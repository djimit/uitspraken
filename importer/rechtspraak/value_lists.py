"""Fetch and parse value lists (waardelijsten) from Rechtspraak."""

import logging
import sqlite3

import httpx
from lxml import etree
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

VALUE_LIST_URLS = {
    "instanties": "https://data.rechtspraak.nl/Waardelijst/Instanties",
    "rechtsgebieden": "https://data.rechtspraak.nl/Waardelijst/Rechtsgebieden",
    "proceduresoorten": "https://data.rechtspraak.nl/Waardelijst/Proceduresoorten",
    "formele_relaties": "https://data.rechtspraak.nl/Waardelijst/FormeleRelaties",
    "instanties_buitenlands": "https://data.rechtspraak.nl/Waardelijst/InstantiesBuitenlands",
    "niet_nederlandse_uitspraken": "https://data.rechtspraak.nl/Waardelijst/NietNederlandseUitspraken",
}

# Hardened XML parser: disable external entities and network access to prevent XXE
_SAFE_PARSER = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)

# Retry helper for transient HTTP/network failures
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=1, max=30),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TransportError, httpx.TimeoutException)),
    reraise=True,
)
def _fetch_xml(url: str) -> etree._Element:
    """Fetch a URL and parse the response as XML with retry logic."""
    resp = httpx.get(url, follow_redirects=True, timeout=30)
    resp.raise_for_status()
    return etree.fromstring(resp.content, _SAFE_PARSER)


def fetch_and_store_value_lists(conn: sqlite3.Connection) -> dict:
    """Fetch all value lists and store them in the database."""
    stats = {}

    # 1. Instanties (Dutch courts)
    logger.info("Fetching Instanties...")
    root = _fetch_xml(VALUE_LIST_URLS["instanties"])
    count = 0
    for inst in root.findall("Instantie"):
        identifier = inst.findtext("Identifier", "").strip()
        naam = inst.findtext("Naam", "").strip()
        afkorting = inst.findtext("Afkorting", "").strip() or None
        inst_type = inst.findtext("Type", "").strip() or None
        begin_date = inst.findtext("BeginDate", "").strip() or None
        end_date = inst.findtext("EndDate", "").strip() or None
        if identifier and naam:
            conn.execute(
                """INSERT OR REPLACE INTO courts (identifier, name, abbreviation, type, begin_date, end_date)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (identifier, naam, afkorting, inst_type, begin_date, end_date),
            )
            count += 1
    stats["courts"] = count
    logger.info(f"  Stored {count} Dutch courts")

    # 2. Rechtsgebieden (legal areas) - hierarchical
    logger.info("Fetching Rechtsgebieden...")
    root = _fetch_xml(VALUE_LIST_URLS["rechtsgebieden"])
    count = _parse_legal_areas(conn, root.findall("Rechtsgebied"), parent_id=None)
    stats["legal_areas"] = count
    logger.info(f"  Stored {count} legal areas")

    # 3. Proceduresoorten (procedure types)
    logger.info("Fetching Proceduresoorten...")
    root = _fetch_xml(VALUE_LIST_URLS["proceduresoorten"])
    count = 0
    for proc in root.findall("Proceduresoort"):
        identifier = proc.findtext("Identifier", "").strip()
        naam = proc.findtext("Naam", "").strip()
        if identifier and naam:
            conn.execute(
                "INSERT OR REPLACE INTO procedure_types (identifier, name) VALUES (?, ?)",
                (identifier, naam),
            )
            count += 1
    stats["procedure_types"] = count
    logger.info(f"  Stored {count} procedure types")

    # 4. FormeleRelaties (formal relations between courts/aanleg levels)
    logger.info("Fetching FormeleRelaties...")
    root = _fetch_xml(VALUE_LIST_URLS["formele_relaties"])
    count = 0
    for rel in root.findall("FormeleRelatie"):
        identifier = rel.findtext("Identifier", "").strip()
        naam = rel.findtext("Naam", "").strip()
        label_eerdere = rel.findtext("LabelEerdereAanleg", "").strip() or None
        label_latere = rel.findtext("LabelLatereAanleg", "").strip() or None
        if identifier and naam:
            conn.execute(
                """INSERT OR REPLACE INTO formal_relations (identifier, name, label_eerdere_aanleg, label_latere_aanleg)
                   VALUES (?, ?, ?, ?)""",
                (identifier, naam, label_eerdere, label_latere),
            )
            count += 1
            # Parse role players
            conn.execute("DELETE FROM formal_relation_roles WHERE relation_identifier = ?", (identifier,))
            rolspelers = rel.find("Rolspelers")
            if rolspelers is not None:
                for rp in rolspelers.findall("Rolspeler"):
                    latere = rp.findtext("InstantieLatereAanleg", "").strip() or None
                    eerdere = rp.findtext("InstantieEerdereAanleg", "").strip() or None
                    if latere or eerdere:
                        conn.execute(
                            """INSERT INTO formal_relation_roles (relation_identifier, instantie_latere_aanleg, instantie_eerdere_aanleg)
                               VALUES (?, ?, ?)""",
                            (identifier, latere, eerdere),
                        )
    stats["formal_relations"] = count
    logger.info(f"  Stored {count} formal relations")

    # 5. InstantiesBuitenlands (foreign courts)
    logger.info("Fetching InstantiesBuitenlands...")
    root = _fetch_xml(VALUE_LIST_URLS["instanties_buitenlands"])
    count = 0
    for inst in root.findall("Instantie"):
        identifier = inst.findtext("Identifier", "").strip()
        naam = inst.findtext("Naam", "").strip()
        afkorting = inst.findtext("Afkorting", "").strip() or None
        inst_type = inst.findtext("Type", "").strip() or None
        begin_date = inst.findtext("BeginDate", "").strip() or None
        end_date = inst.findtext("EndDate", "").strip() or None
        if identifier and naam:
            conn.execute(
                """INSERT OR REPLACE INTO courts (identifier, name, abbreviation, type, begin_date, end_date)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (identifier, naam, afkorting, inst_type, begin_date, end_date),
            )
            count += 1
    stats["foreign_courts"] = count
    logger.info(f"  Stored {count} foreign courts")

    # 6. NietNederlandseUitspraken (non-Dutch decisions with Dutch references)
    logger.info("Fetching NietNederlandseUitspraken...")
    root = _fetch_xml(VALUE_LIST_URLS["niet_nederlandse_uitspraken"])
    count = 0
    for entry in root.findall("entry"):
        ecli = (entry.findtext("id", "") or "").strip()
        # Can have multiple LJN numbers per entry
        ljns = [ljn.text.strip() for ljn in entry.findall("ljn") if ljn.text]
        if ecli:
            for ljn in ljns:
                conn.execute(
                    "INSERT OR REPLACE INTO non_dutch_decisions (ecli, ljn) VALUES (?, ?)",
                    (ecli, ljn),
                )
                count += 1
    stats["non_dutch_decisions"] = count
    logger.info(f"  Stored {count} non-Dutch decision references")

    conn.commit()
    return stats


def _parse_legal_areas(conn: sqlite3.Connection, elements, parent_id: str | None) -> int:
    """Recursively parse legal areas with hierarchy."""
    count = 0
    for el in elements:
        identifier = el.findtext("Identifier", "").strip()
        naam = el.findtext("Naam", "").strip()
        if identifier and naam:
            conn.execute(
                "INSERT OR REPLACE INTO legal_areas (identifier, name, parent_identifier) VALUES (?, ?, ?)",
                (identifier, naam, parent_id),
            )
            count += 1
            # Recurse into child Rechtsgebied elements
            children = el.findall("Rechtsgebied")
            if children:
                count += _parse_legal_areas(conn, children, identifier)
    return count
