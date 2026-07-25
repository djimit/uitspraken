#!/usr/bin/env python3
"""Train a word2vec model on the Rechtspraak corpus and precompute a static
legal-term synonym dictionary for FTS5 keyword query expansion.

Why word2vec here specifically (not a duplicate of the TurboVec semantic
search): word2vec gives static, per-word nearest-neighbor terms trained on
this corpus's own vocabulary -- e.g. "ontslag" -> "beeindiging",
"opzegging". That's a different, narrower job than TurboVec's sentence-level
semantic search: it strengthens the *keyword* (FTS5) side by expanding a
query term with corpus-specific legal synonyms before the bm25 match, so a
literal-term search for "ontslag" also matches documents that only use
"beeindiging arbeidsovereenkomst". A live embedding call would be overkill
for this -- it's a one-time offline training run producing a small static
JSON lookup table, loaded once into the Next.js process, no network hop per
query.

Training on a representative sample (50,000 of 195,578 decisions), not the
full corpus: word2vec needs broad vocabulary coverage, not every document --
diminishing returns past a fairly modest sample size, and this keeps the
training run to a few minutes instead of hours.

Run: python3 train_word2vec.py
"""
from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

from gensim.models import Word2Vec

DB = str(Path.home() / "Rechtspraak" / "data" / "rechtspraak.db")
OUT_PATH = Path(__file__).parent / "word2vec_synonyms.json"
SAMPLE_N = 50_000
TOP_N_TERMS = 8000       # how many of the most frequent vocabulary terms get a synonym entry
NEIGHBORS_PER_TERM = 5
MIN_SIMILARITY = 0.55    # below this, neighbors are noise, not real synonyms

# Common Dutch stopwords + legal-boilerplate filler words that would otherwise
# dominate every neighbor list without being useful search-expansion terms.
STOPWORDS = {
    "de", "het", "een", "van", "in", "op", "is", "en", "dat", "die", "voor",
    "met", "zijn", "aan", "te", "niet", "als", "ook", "dan", "of", "bij",
    "uit", "om", "naar", "wordt", "worden", "zal", "kan", "moet", "heeft",
    "hebben", "was", "er", "dit", "deze", "geen", "nog", "zo", "over", "tot",
    "wel", "maar", "reeds", "welke", "artikel", "lid", "onder", "sub", "ter",
    "inzake", "betreft", "rechtbank", "gerechtshof", "hoge", "raad", "ecli",
}

TOKEN_PATTERN = re.compile(r"[a-zà-ÿ]{3,}", re.IGNORECASE)


def fetch_texts() -> list[str]:
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    rows = conn.execute(
        """
        SELECT COALESCE(body_text_anonymized, body_text) AS text
        FROM decisions
        WHERE body_text IS NOT NULL AND body_text != ''
        ORDER BY RANDOM()
        LIMIT ?
        """,
        (SAMPLE_N,),
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]


def tokenize(text: str) -> list[str]:
    tokens = TOKEN_PATTERN.findall(text.lower())
    return [t for t in tokens if t not in STOPWORDS]


def main() -> None:
    print(f"sampling {SAMPLE_N} decisions...")
    texts = fetch_texts()
    print(f"got {len(texts)} texts, tokenizing...")

    sentences = [tokenize(t) for t in texts]
    del texts

    print("training word2vec...")
    model = Word2Vec(
        sentences,
        vector_size=100,
        window=5,
        min_count=5,
        workers=4,
        sg=1,       # skip-gram: better for rarer legal terms than CBOW
        epochs=5,
    )
    print(f"vocabulary size: {len(model.wv)}")

    # Synonym entries only for the most frequent terms -- a term that
    # appears a handful of times across 50K documents doesn't have a
    # reliable neighborhood, and nobody searches for it anyway.
    frequent_terms = sorted(model.wv.key_to_index, key=lambda w: model.wv.get_vecattr(w, "count"), reverse=True)
    frequent_terms = frequent_terms[:TOP_N_TERMS]

    synonyms: dict[str, list[list[float | str]]] = {}
    for term in frequent_terms:
        neighbors = model.wv.most_similar(term, topn=NEIGHBORS_PER_TERM)
        kept = [[w, round(float(sim), 3)] for w, sim in neighbors if sim >= MIN_SIMILARITY]
        if kept:
            synonyms[term] = kept

    OUT_PATH.write_text(json.dumps(synonyms, ensure_ascii=False))
    print(f"wrote {len(synonyms)} synonym entries -> {OUT_PATH}")

    # A few spot-checks, printed for a human sanity read -- not asserted,
    # word2vec neighbors are exploratory, not guaranteed correct.
    for sample_term in ["ontslag", "huurachterstand", "onrechtmatig", "wanprestatie"]:
        if sample_term in synonyms:
            print(f"  {sample_term} -> {synonyms[sample_term]}")


if __name__ == "__main__":
    main()
