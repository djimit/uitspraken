import re

PII_PATTERNS = [
    (re.compile(r"\b\d{9}\b"), "[BSN-MASKED]"),
    (re.compile(r"\b\d{4}\s?[A-Z]{2}\b"), "[POSTCODE-MASKED]"),
    (re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}"), "[EMAIL-MASKED]"),
]


def mask_pii(text: str) -> str:
    for pattern, replacement in PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def sanitize_query_for_log(query: str | None) -> str:
    if not query:
        return ""
    return mask_pii(query)[:200]
