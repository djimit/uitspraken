# Copilot Instructions — Rechtspraak

> See root `.github/copilot-instructions.md` for global conventions.

Dutch court decisions Open Data pipeline + Next.js dashboard. Imports from data.rechtspraak.nl into SQLite + FTS5, with a read-only Next.js dashboard for analysis.

## Commands

### Importer (Python / uv)
```bash
cd Rechtspraak/importer
source .venv/bin/activate          # or: uv run python -m rechtspraak.cli ...

# Full import pipeline
python -m rechtspraak.cli update-value-lists   # phase 0: courts, legal areas, procedure types
python -m rechtspraak.cli index-crawl          # phase 1: discover ECLIs day-by-day (resumable)
python -m rechtspraak.cli fetch-content        # phase 2: fetch full XML, parse 30+ fields
python -m rechtspraak.cli rebuild-ii-cache     # phase 3: pre-compute inhoudsindicatie analysis

# Maintenance
python -m rechtspraak.cli incremental-update   # crawl + fetch only new/changed decisions
python -m rechtspraak.cli retry-failed         # retry failed fetches
python -m rechtspraak.cli stats                # DB statistics
python -m rechtspraak.cli reparse              # reparse already-fetched XML without re-fetching

# PII remediation
python -m rechtspraak.cli pseudonymize          # anonymize all decisions in _pseudo_cache
python -m rechtspraak.cli pseudonymize-stats    # PII remediation statistics

# Rate/concurrency options available on most commands
--rate 5 --concurrency 3 --start 2024-01-01 --end 2024-12-31
```

### Dashboard (Next.js)
```bash
cd Rechtspraak/dashboard
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
| `pseudonymize.py` | PII scanner + anonymizer: 8 violation types, false-positive filters |
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

## Critical Operational Rules

- **Dashboard DB is readonly** (`better-sqlite3` opened readonly) — never write from Next.js.
- **Crawl is resumable** — `crawl_state` table stores cursor; interrupted crawls continue from last date.
- **Inhoudsindicatie analysis is pre-computed** at import time into `_ii_analysis_cache` (JSON column) — re-running on demand takes 100+ seconds.
- **WAL checkpoint** (`PRAGMA wal_checkpoint(PASSIVE)`) runs periodically in the importer to prevent WAL files growing to multiple GB.
- **DB performance pragmas** in dashboard: `cache_size=64MB`, `mmap_size=256MB`, `temp_store=MEMORY`.
- **XML parser is hardened** — `resolve_entities=False, no_network=True, load_dtd=False` to prevent XXE.
- **`better-sqlite3` is a server-only native module** — `next.config.js` marks it as `serverExternalPackage`.
- **Filters are composable** — `queries.ts` builds dynamic `WHERE` clauses from court, legal area, date range, decision type, procedure.
- **FTS5** — full-text search over `body_text` and `inhoudsindicatie` via `decisions_fts` virtual table.

## Ponytail Simplicity Layer

Ponytail is subordinate implementation guidance here: privacy, data-integrity, runtime, importer/dashboard boundary, and project instructions override Ponytail. Security/runtime/project instructions override Ponytail.

- Prefer the smallest query, parser, or UI change that preserves the SQLite exchange boundary.
- Do not add dashboard writes, new cache paths, broad migrations, or abstraction layers unless existing data flow proves the need.
- Keep XML hardening, PII safeguards, readonly dashboard access, and verification checks even when simplifying code.
- Mark intentional shortcuts with `ponytail:` only when the ceiling and upgrade trigger are explicit.

## Environment

- `RECHTSPRAAK_DATA_DIR` — importer data directory (default: `../data/`)
- `DATABASE_PATH` — dashboard DB path (default: `../data/rechtspraak.db`)

## Browser Testing

Playwright MCP is configured in `dashboard/.vscode/mcp.json`. Install first:
```bash
npm install -g @playwright/mcp
```

No auth on either importer or dashboard.
