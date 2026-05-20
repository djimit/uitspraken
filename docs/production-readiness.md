# Production Readiness

## Current Readiness

- Local/internal readiness: 4/10
- Public or regulated production readiness: 2/10

The repository is suitable for controlled local analysis work. It is not ready for public or regulated deployment because authentication, privacy governance, full security scanning, release controls, observability, and retention controls are not yet in place.

## Top Risks

- No real production authentication or authorization provider.
- SQLite contains raw court decision text and may contain personal data.
- PII detection and remediation rules are duplicated across TypeScript and Python.
- Security scanning is currently a CI placeholder, not a complete control.
- Observability is limited to local logs and dashboard status views.
- Runtime artifacts and local settings have historically been present in the worktree.

## H1 Roadmap: 0-2 Days

- Add local-only guards for admin and pseudonymization audit routes.
- Render `public_body_text` in public decision detail views.
- Ignore generated logs, caches, local Claude settings, and TypeScript build info.
- Add CI skeleton for dashboard build/typecheck and importer compile checks.
- Add agent guardrails in `AGENTS.md`.

## H2 Roadmap: 1-2 Weeks

- Choose and implement a real auth provider for internal users.
- Centralize PII rule definitions so Python and TypeScript cannot drift.
- Add fixture-based parser, migration, query, and PII tests.
- Add dependency scanning, secret scanning, SBOM generation, and scheduled updates.
- Document database migration and cache rebuild procedures.

## H3 Roadmap: 1-2 Months

- Complete DPIA and data retention policy.
- Add structured import run history, audit trails, metrics, and health checks.
- Add release process, environment separation, artifact signing, and provenance.
- Add load testing and operational runbooks.
- Define backup, restore, and incident response procedures.

## Do Not Deploy Unless

- A real auth provider and role model protect admin, audit, and PII views.
- Raw `body_text` access is restricted to approved audit roles.
- DPIA, retention rules, and processor/governance decisions are documented.
- Secret scanning, dependency scanning, SBOM, and release checks run in CI.
- Production has observability, audit logging, and incident response ownership.
- Database files are handled as sensitive operational data.

## Open Decisions

- Production authentication provider and role model.
- DPIA scope and owner.
- Data retention and deletion policy for raw and anonymized text.
- SBOM/provenance tooling.
- Release process and branch protection.
- Observability stack and alerting thresholds.

## Notes

The current CSP keeps `unsafe-inline` and `unsafe-eval` for Next.js compatibility in this H1 baseline. Tightening CSP requires a separate frontend hardening pass with runtime verification.
