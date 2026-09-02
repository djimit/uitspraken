#!/usr/bin/env python3
"""Generate PhD-level advisory PDF v3 — ICC sanctions, digital sovereignty & Dutch judiciary.

Based on the user's expanded 26-section analysis: 'Wanneer sanctiemacht digitale
infrastructuurmacht wordt'. Renders the full document with reportlab.
"""

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
    Preformatted,
    KeepTogether,
)

OUTPUT_DIR = "/Users/dlandman/DjimIT/consulting/advies-icc-strategie-rechtspraak/run-3"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "advies-icc-strategie-rechtspraak.pdf")

styles = getSampleStyleSheet()
NAVY = HexColor("#1a3a5c")
ACCENT = HexColor("#c4912b")
LIGHT_GREY = HexColor("#f5f5f0")
DARK_GREY = HexColor("#444444")
WARN_BG = HexColor("#fff8e7")
CODE_BG = HexColor("#f8f8f4")

# ── Styles ──
s_title = ParagraphStyle(
    "T", parent=styles["Title"], fontSize=20, textColor=NAVY, spaceAfter=6, leading=24
)
s_sub = ParagraphStyle(
    "Su",
    parent=styles["Normal"],
    fontSize=12,
    textColor=DARK_GREY,
    spaceAfter=16,
    leading=15,
    alignment=TA_CENTER,
)
s_h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontSize=15,
    textColor=NAVY,
    spaceBefore=16,
    spaceAfter=6,
    leading=19,
)
s_h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontSize=12,
    textColor=NAVY,
    spaceBefore=10,
    spaceAfter=4,
    leading=15,
)
s_h3 = ParagraphStyle(
    "H3",
    parent=styles["Heading3"],
    fontSize=10.5,
    textColor=ACCENT,
    spaceBefore=6,
    spaceAfter=3,
    leading=13,
)
s_body = ParagraphStyle(
    "B",
    parent=styles["Normal"],
    fontSize=9.5,
    alignment=TA_JUSTIFY,
    spaceAfter=5,
    leading=13.5,
)
s_small = ParagraphStyle(
    "Bs",
    parent=styles["Normal"],
    fontSize=8.5,
    alignment=TA_JUSTIFY,
    spaceAfter=3,
    leading=11.5,
)
s_ref = ParagraphStyle(
    "R",
    parent=styles["Normal"],
    fontSize=8,
    textColor=DARK_GREY,
    spaceAfter=2,
    leading=10.5,
    leftIndent=20,
    firstLineIndent=-20,
)
s_callout = ParagraphStyle(
    "C",
    parent=styles["Normal"],
    fontSize=10,
    textColor=NAVY,
    spaceAfter=6,
    leading=14,
    leftIndent=12,
    rightIndent=12,
    borderColor=ACCENT,
    borderWidth=0,
    borderPadding=8,
    backColor=WARN_BG,
)
s_code = ParagraphStyle(
    "Co",
    parent=styles["Normal"],
    fontSize=7.5,
    textColor=DARK_GREY,
    leading=9,
    spaceAfter=4,
    leftIndent=6,
    backColor=CODE_BG,
    borderPadding=4,
)
s_table_cell = ParagraphStyle(
    "TC", parent=styles["Normal"], fontSize=7.5, leading=9.5, alignment=TA_JUSTIFY
)
s_table_hdr = ParagraphStyle(
    "TH",
    parent=styles["Normal"],
    fontSize=7.5,
    leading=9.5,
    textColor=white,
    fontName="Helvetica-Bold",
)


def P(t, s=s_body):
    return Paragraph(t, s)


def hdr_ftr(c, d):
    c.saveState()
    c.setFont("Helvetica", 7.5)
    c.setFillColor(grey)
    c.drawCentredString(
        A4[0] / 2,
        1.2 * cm,
        f"Wanneer sanctiemacht digitale infrastructuurmacht wordt — v3 (2 sep 2026) — Pagina {d.page}",
    )
    if d.page > 1:
        c.setStrokeColor(NAVY)
        c.setLineWidth(0.5)
        c.line(2.2 * cm, A4[1] - 1.8 * cm, A4[0] - 2.2 * cm, A4[1] - 1.8 * cm)
        c.setFont("Helvetica", 7)
        c.setFillColor(NAVY)
        c.drawString(
            2.2 * cm,
            A4[1] - 1.6 * cm,
            "ICC-Sancties, Rechterlijke Onafhankelijkheid & Strategische IV-impact",
        )
    c.restoreState()


def tbl_style(extra=None):
    base = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.25, grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GREY]),
        ("VALIGN", (0, 0), (-1, -1), "top"),
    ]
    if extra:
        base += extra
    return TableStyle(base)


def mk_table(data, col_widths, extra_style=None):
    """Build a table with Paragraph cells for wrapping."""
    wrapped = []
    for row_idx, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            if isinstance(cell, str):
                style = s_table_hdr if row_idx == 0 else s_table_cell
                wrapped_row.append(Paragraph(cell, style))
            else:
                wrapped_row.append(cell)
        wrapped.append(wrapped_row)
    return Table(wrapped, colWidths=col_widths, style=tbl_style(extra_style))


def code_block(text):
    """Render ASCII art / diagrams in a monospace block."""
    # ponytail: Preformatted is simplest for ASCII art
    return Preformatted(text, s_code)


# ══════════════════════════════════════════════════════════════
# CONTENT — all 26 sections from the user's expanded analysis
# ══════════════════════════════════════════════════════════════


def title_page(S):
    S.append(Spacer(1, 3 * cm))
    S.append(P("Wanneer sanctiemacht digitale infrastructuurmacht wordt", s_title))
    S.append(Spacer(1, 3 * mm))
    S.append(
        P(
            "Geopolitieke sancties, rechterlijke onafhankelijkheid en de strategische impact op informatievoorziening",
            s_sub,
        )
    )
    S.append(Spacer(1, 1 * cm))
    meta = [
        ["Opdrachtgever", "DjimIT Consulting (intern)"],
        ["Auteur", "D. Landman, MSc"],
        ["Datum", "2 september 2026"],
        ["Versie", "3.0 (geïntegreerde uitgebreide analyse)"],
        ["Classificatie", "Intern — niet voor externe publicatie"],
        ["Bronnen", "16 (2 primair, 11 secundair, 3 domeinkennis)"],
        ["Niveau", "PhD / Level 3 — gelaagde argumentatie met falsificatie"],
        ["Methode", "Strong Inference — hypothese + 7 tegenhypotheses (H0-A t/m H0-G)"],
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
    S.append(Spacer(1, 1.5 * cm))
    S.append(
        P(
            "<b>Executive finding.</b> De centrale hypothese houdt stand, maar alleen in een nauwkeurig begrensde vorm. "
            "<b>STRONG INFERENCE:</b> economische sancties tegen individuele rechters, aanklagers of instituties kunnen in een "
            "geconcentreerde digitale economie feitelijk functioneren als technische sancties. Dat gebeurt niet omdat een sanctiebesluit "
            "rechtstreeks een cloudtenant, identity provider of softwareplatform uitschakelt, maar omdat juridische verboden worden "
            "vertaald door banken, payment processors, Amerikaanse technologiebedrijven, compliance-afdelingen en geautomatiseerde "
            "screeningmechanismen naar beslissingen over accounts, betalingen, licenties en dienstverlening.",
            s_small,
        )
    )
    S.append(PageBreak())


def executive_finding(S):
    S.append(P("Executive Finding", s_h1))
    S.append(P("Het causale mechanisme is aantoonbaar:"))
    S.append(
        P(
            "<b>designation</b> &rarr; U.S. legal prohibition &rarr; sanctions screening &rarr; provider/compliance decision "
            "&rarr; service restriction &rarr; loss of digital capability &rarr; operational or institutional effect.",
            s_body,
        )
    )
    S.append(
        P(
            "Executive Order 14203 is hiervoor cruciaal. De order blokkeert eigendom en belangen van aangewezen personen die "
            'zich in de VS bevinden of onder bezit of controle van een "United States person" komen. De order verbiedt '
            "bovendien het leveren of ontvangen van funds, goods en services ten behoeve van blocked persons. De reikwijdte "
            'omvat ook "technological support". Contracten die vóór de sanctie bestonden bieden geen automatische bescherming.'
        )
    )
    S.append(
        P(
            "OFAC bevestigt tegelijkertijd dat het regime niet absoluut is. General licenses kunnen activiteiten toestaan die "
            "anders verboden zouden zijn. Op 18 augustus 2026 werd bijvoorbeeld General License 12 gepubliceerd om bepaalde "
            "transacties met die dag aangewezen personen tijdelijk af te bouwen. Dat maakt een belangrijk architectuurpunt "
            "zichtbaar: <b>continuïteit kan afhangen van discretionaire vergunningverlening door een buitenlandse sanctieautoriteit</b>."
        )
    )
    S.append(
        P(
            'De meest verstrekkende conclusie is daarom niet "Amerikaanse technologie is onveilig" en evenmin "alles moet '
            'Europees of on-premises".'
        )
    )
    S.append(
        P(
            "De conclusie is fundamenteler: voor essentiële rechtsstatelijke processen is het onvoldoende om alleen te weten "
            "waar data staan. Een instelling moet ook weten welke buitenlandse rechtsmacht uiteindelijk haar identity, "
            "cryptografische sleutels, control plane, software, betalingen en herstelvermogen kan beïnvloeden."
        )
    )
    S.append(
        P(
            "Dat is een afzonderlijke risicodimensie naast klassieke cybersecurity. Ik noem die dimensie hier "
            "<b>Institutional Autonomy</b>, en het daaruit voortvloeiende technische risico <b>Jurisdictional Control Risk</b>.",
            s_callout,
        )
    )


def sec1_evidence(S):
    S.append(P("1. Wat is feitelijk bewezen?", s_h1))
    S.append(
        P(
            "Op 6 februari 2025 vaardigde president Trump Executive Order 14203 uit. De juridische grondslag omvat IEEPA en "
            "de National Emergencies Act. De order verklaart activiteiten van het ICC tegen bepaalde Amerikaanse en Israëlische "
            "personen tot een bedreiging van Amerikaanse nationale veiligheid en buitenlands beleid. Karim Khan werd in de annex "
            "opgenomen. De order maakt blokkering mogelijk van eigendom en belangen van aangewezen personen en verbiedt onder "
            "andere financiële, materiële en technologische ondersteuning door partijen die aan Amerikaanse sanctieregels zijn "
            "gebonden. <b>VERIFIED FACT.</b>"
        )
    )
    S.append(
        P(
            "OFAC heeft daarvoor een specifiek programma ingericht, International Criminal Court-Related Sanctions, inmiddels "
            "gecodificeerd in 31 CFR Part 528. OFAC vermeldt expliciet dat general licenses noodzakelijk kunnen zijn om "
            "transacties mogelijk te maken die anders verboden zijn. <b>VERIFIED FACT.</b>"
        )
    )
    S.append(
        P(
            "De Amerikaanse campagne is vervolgens geëscaleerd. Het State Department kondigde op 13 juli 2026 een bredere "
            "campagne tegen het ICC aan. Op 18 augustus volgden aanvullende designations. Het ICC meldde een dag later dat "
            "sancties inmiddels verschillende gekozen functionarissen, de Prosecutor en een medewerker raakten. "
            "<b>VERIFIED FACT.</b>"
        )
    )
    S.append(
        P(
            "De gevolgen zijn niet meer uitsluitend theoretisch. In gerechtelijke procedures verklaarden drie gesanctioneerde "
            "ICC-rechters in juni 2026 dat zij onder meer creditcards, bancaire diensten, bepaalde online platforms, reizen en "
            "in sommige gevallen verzekeringen niet meer normaal konden gebruiken. Dat is een claim van getroffen rechters in "
            "litigation, niet een onafhankelijke technische audit, maar ondersteunt overtuigend dat sancties via private "
            "infrastructuren praktische effecten krijgen. <b>STRONG EVIDENCE.</b>"
        )
    )
    S.append(
        P(
            "AP rapporteerde in 2025 dat Karim Khan toegang verloor tot zijn ICC-e-mailomgeving en dat zijn bankrekeningen "
            "werden geraakt. Daarbij bestaat echter een essentiële bewijscontradictie: Microsoft verklaarde later dat het geen "
            "diensten aan het ICC als organisatie had beëindigd of geschorst. De Britse regering karakteriseerde het daarom "
            "expliciet als een mediabericht waarvan Microsoft het gestelde handelen krachtig ontkende. Het juiste oordeel is dus "
            'niet "Microsoft heeft bewezen het ICC afgesloten", maar:'
        )
    )
    S.append(
        P(
            "<b>DISPUTED FACT:</b> Khan verloor volgens meerdere bronnen toegang tot zijn Microsoft-gebaseerde mailomgeving, "
            "maar de precieze actor, juridische constructie en operationele handeling zijn publiek niet sluitend vastgesteld.",
            s_callout,
        )
    )
    S.append(P("Dat onderscheid is essentieel voor deze analyse."))


def sec2_chain(S):
    S.append(P("2. De sanctieketen als distributed control system", s_h1))
    S.append(
        P(
            "Het klassieke sanctiemodel is financieel. Het hedendaagse sanctiemodel is veel breder omdat digitale dienstverlening "
            "vrijwel altijd contractuele, financiële en identity-afhankelijkheden bevat."
        )
    )
    S.append(P("De relevante keten is:"))
    S.append(
        code_block(
            "US executive / statutory authority\n"
            "             |\n"
            "             v\n"
            "          OFAC / SDN\n"
            "             |\n"
            "             v\n"
            " sanctions & screening datasets\n"
            "             |\n"
            "    +--------+----------+\n"
            "    v        v          v\n"
            " banks     vendors   payment rails\n"
            "    |        |          |\n"
            "    +----+---+----+-----+\n"
            "         v        v\n"
            "       SaaS     Cloud\n"
            "         |        |\n"
            "         +-- IAM -+\n"
            "         +-- APIs -+\n"
            "         +-- CI/CD-+\n"
            "         +-- SecOps+\n"
            "         +-- licensing\n"
            "              |\n"
            "              v\n"
            "     judicial employee\n"
            "              |\n"
            "              v\n"
            "       judicial process"
        )
    )
    S.append(
        P(
            "Het belangrijke punt is dat de sanctieautoriteit niet elke technische consequentie hoeft te orkestreren. "
            "Het ecosysteem doet dat grotendeels zelf."
        )
    )
    S.append(
        P(
            "OFAC stelt dat Amerikaanse personen geen transacties mogen verrichten met blocked persons, ongeacht waar de "
            "blocked person zich bevindt. Amerikaanse personen mogen bovendien bepaalde transacties van niet-Amerikaanse "
            "partijen niet faciliteren wanneer zij deze zelf niet zouden mogen uitvoeren."
        )
    )
    S.append(
        P(
            "Hierdoor ontstaat wat in systeemtermen een <b>policy propagation mechanism</b> is:"
        )
    )
    S.append(
        P(
            "legal rule &rarr; machine-readable designation &rarr; compliance policy &rarr; identity/customer matching "
            "&rarr; entitlement decision &rarr; technical enforcement"
        )
    )
    S.append(
        P(
            "Een rechter hoeft dus niet door de Amerikaanse overheid zelf van Microsoft 365, GitHub of een creditcard te "
            "worden verwijderd. De overheid creëert een juridisch object, de designation, waarna private control planes "
            "enforcement uitvoert."
        )
    )
    S.append(
        P(
            "Dit verschilt fundamenteel van klassieke cyberaanvallen. Er is geen exploit, malware of compromised credential "
            "nodig. De provider gebruikt juist zijn legitieme administratieve privileges."
        )
    )


def sec3_overcompliance(S):
    S.append(
        P(
            "3. Waarom over-compliance waarschijnlijk belangrijker is dan de juridische minimumeis",
            s_h1,
        )
    )
    S.append(
        P(
            "OFAC-sancties zijn sterk genoeg dat organisaties aanzienlijke incentives hebben om false negatives te vermijden. "
            "De economische kosten van één gemiste prohibited transaction kunnen groter worden gepercipieerd dan de kosten van "
            "tientallen false positives."
        )
    )
    S.append(
        P("Daarom kan rationele private risicoaversie leiden tot over-compliance.")
    )
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Stap", "Juridische verplichting", "Private discretion"],
                ["Designation", "hoog", "laag"],
                ["Screening", "vaak vereist", "implementatie varieert"],
                ["Match resolution", "afhankelijk van context", "hoog"],
                ["Account restriction", "afhankelijk van rechtspositie", "hoog"],
                [
                    "Organisatiebrede blokkade",
                    "vaak niet automatisch vereist",
                    "potentieel zeer hoog",
                ],
                ["Restoration", "juridisch en contractueel", "vaak procesafhankelijk"],
            ],
            [3.5 * cm, 5.5 * cm, 5.5 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "Dit verklaart waarom een individuele designation een groter technisch bereik kan krijgen dan strikt juridisch "
            "noodzakelijk."
        )
    )
    S.append(
        P(
            "GitHub illustreert hoe direct deze koppeling kan zijn. De corporate voorwaarden verbieden gebruik wanneer een "
            "klant een SDN is of namens een SDN handelt. GitHub bevestigt ook expliciet dat Amerikaanse trade controls de "
            "beschikbaarheid van betaalde en private repositorydiensten kunnen beperken. <b>VERIFIED FACT.</b>"
        )
    )
    S.append(
        P(
            "AWS verplicht contractpartijen eveneens tot naleving van toepasselijke sanctieregels, inclusief OFAC-programma's."
        )
    )
    S.append(
        P(
            "Dit bewijst niet dat AWS een ICC-workload zal uitschakelen. Het bewijst wel dat sanctions compliance een "
            "contractueel onderdeel van de service relationship vormt."
        )
    )


def sec4_identity(S):
    S.append(P("4. Het werkelijke IV-risico begint bij identity", s_h1))
    S.append(
        P(
            "Veel analyses focussen op cloudhosting. Dat is waarschijnlijk niet het eerste of belangrijkste failure point."
        )
    )
    S.append(
        P(
            "De gevaarlijkste technische afhankelijkheid is vaak: <b>Identity &rarr; authorization &rarr; cryptography "
            "&rarr; control plane</b>."
        )
    )
    S.append(
        P(
            "Wanneer één identity platform verschillende SaaS-, cloud-, endpoint- en securitydiensten voedt, kan één identity "
            "failure een organisatiebrede dependency triggeren."
        )
    )
    S.append(P("Een typische enterprise-keten:"))
    S.append(
        code_block(
            "Entra ID / Okta / Google Identity\n"
            "          |\n"
            "          +-- MFA\n"
            "          +-- OIDC / OAuth\n"
            "          +-- SAML federation\n"
            "          +-- device trust\n"
            "          +-- privileged identities\n"
            "          +-- SaaS access\n"
            "          +-- cloud control plane"
        )
    )
    S.append(
        P(
            "Bij een gesanctioneerde individuele rechter is volledige tenant suspension doorgaans niet de logische eerste "
            "failure mode. Waarschijnlijker zijn: (1) account restriction; (2) license removal; (3) inability to transact; "
            "(4) customer-support escalation; (5) recovery complications; (6) federated-account lockout."
        )
    )
    S.append(
        P(
            "Maar als privileged identities, break-glass accounts of tenant administration eveneens afhankelijk zijn van "
            "dezelfde provider, verandert een individual failure in een systemic failure."
        )
    )
    S.append(
        P(
            "Daarom moet <b>identity als Tier 0 sovereignty asset</b> worden behandeld.",
            s_callout,
        )
    )


def sec5_sovereignty(S):
    S.append(P("5. Van data sovereignty naar control sovereignty", s_h1))
    S.append(
        P(
            "Het gebruikelijke debat over digitale soevereiniteit concentreert zich te veel op datalocatie. Dat is onvoldoende. "
            "Een Nederlandse workload kan volledig in Amsterdam staan en tegelijkertijd operationeel onder externe controle blijven."
        )
    )
    S.append(P("Daarom zijn minimaal zeven dimensies nodig."))
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Sovereignty-dimensie", "Centrale vraag"],
                ["Data sovereignty", "Waar bevinden data en metadata zich?"],
                ["Operational sovereignty", "Wie kan de dienst uitschakelen?"],
                [
                    "Control-plane sovereignty",
                    "Wie beheert provisioning, identity en policy?",
                ],
                [
                    "Cryptographic sovereignty",
                    "Wie beheert root keys en trust anchors?",
                ],
                [
                    "Legal sovereignty",
                    "Welke staat kan de leverancier juridisch instrueren?",
                ],
                [
                    "Financial sovereignty",
                    "Kan dienstverlening blijven worden betaald?",
                ],
                [
                    "Exit sovereignty",
                    "Kan een capability daadwerkelijk worden vervangen?",
                ],
            ],
            [5 * cm, 9.5 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "De Europese Commissie beweegt inmiddels in precies deze richting. Haar Cloud Sovereignty Framework beoordeelt "
            "sovereignty niet uitsluitend vanuit datalocatie, maar onder andere juridisch, operationeel en strategisch. De "
            "Commissie gebruikt het framework inmiddels voor sovereign-cloudprocurement. <b>VERIFIED FACT.</b>"
        )
    )
    S.append(P("European region &ne; European operational sovereignty.", s_callout))


def sec6_jcr(S):
    S.append(P("6. Jurisdictional Concentration Risk", s_h1))
    S.append(
        P(
            "Vendor concentration en jurisdiction concentration zijn verschillende problemen. Stel dat een instelling workloads "
            "verdeelt over AWS, Azure en Google Cloud. Vanuit traditionele cloudresilience lijkt dat diversificatie. Maar "
            "vanuit geopolitieke jurisdiction risk blijven alle drie de leveranciers uiteindelijk verbonden met Amerikaanse "
            "ondernemingsstructuren en Amerikaanse wetgeving."
        )
    )
    S.append(P("<b>Vendor Diversification &ne; Jurisdictional Diversification</b>"))
    S.append(P("Een betere metric is <b>Jurisdictional Concentration Risk</b>, JCR."))
    S.append(P("Conceptueel: <b>JCR = f(C_i, J_i, S_i, R_i)</b> waarbij:"))
    S.append(P("&bull; C_i = criticality van capability i"))
    S.append(P("&bull; J_i = gedeelde jurisdictionele exposure"))
    S.append(P("&bull; S_i = substitutability"))
    S.append(P("&bull; R_i = recoverability"))
    S.append(P("JCR wordt hoog wanneer veel kritieke capabilities:"))
    S.append(
        P(
            "1. dezelfde ultimate jurisdiction delen; 2. dezelfde identity root gebruiken; 3. dezelfde payment rails gebruiken; "
            "4. dezelfde software supply chain gebruiken; 5. niet snel substitueerbaar zijn."
        )
    )
    S.append(
        P(
            "Een multi-cloudarchitectuur kan dus een uitstekende availability architecture zijn en tegelijkertijd een slechte "
            "sovereignty architecture.",
            s_callout,
        )
    )


def sec7_financial(S):
    S.append(P("7. De financiële control plane wordt structureel onderschat", s_h1))
    S.append(
        P(
            "Digitale dienstverlening blijft alleen beschikbaar wanneer vier dingen blijven functioneren: "
            "<b>authorization, licensing, billing, settlement</b>."
        )
    )
    S.append(P("Payment is daarmee een IV-dependency."))
    S.append(
        P(
            "Een SaaS-product kan technisch blijven werken en juridisch beschikbaar blijven, maar alsnog uitvallen wanneer: "
            "credit card blocked &rarr; invoice unpaid &rarr; subscription past due &rarr; license disabled &rarr; user inaccessible"
        )
    )
    S.append(
        P(
            "Dat is geen theoretische constructie. Dat gesanctioneerde ICC-functionarissen problemen ondervinden met "
            "creditcards en bancaire dienstverlening is inmiddels gedocumenteerd."
        )
    )
    S.append(
        P("Daarom hoort een dependency graph niet alleen technologie te bevatten. Ook:")
    )
    S.append(
        code_block(
            "cloud\n"
            "  |\n"
            "reseller\n"
            "  |\n"
            "billing platform\n"
            "  |\n"
            "bank\n"
            "  |\n"
            "payment network"
        )
    )
    S.append(P("is onderdeel van de systeemarchitectuur."))


def sec8_cybersec(S):
    S.append(P("8. Cybersecurity kan door sancties paradoxaal verslechteren", s_h1))
    S.append(
        P(
            "Een bijzonder relevante failure mode ontstaat wanneer sanctiecompliance security tooling raakt. Denk aan: EDR; "
            "threat intelligence; SIEM; certificate infrastructure; secrets management; code signing; vulnerability feeds; "
            "patch repositories; managed SOC; DDoS mitigation."
        )
    )
    S.append(P("Dan ontstaat een paradox:"))
    S.append(
        P(
            "Een sanctie die economische interactie moet beperken kan tegelijkertijd het cyberweerstandsvermogen van een "
            "gerechtelijke instelling reduceren."
        )
    )
    S.append(P("Bijvoorbeeld:"))
    S.append(
        P(
            "vendor termination &rarr; EDR telemetry stops &rarr; SOC loses visibility &rarr; incident detection decreases &rarr; dwell time increases"
        )
    )
    S.append(
        P(
            "of: license expiration &rarr; vulnerability feed stops &rarr; remediation prioritisation degrades"
        )
    )
    S.append(
        P(
            "of: certificate service unavailable &rarr; certificates cannot be renewed &rarr; machine authentication fails"
        )
    )
    S.append(
        P(
            "Voor het ICC zelf is geen publiek bewijs gevonden dat een dergelijk security-platform daadwerkelijk door Amerikaanse "
            "sancties is uitgeschakeld. Dus: <b>PLAUSIBLE HIGH-IMPACT RISK, not VERIFIED EVENT.</b>",
            s_callout,
        )
    )


def sec9_supplychain(S):
    S.append(P("9. Software supply chain maakt soevereiniteit recursief", s_h1))
    S.append(P("Open source lost dit probleem slechts gedeeltelijk op."))
    S.append(
        P(
            "Een applicatie kan volledig open source zijn en toch afhankelijk zijn van: GitHub, GitHub Actions, npm, PyPI, "
            "container registry, OIDC, code-signing infrastructure, CI runners, package signing, security feeds, artifact storage."
        )
    )
    S.append(
        P(
            "GitHub stelt expliciet dat SDN-status gevolgen kan hebben voor gebruik van het platform."
        )
    )
    S.append(P("<b>Open Source &ne; Sovereign Supply Chain</b>"))
    S.append(P("Echte supply-chain sovereignty vereist ten minste:"))
    S.append(
        P(
            "mirrored source repositories; mirrored package repositories; eigen artifact registry; SBOM; provenance; "
            "SLSA controls; key ownership; reproducible builds; escrow van proprietary componenten waar nodig; "
            "offline build capability voor Tier 0 en Tier 1."
        )
    )


def sec10_ciaa(S):
    S.append(P("10. Judicial independence als informatiebeveiligingseigenschap", s_h1))
    S.append(
        P(
            "Dit is waarschijnlijk de belangrijkste conceptuele uitkomst van het onderzoek."
        )
    )
    S.append(
        P(
            "Klassieke security beschermt: <b>CIA = Confidentiality + Integrity + Availability</b>"
        )
    )
    S.append(
        P(
            "Maar stel dat een systeem: volledig beschikbaar is, gegevens vertrouwelijk houdt, gegevens correct bewaart, "
            "terwijl een buitenlandse staat via juridische sancties kan bepalen welke rechter toegang houdt tot dat systeem."
        )
    )
    S.append(
        P("Dan zijn C, I en A intact. Toch is de institutionele security geschonden.")
    )
    S.append(
        P(
            "Daarom moet bij constitutioneel kritieke systemen een vierde eigenschap worden toegevoegd: "
            "<b>CIAA = Confidentiality + Integrity + Availability + Autonomy</b>",
            s_callout,
        )
    )
    S.append(
        P(
            "<b>Autonomy</b> betekent: het vermogen van een rechtsstatelijke instelling om haar wettelijke taak uit te voeren "
            "zonder dat een externe politieke actor via leveranciers, infrastructuur of economische control planes selectief "
            "kan bepalen welke bevoegde functionarissen hun taak technisch kunnen uitvoeren."
        )
    )
    S.append(
        P(
            "Dit is niet puur normatieve theorie. Europese jurisprudentie behandelt bescherming tegen externe interventie en "
            "druk als essentieel element van rechterlijke onafhankelijkheid. Het Hof van Justitie benadrukt dat rechters "
            "beschermd moeten worden tegen externe interventie of druk die hun onafhankelijkheid kan aantasten."
        )
    )
    S.append(
        P(
            "<b>STRONG INFERENCE:</b> als technische toegang tot essentiële gerechtelijke capabilities selectief kan worden "
            "beïnvloed als gevolg van politieke maatregelen van een derde staat, kan de informatiearchitectuur onderdeel worden "
            "van het constitutionele probleem van judicial independence.",
            s_callout,
        )
    )


def sec11_zerotrust(S):
    S.append(P("11. Zero Trust heeft een jurisdictionele blind spot", s_h1))
    S.append(
        P(
            "NIST SP 800-207 redeneert terecht vanuit expliciete verificatie: subject &rarr; policy decision point &rarr; "
            "policy enforcement point &rarr; resource. Identity vormt daarbij een centrale input voor access decisions."
        )
    )
    S.append(
        P(
            "Maar traditioneel Zero Trust stelt zelden de vraag: <b>Wie controleert de policy decision point?</b>"
        )
    )
    S.append(
        P(
            "Een technisch perfecte Zero Trust-architectuur kan dus een sovereignty failure bevatten. Wanneer Identity Provider, "
            "Policy Engine, Certificate Authority, Device Trust, Telemetry en Cloud Control Plane onder dezelfde externe "
            "jurisdictionele boundary vallen, heeft de organisatie wel Zero Trust tegen gebruikers, maar niet tegen de operator "
            "van de trust infrastructure."
        )
    )
    S.append(P("Daarom stel ik voor: <b>Jurisdiction-Aware Zero Trust</b>"))
    S.append(P("Aan NIST ZTA worden acht sovereign invariants toegevoegd:"))
    S.append(
        P(
            "1. identity independence; 2. cryptographic autonomy; 3. local emergency authentication; "
            "4. provider-independent recovery; 5. policy portability; 6. sovereign security logging; "
            "7. customer-controlled root keys; 8. workload portability."
        )
    )
    S.append(
        P(
            "Het principe wordt: <b>Never trust implicitly, always verify, and never make verification irrecoverably dependent "
            "on one external jurisdiction.</b>",
            s_callout,
        )
    )


def sec12_blocking(S):
    S.append(P("12. De EU Blocking Statute lost het technische probleem niet op", s_h1))
    S.append(
        P(
            "De Blocking Statute, Regulation 2271/96, beschermt Europese operators tegen bepaalde extraterritoriale wetgeving "
            "van derde landen. Momenteel ziet de annex voornamelijk op bepaalde Amerikaanse maatregelen betreffende Cuba en "
            "Iran. De ICC-sancties vallen dus niet automatisch onder de huidige bescherming."
        )
    )
    S.append(
        P(
            "De Commissie bevestigde op 18 februari 2026 dat zij overwoog de annex via een delegated act uit te breiden zodat "
            "ook ICC-gerelateerde Amerikaanse sancties zouden kunnen worden geraakt, maar diplomatie en targeted solutions "
            "bleven de voorkeursroute."
        )
    )
    S.append(
        P(
            "In augustus 2026 bevestigde de Commissie opnieuw dat zij de gevolgen onderzocht na de nieuwe Amerikaanse sancties."
        )
    )
    S.append(
        P(
            "Nederlandse en Europese politieke druk om het instrument daadwerkelijk te gebruiken is aanzienlijk. De Tweede Kamer "
            "nam in april 2026 een motie aan die de regering verzocht zich hiervoor in EU-verband te blijven inspannen."
        )
    )
    S.append(
        P(
            "Maar de fundamentele beperking blijft: <b>Legal Blocking &ne; Technical Continuity</b>"
        )
    )
    S.append(
        P(
            "Een EU-dochter kan wettelijk verplicht worden een dienst niet te beëindigen wegens een Amerikaanse sanctie. Dat "
            "garandeert niet dat zij technisch zelfstandig beschikt over: identity; global account control; licensing; code; "
            "cloud orchestration; cryptographic roots; parent-company APIs; updates."
        )
    )
    S.append(
        P(
            "De Europese Commissie heeft zelf aangegeven dat het Blocking Statute EU-operators binnen de EU kan beschermen, "
            "maar hun exposure aan Amerikaanse maatregelen buiten de EU niet wegneemt wanneer zij economische en financiële "
            "belangen in de VS hebben."
        )
    )
    S.append(P("<b>Regulatory Sovereignty &ne; Operational Sovereignty</b>", s_callout))


def sec13_threatmodel(S):
    S.append(P("13. Threat model", s_h1))
    S.append(
        P(
            "Voor rechtsstatelijke IV is een aangepaste sovereign-risk threat model geschikter dan pure STRIDE."
        )
    )
    S.append(P("<b>Assets</b>", s_h3))
    S.append(
        P(
            "A1 Judicial independence; A2 Case availability; A3 Evidence integrity; A4 Confidential judicial communication; "
            "A5 Identity; A6 Cryptographic keys; A7 Judicial records; A8 Audit trails; A9 Software supply chain; "
            "A10 Institutional continuity."
        )
    )
    S.append(P("<b>Actors</b>", s_h3))
    S.append(
        P(
            "Niet alleen: cybercriminal, APT, insider — maar ook: foreign state, sanctions authority, financial institution, "
            "cloud provider, SaaS provider, compliance department, certificate authority, payment processor, software supplier, "
            "subcontractor."
        )
    )
    S.append(
        P(
            "De cruciale toevoeging is dat veel van deze actors geen aanvaller zijn. Zij kunnen legitieme authority uitoefenen "
            "die een ongewenst institutioneel effect veroorzaakt. Dat vraagt een ander threat-modelbegrip: "
            "<b>adversarial outcome without malicious system compromise.</b>",
            s_callout,
        )
    )


def sec14_failuremodes(S):
    S.append(P("14. Failure-mode analysis", s_h1))
    S.append(Spacer(1, 4))
    fm_data = [
        [
            "Failure mode",
            "Kans",
            "Impact",
            "Time-to-impact",
            "Blast radius",
            "Reversibility",
            "Confidence",
        ],
        [
            "F1 Individual account suspension",
            "medium",
            "high",
            "uren",
            "persoon",
            "medium",
            "high",
        ],
        [
            "F2 Tenant suspension",
            "low",
            "extreme",
            "uren/dagen",
            "organisatie",
            "low/medium",
            "low",
        ],
        [
            "F3 Payment failure",
            "med/high",
            "high",
            "dagen/weken",
            "persoon/dienst",
            "medium",
            "high",
        ],
        [
            "F4 Licence non-renewal",
            "medium",
            "high",
            "weken/maanden",
            "dienst",
            "medium",
            "medium",
        ],
        [
            "F5 Identity loss",
            "medium",
            "extreme",
            "onmiddellijk",
            "persoon→org",
            "medium",
            "medium",
        ],
        [
            "F6 MFA failure",
            "medium",
            "high",
            "onmiddellijk",
            "persoon",
            "high",
            "medium",
        ],
        [
            "F7 Certificate disruption",
            "low",
            "extreme",
            "dagen/weken",
            "service/domain",
            "medium",
            "low",
        ],
        ["F8 Update denial", "low/med", "high", "weken", "fleet", "medium", "medium"],
        [
            "F9 API termination",
            "medium",
            "high",
            "onmiddellijk",
            "app-keten",
            "medium",
            "medium",
        ],
        [
            "F10 Git lockout",
            "medium",
            "high",
            "uren",
            "engineering",
            "high (mirror)",
            "high",
        ],
        [
            "F11 Telemetry loss",
            "low/med",
            "high",
            "direct",
            "SOC/security",
            "medium",
            "medium",
        ],
        [
            "F12 Backup dependency failure",
            "low",
            "extreme",
            "latent",
            "enterprise",
            "low",
            "medium",
        ],
        [
            "F13 DNS/domain disruption",
            "low",
            "extreme",
            "direct",
            "enterprise/public",
            "medium",
            "low",
        ],
        [
            "F14 Supply-chain failure",
            "medium",
            "high",
            "dagen/weken",
            "meerdere sys.",
            "medium",
            "high",
        ],
        [
            "F15 Subcontractor action",
            "medium",
            "high",
            "variabel",
            "verborgen",
            "low",
            "medium",
        ],
        [
            "F16 Over-compliance",
            "med/high",
            "high",
            "uren/dagen",
            "variabel",
            "medium",
            "high",
        ],
        [
            "F17 Cascading provider failure",
            "low",
            "extreme",
            "uren",
            "enterprise",
            "low",
            "medium",
        ],
        [
            "F18 Inability to procure replacement",
            "medium",
            "extreme",
            "maanden",
            "strategic",
            "low",
            "high",
        ],
    ]
    S.append(
        mk_table(
            fm_data,
            [3.2 * cm, 1.3 * cm, 1.3 * cm, 1.8 * cm, 2.0 * cm, 1.8 * cm, 1.3 * cm],
        )
    )
    S.append(Spacer(1, 4))
    S.append(
        P(
            "De kansen zijn bewust ordinaal weergegeven. Er bestaat onvoldoende empirische basis voor percentages.",
            s_small,
        )
    )


def sec15_scenarios(S):
    S.append(P("15. Vijf scenario's", s_h1))
    S.append(P("<b>Scenario A — één rechter</b>", s_h3))
    S.append(
        P(
            "Een rechter wordt SDN. Waarschijnlijkste cascade: designation &rarr; banking restrictions &rarr; payment "
            "problems &rarr; selected SaaS restrictions &rarr; account reviews &rarr; travel/payment friction. "
            "Institutionele impact blijft relatief beperkt als identities, dossiers en collaborationrechten centraal "
            "door de instelling worden beheerd. Empirische plausibiliteit: <b>HIGH</b>."
        )
    )
    S.append(P("<b>Scenario B — meerdere functionarissen</b>", s_h3))
    S.append(
        P(
            "Wanneer meerdere rechters, prosecutors en medewerkers worden gesanctioneerd neemt organisatorische frictie "
            "niet lineair maar mogelijk superlineair toe. n sanctioned users &rarr; n identity exceptions &rarr; n financial "
            "exceptions &rarr; growing vendor uncertainty &rarr; compliance escalation &rarr; organizational restrictions. "
            "Plausibility: <b>HIGH</b>."
        )
    )
    S.append(P("<b>Scenario C — institutionele sanctie</b>", s_h3))
    S.append(
        P(
            "Dit is kwalitatief anders. Bij directe designation van de organisatie kunnen payment, SaaS, cloud en "
            "supply-chain dependencies tegelijkertijd worden geraakt. Current status: <b>SCENARIO, not observed fact</b>. "
            "Blast radius: potentially existential."
        )
    )
    S.append(P("<b>Scenario D — provider over-compliance</b>", s_h3))
    S.append(
        P(
            "Een leverancier beperkt meer gebruikers of diensten dan strikt juridisch noodzakelijk. Dit is technisch zeer "
            "aannemelijk omdat compliance decisions vaak centraal en geautomatiseerd zijn. Plausibility: <b>HIGH</b>."
        )
    )
    S.append(P("<b>Scenario E — Europese infrastructuurfragmentatie</b>", s_h3))
    S.append(
        P(
            "Europa reageert door kritieke workloads structureel onder eigen jurisdictionele control planes te brengen. "
            "Voordelen: jurisdiction diversification; grotere strategische autonomie; verbeterde forced-exit capability. "
            "Nadelen: hogere kosten; duplicatie; kleinere ecosystemen; minder schaal; complexere interoperability; "
            "mogelijk lagere security maturity. Scenario probability: increasing, maar geen inevitability."
        )
    )
    S.append(
        P(
            "De Europese Commissie heeft in 2025 en 2026 daadwerkelijk een Cloud Sovereignty Framework en sovereign-cloudprocurement "
            "ontwikkeld, wat aangeeft dat dit type afweging inmiddels operationeel beleid wordt."
        )
    )


def sec16_falsification(S):
    S.append(P("16. Falsificatie van de centrale these", s_h1))
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Tegenhypothese", "Uitkomst"],
                [
                    "H0-A Europese entiteiten zijn voldoende gescheiden",
                    "gedeeltelijk verworpen",
                ],
                ["H0-B EU-recht beschermt voldoende", "verworpen"],
                ["H0-C dataresidentie geeft autonomie", "verworpen"],
                ["H0-D multi-cloud elimineert jurisdiction risk", "verworpen"],
                ["H0-E open source elimineert sovereignty risk", "verworpen"],
                [
                    "H0-F risico te theoretisch voor investering",
                    "grotendeels verworpen",
                ],
                [
                    "H0-G sovereign architecture kan riskanter zijn",
                    "bevestigd onder bepaalde omstandigheden",
                ],
            ],
            [8 * cm, 6.5 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "H0-A blijft relevant wanneer een Europese dochter werkelijk operationeel, juridisch, cryptografisch en financieel "
            "zelfstandig is. Alleen incorporation in Europa is onvoldoend bewijs."
        )
    )
    S.append(
        P(
            "H0-B faalt omdat het Blocking Statute momenteel ICC-sancties niet automatisch omvat en, zelfs na uitbreiding, "
            "technische afhankelijkheden niet elimineert."
        )
    )
    S.append(
        P(
            "H0-C faalt omdat dataresidentie geen zeggenschap over identity, control plane, licensing of contract termination bepaalt."
        )
    )
    S.append(
        P(
            "H0-D faalt wanneer AWS, Azure en GCP dezelfde jurisdictionele exposure delen."
        )
    )
    S.append(
        P(
            "H0-E faalt vanwege hosted Git, package registries, signing en build infrastructure."
        )
    )
    S.append(
        P(
            "H0-F wordt empirisch verzwakt door bestaande bancaire, platform- en operationele gevolgen voor ICC-functionarissen."
        )
    )
    S.append(
        P(
            'H0-G is daarentegen reëel. Een haastig gebouwd "soeverein" platform zonder security maturity, patch discipline, '
            "SOC-capaciteit en competente operators kan meer risico introduceren dan de buitenlandse afhankelijkheid die het "
            'moet oplossen. Dat is waarom "alles self-hosted" geen rationeel eindbeeld is.',
            s_callout,
        )
    )


def sec17_refarch(S):
    S.append(P("17. Referentiearchitectuur voor een rechtsstatelijke instelling", s_h1))
    S.append(P("Een bruikbare architectuur is tiered."))
    S.append(P("<b>Tier 0 — Sovereign Root</b>", s_h3))
    S.append(
        P(
            "Moet maximaal jurisdictioneel onafhankelijk zijn: Root PKI; Identity recovery; Emergency MFA; Break-glass "
            "accounts; Key management; Secrets; DNS recovery; Audit-root; Configuration source."
        )
    )
    S.append(
        P(
            "Eigenschappen: institution-controlled cryptographic roots; offline recovery; hardware-backed keys; "
            "provider-independent emergency identity; local privileged access; immutable configuration copies."
        )
    )
    S.append(P("<b>TSR target: TSR-0 of TSR-1</b>"))
    S.append(P("<b>Tier 1 — Mission-critical judicial systems</b>", s_h3))
    S.append(
        P(
            "Dossiers, evidence, zaakbehandeling, beslissingsondersteuning. Vereisten: portable data model; IaC; "
            "reproducible deployment; independent backup; secondary execution environment; independent authentication "
            "path; independent logging; alternative DNS and PKI route. <b>TSR target: TSR-1 tot TSR-2.</b>"
        )
    )
    S.append(P("<b>Tier 2 — Collaboration</b>", s_h3))
    S.append(
        P(
            "Mail, conferencing, file sharing en office-productivity. Meer supplier risk kan worden geaccepteerd zolang: "
            "export mogelijk is; identities niet exclusief leverancierseigendom zijn; mail fallback bestaat; emergency "
            "communication onafhankelijk is. <b>TSR target: TSR-2.</b>"
        )
    )
    S.append(P("<b>Tier 3 — Supporting SaaS</b>", s_h3))
    S.append(
        P(
            "Niet-kritieke applicaties. Contractuele exit kan meestal voldoende zijn. <b>TSR target: TSR-3 of TSR-4.</b>"
        )
    )


def sec18_tsr(S):
    S.append(P("18. Time to Sovereign Recovery", s_h1))
    S.append(
        P(
            "RTO beantwoordt: hoe snel moet dienstverlening herstellen? TSR beantwoordt een andere vraag: "
            "<b>hoe snel kunnen we dienstverlening herstellen zonder de leverancier of jurisdictionele dependency die de "
            "storing heeft veroorzaakt?</b>"
        )
    )
    S.append(P("<b>TSR &ne; RTO</b>"))
    S.append(
        P(
            "Een workload kan bijvoorbeeld RTO = 4 uur hebben maar TSR = 6 maanden. Dat is precies het risico dat klassieke BCP-tests missen."
        )
    )
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Klasse", "Sovereign recovery"],
                ["TSR-0", "onmiddellijk, zonder externe control plane"],
                ["TSR-1", "<24 uur"],
                ["TSR-2", "<72 uur"],
                ["TSR-3", "<7 dagen"],
                ["TSR-4", ">7 dagen of reconstructie nodig"],
            ],
            [3 * cm, 11.5 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "Voor Tier 0 zou TSR-4 bij een rechtsstatelijke instelling als <b>architectuurdefect</b> moeten worden behandeld.",
            s_callout,
        )
    )


def sec19_fer(S):
    S.append(P("19. Forced Exit Readiness", s_h1))
    S.append(
        P(
            "Traditionele exit-plannen nemen impliciet aan: decision &rarr; transition project &rarr; vendor cooperation &rarr; migration. "
            "Een sanctiescenario is anders: external trigger &rarr; vendor restriction &rarr; immediate loss &rarr; migration under duress."
        )
    )
    S.append(
        P(
            "Daarom is een klassiek exit-plan onvoldoende. Een kritieke leverancier moet worden beoordeeld op <b>Forced Exit Readiness, FER</b>."
        )
    )
    S.append(
        P(
            "Minimaal: actuele export; portable identities; independent keys; deployable IaC; mirrored software; "
            "alternative supplier; tested restoration; contractual transition assistance; emergency payment route; "
            "independent documentation."
        )
    )
    S.append(
        P(
            "DORA biedt hier een nuttig vergelijkingsmodel. Hoewel DORA niet het generieke juridisch kader voor de rechterlijke "
            "macht vormt, vereist het voor de financiële sector expliciete, gedocumenteerde en periodiek geteste exit-plannen "
            "waarbij financiële instellingen ICT-contracten moeten kunnen verlaten zonder bedrijfscontinuïteit te schaden. "
            "Dat principe is goed overdraagbaar naar constitutioneel kritieke IV."
        )
    )


def sec20_consequences(S):
    S.append(P("20. Consequenties voor Nederlandse rechtsstatelijke IV", s_h1))
    S.append(
        P(
            "Dit onderzoek toont niet aan dat de Nederlandse Rechtspraak of andere Nederlandse instituties concrete "
            "kwetsbaarheden hebben. Daarvoor zouden interne architecturen, contracten en dependency graphs nodig zijn."
        )
    )
    S.append(
        P(
            "Wel is het voldoende om een nieuw strategic-risk assessment te rechtvaardigen."
        )
    )
    S.append(
        P(
            "De relevante vraag wordt: <b>Welke capabilities kan de Nederlandse rechtsstaat niet binnen 24, 72 uur of zeven "
            "dagen zelfstandig herstellen wanneer een cruciale buitenlandse leverancier juridisch of commercieel niet meer mag "
            "meewerken?</b>",
            s_callout,
        )
    )
    S.append(
        P(
            "Dat assessment moet specifiek kijken naar: identity; PKI; MFA; email; case systems; evidence repositories; "
            "source code; CI/CD; backups; EDR; SIEM; DNS; cloud control planes; licensing; payment."
        )
    )
    S.append(
        P(
            "BIO2 vormt inmiddels het overheidsbrede cybersecuritynormenkader en is gekoppeld aan de Nederlandse implementatie "
            "van NIS2."
        )
    )
    S.append(
        P(
            "Wel is juridische voorzichtigheid nodig rond NIS2. De NIS2-richtlijn bevat specifieke uitzonderingen en "
            "scopebepalingen voor bepaalde public-sector-, law-enforcement- en judiciaryfuncties. NIS2 mag dus niet zonder "
            "verdere nationale toepasselijkheidsanalyse als directe grondslag voor alle rechterlijke IV worden gepresenteerd."
        )
    )
    S.append(
        P(
            "De relevante governancevraag is breder dan compliance: <b>BIO/ISO/NIS2 controls moeten worden uitgebreid met jurisdictional resilience.</b>"
        )
    )


def sec21_procurement(S):
    S.append(P("21. Procurement requirements", s_h1))
    S.append(P("Voor Tier 0 en Tier 1 zouden aanbestedingen minimaal moeten bevatten:"))
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Requirement", "Doel"],
                [
                    "ultimate jurisdiction disclosure",
                    "jurisdiction risk zichtbaar maken",
                ],
                ["subcontractor disclosure", "verborgen dependencies vinden"],
                ["sanctions-impact clause", "procedure bij designation"],
                ["advance notification", "tijd winnen"],
                ["continued-service obligation", "cliff-edge voorkomen"],
                ["key ownership", "crypto-autonomie"],
                ["identity export", "IdP-exit"],
                ["open data formats", "portability"],
                ["API portability", "applicatie-exit"],
                ["configuration export", "reconstructie"],
                ["source/software escrow", "proprietary recovery"],
                ["SBOM", "supply-chain visibility"],
                ["reproducible IaC", "alternate deployment"],
                ["independent backup", "vendor-independent restore"],
                ["tested exit", "bewijs, geen papieren plan"],
                ["TSR target", "meetbare sovereign recovery"],
                ["substitution plan", "supplier replacement"],
                ["payment fallback", "billing continuity"],
                ["legal entity mapping", "rechtsmacht vaststellen"],
            ],
            [5.5 * cm, 9 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "Een cruciale extra contractuele vraag is: <b>Kan de leverancier technisch voldoen aan de exit-clausule wanneer "
            "diens moedermaatschappij hem juridisch verbiedt mee te werken?</b> Als het antwoord onbekend is, is de "
            "contractuele exit geen bewezen control.",
            s_callout,
        )
    )


def sec22_riskregister(S):
    S.append(P("22. Strategisch IV-risk register", s_h1))
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                [
                    "Risk",
                    "Trigger",
                    "Dependency",
                    "Kans",
                    "Impact",
                    "Blast radius",
                    "Required control",
                    "Residual",
                ],
                [
                    "R1 identity exclusion",
                    "designation",
                    "IdP",
                    "M",
                    "extreme",
                    "user/tenant",
                    "sovereign recovery IdP",
                    "M",
                ],
                [
                    "R2 cloud control loss",
                    "provider action",
                    "hyperscaler",
                    "L",
                    "extreme",
                    "platform",
                    "second control plane",
                    "M",
                ],
                [
                    "R3 payment interruption",
                    "banking restriction",
                    "bank/card",
                    "H",
                    "high",
                    "SaaS estate",
                    "alternative settlement",
                    "M",
                ],
                [
                    "R4 SaaS suspension",
                    "provider compliance",
                    "SaaS",
                    "M",
                    "high",
                    "process",
                    "data/identity portability",
                    "M",
                ],
                [
                    "R5 repository lockout",
                    "trade controls",
                    "Git platform",
                    "M",
                    "high",
                    "SDLC",
                    "mirrored Git",
                    "L",
                ],
                [
                    "R6 software update loss",
                    "sanctions",
                    "vendor",
                    "L/M",
                    "high",
                    "fleet",
                    "offline repository",
                    "M",
                ],
                [
                    "R7 cybersecurity degradation",
                    "license/support loss",
                    "security vendor",
                    "L/M",
                    "extreme",
                    "enterprise",
                    "independent SecOps",
                    "M",
                ],
                [
                    "R8 DNS/certificate failure",
                    "compliance action",
                    "DNS/CA",
                    "L",
                    "extreme",
                    "enterprise",
                    "secondary DNS/PKI",
                    "L/M",
                ],
                [
                    "R9 systemic jurisdiction concentration",
                    "escalation",
                    "common jurisdiction",
                    "M",
                    "extreme",
                    "enterprise",
                    "jurisdiction diversification",
                    "M",
                ],
                [
                    "R10 paper-only exit",
                    "forced termination",
                    "vendor",
                    "H",
                    "extreme",
                    "service",
                    "FER + TSR tests",
                    "M",
                ],
                [
                    "R11 over-compliance",
                    "vendor risk aversion",
                    "compliance",
                    "M/H",
                    "high",
                    "unpredictable",
                    "pre-agreed procedure",
                    "M",
                ],
                [
                    "R12 sovereign replacement weakness",
                    "emergency migration",
                    "smaller provider",
                    "M",
                    "high",
                    "platform",
                    "maturity assessment",
                    "M",
                ],
            ],
            [
                2.3 * cm,
                1.8 * cm,
                1.5 * cm,
                0.8 * cm,
                1.0 * cm,
                1.5 * cm,
                2.5 * cm,
                0.8 * cm,
            ],
        )
    )


def sec23_evidence(S):
    S.append(P("23. Evidence matrix", s_h1))
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Claim", "Evidence", "Counter-evidence", "Confidence", "Consequence"],
                [
                    "EO 14203 verbiedt bepaalde dienstverlening aan designated persons",
                    "EO + CFR/OFAC",
                    "licenses kunnen uitzonderen",
                    "very high",
                    "digital services kunnen juridisch geraakt worden",
                ],
                [
                    "sancties hebben praktische digitale/financiële gevolgen",
                    "ICC litigation, AP",
                    "sommige details disputed",
                    "high",
                    "risico is niet puur theoretisch",
                ],
                [
                    "Microsoft blokkeerde persoonlijk Khan",
                    "AP",
                    "Microsoft ontkent service termination",
                    "medium/contested",
                    "geen harde providerclaim maken",
                ],
                [
                    "Blocking Statute beschermt ICC nu volledig",
                    "geen",
                    "ICC measures niet standaard in annex",
                    "very high negative",
                    "juridische gap",
                ],
                [
                    "EU onderzoekt uitbreiding",
                    "Commission",
                    "nog geen definitieve generieke oplossing",
                    "high",
                    "beleidsontwikkeling",
                ],
                [
                    "dataresidentie biedt operationele sovereignty",
                    "geen",
                    "provider retains control plane",
                    "high negative",
                    "aanvullende controls nodig",
                ],
                [
                    "multi-cloud elimineert jurisdiction risk",
                    "geen",
                    "gedeelde US jurisdiction",
                    "high negative",
                    "jurisdiction-aware diversification",
                ],
                [
                    "open source elimineert sovereignty risk",
                    "geen",
                    "hosting/build/package dependencies",
                    "high negative",
                    "supply-chain architecture nodig",
                ],
                [
                    "judicial autonomy is cybersecurity relevant",
                    "jurisprudence + systems inference",
                    "geen expliciete CIAA-standaard",
                    "medium/high",
                    "nieuw architecture property",
                ],
                [
                    "TSR verbetert resilience governance",
                    "conceptual deduction",
                    "niet gestandaardiseerd",
                    "medium",
                    "pilot metric",
                ],
            ],
            [3.5 * cm, 2.5 * cm, 2.5 * cm, 1.8 * cm, 4 * cm],
        )
    )


def sec24_governance(S):
    S.append(P("24. Governance voor Nederlandse rechtsstatelijke instituties", s_h1))
    S.append(
        P(
            "Dit onderwerp kan niet uitsluitend bij de CISO worden gelegd. Het raakt meerdere accountability domains."
        )
    )
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Rol", "Verantwoordelijkheid"],
                ["Bestuur", "bepaalt risk appetite voor institutionele autonomie"],
                ["CIO", "verantwoordelijk voor operational sovereignty en TSR"],
                ["CISO", "integreert sovereign-control scenarios in threat modelling"],
                [
                    "Enterprise Architecture Board",
                    "beheert jurisdictional dependency architecture",
                ],
                ["CPO/inkoop", "borgt forced-exit clauses"],
                [
                    "Legal",
                    "analyseert sancties, conflicterende jurisdictions en contractuele enforceability",
                ],
                ["BCM", "test supplier-loss scenarios"],
                [
                    "SOC",
                    "detecteert plotseling verlies van security telemetry en vendor connectivity",
                ],
                ["IAM/PAM", "beheert sovereign break-glass"],
            ],
            [4.5 * cm, 10 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "Dit onderwerp moet daarom als <b>enterprise constitutional resilience risk</b> worden behandeld, niet als puur cloudvendor risk.",
            s_callout,
        )
    )


def sec25_actionplan(S):
    S.append(P("25. Wat moet nu daadwerkelijk gebeuren?", s_h1))
    S.append(
        P("Mijn prioritering zou niet beginnen met migreren. <b>Begin met meten.</b>")
    )
    S.append(P("<b>Fase 1 — 0 tot 90 dagen</b>", s_h3))
    S.append(
        P(
            "Maak voor Tier 0 en Tier 1 een jurisdictional dependency graph. Inventariseer per capability: provider; "
            "ultimate parent; contracting entity; jurisdiction; identity dependency; key dependency; payment dependency; "
            "DNS dependency; software dependency; subcontractors; RTO; RPO; TSR."
        )
    )
    S.append(P("Voer daarna vijf tabletop-tests uit:"))
    S.append(
        P(
            "1. sanctioned employee; 2. IdP exclusion; 3. payment rail failure; 4. SaaS suspension; 5. hyperscaler control-plane denial."
        )
    )
    S.append(P("<b>Fase 2 — 3 tot 9 maanden</b>", s_h3))
    S.append(
        P(
            "Implementeer: independent break-glass identity; customer-owned root keys; sovereign logging; "
            "offline/recoverable PKI; repository mirrors; independent backups; IaC rebuild; sanctions-response playbook; "
            "dual payment capability."
        )
    )
    S.append(P("<b>Fase 3 — 9 tot 24 maanden</b>", s_h3))
    S.append(
        P(
            "Voor capabilities met TSR-4: architecture redesign; jurisdiction diversification; alternative execution "
            "environment; mandatory FER testing; procurement reform."
        )
    )


def sec26_rule(S):
    S.append(P("26. De belangrijkste architectuurregel", s_h1))
    S.append(P("Het doel is niet: geen Amerikaanse technologie."))
    S.append(
        P(
            "Het doel is: <b>geen onvervangbare externe juridische control point voor constitutioneel kritieke functies.</b>"
        )
    )
    S.append(
        P(
            "Daarom kan een Amerikaanse hyperscaler voor veel workloads volstrekt rationeel blijven. Het probleem ontstaat pas wanneer:"
        )
    )
    S.append(
        P(
            "<b>Criticality &times; Jurisdiction Concentration &times; Low Substitutability</b> hoog wordt."
        )
    )
    S.append(
        P(
            "Een hoogwaardige Amerikaanse cloudservice met bewezen TSR-1 recovery kan vanuit sovereign-resilienceperspectief "
            "beter zijn dan een zwakke Europese provider zonder security maturity en zonder werkende exit."
        )
    )
    S.append(
        P(
            "<b>Soevereiniteit is dus geen herkomstlabel. Het is een verifieerbare operationele eigenschap.</b>",
            s_callout,
        )
    )


def conclusion(S):
    S.append(P("Conclusie", s_h1))
    S.append(
        P(
            "De centrale these is voldoende gefalsificeerd en vervolgens overeind gebleven."
        )
    )
    S.append(
        P(
            "Amerikaanse sancties tegen ICC-functionarissen zijn in juridische vorm economische sancties, maar hun feitelijke "
            "werking stopt niet bij vermogen of bankrekeningen. Door de centrale positie van Amerikaanse banken, "
            "technologiebedrijven, cloudplatformen, software-ecosystemen en digitale control planes kunnen zij zich voortplanten "
            "naar informatievoorziening."
        )
    )
    S.append(
        P(
            "Dat effect is inmiddels gedeeltelijk empirisch zichtbaar, vooral in financiële en digitale dienstverlening aan "
            "individuele ICC-functionarissen. Tegelijkertijd moet grote voorzichtigheid worden betracht met specifieke claims, "
            "met name rond de precieze rol van Microsoft bij Karim Khan. Daar is de publieke evidence contradictoir."
        )
    )
    S.append(
        P(
            "De strategische les voor Europese rechtsstatelijke instituties gaat daarom verder dan het ICC."
        )
    )
    S.append(
        P(
            "De klassieke securityvraag luidde: <i>Kan een aanvaller ons systeem binnendringen?</i>"
        )
    )
    S.append(P("De cloudvraag werd: <i>Kan onze leverancier uitvallen?</i>"))
    S.append(
        P(
            "De sovereigntyvraag moet nu zijn: <i>Kan een externe staat via een legitieme juridische bevoegdheid een leverancier "
            "ertoe brengen een essentiële rechtsstatelijke capability te ontnemen, en kunnen wij die capability vervolgens "
            "zelfstandig herstellen?</i>",
            s_callout,
        )
    )
    S.append(
        P(
            'Wanneer het antwoord op het eerste deel "ja" en op het tweede deel "nee" is, is technologische afhankelijkheid '
            "niet langer uitsluitend vendor risk. Dan is zij een risico voor institutionele autonomie."
        )
    )
    S.append(
        P(
            "En bij een gerechtelijke instelling kan institutionele autonomie niet worden beschouwd als een bijkomend "
            "architectuurcriterium. Het is onderdeel van het te beschermen object zelf."
        )
    )
    S.append(
        P(
            "Daaruit volgen drie nieuwe begrippen die ik voor verdere uitwerking binnen een volwassen IV-governancemodel relevant acht:"
        )
    )
    S.append(
        P(
            "&bull; <b>Jurisdictional Concentration Risk</b>, om gedeelde buitenlandse control boundaries zichtbaar te maken."
        )
    )
    S.append(
        P(
            "&bull; <b>Time to Sovereign Recovery</b>, om te meten hoe snel een kritieke capability buiten de getroffen leverancier of jurisdictie kan worden hersteld."
        )
    )
    S.append(
        P(
            "&bull; <b>Jurisdiction-Aware Zero Trust</b>, om naast gebruikers en workloads ook de juridische en operationele eigenaar van de verifier zelf in het trust model op te nemen."
        )
    )
    S.append(
        P(
            'Samen veranderen die de discussie van abstracte "digitale soevereiniteit" naar iets veel bruikbaarders: '
            "<b>bewijsbare operationele onafhankelijkheid onder adversarial geopolitical conditions.</b>"
        )
    )
    S.append(
        P(
            "Dat is, op basis van de beschikbare evidence, het niveau waarop IV-architectuur voor de rechtsstaat voortaan zou moeten worden beoordeeld."
        )
    )


def sources_section(S):
    S.append(PageBreak())
    S.append(P("Bronnenregister", s_h1))
    S.append(
        P(
            "16 bronnen, gecategoriseerd als primair (P), secundair (S), of domeinkennis (D). Bronnen zijn geraadpleegd via "
            "webfetch tussen 31 augustus en 2 september 2026.",
            s_small,
        )
    )
    srcs = [
        (
            "S1",
            "P",
            "US Department of State. 'Secretary Rubio on ICC Sanctions Campaign'. Persbericht, 13 juli 2026. Geraadpleegd via state.gov.",
        ),
        (
            "S2",
            "P",
            "Verordening (EG) Nr. 2271/96 van de Raad van 22 november 1996 ter bescherming tegen de gevolgen van de extraterritoriale toepassing van wetgeving door derde landen. EUR-Lex.",
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
            "Wikipedia. 'International Criminal Court'. Geraadpleegd via en.wikipedia.org (755 regels).",
        ),
        (
            "S6",
            "S",
            "Wikipedia. 'Rome Statute'. Geraadpleegd via en.wikipedia.org (440 regels).",
        ),
        (
            "S7",
            "S",
            "Wikipedia. 'United States and the International Criminal Court'. Geraadpleegd via en.wikipedia.org (438 regels).",
        ),
        (
            "S8",
            "S",
            "Wikipedia. 'Saadi v Italy' (EHRM, 2008). Geraadpleegd via en.wikipedia.org (311 regels).",
        ),
        (
            "S9",
            "S",
            "Wikipedia. 'State immunity'. Geraadpleegd via en.wikipedia.org (344 regels).",
        ),
        (
            "S10",
            "S",
            "Wikipedia. 'Universal jurisdiction'. Geraadpleegd via en.wikipedia.org (530 regels).",
        ),
        (
            "S11",
            "S",
            "Wikipedia. 'Immunity from prosecution'. Geraadpleegd via en.wikipedia.org (409 regels).",
        ),
        (
            "S12",
            "S",
            "Wikipedia. 'Genocide Convention'. Geraadpleegd via en.wikipedia.org (487 regels).",
        ),
        (
            "S13",
            "S",
            "Wikipedia. 'Extraterritorial jurisdiction'. Geraadpleegd via en.wikipedia.org (518 regels).",
        ),
        (
            "S14",
            "D",
            "NORA Referentiearchitectuur. Domeinkennis — verplicht sinds 2008, vijf-laags model, EIF-aligned.",
        ),
        (
            "S15",
            "D",
            "BIO2 (Beheermodel Informatiebeveiliging Overheid). Domeinkennis — ISO 27001/27002-based, BIO-1/BIO-2/BIO-3.",
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
    S.append(
        P("Appendix A: Rechtspraak Repository — Architectuur & Supply Chain", s_h1)
    )
    S.append(
        P(
            "Het Rechtspraak-project [S16] bestaat uit drie lagen: (1) een Python ETL-importer die uitspraken crawlt van "
            "data.rechtspraak.nl en opslaat in SQLite (12,6 GB, 174K+ beslissingen, FTS5-geïndexeerde full-text search); "
            "(2) een Next.js dashboard (App Router) met better-sqlite3 in readonly-mode — geen cloud-afhankelijkheden; "
            "(3) een Search Platform (FastAPI + OpenSearch 2.17.1) met DLS/FLS-autorisatie en een SearchEnginePort-abstractie."
        )
    )
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["Component", "Herkomst", "US-origin?", "Risico"],
                ["Next.js dashboard", "Vercel (US) / OSS", "Nee (MIT)", "Laag"],
                ["better-sqlite3", "OSS (MIT)", "Nee", "Laag"],
                ["SQLite", "Public domain", "Nee", "Geen"],
                ["FastAPI", "OSS (MIT)", "Nee", "Laag"],
                ["OpenSearch 2.17.1", "Amazon (US) / Apache 2.0", "JA", "Medium"],
                ["Docker", "Docker Inc (US) / Apache 2.0", "Bedrijfsrisico", "Laag"],
                ["python-jose", "OSS (MIT)", "Nee", "Laag"],
                ["OpenTelemetry", "CNCF / OSS", "Nee", "Laag"],
            ],
            [4 * cm, 4 * cm, 2.5 * cm, 2.5 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "OpenSearch 2.17.1 is de enige US-origin component in de stack. Hoewel OpenSearch een Apache 2.0-licensed project "
            "is (na de fork van Elasticsearch in 2021), wordt het beheerd door Amazon Web Services — een Amerikaans bedrijf "
            "dat onderhevig is aan Amerikaans export controlrecht (EAR) en sanctiebeleid. De SearchEnginePort-abstractie in "
            "<i>opensearch_adapter.py</i> maakt een migratie naar een EU-alternatief technisch haalbaar met minimale blast radius."
        )
    )
    S.append(
        P("Appendix B: TOGAF Migratiepad (OpenSearch &rarr; EU-alternatief)", s_h1)
    )
    S.append(Spacer(1, 4))
    S.append(
        mk_table(
            [
                ["TOGAF Fase", "Activiteit", "Tijdspad"],
                [
                    "A. Architecture Vision",
                    "Definitie doelarchitectuur (zonder US-origin)",
                    "2 weken",
                ],
                [
                    "B. Business Architecture",
                    "Impact-analyse op search-functionaliteit (9 query-modi)",
                    "3 weken",
                ],
                [
                    "C. Information Systems",
                    "Selectie alternatief (typesense/Qdrant/Meilisearch)",
                    "4 weken",
                ],
                [
                    "D. Technology Architecture",
                    "PoC met geselecteerd alternatief via SearchEnginePort",
                    "6 weken",
                ],
                [
                    "E. Opportunities & Solutions",
                    "Vergelijking PoC vs OpenSearch (performance, features)",
                    "2 weken",
                ],
                [
                    "F. Migration Planning",
                    "Gefaseerde migratie, rollback-plan, dual-run",
                    "4 weken",
                ],
                [
                    "G. Implementation Governance",
                    "Uitvoering migratie, monitoring",
                    "8 weken",
                ],
                [
                    "H. Architecture Change Mgmt",
                    "Decommissioning OpenSearch, update documentatie",
                    "4 weken",
                ],
            ],
            [4.5 * cm, 7.5 * cm, 2 * cm],
        )
    )
    S.append(Spacer(1, 6))
    S.append(
        P(
            "Totale migratie-inspanning: circa 33 weken (8 maanden) part-time. De SearchEnginePort-abstractie is de kritieke "
            "enabler: alleen opensearch_adapter.py hoeft te worden vervangen. De 9 query-modi in query_builder.py moeten "
            "opnieuw worden gemapt, maar de API-sequentie blijft identiek."
        )
    )
    S.append(P("Appendix C: Limitations", s_h1))
    lims = [
        "<b>Bronnenkwaliteit.</b> Van de 16 bronnen zijn 2 primair, 11 secundair (vooral Wikipedia — geraadpleegd omdat ICC-website, HUDOC en whitehouse.gov 403/404 retourneerden), en 3 domeinkennis. Voor een formele publicatie zouden Wikipedia-bronnen moeten worden vervangen door primaire bronnen.",
        "<b>Geen toegang tot primaire juridische bronnen.</b> HUDOC (hudoc.echr.coe.int) retourneerde 403. De ICC-website (icc-cpi.int) retourneerde 403. Deze beperkingen zijn een environmental constraint.",
        "<b>NRC-interview niet direct geverifieerd.</b> Het interview met Henk Naves (31 augustus 2026) is niet via NRC geverifieerd. De inhoud is gereconstrueerd vanuit de opdrachtbeschrijving.",
        "<b>Geen formele juridische review.</b> Dit advies is geschreven door een IT-consultant, niet een jurist. Voor formele adoptie is review nodig door een deskundige in internationaal strafrecht en sanctieregime.",
        "<b>TOGAF-migratie is indicatief.</b> De tijdspaden zijn schattingen gebaseerd op ervaring, niet op formeel capacity-planning. Een PoC moet de haalbaarheid valideren.",
        "<b>Falsificatie is conceptueel.</b> De tegenhypotheses H0-A t/m H0-G zijn logisch geëvalueerd, niet empirisch getest via experimenten. Dat is inherent aan het onderzoeksonderwerp.",
    ]
    for lim in lims:
        S.append(P(lim))


# ── Build ──


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.0 * cm,
        title="Wanneer sanctiemacht digitale infrastructuurmacht wordt",
        author="DjimIT Consulting",
    )
    S = []
    title_page(S)
    executive_finding(S)
    sec1_evidence(S)
    sec2_chain(S)
    sec3_overcompliance(S)
    sec4_identity(S)
    sec5_sovereignty(S)
    sec6_jcr(S)
    sec7_financial(S)
    sec8_cybersec(S)
    sec9_supplychain(S)
    sec10_ciaa(S)
    sec11_zerotrust(S)
    sec12_blocking(S)
    sec13_threatmodel(S)
    sec14_failuremodes(S)
    sec15_scenarios(S)
    sec16_falsification(S)
    sec17_refarch(S)
    sec18_tsr(S)
    sec19_fer(S)
    sec20_consequences(S)
    sec21_procurement(S)
    sec22_riskregister(S)
    sec23_evidence(S)
    sec24_governance(S)
    sec25_actionplan(S)
    sec26_rule(S)
    conclusion(S)
    sources_section(S)
    appendix(S)
    doc.build(S, onFirstPage=hdr_ftr, onLaterPages=hdr_ftr)
    print(f"PDF generated: {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH):,} bytes)")


if __name__ == "__main__":
    main()
