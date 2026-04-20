"""XML parsing for Rechtspraak Open Data API responses."""

from lxml import etree

# Hardened XML parser: disable external entities and network access to prevent XXE attacks
_SAFE_PARSER = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)

from .config import NS
from .models import SearchEntry, DecisionContent, LegalArea, Relation, Contributor, Reference

ATOM_NS = NS["atom"]
RDF_NS = NS["rdf"]
DCTERMS_NS = NS["dcterms"]
RDFS_NS = NS["rdfs"]
PSI_NS = NS["psi"]
RS_NS = NS["rs"]
ECLI_NS = NS["ecli"]
BWB_NS = "bwb-dl"
EU_NS = "http://publications.europa.eu/celex/"
CVDR_NS = "http://decentrale.regelgeving.overheid.nl/cvdr/"
TR_NS = "http://tuchtrecht.overheid.nl/"


def parse_search_feed(xml_bytes: bytes) -> tuple[int, list[SearchEntry]]:
    """Parse an Atom feed from the search API. Returns (total_count, entries)."""
    root = etree.fromstring(xml_bytes, _SAFE_PARSER)

    subtitle = root.findtext(f"{{{ATOM_NS}}}subtitle", default="")
    total = 0
    if subtitle:
        # Format: "Aantal gevonden ECLI's: 123"
        parts = subtitle.split(":")
        if len(parts) >= 2:
            try:
                total = int(parts[-1].strip())
            except ValueError:
                pass

    entries = []
    for entry_el in root.findall(f"{{{ATOM_NS}}}entry"):
        # Skip deleted entries
        if entry_el.get("deleted"):
            continue

        ecli = entry_el.findtext(f"{{{ATOM_NS}}}id", default="")
        title = entry_el.findtext(f"{{{ATOM_NS}}}title", default="")
        summary = entry_el.findtext(f"{{{ATOM_NS}}}summary", default="")
        updated = entry_el.findtext(f"{{{ATOM_NS}}}updated", default="")

        link_el = entry_el.find(f"{{{ATOM_NS}}}link")
        link = link_el.get("href", "") if link_el is not None else ""

        if ecli:
            entries.append(SearchEntry(
                ecli=ecli,
                title=title,
                summary=summary,
                updated=updated,
                link=link,
            ))

    return total, entries


def _extract_text_recursive(el) -> str:
    """Recursively extract text from an element and its children."""
    parts = []
    if el.text:
        parts.append(el.text)
    for child in el:
        parts.append(_extract_text_recursive(child))
        if child.tail:
            parts.append(child.tail)
    return " ".join(parts)


def _get_attr(el, ns: str, name: str) -> str | None:
    """Get attribute value trying both namespaced and unqualified forms."""
    return el.get(f"{{{ns}}}{name}") or el.get(name)


def parse_decision_content(xml_bytes: bytes) -> DecisionContent:
    """Parse the full content XML for a single decision.

    Extracts all metadata defined in the open-metadata.xsd and
    open-rechtspraak.xsd schemas.
    """
    root = etree.fromstring(xml_bytes, _SAFE_PARSER)

    # Find the RDF metadata section
    rdf = root.find(f"{{{RDF_NS}}}RDF")
    if rdf is None:
        rdf = root.find("rdf:RDF", NS)

    content = DecisionContent(ecli="")

    if rdf is not None:
        # Parse all rdf:Description blocks (register + document metadata)
        descriptions = rdf.findall(f"{{{RDF_NS}}}Description")
        for desc in descriptions:
            _parse_rdf_description(desc, content)

        content.metadata_xml = etree.tostring(rdf, encoding="unicode", pretty_print=True)

    # Extract inhoudsindicatie
    inhoud_el = root.find(f"{{{RS_NS}}}inhoudsindicatie")
    if inhoud_el is None:
        inhoud_el = root.find("inhoudsindicatie")
    if inhoud_el is not None:
        content.inhoudsindicatie = _extract_text_recursive(inhoud_el).strip()

    # Extract body text from uitspraak or conclusie
    for tag in ["uitspraak", "conclusie"]:
        body_el = root.find(f"{{{RS_NS}}}{tag}")
        if body_el is None:
            body_el = root.find(tag)
        if body_el is not None:
            content.body_text = _extract_text_recursive(body_el).strip()
            content.body_xml = etree.tostring(body_el, encoding="unicode", pretty_print=True)
            if not content.decision_type:
                content.decision_type = "Uitspraak" if tag == "uitspraak" else "Conclusie"
            break

    return content


def _parse_rdf_description(desc, content: DecisionContent) -> None:
    """Parse a single rdf:Description element for all metadata fields."""

    # === Core metadata ===

    # Identifier (ECLI)
    identifier = desc.findtext(f"{{{DCTERMS_NS}}}identifier", default="")
    if identifier and not content.ecli:
        content.ecli = identifier

    # Decision type (Uitspraak / Conclusie)
    type_el = desc.find(f"{{{DCTERMS_NS}}}type")
    if type_el is not None and not content.decision_type:
        content.decision_type = type_el.text
        content.decision_type_uri = (
            _get_attr(type_el, PSI_NS, "resourceIdentifier")
            or type_el.get("resourceIdentifier")
        )

    # Decision date
    date_el = desc.find(f"{{{DCTERMS_NS}}}date")
    if date_el is not None and not content.decision_date:
        content.decision_date = date_el.text

    # Issued date (publication on rechtspraak.nl)
    issued_el = desc.find(f"{{{DCTERMS_NS}}}issued")
    if issued_el is not None and not content.issued_date:
        content.issued_date = issued_el.text

    # Modified date
    modified_el = desc.find(f"{{{DCTERMS_NS}}}modified")
    if modified_el is not None and not content.modified_date:
        content.modified_date = modified_el.text

    # Access rights (public / private)
    access_el = desc.find(f"{{{DCTERMS_NS}}}accessRights")
    if access_el is not None:
        content.access_rights = access_el.text

    # === Creator (court) with division ===
    creator_el = desc.find(f"{{{DCTERMS_NS}}}creator")
    if creator_el is not None and not content.court_name:
        content.court_name = creator_el.text.strip() if creator_el.text else None
        content.court_identifier = (
            _get_attr(creator_el, PSI_NS, "resourceIdentifier")
            or creator_el.get("resourceIdentifier")
        )
        # Court division (psi:afdeling)
        content.court_division = _get_attr(creator_el, PSI_NS, "afdeling")
        # Fallback: try rdfs:label for court name
        if not content.court_name:
            label = creator_el.get(f"{{{RDFS_NS}}}label")
            if label:
                content.court_name = label

    # === Contributors (judges / raadsheren / AG) ===
    for contrib_el in desc.findall(f"{{{DCTERMS_NS}}}contributor"):
        name = contrib_el.text.strip() if contrib_el.text else None
        if name:
            role = contrib_el.get(f"{{{RDFS_NS}}}label")
            content.contributors.append(Contributor(name=name, role=role))

    # === Title fields ===
    # Alternative title (famous case nickname)
    alt_el = desc.find(f"{{{DCTERMS_NS}}}alternative")
    if alt_el is not None:
        content.alternative_title = alt_el.text.strip() if alt_el.text else None

    # === Case identifiers ===
    # Case number (zaaknummer)
    zaaknr_el = desc.find(f"{{{PSI_NS}}}zaaknummer")
    if zaaknr_el is not None and not content.case_number:
        content.case_number = zaaknr_el.text

    # Procedure type
    procedure_el = desc.find(f"{{{PSI_NS}}}procedure")
    if procedure_el is not None and not content.procedure_type:
        content.procedure_type = procedure_el.text
        content.procedure_type_uri = (
            _get_attr(procedure_el, PSI_NS, "resourceIdentifier")
            or procedure_el.get("resourceIdentifier")
        )
        if not content.procedure_type:
            content.procedure_type = procedure_el.get(f"{{{RDFS_NS}}}label")

    # === Geographic & temporal ===
    # Coverage
    coverage_el = desc.find(f"{{{DCTERMS_NS}}}coverage")
    if coverage_el is not None and not content.coverage:
        content.coverage = coverage_el.text

    # Language
    lang_el = desc.find(f"{{{DCTERMS_NS}}}language")
    if lang_el is not None:
        content.language = lang_el.text or "nl"

    # Spatial (sitting location / zittingsplaats)
    spatial_el = desc.find(f"{{{DCTERMS_NS}}}spatial")
    if spatial_el is not None:
        content.spatial = spatial_el.text.strip() if spatial_el.text else None

    # Temporal (tax year / period)
    temporal_el = desc.find(f"{{{DCTERMS_NS}}}temporal")
    if temporal_el is not None:
        start_el = temporal_el.find("start")  # unqualified per schema
        end_el = temporal_el.find("end")
        if start_el is not None and start_el.text:
            content.temporal_start = start_el.text.strip()
        if end_el is not None and end_el.text:
            content.temporal_end = end_el.text.strip()

    # === Legal areas (subject) ===
    for subject_el in desc.findall(f"{{{DCTERMS_NS}}}subject"):
        area_id = (
            _get_attr(subject_el, PSI_NS, "resourceIdentifier")
            or subject_el.get("resourceIdentifier")
            or ""
        )
        name = (
            (subject_el.text.strip() if subject_el.text else "")
            or subject_el.get(f"{{{RDFS_NS}}}label")
            or ""
        )
        if area_id or name:
            content.legal_areas.append(LegalArea(identifier=area_id, name=name))

    # === Relations (formal: hoger beroep, cassatie, etc.) ===
    for rel_el in desc.findall(f"{{{DCTERMS_NS}}}relation"):
        rel = Relation(
            related_ecli=(
                rel_el.get(f"{{{ECLI_NS}}}resourceIdentifier")
                or rel_el.get("ecli:resourceIdentifier")
            ),
            relation_type=_get_attr(rel_el, PSI_NS, "type"),
            relation_aanleg=_get_attr(rel_el, PSI_NS, "aanleg"),
            relation_gevolg=_get_attr(rel_el, PSI_NS, "gevolg"),
            label=rel_el.text.strip() if rel_el.text else None,
        )
        content.relations.append(rel)

    # === References (law citations: BWB, EU, other ECLI) ===
    for ref_el in desc.findall(f"{{{DCTERMS_NS}}}references"):
        ref_type = None
        ref_id = None

        # Check for BWB reference
        bwb_id = ref_el.get(f"{{{BWB_NS}}}resourceIdentifier")
        if bwb_id:
            ref_type = "bwb"
            ref_id = bwb_id

        # Check for ECLI reference
        ecli_id = ref_el.get(f"{{{ECLI_NS}}}resourceIdentifier")
        if ecli_id:
            ref_type = "ecli"
            ref_id = ecli_id

        # Check for EU reference
        eu_id = ref_el.get(f"{{{EU_NS}}}resourceIdentifier")
        if eu_id:
            ref_type = "eu"
            ref_id = eu_id

        # Check for CVDR reference
        cvdr_id = ref_el.get(f"{{{CVDR_NS}}}resourceIdentifier")
        if cvdr_id:
            ref_type = "cvdr"
            ref_id = cvdr_id

        label = ref_el.text.strip() if ref_el.text else None

        if ref_type or label:
            content.references.append(Reference(
                reference_type=ref_type,
                identifier=ref_id,
                label=label,
            ))

    # === Vindplaatsen (publication venues: NJ, AB, JOR, etc.) ===
    has_version_el = desc.find(f"{{{DCTERMS_NS}}}hasVersion")
    if has_version_el is not None:
        rdf_list = has_version_el.find(f"{{{RDF_NS}}}list")
        if rdf_list is not None:
            for li in rdf_list.findall(f"{{{RDF_NS}}}li"):
                text = li.text.strip() if li.text else None
                if text:
                    content.vindplaatsen.append(text)

    # === Replaces / IsReplacedBy ===
    replaces_el = desc.find(f"{{{DCTERMS_NS}}}replaces")
    if replaces_el is not None:
        content.replaces = replaces_el.text.strip() if replaces_el.text else None

    replaced_by_el = desc.find(f"{{{DCTERMS_NS}}}isReplacedBy")
    if replaced_by_el is not None:
        content.is_replaced_by = replaced_by_el.text.strip() if replaced_by_el.text else None

    # === HasFormat (public URL on rechtspraak.nl) ===
    has_format_el = desc.find(f"{{{DCTERMS_NS}}}hasFormat")
    if has_format_el is not None and not content.public_url:
        content.public_url = (
            has_format_el.get("resourceIdentifier")
            or _get_attr(has_format_el, TR_NS, "resourceIdentifier")
        )
