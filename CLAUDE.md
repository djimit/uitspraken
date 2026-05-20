# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Importer (Python, uses uv)
```bash
cd importer
source .venv/bin/activate          # or: uv run ...

# Full import pipeline
python -m rechtspraak.cli update-value-lists   # phase 0: courts, legal areas, procedure types
python -m rechtspraak.cli index-crawl          # phase 1: discover ECLIs day-by-day
python -m rechtspraak.cli fetch-content        # phase 2: fetch full XML, parse 30+ fields
python -m rechtspraak.cli rebuild-ii-cache     # phase 3: pre-compute inhoudsindicatie analysis

# Maintenance
python -m rechtspraak.cli incremental-update   # crawl + fetch only new/changed decisions
python -m rechtspraak.cli retry-failed         # retry decisions that failed to fetch
python -m rechtspraak.cli stats                # print DB statistics (now includes PII info)
python -m rechtspraak.cli reparse              # reparse already-fetched XML

# PII remediation
python -m rechtspraak.cli pseudonymize          # anonymize all decisions in _pseudo_cache
python -m rechtspraak.cli pseudonymize --ecli <ECLI> --dry-run  # scan single decision
python -m rechtspraak.cli pseudonymize-stats    # PII remediation statistics

# Options available on most commands
--rate 5            # requests per second (default: 5)
--concurrency 3     # concurrent fetches (default: 3)
--start / --end     # date range filters (YYYY-MM-DD)
```

### Dashboard (Next.js)
```bash
cd dashboard
npm install
npm run dev      # http://localhost:3000
npm run build
npm start        # production
```

## Architecture

Three-layer pipeline with SQLite as the exchange point:

```
Rechtspraak Open Data API (data.rechtspraak.nl)
        │ httpx async + rate limiter + tenacity retry
        ▼
importer/rechtspraak/    (Python ETL)
        │ upsert via FTS5-indexed SQLite
        ▼
data/rechtspraak.db      (12.6 GB, 174K+ decisions, WAL mode)
        │ better-sqlite3 readonly
        ▼
dashboard/src/           (Next.js App Router)
```

### Importer modules

| File | Role |
|------|------|
| `cli.py` | Click CLI entry point |
| `pipeline.py` | Phase orchestration (0→1→2→3) |
| `crawler.py` | Search index crawl with resumable cursor in `crawl_state` table |
| `fetcher.py` | Async batch fetch with success/failure callbacks |
| `client.py` | HTTP client — token-bucket rate limiter, tenacity retry, semaphore concurrency |
| `parser.py` | lxml XML parser — Atom feed + full decision XML → 30+ fields |
| `database.py` | SQLite upserts, WAL checkpointing, FTS5 indexing, 4 migrations |
| `ii_cache.py` | Pre-computes outcome detection, law citation frequency, word frequency, compression ratio |
| `value_lists.py` | Reference data: courts, legal areas (hierarchical), procedure types |
| `pseudonymize.py` | PII scanner + anonymizer: ported from dashboard pseudo-check.ts, 8 violation types, false-positive filters |
| `models.py` | Dataclasses: `SearchEntry`, `DecisionContent`, `LegalArea`, `Relation`, etc. |
| `config.py` | Constants, URLs, namespaces, `RECHTSPRAAK_DATA_DIR` env var |

### Dashboard query layer

`dashboard/src/lib/` contains 4 query files used by server components and API routes:
- `queries.ts` — 50+ functions for main dashboard sections; in-process cache (60–300s TTL)
- `inhoudsindicatie-queries.ts` — outcome detection, law patterns, word/bigram frequency, compression
- `appeal-queries.ts` — hoger beroep trends, gevolg breakdown, court flow
- `forensic-queries.ts` — penalty analysis (veroordeling, TBS, taakstraf)
- `pseudo-check.ts` — PII violation detection (25K+ violations found across the corpus)

Dashboard sections: Overzicht, Tijdlijn, Instanties, Analyse, Publicatievertraging, Relaties, Inhoudsindicatie, Hoger Beroep, Forensisch, Pseudonimisering, Admin/Pipeline.

## Key Details

- **Crawl is resumable** — `crawl_state` table stores cursor; interrupted crawls continue from last date.
- **Inhoudsindicatie analysis is pre-computed** at import time into `_ii_analysis_cache` (JSON column) — rerunning on demand would take 100+ seconds on the full corpus.
- **Dashboard DB is readonly** — `better-sqlite3` opened in readonly mode; never write from Next.js.
- **WAL checkpoint** — `PRAGMA wal_checkpoint(PASSIVE)` runs periodically in importer to prevent WAL files growing to multiple GB.
- **DB performance pragmas** — dashboard sets `cache_size=64MB`, `mmap_size=256MB`, `temp_store=MEMORY`.
- **XML parser is hardened** — `resolve_entities=False, no_network=True, load_dtd=False` to prevent XXE.
- **Filters are composable** — `queries.ts` builds dynamic `WHERE` clauses from court, legal area, date range, decision type, procedure.
- **FTS5** — full-text search over `body_text` and `inhoudsindicatie` via `decisions_fts` virtual table.
- **`better-sqlite3` is a server-only native module** — `next.config.js` marks it as `serverExternalPackage`.

## Environment

- `RECHTSPRAAK_DATA_DIR` — importer data directory (default: `../data/`)
- `DATABASE_PATH` — dashboard DB path (default: `../data/rechtspraak.db`)

No auth on either importer or dashboard.
