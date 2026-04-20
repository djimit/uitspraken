# Rechtspraak Open Data — Datapipeline & Analyse

## Overzicht

Dit project importeert gepubliceerde rechterlijke uitspraken van de [Rechtspraak Open Data API](https://data.rechtspraak.nl/) en biedt een analytisch dashboard met onder andere een diepgaande analyse van de **inhoudsindicatie** (samenvatting) van beslissingen.

---

## Datapipeline

### Architectuur

```
Rechtspraak API (XML/Atom)
        │
        ▼
 ┌──────────────┐      ┌──────────────────┐
 │   Importer    │ ───▶ │  SQLite + FTS5   │
 │   (Python)    │      │  rechtspraak.db  │
 └──────────────┘      └──────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Dashboard   │
                        │  (Next.js)   │
                        └──────────────┘
```

### Importproces (3 fasen)

| Fase | Commando | Wat het doet |
|------|----------|-------------|
| 0 | `update-value-lists` | Haalt referentiedata op (instanties, rechtsgebieden, proceduresoorten) |
| 1 | `index-crawl` | Doorzoekt de zoek-API per dag, slaat ECLI's + metadata op (`fetch_status='pending'`) |
| 2 | `fetch-content` | Haalt per ECLI de volledige XML op, parseert 30+ velden (body, inhoudsindicatie, rechters, wetsverwijzingen) |
| 3 | `rebuild-ii-cache` | Pre-berekent inhoudsindicatie-analyses en slaat resultaten op als JSON in een cachetabel |

**Volledig importeren:**
```bash
cd importer && source .venv/bin/activate
python3 -m rechtspraak full-import --from 2024-01-01 --to 2026-03-25
```

**Incrementeel bijwerken:**
```bash
python3 -m rechtspraak incremental-update
```

### Technische kenmerken

- **Async HTTP** met token-bucket rate limiting (~5 req/s) en configurable concurrency
- **Resumable crawls** — bij onderbreking hervat de index-crawl vanaf de laatste datum
- **Batch commits** (per 500 beslissingen) met WAL-checkpointing om bloat te voorkomen
- **Retry-logica** — gefaalde fetches worden opnieuw geprobeerd (max 3 pogingen)
- **FTS5-index** op titel, samenvatting, body en inhoudsindicatie voor full-text zoeken

### Datamodel (kerntabellen)

| Tabel | Inhoud |
|-------|--------|
| `decisions` | Hoofdtabel: ECLI, datum, instantie, type, body_text, inhoudsindicatie, fetch_status |
| `decision_legal_areas` | Rechtsgebieden per beslissing (m:n) |
| `decision_relations` | Hoger beroep / cassatie relaties + uitkomst |
| `decision_contributors` | Rechters/raadsheren met rol |
| `decision_references` | Wetsverwijzingen (BWB, ECLI, EU, CVDR) |
| `decision_vindplaatsen` | Publicatiebronnen (NJ, AB, JOR, etc.) |
| `decisions_fts` | Full-text search (FTS5) op 5 tekstvelden |
| `_ii_analysis_cache` | Pre-berekende inhoudsindicatie-analyse (JSON) |

---

## Dashboard — Inhoudsindicatie-analyse

### Wat wordt geanalyseerd

De tab **Inhoudsindicatie** biedt een uitgebreide analyse van de korte samenvattingen die de rechtspraak bij beslissingen publiceert. De analyse is opgedeeld in vier blokken:

#### 1. Dekkingsstatistieken
- **Totaal / met / zonder** inhoudsindicatie (absoluut en percentage)
- **Gemiddelde, mediaan, min/max lengte** in tekens
- **Dekking per instantie** — welke gerechten consequent samenvattingen leveren (gefilterd op ≥50 beslissingen)
- **Dekking per rechtsgebied** — bijv. strafrecht vs. bestuursrecht
- **Dekking per type** — uitspraak vs. conclusie
- **Tijdlijn** — maandelijkse dekking en trend

#### 2. Inhoudsanalyse
- **Uitkomstdetectie** — 15 regex-patronen herkennen veelvoorkomende uitkomsten (veroordeling, vrijspraak, beroep gegrond/ongegrond, gevangenisstraf, TBS, etc.)
- **Gegrond/ongegrond per instantie** — slagingspercentage hoger beroep per gerecht (≥10 beslissingen met uitkomstdata)
- **Wetsverwijzingen** — frequentie van verwijzingen naar 17 wetten (BW, Sr, Sv, Awb, EVRM, WOZ, etc.)

#### 3. Taalanalyse
- **Woordfrequentie** — top-40 woorden (na verwijdering van stopwoorden), gevisualiseerd als woordwolk
- **Bigrammen** — top-25 woordparen (bijv. "hoger beroep", "openbare orde")

#### 4. Structuuranalyse
- **Lengtehistogram** — verdeling over 7 buckets (< 50 t/m 2.000+ tekens)
- **Lengtetrend** — maandelijks gemiddelde lengte over tijd
- **Compressieverhouding** — verhouding inhoudsindicatie t.o.v. volledige beslissingstekst, uitgesplitst naar beslissingslengte (kort / middel / lang / zeer lang)
- **Voorbeelden** — langste en kortste inhoudsindicaties met ECLI-link

### Performance

Alle analyses zijn **pre-berekend** door de importer en opgeslagen als JSON in `_ii_analysis_cache`. Het dashboard leest enkel uit deze cache (~1ms per query), waardoor de pagina direct laadt.

---

## Opmerkingen bij oplevering inhoudsindicatie-data

### Datakwaliteit

- **Dekking is niet 100%** — niet alle beslissingen bevatten een inhoudsindicatie. Het dekkingspercentage verschilt sterk per instantie en rechtsgebied. De analyse maakt dit inzichtelijk.
- **Uitkomstdetectie is heuristisch** — de 15 patronen matchen op veelvoorkomende formuleringen in de inhoudsindicatie-tekst. Ongebruikelijke formuleringen worden mogelijk gemist. Dit zijn geen geverifieerde labels uit de bron.
- **Wetsverwijzingen zijn op naam** — matching gebeurt op basis van afkortingen en volledige namen (bijv. "BW", "Burgerlijk Wetboek"). Verwijzingen via alleen artikelnummers zonder wetnaam worden niet herkend.

### Beperkingen

- **Geen foreign keys** — referentietabellen (instanties, rechtsgebieden) zijn niet altijd vooraf gevuld. De data gebruikt de naam zoals aangeleverd in de XML.
- **Compressieratio** vereist dat zowel inhoudsindicatie als body_text beschikbaar zijn; bij ontbrekende body_text wordt de beslissing niet meegenomen.
- **Woordfrequentie is gesampled** — om performance te waarborgen wordt een steekproef (~5.000 woorden) genomen in plaats van het volledige corpus.

### Hoe de cache te vernieuwen

Na het importeren van nieuwe beslissingen:

```bash
# Vanuit de importer
python3 -m rechtspraak rebuild-ii-cache

# Of als onderdeel van een volledige import (gebeurt automatisch)
python3 -m rechtspraak full-import --from 2024-01-01 --to 2026-03-25
```

### Dashboard starten

```bash
cd dashboard
npm run dev  # http://localhost:3000
```

---

## Projectstructuur

```
Rechtspraak/
├── importer/                    # Python datapipeline
│   ├── rechtspraak/
│   │   ├── cli.py               # CLI commando's (click)
│   │   ├── pipeline.py          # Orchestratie (full-import, incremental)
│   │   ├── client.py            # Async HTTP client met rate limiting
│   │   ├── crawler.py           # Zoek-API crawler (per dag)
│   │   ├── fetcher.py           # Content fetcher (per ECLI)
│   │   ├── parser.py            # XML/RDF parser (30+ velden)
│   │   ├── database.py          # SQLite upsert & FTS beheer
│   │   ├── ii_cache.py          # Inhoudsindicatie analyse-cache
│   │   └── value_lists.py       # Referentiedata (instanties, etc.)
│   └── migrations/              # SQL schema migraties (001–004)
├── dashboard/                   # Next.js analytisch dashboard
│   ├── src/app/inhoudsindicatie/ # Inhoudsindicatie pagina
│   ├── src/components/
│   │   └── inhoudsindicatie/     # 14 visualisatiecomponenten
│   └── src/lib/
│       ├── queries.ts            # Query-functies (leest uit cache)
│       └── types.ts              # TypeScript interfaces
├── data/
│   └── rechtspraak.db           # SQLite database
└── README.md
```
