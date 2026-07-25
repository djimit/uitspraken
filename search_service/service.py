#!/usr/bin/env python3
"""Semantic search sidecar for the Rechtspraak dashboard.

The dashboard (Next.js + better-sqlite3) can't call TurboVec directly --
it's a Python package. This small FastAPI service is the sidecar: embed the
query locally via Ollama, search the TurboVec index built by build_index.py,
return doc-level hits. Complements the dashboard's existing FTS5 keyword
search (src/lib/queries.ts), doesn't replace it.

Run: uvicorn service:app --port 8123
"""
from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / "research_agent" / "src"))

import requests
from fastapi import FastAPI
from pydantic import BaseModel, Field

from research_agent.providers.turbovec_store import TurboVecStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rechtspraak-search-sidecar")

INDEX_PATH = Path(__file__).parent / "index" / "rechtspraak"
OLLAMA_URL = "http://localhost:11434"

app = FastAPI(title="Rechtspraak semantic search")
_store: TurboVecStore | None = None


def get_store() -> TurboVecStore:
    global _store
    if _store is None:
        if not INDEX_PATH.with_suffix(".tvim").exists():
            raise RuntimeError(f"no index at {INDEX_PATH} -- run build_index.py first")
        _store = TurboVecStore(path=INDEX_PATH, dim=768, bit_width=4)
        logger.info("loaded index: %d chunks, %d unique decisions", len(_store), _store.document_count)
    return _store


@app.on_event("startup")
async def preload_index() -> None:
    # The JSON sidecar is ~3.7GB at full-corpus scale; loading it lazily on
    # the first real search means that request eats the load time (tens of
    # seconds), which blows past callers' HTTP timeouts. Load it eagerly at
    # process startup instead, so "Application startup complete" actually
    # means ready-to-serve, not just ready-to-start-loading.
    if INDEX_PATH.with_suffix(".tvim").exists():
        get_store()


def embed_query(text: str) -> list[float]:
    r = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": "nomic-embed-text", "input": ["search_query: " + text]},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["embeddings"][0]


class SearchRequest(BaseModel):
    query: str
    k: int = Field(default=10, le=200, gt=0)


class SearchHit(BaseModel):
    ecli: str
    court_name: str | None = None
    decision_date: str | None = None
    snippet: str
    score: float


class SearchResponse(BaseModel):
    hits: list[SearchHit]


@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest) -> SearchResponse:
    qvec = embed_query(req.query)
    # over-fetch chunks then dedupe to distinct decisions (multiple chunks
    # per doc can and do both show up in the same top-k). Results come back
    # sorted best-first, so the first occurrence of an ecli is its best chunk.
    results = await get_store().similarity_search_with_scores_by_vector(qvec, k=req.k * 4)
    hits: list[SearchHit] = []
    seen_eclis: set[str] = set()
    for chunk, score in results:
        if chunk.document_id in seen_eclis:
            continue
        seen_eclis.add(chunk.document_id)
        hits.append(SearchHit(
            ecli=chunk.document_id,
            court_name=chunk.metadata.get("court_name"),
            decision_date=chunk.metadata.get("decision_date"),
            snippet=chunk.text[:400],
            score=score,
        ))
        if len(hits) >= req.k:
            break
    return SearchResponse(hits=hits)


@app.get("/health")
async def health() -> dict:
    ready = INDEX_PATH.with_suffix(".tvim").exists()
    return {"status": "ok" if ready else "no_index"}
