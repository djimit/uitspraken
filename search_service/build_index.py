#!/usr/bin/env python3
"""Build the semantic-search TurboVec index for a sample of decisions.

Safety: reads COALESCE(body_text_anonymized, body_text) -- the 25,127 rows
previously flagged for PII are fully remediated (_pii_remediation:
violations_found == violations_fixed == 48,702), and this expression uses
the remediated text for exactly those rows. Read-only DB connection.

Checkpointed: checkpoint.json is flushed every FLUSH_EVERY docs, so an
interrupted run (Ctrl-C, crash, laptop sleep) resumes from the last flush
instead of re-embedding everything. FULL_CORPUS=True covers all ~195,578
decisions with body_text -- at the observed ~2.9 docs/s this is roughly
18-19 hours; ran first as a 5,000-doc pilot (FULL_CORPUS=False, SAMPLE_N)
to prove the mechanism before committing to the full run.

Run: nohup python3 build_index.py > build_index.log 2>&1 &  (this is hours, not minutes)
"""
from __future__ import annotations

import json
import sqlite3
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path.home() / "research_agent" / "src"))

import requests

from research_agent.models import DocumentChunk
from research_agent.providers.turbovec_store import TurboVecStore

DB = str(Path.home() / "Rechtspraak" / "data" / "rechtspraak.db")
SAMPLE_N = 5000
# Full-corpus mode: all ~195,578 decisions with body_text, not just the
# 5,000-doc pilot sample (which also required a real inhoudsindicatie --
# that was only needed for the pilot's round-trip test, not for indexing).
FULL_CORPUS = True
DIM = 768
BATCH = 50
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200
MAX_CHUNKS_PER_DOC = 20

OUT_DIR = Path(__file__).parent / "index"
CHECKPOINT = OUT_DIR / "checkpoint.json"
SAMPLE_FILE = OUT_DIR / "sample_eclis.json"
INDEX_PATH = OUT_DIR / "rechtspraak"


def fetch_sample():
    """Full-corpus mode: every decision with body_text, no sampling needed.
    Pilot mode (kept for reference): pick SAMPLE_N decisions once (ORDER BY
    RANDOM()) and persist the exact ecli list so reruns target the same
    fixed sample instead of drawing a new random set each time."""
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    if FULL_CORPUS:
        rows = conn.execute(
            """
            SELECT ecli, court_name, decision_date,
                   COALESCE(body_text_anonymized, body_text) AS text
            FROM decisions
            WHERE body_text IS NOT NULL AND body_text != ''
            ORDER BY ecli
            """
        ).fetchall()
    elif SAMPLE_FILE.exists():
        eclis = json.loads(SAMPLE_FILE.read_text())["eclis"]
        placeholders = ",".join("?" * len(eclis))
        rows = conn.execute(
            f"""SELECT ecli, court_name, decision_date,
                       COALESCE(body_text_anonymized, body_text) AS text
                FROM decisions WHERE ecli IN ({placeholders})""",
            eclis,
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT ecli, court_name, decision_date,
                   COALESCE(body_text_anonymized, body_text) AS text
            FROM decisions
            WHERE body_text IS NOT NULL AND body_text != ''
              AND length(inhoudsindicatie) > 60
            ORDER BY RANDOM()
            LIMIT ?
            """,
            (SAMPLE_N,),
        ).fetchall()
        SAMPLE_FILE.write_text(json.dumps({"eclis": [r["ecli"] for r in rows]}))

    conn.close()
    return [dict(r) for r in rows]


def chunk_text(text: str) -> list[str]:
    chunks = []
    step = CHUNK_SIZE - CHUNK_OVERLAP
    for start in range(0, len(text), step):
        chunk = text[start:start + CHUNK_SIZE]
        if len(chunk) < 100:
            break
        chunks.append(chunk)
        if len(chunks) >= MAX_CHUNKS_PER_DOC:
            break
    return chunks or [text[:CHUNK_SIZE]]


def embed_batch(texts: list[str]) -> list[list[float]]:
    r = requests.post(
        "http://localhost:11434/api/embed",
        json={"model": "nomic-embed-text", "input": texts},
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["embeddings"]


def load_checkpoint() -> set[str]:
    if CHECKPOINT.exists():
        return set(json.loads(CHECKPOINT.read_text())["done_eclis"])
    return set()


def save_checkpoint(done_eclis: set[str]) -> None:
    CHECKPOINT.write_text(json.dumps({"done_eclis": sorted(done_eclis)}))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    done = load_checkpoint()
    rows = fetch_sample()
    remaining = [r for r in rows if r["ecli"] not in done]
    n_total = len(rows)
    del rows  # ~3.6GB of row text at full-corpus scale; keep only what's left to do
    print(f"{n_total} docs total, {len(done)} already done, {len(remaining)} remaining")

    store = TurboVecStore(path=INDEX_PATH, dim=DIM, bit_width=4)
    # TurboVecStore.add() does a full atomic persist (rewrites both index
    # files) on every call. At full-corpus scale the JSON sidecar reaches
    # ~4GB, so flushing every doc (fine at 5,000 docs) would mean rewriting
    # a multi-GB file hundreds of thousands of times. FLUSH_EVERY=2000 caps
    # total rewrite I/O at a manageable ~100-200GB over the whole run, at
    # the cost of losing up to ~2000 docs (~11 min) of embedding on a crash.
    FLUSH_EVERY = 2000
    buffer: list[DocumentChunk] = []

    import asyncio

    def flush():
        if buffer:
            asyncio.run(store.add(list(buffer)))
            buffer.clear()

    t_start = time.perf_counter()
    for n, row in enumerate(remaining, 1):
        raw_chunks = chunk_text(row["text"])
        texts = ["search_document: " + c for c in raw_chunks]
        embeddings = []
        for i in range(0, len(texts), BATCH):
            embeddings.extend(embed_batch(texts[i:i + BATCH]))

        buffer.extend(
            DocumentChunk(
                id=f"{row['ecli']}#{ci}", document_id=row["ecli"], text=raw_chunks[ci],
                metadata={"court_name": row["court_name"], "decision_date": row["decision_date"], "chunk_index": ci},
                embedding=embeddings[ci],
            )
            for ci in range(len(raw_chunks))
        )
        done.add(row["ecli"])

        if n % FLUSH_EVERY == 0 or n == len(remaining):
            flush()
            save_checkpoint(done)
            elapsed = time.perf_counter() - t_start
            rate = n / elapsed
            eta_min = (len(remaining) - n) / rate / 60 if rate > 0 else 0
            print(f"  {n}/{len(remaining)} docs ({len(done)}/{n_total} total) "
                  f"- {rate:.2f} docs/s - ETA {eta_min/60:.1f} h", flush=True)

    save_checkpoint(done)
    manifest = {
        "source_db": DB, "n_docs": len(done), "dim": DIM, "bit_width": 4,
        "chunk_size": CHUNK_SIZE, "chunk_overlap": CHUNK_OVERLAP,
        "embedding_model": "nomic-embed-text",
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"done: {len(done)} docs indexed -> {INDEX_PATH}.tvim")


if __name__ == "__main__":
    main()
