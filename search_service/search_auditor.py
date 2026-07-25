#!/usr/bin/env python3
"""JLAIF audit of the Rechtspraak hybrid legal search, using JuraRegel's own
Legal AI Assurance Framework machinery (~/juraregel/api/assurance/) directly
-- not a reimplementation, an import -- so this is scored on the same scale
as JuraRegel's own audited products.

Adapted from RAGEngineAuditor (~/juraregel/api/assurance/rag_auditor.py) to
what's actually checkable for a retrieval-only product (no LLM generation):

  Checkable here, adapted:
    SOURCE        -- every returned ECLI must be well-formed AND resolve to a
                     real row in the corpus (JuraRegel's own citation_verification.py
                     explicitly does NOT check this -- only numeric plausibility
                     of article references -- so this check goes further)
    INTERPRETATION -- regression test for the exact bug found and fixed this
                     session: an off-topic query must not get "sterk"-labeled hits
    TEMPORAL      -- recencyMultiplier must stay boost-only, bounded [1.0, 1.10]
                     (never a penalty for old-but-still-authoritative case law)
    OMISSION      -- a court filter must not leak results from other courts
    BIAS          -- courtTier multiplier must stay within its designed
                     [0.90, 1.15] soft-tiebreaker range (a drift here would mean
                     some court is being structurally over/under-weighted)
    CONFIDENTIALITY -- snippets checked for PII patterns *after* stripping
                     ECLI-shaped substrings first -- directly avoiding the
                     false-positive-on-citation-numbers failure mode that gave
                     JuraRegel's own RAG Engine its 5/5 NO-GO, S5 finding.

  Not applicable here, and not faked to look rigorous:
    FACTUAL     -- nothing is generated, so there is no synthesized claim to
                   fact-check; this error type requires generation to exist at all.
    JURISDICTION -- corpus is exclusively NL (+ Caribbean NL) case law; there is
                   no cross-jurisdiction content to confuse.
    PROCEDURAL  -- no multi-step procedural workflow exists to violate.

Run: python3 search_auditor.py   (requires the dashboard + sidecar running)
"""
from __future__ import annotations

import re
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path

import requests

sys.path.insert(0, str(Path.home() / "juraregel"))
from api.assurance.error_taxonomy import LegalError, LegalErrorType, Severity  # noqa: E402
from api.assurance.release_gate import evaluate_release  # noqa: E402
from api.assurance.severity_scorer import UseCaseProfile, score_system  # noqa: E402

DB = str(Path.home() / "Rechtspraak" / "data" / "rechtspraak.db")
DASHBOARD_URL = "http://localhost:3000"

ECLI_PATTERN = re.compile(r"^ECLI:[A-Z]{2}:[A-Z0-9]+:\d{4}:\d+$")
ECLI_STRIP_PATTERN = re.compile(r"ECLI:[A-Z]{2}:[A-Z0-9]+:\d{4}:\d+")
PII_PATTERNS = [
    r"\b\d{9}\b",  # BSN-shaped
    r"\b\d{4}\s?[A-Z]{2}\b",  # postcode-shaped
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}",  # email
]


@dataclass
class AuditFinding:
    error_type: LegalErrorType
    severity: Severity
    description: str
    evidence: str


def hybrid_search(query: str, **params) -> dict:
    r = requests.get(f"{DASHBOARD_URL}/api/hybrid-search", params={"q": query, **params}, timeout=60)
    r.raise_for_status()
    return r.json()


def check_source_errors(hits: list[dict], conn: sqlite3.Connection) -> list[AuditFinding]:
    findings = []
    eclis = [h["ecli"] for h in hits]
    if not eclis:
        return findings

    malformed = [e for e in eclis if not ECLI_PATTERN.match(e)]
    if malformed:
        findings.append(AuditFinding(
            LegalErrorType.SOURCE, Severity.S3_MATERIEEL,
            f"{len(malformed)} resultaten met niet-standaard ECLI-formaat",
            str(malformed[:5]),
        ))

    placeholders = ",".join("?" * len(eclis))
    existing = {row[0] for row in conn.execute(f"SELECT ecli FROM decisions WHERE ecli IN ({placeholders})", eclis)}
    missing = set(eclis) - existing
    if missing:
        findings.append(AuditFinding(
            LegalErrorType.SOURCE, Severity.S5_SYSTEEMISCH,
            f"{len(missing)} resultaten verwijzen naar ECLI's die niet in het corpus bestaan (fabricated citation)",
            str(sorted(missing)[:5]),
        ))
    return findings


def check_interpretation_errors(nonsense_result: dict) -> list[AuditFinding]:
    findings = []
    strong = [h for h in nonsense_result["hits"] if h.get("semanticStrength") == "sterk"]
    if strong:
        findings.append(AuditFinding(
            LegalErrorType.INTERPRETATION, Severity.S3_MATERIEEL,
            "Off-topic query levert 'sterk'-gelabelde resultaten op (misleidende zekerheidsclaim)",
            f"{len(strong)}/{len(nonsense_result['hits'])} hits gelabeld 'sterk': {[h['ecli'] for h in strong[:3]]}",
        ))
    return findings


def check_temporal_errors(hits: list[dict]) -> list[AuditFinding]:
    findings = []
    for h in hits:
        m = h.get("recencyMultiplier", 1.0)
        if m < 1.0 or m > 1.10:
            findings.append(AuditFinding(
                LegalErrorType.TEMPORAL, Severity.S3_MATERIEEL,
                f"recencyMultiplier buiten ontworpen bereik [1.0, 1.10]: {m}",
                h["ecli"],
            ))
    return findings


def check_bias_errors(hits: list[dict]) -> list[AuditFinding]:
    findings = []
    for h in hits:
        mult = h.get("courtTier", {}).get("multiplier", 1.0)
        if mult < 0.90 or mult > 1.15:
            findings.append(AuditFinding(
                LegalErrorType.BIAS, Severity.S4_RECHTSVERLIES,
                f"instantie-multiplier buiten ontworpen bereik [0.90, 1.15]: {mult} ({h.get('court_name')})",
                h["ecli"],
            ))
    return findings


def check_confidentiality_errors(hits: list[dict]) -> list[AuditFinding]:
    findings = []
    for h in hits:
        snippet = h.get("snippet") or ""
        # Strip ECLI-shaped substrings before pattern-matching -- this is the
        # exact whitelist JuraRegel's own confidentiality check is missing,
        # which is why 9-digit citation numbers there trip a "PII" false
        # positive and hard-block release.
        cleaned = ECLI_STRIP_PATTERN.sub("", snippet)
        for pattern in PII_PATTERNS:
            if re.search(pattern, cleaned):
                findings.append(AuditFinding(
                    LegalErrorType.CONFIDENTIALITY, Severity.S5_SYSTEEMISCH,
                    f"Mogelijk PII-patroon in snippet (na ECLI-whitelist): {pattern}",
                    h["ecli"],
                ))
    return findings


def check_omission_errors(filtered_hits: list[dict], expected_court: str) -> list[AuditFinding]:
    findings = []
    wrong_court = [h for h in filtered_hits if h["court_name"] != expected_court]
    if wrong_court:
        findings.append(AuditFinding(
            LegalErrorType.OMISSION, Severity.S4_RECHTSVERLIES,
            f"Filter court={expected_court!r} lekte {len(wrong_court)} resultaten van andere instanties",
            str([h["ecli"] for h in wrong_court[:3]]),
        ))
    return findings


def main() -> None:
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

    real = hybrid_search("huurcontract ontbinding wegens wanprestatie", pageSize=30)
    nonsense = hybrid_search("purple elephant quantum banana", pageSize=20)
    filtered = hybrid_search("huurcontract ontbinding", court="Rechtbank Den Haag", pageSize=20)

    findings: list[AuditFinding] = []
    findings += check_source_errors(real["hits"] + nonsense["hits"] + filtered["hits"], conn)
    findings += check_interpretation_errors(nonsense)
    findings += check_temporal_errors(real["hits"])
    findings += check_bias_errors(real["hits"] + nonsense["hits"] + filtered["hits"])
    findings += check_confidentiality_errors(real["hits"] + nonsense["hits"] + filtered["hits"])
    findings += check_omission_errors(filtered["hits"], "Rechtbank Den Haag")

    errors = [
        LegalError(error_type=f.error_type, severity=f.severity, description=f.description, source_claim=f.evidence)
        for f in findings
    ]

    # L1: pure retrieval, no synthesis, no autonomous action -- the lowest
    # autonomy level in JuraRegel's own model, one rung below the RAG Engine's
    # own L2 "informatief" classification, since there isn't even generation here.
    use_case = UseCaseProfile(
        name="rechtspraak-hybrid-search",
        autonomy_level=1,
        legal_domain="algemeen",
        user_group="jurist",
    )
    score_result = score_system(errors, use_case)
    decision = evaluate_release(errors, use_case)

    print("=== JLAIF-audit: Rechtspraak hybrid search (via JuraRegel's eigen assurance-modules) ===")
    print(f"Queries getest: 'huurcontract ontbinding wegens wanprestatie' (n={len(real['hits'])}), "
          f"'purple elephant quantum banana' (n={len(nonsense['hits'])}), "
          f"court-filter 'Rechtbank Den Haag' (n={len(filtered['hits'])})")
    print(f"\nBevindingen: {len(findings)}")
    for f in findings:
        print(f"  [{f.severity.value}] {f.error_type.value}: {f.description}")
        print(f"      evidence: {f.evidence}")
    print(f"\nSeverity distribution: {score_result.distribution.to_dict()}")
    print(f"Acceptability ratio: {score_result.ratio:.2f} (threshold: {score_result.details['autonomy_threshold']})")
    print(f"\nRelease decision: {decision.verdict} -- {decision.reason}")


if __name__ == "__main__":
    main()
