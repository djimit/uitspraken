# AGENTS.md

Guidance for AI agents and human reviewers working in this repository.

## Repository Overview

This project has three main layers:

1. Python importer in `importer/rechtspraak/`
2. SQLite database in `data/rechtspraak.db`
3. Next.js dashboard in `dashboard/src/`

The importer owns crawling, parsing, migration, cache building, and PII remediation. The dashboard must treat SQLite as read-only and should render public-safe text where available.

## Architecture Rules

- Keep importer writes in Python; do not write to SQLite from the Next.js app.
- Do not assume every local database has the newest migration. Check schema before depending on new columns.
- Keep raw data, derived caches, public-safe text, and audit-only views conceptually separate.
- Preserve existing local changes unless the user explicitly asks to replace them.
- Prefer small changes with explicit validation over broad rewrites.

## Required Preflight

- Run `git status --short`.
- Read the relevant entrypoints/configs before editing.
- Search for existing helpers before adding new abstractions.
- Check `body_text` usage before changing privacy-sensitive rendering.
- Confirm whether a command would mutate tracked files before running it.

## Required Post-Change Checks

- `git status --short`
- `cd dashboard && npm run typecheck --if-present`
- `cd dashboard && npm run build --if-present`
- `python -m compileall importer`
- `git ls-files | grep -E '(\\.log|tsbuildinfo|settings\\.local\\.json)$' || true`
- `rg "body_text" dashboard/src`

## Privacy Rules

- Do not print, log, or summarize raw PII from court decision bodies.
- Do not render raw `body_text` in public-facing views when `body_text_anonymized` is available.
- Treat pseudonymization and PII audit pages as internal-only until real production auth exists.
- Keep PII examples synthetic in docs, tests, and reports.
- Do not add raw full-text output to logs, CI output, or issue/PR descriptions.

## Forbidden Actions

- Do not run `rm data/*.db*` or otherwise delete database files.
- Do not run `git push`.
- Do not install dependencies without explicit user permission.
- Do not perform network fetches without explicit user permission.
- Do not read SSH keys, private keys, credentials, or files under private key paths.
- Do not expose raw PII in logs or terminal output.

## Release Notes For Agents

This repository is not production-ready for public or regulated deployment. The current baseline is intended for safer internal/local use only. Real production use requires authentication, privacy governance, dependency and secret scanning, release controls, retention policy, and observability.
