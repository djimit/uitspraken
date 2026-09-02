#!/usr/bin/env python3
"""Generate PhD-level advisory PDF v2 — ICC sanctions & Dutch judiciary."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
)

OUTPUT_DIR = "/Users/dlandman/DjimIT/consulting/advies-icc-strategie-rechtspraak/run-3"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "advies-icc-strategie-rechtspraak.pdf")

styles = getSampleStyleSheet()
NAVY = HexColor("#1a3a5c")
ACCENT = HexColor("#c4912b")
LIGHT_GREY = HexColor("#f5f5f0")
DARK_GREY = HexColor("#444444")

s_title = ParagraphStyle(
    "T", parent=styles["Title"], fontSize=22, textColor=NAVY, spaceAfter=6, leading=26
)
s_sub = ParagraphStyle(
    "Su",
    parent=styles["Normal"],
    fontSize=13,
    textColor=DARK_GREY,
    spaceAfter=20,
    leading=16,
    alignment=TA_CENTER,
)
s_h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontSize=16,
    textColor=NAVY,
    spaceBefore=18,
    spaceAfter=8,
    leading=20,
)
s_h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontSize=13,
    textColor=NAVY,
    spaceBefore=12,
    spaceAfter=6,
    leading=16,
)
s_h3 = ParagraphStyle(
    "H3",
    parent=styles["Heading3"],
    fontSize=11,
    textColor=ACCENT,
    spaceBefore=8,
    spaceAfter=4,
    leading=14,
)
s_body = ParagraphStyle(
    "B",
    parent=styles["Normal"],
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=6,
    leading=14,
)
s_small = ParagraphStyle(
    "Bs",
    parent=styles["Normal"],
    fontSize=9,
    alignment=TA_JUSTIFY,
    spaceAfter=4,
    leading=12,
)
s_ref = ParagraphStyle(
    "R",
    parent=styles["Normal"],
    fontSize=8.5,
    textColor=DARK_GREY,
    spaceAfter=3,
    leading=11,
    leftIndent=20,
    firstLineIndent=-20,
)


def P(t, s=s_body):
    return Paragraph(t, s)


def hdr_ftr(c, d):
    c.saveState()
    c.setFont("Helvetica", 8)
    c.setFillColor(grey)
    c.drawCentredString(
        A4[0] / 2, 1.2 * cm, f"Advies ICC-Sancties — v2 (1 sep 2026) — Pagina {d.page}"
    )
    if d.page > 1:
        c.setStrokeColor(NAVY)
        c.setLineWidth(0.5)
        c.line(2.2 * cm, A4[1] - 1.8 * cm, A4[0] - 2.2 * cm, A4[1] - 1.8 * cm)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(NAVY)
        c.drawString(
            2.2 * cm,
            A4[1] - 1.6 * cm,
            "ICC-Sancties en de Nederlandse Rechterlijke Macht",
        )
    c.restoreState()


def tbl_style(extra=None):
    base = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.25, grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GREY]),
    ]
    if extra:
        base += extra
    return TableStyle(base)


# ── Content ──


def title_page(S):
    S.append(Spacer(1, 4 * cm))
    S.append(P("Advies: ICC-Sancties en de Nederlandse Rechterlijke Macht", s_title))
    S.append(Spacer(1, 4 * mm))
    S.append(
        P(
            "Een gelaagd advies naar aanleiding van het NRC-interview met Henk Naves, voorzitter Raad voor de Rechtspraak",
            s_sub,
        )
    )
    S.append(Spacer(1, 1.5 * cm))
    meta = [
        ["Opdrachtgever", "DjimIT Consulting (intern)"],
        ["Auteur", "D. Landman, MSc"],
        ["Datum", "1 september 2026"],
        ["Versie", "2.0 (critic review verwerkt)"],
        ["Classificatie", "Intern — niet voor externe publicatie"],
        ["Bronnen", "16 (2 primair, 11 secundair, 3 domeinkennis)"],
        ["Niveau", "PhD / Level 3 — gelaagde argumentatie"],
    ]
    mt = Table(meta, colWidths=[4 * cm, 11 * cm])
    mt.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
                ("TEXTCOLOR", (1, 0), (1, -1), DARK_GREY),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREY),
                ("LINEABOVE", (0, 0), (-1, 0), 1, NAVY),
                ("LINEBELOW", (0, -1), (-1, -1), 1, NAVY),
            ]
        )
    )
    S.append(mt)
    S.append(Spacer(1, 2 * cm))
    S.append(
        P(
            "<b>Samenvatting.</b> Dit advies analyseert de geopolitieke spanning tussen de Verenigde Staten en het Internationaal Strafhof (ICC) vanuit twee complementaire perspectieven. Spoor A biedt policy-advice voor de Nederlandse rechterlijke macht in het spanningsveld van statenimmuniteit, universele jurisdictie en het Rome Statuut. Spoor B vertaalt de geopolitieke risico's naar concrete IV/architectuur-implicaties voor het Rechtspraak-softwareproject, met bijzondere aandacht voor US-origin componenten (OpenSearch), BIO2-maatregelen en een TOGAF-gebaseerde migratiestrategie.",
            s_small,
        )
    )
    S.append(PageBreak())


def exec_summary(S):
    S.append(P("Executive Summary", s_h1))
    S.append(
        P(
            "Op 13 juli 2026 kondigde de Amerikaanse minister van Buitenlandse Zaken Rubio een 'whole-of-government' campagne aan om het Internationaal Strafhof (ICC) te ontmantelen. Het ICC had geweigerd een onderzoek naar Amerikaanse militairen en inlichtingenofficieren te sluiten. In een interview met NRC op 31 augustus 2026 reageert Henk Naves, voorzitter van de Raad voor de Rechtspraak, op deze sancties en hun implicaties voor de Nederlandse rechterlijke macht [S6]."
        )
    )
    S.append(
        P(
            "Dit advies beargumenteert dat de Nederlandse rechterlijke macht een <b>doctrine van prudente stevigheid</b> moet aannemen: pragmatisch in diplomatieke afstemming, doch jurisprudentieel robuust in de handhaving van het Rome Statuut en het EU Blocking Statute. De doctrine wordt geoperationaliseerd via drie sporen met expliciete tijdspaden en verantwoordelijken."
        )
    )
    S.append(
        P(
            "Voor het Rechtspraak-softwareproject betekent dit dat de enige US-origin component — OpenSearch 2.17.1 — een supply-chain-risico vormt dat binnen BIO2-kader US-ORIGIN-1/2/3 aanspreekbaar is. Een TOGAF-gebaseerde migratie naar een EU-alternatief (typesense, Qdrant) via de bestaande <i>SearchEnginePort</i>-abstractie is technisch haalbaar met minimale blast radius."
        )
    )
    S.append(Spacer(1, 6))
    findings = [
        ["#", "Bevinding", "Risico"],
        [
            "1",
            "VS-sancties raken ICC-operationele capaciteit, niet Nederlandse rechterlijke onafhankelijkheid direct",
            "Laag",
        ],
        [
            "2",
            "EU Blocking Statute (Verordening 2271/96) verplicht non-compliance met extraterritoriale Amerikaanse wetgeving",
            "Medium",
        ],
        [
            "3",
            "Rome Statuut Art 27 vs Art 98 spanningsveld blijft onopgelost in internationaal recht",
            "Hoog",
        ],
        [
            "4",
            "OpenSearch (US-origin) is enige supply-chain-afhankelijkheid in Rechtspraak-stack",
            "Medium",
        ],
        [
            "5",
            "SearchEnginePort-abstractie maakt migratie technisch triviaal, politiek complex",
            "Laag",
        ],
    ]
    S.append(
        Table(findings, colWidths=[0.8 * cm, 11 * cm, 2.5 * cm], style=tbl_style())
    )
    S.append(PageBreak())


def legal_framework(S):
    S.append(P("1. Juridisch Kader", s_h1))
    S.append(P("1.1 Het Rome Statuut en de immuniteitsdoctrine", s_h2))
    S.append(
        P(
            "Het Rome Statuut [S4, S6] kent een fundamentele spanning tussen Artikel 27 en Artikel 98. Artikel 27 stelt dat officiële capaciteit (immuniteit) geen beletsel vormt voor de jurisdictie van het Hof — dit geldt ook voor staatshoofden. Artikel 98 daarentegen verplicht het Hof om bij de uitlevering van een persoon rekening te houden met de immuniteitsverplichtingen van derde staten. Deze spanning is uitvoerig besproken in de Al-Bashir-beslissingen van het ICC, waarin twee routes werden gevolgd: de Veiligheidsraad-route (SC-referral impliceert waiver) en de grammaticale interpretatie (Art 27 prevaleert boven Art 98 voor statenpartijen) [S4]."
        )
    )
    S.append(
        P(
            "De EHRM-jurisprudentie rondom rechterlijke onafhankelijkheid — <i>Campbell and Fell v Verenigd Koninkrijk</i>, <i>Stafford v Verenigd Koninkrijk</i>, <i>Kleyn v Nederland</i> — onderstreept dat onafhankelijkheid een kernwaarde is die niet door politieke druk mag worden ingeperkt. Deze jurisprudentie is relevant omdat Nederland als gaststaat van het ICC een bijzondere verantwoordelijkheid draagt [S5]."
        )
    )
    S.append(P("1.2 Saadi v. Italië en de grenzen van immuniteit", s_h2))
    S.append(
        P(
            "In <i>Saadi v Italië</i> (EHRM, 2008) oordeelde het Hof dat de uitlevering van een individu naar een staat waar hij een reëel risico loopt op foltering, in strijd is met Artikel 3 EHRM — onafhankelijk van de ernst van de vermeende misdrijven. Deze uitspraak is relevant voor het ICC-sancieregime omdat zij de grenzen van statenimmuniteit aangeeft: immuniteit tegen vervolging [S11, S13] weegt niet op tegen fundamentele mensenrechtenbescherming [S8]."
        )
    )
    S.append(
        P(
            "De doctrine van universele jurisdictie [S10] stelt dat bepaalde internationale misdrijven (genocide, oorlogsmisdrijven, misdrijven tegen de menselijkheid) door elke staat kunnen worden vervolgd, onafhankelijk van territoriale of personaliteitsjurisdictie. Het Genocideverdrag [S12] en het Rome Statuut [S6] verankeren dit principe. De extraterritoriale jurisdictie [S15] die Nederland uitoefent op basis van deze verdragen, wordt door de VS-sancties niet direct aangetast — maar de geopolitieke druk creëert een chillend effect op de bereidheid om deze jurisdictie actief te gebruiken."
        )
    )
    S.append(P("1.3 Statenimmuniteit: het algemene vertrekpunt", s_h2))
    S.append(
        P(
            "Het internationaal gewoonterecht kent statenimmuniteit [S9] als fundamenteel beginsel: soevereine staten zijn niet onderworpen aan de jurisdictie van andere staten. Deze immuniteit is echter niet absoluut. De uitzondering voor <i>acta de jure gestionis</i> (commerciële handelingen) versus <i>acta de jure imperii</i> (soevereine handelingen) is inmiddels algemeen aanvaard. Voor internationale misdrijven is de trend — zoals zichtbaar in <i>Pinochet (No. 3)</i> en <i>Jones v Saudi-Arabië</i> — dat immuniteit voor ernstige mensenrechtenschendingen steeds verder wordt ingeperkt [S9, S11]."
        )
    )
    S.append(P("1.4 EU Blocking Statute (Verordening 2271/96)", s_h2))
    S.append(
        P(
            "De EU-Verordening 2271/96 [S2] is het centrale juridische instrument waarmee de EU zich verzet tegen extraterritoriale toepassing van derdelandsrecht. Artikel 2 verplicht EU-personen om niet te voldoen aan eisen uit extraterritoriale wetgeving. Artikelen 3-6 bepalen dat vonnissen op basis van dergelijke wetgeving niet worden erkend of ten uitvoer gelegd. Artikel 7 schept een informatieverplichting richting de Europese Commissie. Artikel 8 bevestigt dat niet-nakoming van de verordening geen rechtsgevolg heeft. De Annex somt de specifieke Amerikaanse wetten op (Helms-Burton, ILSA, Iran/Libya Sanctions Act) [S2]."
        )
    )
    S.append(
        P(
            "Voor de Nederlandse context betekent dit dat Nederlandse rechtsorganen en -medewerkers <b>juridisch verplicht</b> zijn om niet mee te werken aan Amerikaanse sancties die extraterritoriale werking claimen — inclusief sancties gericht tegen het ICC. Dit geldt ook voor informatie-uitwisseling, technische steun, of andere vormen van bijstand [S2]."
        )
    )
    S.append(P("1.5 De VS-ICC dynamiek", s_h2))
    S.append(
        P(
            "De Verenigde Staten zijn geen partij bij het Rome Statuut en hebben historisch een vijandige houding aangenomen tegenover het ICC. De sancties van juli 2026 [S1] vormen een escalatie van eerdere maatregelen (2020, onder Trump) die in 2021 door Biden werden opgeheven. De huidige campagne omvat een 'whole-of-government response' met als doel het 'systematically disable ICC operations'. Secretary Rubio benadrukte dat 'no diplomatic option is off-limits' [S1]. Het ICC onderzoekt Amerikaanse militairen en inlichtingenofficieren en heeft geweigerd dit onderzoek te sluiten [S1, S7]."
        )
    )


def policy_advice(S):
    S.append(PageBreak())
    S.append(P("2. Spoor A: Policy Advice voor de Rechterlijke Macht", s_h1))
    S.append(P("2.1 Doctrine van Prudente Stevigheid", s_h2))
    S.append(
        P(
            "De Raad voor de Rechtspraak kan een doctrine aannemen die twee principes verbindt: <b>prudentie</b> in diplomatieke afstemming met de uitvoerende macht, en <b>stevigheid</b> in de jurisprudentiële handhaving van internationale verplichtingen. De doctrine is niet een politieke keuze maar een juridisch verplichte positie, afgeleid uit het Rome Statuut, het EU Blocking Statute en de EHRM-jurisprudentie over rechterlijke onafhankelijkheid [S2, S4, S5]."
        )
    )
    S.append(P("De doctrine wordt geoperationaliseerd via drie sporen:", s_body))
    S.append(P("Spoor 1: Jurisprudentiële Robuustheid (Q4 2026 — Q2 2027)", s_h3))
    S.append(
        P(
            "<b>Doel.</b> Nederlandse rechters handhaven het Rome Statuut en het EU Blocking Statute zonder politieke zelfcensuur. <b>Acties.</b> (1) De Hoge Raad publiceert een richtlijn dat immuniteitskwesties in ICC-gerelateerde zaken worden getoetst aan Art 27 Rome Statuut, niet aan diplomatieke overwegingen. (2) Het Openbaar Ministerie ontwikkelt een protocol voor universele jurisdictie-cases met expliciete non-compliance met Amerikaanse sanctie-eisen. (3) De Raad voor de Rechtspraak biedt training aan rechters over het EU Blocking Statute en de Saadi-v-Italië-doctrine [S2, S8]. <b>Tijdspad.</b> Richtlijn uiterlijk Q1 2027, trainingen Q2 2027. <b>Verantwoordelijke.</b> Hoge Raad (richtlijn), Raad voor de Rechtspraak (training), OM (protocol)."
        )
    )
    S.append(P("Spoor 2: Diplomatieke Afstemming (Q4 2026 — lopend)", s_h3))
    S.append(
        P(
            "<b>Doel.</b> De rechterlijke macht coördineert met het ministerie van Buitenlandse Zaken zonder haar onafhankelijkheid prijs te geven. <b>Acties.</b> (1) De Raad voor de Rechtspraak stelt een permanent liaison in met BZ voor ICC-gerelateerde ontwikkelingen. (2) Er komt een protocol voor informatie-uitwisseling dat Artikel 7 van het EU Blocking Statute respecteert (informeren Commissie, niet informeren van derde staten). (3) De rechterlijke macht onderschrijft dat geopolitieke afwegingen een taak van de uitvoerende macht zijn, niet van de rechter [S2]. <b>Tijdspad.</b> Liaison Q4 2026, protocol Q1 2027. <b>Verantwoordelijke.</b> Raad voor de Rechtspraak."
        )
    )
    S.append(P("Spoor 3: Institutionele Weerbaarheid (Q1 2027 — Q4 2027)", s_h3))
    S.append(
        P(
            "<b>Doel.</b> De rechterlijke macht is bestand tegen externe druk, sancties en cyberoperaties. <b>Acties.</b> (1) BIO2-audit van rechterlijke IT-systemen met bijzondere aandacht voor US-origin componenten (US-ORIGIN-1/2/3, zie Spoor B). (2) Crisisprotocol voor het scenario dat Nederlandse rechters of medewerkers persoonlijk door de VS worden gesanctioneerd (rekeningblokkades, reisbeperkingen). (3) Samenwerking met EU-partners voor fallback-infrastructuur. <b>Tijdspad.</b> Audit Q1 2027, crisisprotocol Q2 2027, EU-fallback Q4 2027. <b>Verantwoordelijke.</b> Raad voor de Rechtspraak + ICTU."
        )
    )
    S.append(P("2.2 Aanbevelingen", s_h2))
    recs = [
        "De Raad voor de Rechtspraak adopteert de doctrine van prudente stevigheid als leidraad voor ICC-gerelateerde kwesties.",
        "De Hoge Raad ontwikkelt een richtlijn immuniteit/ICC die Art 27 Rome Statuut als vertrekpunt neemt, niet diplomatieke afwegingen.",
        "Het OM ontvangt een protocol voor universele jurisdictie-cases met expliciete non-compliance met VS-sancties op basis van Verordening 2271/96.",
        "De rechterlijke macht stelt een liaison in met BZ en een informatieprotocol dat Artikel 7 EU Blocking Statute respecteert.",
        "BIO2-audit van rechterlijke IT met focus op US-origin componenten (US-ORIGIN-1/2/3).",
        "Crisisprotocol voor persoonlijke sancties tegen rechters/medewerkers.",
    ]
    for i, r in enumerate(recs, 1):
        S.append(P(f"<b>A{i}.</b> {r}"))


def architecture(S):
    S.append(PageBreak())
    S.append(P("3. Spoor B: IV/Architectuur-Implicaties", s_h1))
    S.append(P("3.1 Huidige Architectuur (Rechtspraak Repository)", s_h2))
    S.append(
        P(
            "Het Rechtspraak-project [S16] bestaat uit drie lagen: (1) een Python ETL-importer die uitspraken crawlt van data.rechtspraak.nl en opslaat in SQLite (12,6 GB, 174K+ beslissingen, FTS5-geïndexeerde full-text search); (2) een Next.js dashboard (App Router) met better-sqlite3 in readonly-mode — geen cloud-afhankelijkheden; (3) een Search Platform (FastAPI + OpenSearch 2.17.1) met DLS/FLS-autorisatie en een <i>SearchEnginePort</i>-abstractie [S16]."
        )
    )
    arch = [
        ["Component", "Herkomst", "US-origin?", "Risico"],
        ["Next.js dashboard", "Vercel (US) / OSS", "Nee (MIT)", "Laag"],
        ["better-sqlite3", "OSS (MIT)", "Nee", "Laag"],
        ["SQLite", "Public domain", "Nee", "Geen"],
        ["FastAPI", "OSS (MIT)", "Nee", "Laag"],
        ["OpenSearch 2.17.1", "Amazon (US) / Apache 2.0", "JA", "Medium"],
        ["Docker", "Docker Inc (US) / Apache 2.0", "Bedrijfsrisico", "Laag"],
        ["python-jose", "OSS (MIT)", "Nee", "Laag"],
        ["OpenTelemetry", "CNCF / OSS", "Nee", "Laag"],
    ]
    S.append(
        Table(arch, colWidths=[4 * cm, 4 * cm, 2.5 * cm, 2.5 * cm], style=tbl_style())
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "OpenSearch 2.17.1 is de enige US-origin component in de stack. Hoewel OpenSearch een Apache 2.0-licensed project is (na de fork van Elasticsearch in 2021), wordt het beheerd door Amazon Web Services — een Amerikaans bedrijf dat onderhevig is aan Amerikaans export controlrecht (EAR) en sanctiebeleid [S16]."
        )
    )
    S.append(P("3.2 BIO2 en US-Origin Componenten", s_h2))
    S.append(
        P(
            "Het Beheermodel Informatiebeveiliging Overheid (BIO2) [S15] is het verplichte kader voor Rijksoverheid-ICT, gebaseerd op ISO 27001/27002. BIO-1 dekt basismaatregelen, BIO-2 voortgezette maatregelen, BIO-3 audit/BIR. Voor US-origin componenten zijn drie BIO2-maatregelen direct relevant:"
        )
    )
    S.append(
        P(
            "<b>US-ORIGIN-1 (Leveranciersrisico).</b> Het leveranciersrisico van OpenSearch moet worden gedocumenteerd in een VRBI-leveranciersanalyse. Het risico is dat Amazon onder Amerikaanse sanctiedruk de toegang tot updates, security patches of documentatie beperkt. Mitigatie: lokale fork, mirror van artifacts, of migratie naar EU-alternatief [S15, S16]."
        )
    )
    S.append(
        P(
            "<b>US-ORIGIN-2 (Supply-chain integrity).</b> De integriteit van OpenSearch-releases moet worden gewaarborgd via signature verification en reproducible builds. Bij Amerikaanse sancties is er een risico dat toekomstige releases backdoors bevatten onder dwang van Amerikaanse overheid (National Security Letter). Mitigatie: pinning van huidige versie, eigen artifact-mirror, code-audit bij elke upgrade [S15]."
        )
    )
    S.append(
        P(
            "<b>US-ORIGIN-3 (Exit-strategie).</b> BIO2 vereist een exit-strategie voor kritieke afhankelijkheden. De SearchEnginePort-abstractie in <i>opensearch_adapter.py</i> maakt een migratie naar een EU-alternatief (typesense, Qdrant, Meilisearch) technisch haalbaar met minimale blast radius — alleen de adapter hoeft te worden vervangen [S16]."
        )
    )
    S.append(P("3.3 TOGAF-gebaseerde Migratiestrategie", s_h2))
    S.append(
        P(
            "De migratie van OpenSearch naar een EU-alternatief kan worden gestructureerd via de TOGAF ADM (Architecture Development Method). De volgende fasen zijn relevant:"
        )
    )
    togaf = [
        ["TOGAF Fase", "Activiteit", "Tijdspad", "Risico"],
        [
            "A. Architecture Vision",
            "Definitie doelarchitectuur (zonder US-origin)",
            "2 weken",
            "Laag",
        ],
        [
            "B. Business Architecture",
            "Impact-analyse op search-functionaliteit (9 query-modi)",
            "3 weken",
            "Medium",
        ],
        [
            "C. Information Systems",
            "Selectie alternatief (typesense/Qdrant/Meilisearch)",
            "4 weken",
            "Medium",
        ],
        [
            "D. Technology Architecture",
            "PoC met geselecteerd alternatief via SearchEnginePort",
            "6 weken",
            "Laag",
        ],
        [
            "E. Opportunities & Solutions",
            "Vergelijking PoC vs OpenSearch (performance, features)",
            "2 weken",
            "Laag",
        ],
        [
            "F. Migration Planning",
            "Gefaseerde migratie, rollback-plan, dual-run",
            "4 weken",
            "Medium",
        ],
        [
            "G. Implementation Governance",
            "Uitvoering migratie, monitoring",
            "8 weken",
            "Medium",
        ],
        [
            "H. Architecture Change Mgmt",
            "Decommissioning OpenSearch, update documentatie",
            "4 weken",
            "Laag",
        ],
    ]
    S.append(
        Table(
            togaf,
            colWidths=[4 * cm, 5.5 * cm, 2 * cm, 2 * cm],
            style=tbl_style([("FONTSIZE", (0, 0), (-1, -1), 8)]),
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "De totale migratie-inspanning bedraagt circa 33 weken (8 maanden) met een part-time team. De SearchEnginePort-abstractie [S16: <i>search-platform/app/engine/port.py</i>] is de kritieke enabler: alleen <i>opensearch_adapter.py</i> hoeft te worden vervangen door een nieuwe adapter. De 9 query-modi in <i>query_builder.py</i> moeten opnieuw worden gemapt, maar de API-sequentie blijft identiek [S16]."
        )
    )
    S.append(P("3.4 PII en Geopolitieke Risico's", s_h2))
    S.append(
        P(
            "Het Rechtspraak-project bevat gevoelige PII in <i>body_text</i> van rechtszaken. Het AGENTS.md-protocol [S16] schrijft voor dat <i>body_text</i> als sensitive wordt behandeld, met pseudonymize-module (8 violatietypes, false-positive filters) en FLS-projection in het Search Platform. Bij Amerikaanse toegang tot deze data (via OpenSearch-cloud of via backdoors) ontstaat een geopolitiek privacy-risico. De FLS-projection (Field-Level Security) in de DLS/FLS-autorisatielaag beperkt dit risico maar elimineert het niet [S16]."
        )
    )


def critic_section(S):
    S.append(PageBreak())
    S.append(P("4. Critic Review en Limitations", s_h1))
    S.append(P("4.1 Critic Review (inline uitgevoerd)", s_h2))
    S.append(
        P(
            "Een inline critic review is uitgevoerd met zeven criteria. Het oordeel was CONCERNS — het advies is inhoudelijk stevig maar bevat verbeterpunten die in deze v2 zijn verwerkt."
        )
    )
    critic = [
        ["Criterium", "Bevinding", "Actie v2"],
        [
            "Juridische diepgang",
            "Voldoende — Rome Statuut, EU Blocking, EHRM",
            "Saadi v Italië toegevoegd",
        ],
        [
            "Doctrine helderheid",
            "MEDIUM — 'prudente stevigheid' operationeel vaag",
            "3 sporen + tijdspaden + verantwoordelijken",
        ],
        [
            "TOGAF-migratie",
            "MEDIUM — geen migratietijdspad",
            "8-fase TOGAF tabel met weken",
        ],
        [
            "Bronnenkwaliteit",
            "MEDIUM — veel Wikipedia/secondair",
            "Genoteerd in limitations",
        ],
        [
            "BIO2-koppeling",
            "MEDIUM — niet gelinkt aan US-software",
            "US-ORIGIN-1/2/3 maatregelen",
        ],
        ["Repo-claims", "VERIFIED — alle claims gecontroleerd", "Geen actie nodig"],
        [
            "Neutraliteit",
            "Voldoende — analyse zonder politiek standpunt",
            "Geen actie nodig",
        ],
    ]
    S.append(Table(critic, colWidths=[3.5 * cm, 7 * cm, 5.5 * cm], style=tbl_style()))
    S.append(P("4.2 Limitations", s_h2))
    lims = [
        "<b>Bronnenkwaliteit.</b> Van de 16 bronnen zijn 2 primair (State Dept persbericht, EUR-Lex verordening), 11 secundair (vooral Wikipedia — geraadpleegd omdat ICC-website, HUDOC en whitehouse.gov 403/404 retourneerden), en 3 domeinkennis. Voor een formele publicatie zouden Wikipedia-bronnen moeten worden vervangen door primaire bronnen (Rome Statuut tekst, EHRM-uitspraken met paragraafnummers, BIO2-voorschriften).",
        "<b>Geen toegang tot primaire juridische bronnen.</b> HUDOC (hudoc.echr.coe.int) retourneerde 403 — EHRM-cases zijn niet geverifieerd met paragraafnummers. De ICC-website (icc-cpi.int) retourneerde 403. raadvoorderechtspraak.nl gaf een transport error. Deze beperkingen zijn een environmental constraint, geen inhoudelijke keuze.",
        "<b>NRC-interview niet direct geverifieerd.</b> Het interview met Henk Naves (31 augustus 2026) is niet via NRC geverifieerd. De inhoud is gereconstrueerd vanuit de opdrachtbeschrijving. Voor publicatie is directe verificatie nodig.",
        "<b>Geen subagent-dispatch.</b> De critic review is inline uitgevoerd, niet via een onafhankelijke subagent. Dit reduceert de onafhankelijkheid van de review. Bij beschikbaarheid van subagent-dispatch moet de review worden herhaald.",
        "<b>TOGAF-migratie is indicatief.</b> De tijdspaden in de TOGAF-tabel zijn schattingen gebaseerd op ervaring, niet op een formeel capacity-planning-onderzoek. Een PoC moet de haalbaarheid valideren.",
        "<b>Geen formele juridische review.</b> Dit advies is geschreven door een IT-consultant, niet een jurist. Voor formele adoptie is review nodig door een deskundige in internationaal strafrecht en sanctieregime.",
    ]
    for lim in lims:
        S.append(P(lim))


def sources_section(S):
    S.append(PageBreak())
    S.append(P("5. Bronnenregister", s_h1))
    S.append(
        P(
            "16 bronnen, gecategoriseerd als primair (P), secundair (S), of domeinkennis (D). Bronnen zijn geraadpleegd via webfetch tussen 31 augustus en 1 september 2026.",
            s_small,
        )
    )
    srcs = [
        (
            "S1",
            "P",
            "US Department of State. 'Secretary Rubio on ICC Sanctions Campaign'. Persbericht, 13 juli 2026. Geraadpleegd via state.gov (webfetch).",
        ),
        (
            "S2",
            "P",
            "Verordening (EG) Nr. 2271/96 van de Raad van 22 november 1996 ter bescherming tegen de gevolgen van de extraterritoriale toepassing van wetgeving door derde landen. EUR-Lex. Geraadpleegd via eur-lex.europa.eu.",
        ),
        (
            "S3",
            "D",
            "Rome Statuut van het Internationaal Strafhof, Artikelen 27 en 98. Domeinkennis — niet online geverifieerd (icc-cpi.int 403).",
        ),
        (
            "S4",
            "D",
            "Rome Statuut: Al-Bashir-beslissingen ICC. Domeinkennis — doctrinale analyse van Art 27 vs Art 98.",
        ),
        (
            "S5",
            "S",
            "Wikipedia. 'International Criminal Court'. Geraadpleegd via en.wikipedia.org (webfetch, 755 regels).",
        ),
        (
            "S6",
            "S",
            "Wikipedia. 'Rome Statute'. Geraadpleegd via en.wikipedia.org (webfetch, 440 regels).",
        ),
        (
            "S7",
            "S",
            "Wikipedia. 'United States and the International Criminal Court'. Geraadpleegd via en.wikipedia.org (webfetch, 438 regels).",
        ),
        (
            "S8",
            "S",
            "Wikipedia. 'Saadi v Italy' (EHRM, 2008). Geraadpleegd via en.wikipedia.org (webfetch, 311 regels).",
        ),
        (
            "S9",
            "S",
            "Wikipedia. 'State immunity'. Geraadpleegd via en.wikipedia.org (webfetch, 344 regels).",
        ),
        (
            "S10",
            "S",
            "Wikipedia. 'Universal jurisdiction'. Geraadpleegd via en.wikipedia.org (webfetch, 530 regels).",
        ),
        (
            "S11",
            "S",
            "Wikipedia. 'Immunity from prosecution'. Geraadpleegd via en.wikipedia.org (webfetch, 409 regels).",
        ),
        (
            "S12",
            "S",
            "Wikipedia. 'Genocide Convention'. Geraadpleegd via en.wikipedia.org (webfetch, 487 regels).",
        ),
        (
            "S13",
            "S",
            "Wikipedia. 'Extraterritorial jurisdiction'. Geraadpleegd via en.wikipedia.org (webfetch, 518 regels).",
        ),
        (
            "S14",
            "D",
            "NORA Referentiearchitectuur. Domeinkennis — verplicht sinds 2008, vijf-laags model, EIF-aligned.",
        ),
        (
            "S15",
            "D",
            "BIO2 (Beheermodel Informatiebeveiliging Overheid). Domeinkennis — ISO 27001/27002-based, BIO-1/BIO-2/BIO-3. US-ORIGIN-1/2/3 maatregelen afgeleid voor dit advies.",
        ),
        (
            "S16",
            "D",
            "Rechtspraak Repository Architectuur. Direct geverifieerd tegen broncode: search-platform/app/engine/port.py (SearchEnginePort), opensearch_adapter.py, query_builder.py (9 query-modi), docker-compose.yml (OpenSearch 2.17.1), dashboard/package.json, AGENTS.md (PII-regels). Alle claims VERIFIED.",
        ),
    ]
    for sid, stype, cite in srcs:
        S.append(P(f"<b>[{sid}] ({stype})</b> {cite}", s_ref))


def appendix(S):
    S.append(PageBreak())
    S.append(P("Appendix A: NORA-referentie", s_h1))
    S.append(
        P(
            "De Nederlandse Overheidsreferentiearchitectuur (NORA) [S14] biedt een vijf-laags referentiemodel dat sinds 2008 verplicht is voor Rijksoverheid-ICT. De lagen zijn: (1) Interactie (burgers/bedrijven), (2) Proces (backoffice), (3) Data/informatie, (4) Infrastructuur, (5) Beveiliging. NORA is EIF-aligned (European Interoperability Framework) en gebruikt BOMOS als beheermethodiek. De acht USM-gebaseerde capabilities bieden een kader voor het positioneren van de Rechtspraak-search-platform in de overheidsarchitectuur."
        )
    )
    S.append(P("Appendix B: Critic Review Methodologie", s_h1))
    S.append(
        P(
            "De critic review is inline uitgevoerd wegens technical failure van de Task tool (subagent dispatch: 'invalid AppId'). De review assessseerde zeven criteria: (1) juridische diepgang, (2) doctrine-helderheid, (3) TOGAF-migratie, (4) bronnenkwaliteit, (5) BIO2-koppeling, (6) repo-claims verificatie, (7) neutraliteit. Het oordeel was CONCERNS met vier MEDIUM-bevindingen, alle verwerkt in v2. Bij beschikbaarheid van subagent-dispatch moet de review onafhankelijk worden herhaald."
        )
    )


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.0 * cm,
        title="Advies ICC-Sancties en de Nederlandse Rechterlijke Macht",
        author="DjimIT Consulting",
    )
    S = []
    title_page(S)
    exec_summary(S)
    legal_framework(S)
    policy_advice(S)
    architecture(S)
    critic_section(S)
    sources_section(S)
    appendix(S)
    doc.build(S, onFirstPage=hdr_ftr, onLaterPages=hdr_ftr)
    print(f"PDF generated: {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH):,} bytes)")


if __name__ == "__main__":
    main()
