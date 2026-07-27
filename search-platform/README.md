# Search Platform Dienst — Referentie-implementatie

API-only zoekdienst die afnemende applicaties via REST zoekfunctionaliteit biedt over expliciet geconfigureerde zoekcontexten.

## Technische keuzes

- **Python 3.12 + FastAPI** (async), Pydantic v2
- **OpenSearch 2.x** (Apache-2.0) met security-plugin
  - Motivatie: document-level security, field-level security, auditlogging en OIDC/SAML zitten in de gratis distributie
- **Engine-ontkoppeling**: `SearchEnginePort` interface + `OpenSearchAdapter`
- **OIDC mock-IdP**: JWT-uitgifte-endpoint voor ontwikkeling

## Starten

```bash
# Via docker-compose
docker compose up -d

# Lokaal met uv
uv sync --extra dev
uv run uvicorn app.main:app --port 8000
```

## Seed data

```bash
make seed
```

## Tests

```bash
make test
```

## API

| Endpoint | Beschrijving |
|---|---|
| `POST /v1/contexts/{ctx}/search` | Zoeken (9 modes) |
| `GET /v1/contexts/{ctx}/search/explain?id=...` | Ranking-transparantie |
| `POST /v1/contexts/{ctx}/documents` | Document indexeren |
| `DELETE /v1/contexts/{ctx}/documents/{id}` | Document verwijderen |
| `GET /v1/admin/contexts` | Contexten lijst |
| `POST /v1/admin/contexts/{name}/provision` | Index provisioneren |
| `GET /healthz`, `/readyz`, `/metrics` | Health checks |

## Architectuim

```
app/
  api/          # Search API-laag
  engine/       # SearchEnginePort + OpenSearchAdapter + query_builder + semantic
  index/        # Context registry + index templates
  ingestion/    # Multi-bron pipeline + connectors
  security/     # Authz (DLS/FLS) + masking
  observability/# Audit logging
contexts/       # Zoekcontext YAML configs
seed/           # Synthetische data generator
tests/          # Test suite
```

## Guardrails

- Geen echte PII (alleen synthetische data)
- Geen OpenShift/MRP-provisioning
- Geen Platinum-only features
- Geen productie-IAM (alleen mock-IdP)
- Geen UI (API-only)
- Engine-specifieke aanroepen alleen via `SearchEnginePort`

## Licentie

Apache-2.0 (OpenSearch compatibel)
