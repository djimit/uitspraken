# Snapshot & Erasure Design

## Retentie
- Elke zoekcontext heeft `retention_days` (default 3650 = 10 jaar)
- Documenten ouder dan retention worden verwijderd via delete-by-query

## Snapshot strategie
- Immutable snapshots → SLM-rotatie
- Restore → scrub → resnapshot flow

## Erasure (AVG)
- Delete-by-query op live index
- Bulk delete via `engine.delete_by_query()`
- Audit log bij elke erasure operatie
