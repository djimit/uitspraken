"""PII detection and anonymization for Rechtspraak decisions.

Ports the regex-based PII scanner from dashboard/src/lib/pseudo-check.ts
and adds automated anonymization: replaces detected PII with replacement tokens.

Usage:
    from .pseudonymize import scan_decision, anonymize_decision
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ── Constants (ported from pseudo-check.ts) ──────────────────────────────

VIOLATION_META: dict[str, dict] = {
    "phone_mobile":    {"label": "Mobiel nummer",     "severity": "high",   "suggestion": "[telefoonnummer]"},
    "phone_landline":  {"label": "Vast nummer",       "severity": "medium", "suggestion": "[telefoonnummer]"},
    "email":           {"label": "E-mailadres",       "severity": "high",   "suggestion": "[e-mailadres]"},
    "postcode":        {"label": "Postcode",          "severity": "medium", "suggestion": "[postcode]"},
    "street_address":  {"label": "Straatnaam + nummer", "severity": "medium", "suggestion": "[adres]"},
    "bsn":             {"label": "BSN-achtig nummer", "severity": "high",   "suggestion": "[BSN]"},
    "license_plate":   {"label": "Kenteken",          "severity": "low",    "suggestion": "[kenteken]"},
    "date_of_birth":   {"label": "Geboortedatum",     "severity": "high",   "suggestion": "[geboortedatum]"},
}

SAFE_EMAIL_DOMAINS = {
    "rechtspraak.nl", "overheid.nl", "rijksoverheid.nl", "belastingdienst.nl",
    "minvenj.nl", "minjenv.nl", "om.nl", "politie.nl", "ind.nl",
    "uwv.nl", "svb.nl", "duo.nl", "rvo.nl", "kadaster.nl",
    "kvk.nl", "cbr.nl", "rdw.nl", "rivm.nl", "knb.nl",
    "notaris.nl", "advocatenorde.nl", "tuchtrecht.nl",
    "caribjustitia.org", "gmail.com", "outlook.com", "hotmail.com",
}

ORG_KEYWORDS = re.compile(
    r"reclassering|advocatenkantoor|advocaten|notariskantoor|notaris|accountant|"
    r"belastingdienst|politie|gemeente|waterschap|ministerie|rechtbank|gerechtshof|"
    r"raad van state|openbaar ministerie|griffie|kantonrechter|B\.V\.|N\.V\.|Stichting|"
    r"werkzaam\s+bij|kantoor|maatschap|incassobureau|deurwaarder|woningcorporatie|"
    r"ziekenhuis|huisarts|tandarts|apotheek|school|universiteit|hogeschool|ggz|ggd|"
    r"jeugdzorg|veilig\s+thuis|bureau|instelling|instantie|organisatie|bedrijf|"
    r"onderneming|raadsman|raadsvrouw|gemachtigde|deskundige|makelaars?|taxateur|"
    r"accountants?|ingenieursbureau|laboratorium|kliniek|centrum",
    re.IGNORECASE,
)

REF_HOUSING_KEYWORDS = re.compile(
    r"referentiewoning|vergelijkingsobject|vergelijkbare?\s+woning|vergelijkingspand|"
    r"taxatie(?:rapport|waarde|verslag)?|woz[-\s]?waarde|woz[-\s]?beschikking|"
    r"waardepeildatum|heffingsmaatstaf|onroerende\s+zaak|registergoed|kadastr|"
    r"kadaster|perceel(?:nummer)?|grondoppervlak|m[²2]\s|oppervlakte|bouwjaar\s+\d|"
    r"woningtype|type\s+woning|inhoud\s+\d|gebruiksoppervlak|bruto\s+vloer|"
    r"pandoppervlak|aanbouw|garage\s+\d|berging|tussenwoning|hoekwoning|vrijstaand|"
    r"geschakeld|twee[-\s]?onder[-\s]?een[-\s]?kap|appartement\s+\d|etage|verdieping|"
    r"bouwnummer|koopsom|verkoopprijs|transactie(?:prijs|datum)|overdracht|eigendom|"
    r"huur(?:prijs|waarde)|erfpacht|bestemmingsplan|bouwvergunning|omgevingsvergunning",
    re.IGNORECASE,
)

POSTCODE_FALSE_POSITIVE = re.compile(
    r"^\d{4}\s?(EU|EG|CE|BW|Sr|Sv|WW|PW|ZW|AW|Wm|Fw|Rv|EJ|AZ|HA|KG|JE|FA|CA|CB|CU)$",
    re.IGNORECASE,
)

MONTHS_NL = [
    "januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december",
]

# ── Dataclasses ───────────────────────────────────────────────────────────

@dataclass
class Violation:
    type: str
    severity: str
    label: str
    match: str
    start_idx: int
    end_idx: int
    suggestion: str


@dataclass
class AnonymizedResult:
    ecli: str
    violations_found: int
    violations_fixed: int
    anonymized_text: str
    violations: list[Violation] = field(default_factory=list)


# ── False-positive filters ────────────────────────────────────────────────

def _is_inside_bracket(text: str, idx: int) -> bool:
    """Check if a character position falls inside [...] brackets."""
    for i in range(idx - 1, max(0, idx - 80) - 1, -1):
        if text[i] == "]":
            return False
        if text[i] == "[":
            return True
    return False


def _is_in_header(text: str, idx: int) -> bool:
    """Check if position is in the first or last 500 chars (court header/footer)."""
    return idx < 500 or idx > len(text) - 500


def _is_near_organisation(text: str, idx: int) -> bool:
    """Check if text before match contains an organisation keyword."""
    lookback = text[max(0, idx - 300):idx]
    return bool(ORG_KEYWORDS.search(lookback))


def _is_reference_housing(text: str, idx: int) -> bool:
    """Check if match is in a property valuation / reference housing context."""
    lookback = text[max(0, idx - 400):idx + 100]
    return bool(REF_HOUSING_KEYWORDS.search(lookback))


# ── Detection ─────────────────────────────────────────────────────────────

def scan_decision(text: str) -> list[Violation]:
    """Scan a decision body_text for PII violations. Returns list of Violations."""
    if not text:
        return []
    violations: list[Violation] = []

    # Mobile phone: 06-12345678 or 06 12345678
    for m in re.finditer(r"06[-\s]?\d{8}", text):
        if _is_inside_bracket(text, m.start()):
            continue
        if _is_near_organisation(text, m.start()):
            continue
        violations.append(_make_violation("phone_mobile", m.group(), m.start()))

    # Landline: 020-1234567, 0226-399320
    for m in re.finditer(r"0[1-9]\d{1,2}[-\s]\d{6,7}", text):
        if _is_inside_bracket(text, m.start()):
            continue
        if _is_in_header(text, m.start()):
            continue
        if _is_near_organisation(text, m.start()):
            continue
        violations.append(_make_violation("phone_landline", m.group(), m.start()))

    # Email addresses
    for m in re.finditer(r"[\w.+-]+@[\w.-]+\.\w{2,}", text):
        if _is_inside_bracket(text, m.start()):
            continue
        domain = m.group().split("@")[1].lower()
        if domain in SAFE_EMAIL_DOMAINS:
            continue
        if _is_in_header(text, m.start()):
            continue
        if _is_near_organisation(text, m.start()):
            continue
        violations.append(_make_violation("email", m.group(), m.start()))

    # Dutch postcode: 1234 AB
    for m in re.finditer(r"\b(\d{4})\s?([A-Z]{2})\b", text):
        if _is_inside_bracket(text, m.start()):
            continue
        if _is_in_header(text, m.start()):
            continue
        num = int(m.group(1))
        if num < 1000 or num > 9999:
            continue
        if POSTCODE_FALSE_POSITIVE.search(m.group()):
            continue
        if _is_near_organisation(text, m.start()):
            continue
        if _is_reference_housing(text, m.start()):
            continue
        violations.append(_make_violation("postcode", m.group(), m.start()))

    # Street name + house number
    for m in re.finditer(
        r"((?:straat|weg|laan|plein|singel|gracht|kade|dijk|dreef|hof|park|allee|boulevard|steeg|pad)\s+\d+[\s,a-zA-Z]{0,5})",
        text,
        re.IGNORECASE,
    ):
        if _is_inside_bracket(text, m.start()):
            continue
        if _is_in_header(text, m.start()):
            continue
        if _is_near_organisation(text, m.start()):
            continue
        if _is_reference_housing(text, m.start()):
            continue
        violations.append(_make_violation("street_address", m.group().strip(), m.start()))

    # BSN-like: exactly 9 digits (not part of longer number)
    for m in re.finditer(r"(?<!\d)\d{9}(?!\d)", text):
        if _is_inside_bracket(text, m.start()):
            continue
        context = text[max(0, m.start() - 40):m.start() + 40]
        if re.search(
            r"ECLI|parketnummer|parket|zaakn|registratien|kenmerk|dossiern|telefo|06[-\s]|fax",
            context,
            re.IGNORECASE,
        ):
            continue
        violations.append(_make_violation("bsn", m.group(), m.start()))

    # Full dates of birth
    months_alt = "|".join(MONTHS_NL)
    for m in re.finditer(
        rf"geboren\s+(?:op\s+)?(\d{{1,2}}\s+(?:{months_alt})\s+\d{{4}})",
        text,
        re.IGNORECASE,
    ):
        if _is_inside_bracket(text, m.start()):
            continue
        dob_match = m.group(1)
        dob_start = m.start() + m.group().index(dob_match)
        violations.append(_make_violation("date_of_birth", dob_match, dob_start))

    # Dutch license plates
    for m in re.finditer(
        r"\b([A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{1,2}|\d{2}[-\s]?[A-Z]{3}[-\s]?\d{1}|\d{1}[-\s]?[A-Z]{3}[-\s]?\d{2}|[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{2}|\d{2}[-\s]?[A-Z]{2}[-\s]?\d{2})\b",
        text,
    ):
        if _is_inside_bracket(text, m.start()):
            continue
        pre = text[max(0, m.start() - 20):m.start()]
        if re.search(r"artikel|lid|ECLI|nr\.|zaak", pre, re.IGNORECASE):
            continue
        violations.append(_make_violation("license_plate", m.group(), m.start()))

    return violations


def _make_violation(vtype: str, match: str, start_idx: int) -> Violation:
    meta = VIOLATION_META[vtype]
    return Violation(
        type=vtype,
        severity=meta["severity"],
        label=meta["label"],
        match=match,
        start_idx=start_idx,
        end_idx=start_idx + len(match),
        suggestion=meta["suggestion"],
    )


# ── Anonymization ─────────────────────────────────────────────────────────

def anonymize_decision(text: str) -> tuple[str, list[Violation]]:
    """Anonymize a decision body_text by replacing detected PII with tokens.

    Returns (anonymized_text, violations_found).

    Violations are sorted by start_idx descending so replacements don't shift
    subsequent positions. Already-bracketed text is preserved.
    """
    violations = scan_decision(text)
    if not violations:
        return text, []

    # Sort by position descending so replacement indices stay stable
    violations_sorted = sorted(violations, key=lambda v: v.start_idx, reverse=True)

    chars = list(text)
    for v in violations_sorted:
        # Verify the match is still intact (no overlapping replacement shifted it)
        current = "".join(chars[v.start_idx:v.end_idx])
        if current != v.match:
            continue
        chars[v.start_idx:v.end_idx] = v.suggestion

    return "".join(chars), violations
