# Traceability Matrix

| Eis | Herkomst | Build-artefact |
|---|---|---|
| Exact/full-text/fuzzy/wildcard/operator | AS §2.4 1a–1f | `engine/query_builder.py` + `/search` |
| Filter/sort/facet/paging | AS §2.4 2a–2b, 3 | `query_builder` + `api/models.py` |
| Relevantie + transparantie | AS 2c, BP4 | `score` in respons + `api/explain.py` |
| Semantisch/hybride (optioneel) | AS 1g, SAD §3.2 | `engine/semantic.py` (feature-flag) |
| Autorisatie in zoeklaag (DLS/FLS) | AS req 4, §8.2, AB-06 | `security/authz.py` |
| Meerdere bronnen + denormalisatie | AS 5a–5c, SAD §3.1 | `ingestion/pipeline.py`, `connectors/` |
| API-only REST | AS 6, AB-01 | FastAPI, geen UI |
| Zoekcontexten + isolatie | SAD §1.5/§3.1 | `contexts/*.yml`, `index/context_registry.py` |
| Dienstprofielen 222-2 / 333-3 | SAD §3.2/§5.1.1 | profielpresets in `context_registry` |
| Privacy: masking/doelbinding/bewaartermijn | AS §8.3 | `security/masking.py`, context-metadata |
| Observability/audit/monitoring | SAD §3.7 | `observability/*` |
| Per-hit bronprovenance | AS §8.2 | `source_system` in mapping + respons |
| Engine-vervangbaarheid | AS §9.1 | `engine/port.py` + adapter |
| Snapshot/erasure-ontwerp | AS §8.3 | `docs/snapshot_erasure.md` + delete-by-query |
