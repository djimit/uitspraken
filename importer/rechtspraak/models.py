"""Data models for the Rechtspraak importer."""

from dataclasses import dataclass, field


@dataclass
class SearchEntry:
    ecli: str
    title: str
    summary: str
    updated: str
    link: str


@dataclass
class LegalArea:
    identifier: str
    name: str


@dataclass
class Relation:
    related_ecli: str | None
    relation_type: str | None
    relation_aanleg: str | None
    relation_gevolg: str | None
    label: str | None


@dataclass
class Contributor:
    name: str
    role: str | None = None  # e.g. "Rechter", "Raadsheer", "AG"


@dataclass
class Reference:
    reference_type: str | None  # "bwb", "ecli", "eu", "cvdr"
    identifier: str | None
    label: str | None


@dataclass
class DecisionContent:
    ecli: str
    decision_type: str | None = None
    decision_type_uri: str | None = None
    decision_date: str | None = None
    issued_date: str | None = None
    modified_date: str | None = None
    court_identifier: str | None = None
    court_name: str | None = None
    court_division: str | None = None  # psi:afdeling
    case_number: str | None = None
    procedure_type: str | None = None
    procedure_type_uri: str | None = None
    coverage: str | None = None
    language: str = "nl"
    alternative_title: str | None = None  # dcterms:alternative (famous cases)
    spatial: str | None = None  # dcterms:spatial (sitting location)
    temporal_start: str | None = None  # dcterms:temporal start
    temporal_end: str | None = None  # dcterms:temporal end
    public_url: str | None = None  # dcterms:hasFormat URL
    replaces: str | None = None  # dcterms:replaces
    is_replaced_by: str | None = None  # dcterms:isReplacedBy
    access_rights: str | None = "public"  # dcterms:accessRights
    legal_areas: list[LegalArea] = field(default_factory=list)
    relations: list[Relation] = field(default_factory=list)
    contributors: list[Contributor] = field(default_factory=list)
    references: list[Reference] = field(default_factory=list)
    vindplaatsen: list[str] = field(default_factory=list)  # dcterms:hasVersion
    body_text: str | None = None
    body_xml: str | None = None
    inhoudsindicatie: str | None = None
    metadata_xml: str | None = None


@dataclass
class Court:
    identifier: str
    name: str
    abbreviation: str | None = None
    court_type: str | None = None
    begin_date: str | None = None
    end_date: str | None = None
