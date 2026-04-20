# 📊 Rechtspraak Dashboard

Dutch court decisions analytics platform powered by the Rechtspraak Open Data API.

> **174,210 decisions** | **170,170 with content** | **25,127 PII violations detected**

---

## 🎯 Key Features

### 📈 Decision Analytics
- Court breakdown and statistics
- Judge performance tracking
- Procedure type analysis
- Timeline visualizations

### 📝 Inhoudsindicatie Quality Analysis
Analyze how Dutch courts write decision summaries:
- Quality metrics per court type
- Legal area breakdowns
- Compliance tracking (200 characters / 40 words guideline)
- Trend analysis

### 🔒 Pseudonymization Audit
Scan decisions for Personal Identifiable Information (PII):
- Phone numbers (mobile & landline)
- Email addresses
- Street addresses & postcodes
- BSN numbers, license plates, dates of birth
- Interactive violation highlighting

### ⚖️ Hoger Beroep Analysis
Appeal case flow and outcomes tracking

### 🔍 Forensic Analysis
Financial crime and specialized case detection

---

## 📱 Dashboard Tabs

### Overview
Filter and explore all decisions with multiple dimensions:
- Instantie (Court Type)
- Rechtsgebied (Legal Area)
- Case Type

### Inhoudsindicatie
![Inhoudsindicatie Analysis](./screenshots/inhoudsindicatie.png)

Quality analysis of decision summaries:
- Compliance rate visualization
- Length distribution charts
- Best and worst performing courts
- Legal area performance metrics

### Pseudonimisering
![Pseudonymization Audit](./screenshots/pseudonimisering.png)

PII violation detection:
- 25K+ violations identified
- Severity categorization (high/medium/low)
- Court-by-court breakdown
- Individual decision inspection with highlighting

### Rechters
Judge statistics and activity tracking

### Hoger Beroep
Appeal case analysis and trends

### Forensisch
Specialized case categories (financial, organized crime)

---

## 🏗️ Architecture

```
Rechtspraak/
├── importer/              # Python data pipeline
│   ├── rechtspraak/       # Core modules
│   ├── migrations/        # Database schema
│   └── .venv/            # Virtual environment
│
├── dashboard/             # Next.js web application
│   ├── src/
│   │   ├── app/          # Pages & routes
│   │   ├── components/   # React components
│   │   ├── lib/          # Database queries
│   │   └── styles/       # Tailwind CSS
│   └── scripts/          # Build utilities
│
└── data/
    └── rechtspraak.db     # SQLite database (FTS5)
```

---

## 📊 Database

**SQLite with FTS5 Full-Text Search**

```sql
-- Core tables
decisions       -- 174K court decisions
judges          -- Judge statistics
procedures      -- Case procedure types
legal_areas     -- 50+ Dutch legal domains

-- Analytics
_pseudo_cache   -- 25K PII violations
_ii_cache       -- Inhoudsindicatie metrics
_appeal_cache   -- Hoger Beroep analysis
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS v4 |
| **Charts** | Recharts, Lucide React icons |
| **Backend** | Python 3.14, asyncio |
| **Database** | SQLite, FTS5 |
| **API** | Rechtspraak Open Data (no auth) |

---

## 📥 Data Import

Latest data: **2026-04-10** (174K decisions)

```bash
# Full import with index crawl + content fetch
python3 -m rechtspraak full-import --from 2024-01-01 --to 2026-04-17

# Incremental update
python3 -m rechtspraak incremental-update

# Fetch content for pending decisions
python3 -m rechtspraak fetch-content --max 5000
```

---

## 🔗 Rechtspraak API

**Endpoint**: https://data.rechtspraak.nl/

**Search**:
```
GET /uitspraken/zoeken?date=YYYY-MM-DD&max=1000&from=N&return=DOC
```

**Content**:
```
GET /uitspraken/content?id=ECLI:NL:XX:YYYY:NNNN
```

**Features**:
- ✓ No authentication
- ✓ XML/RDF format
- ✓ Rate limit: ~5 req/s recommended
- ✓ Historical data from 1921 onwards

---

## 📈 Analytics Highlights

### Inhoudsindicatie Compliance
- **Guideline**: 200 characters (~40 words) max
- **Current average**: 331 characters
- **Compliance rate**: 54%
- **Best performers**: Rechtbank (highest compliance)
- **Focus areas**: Gerechtshof, CRvB need improvement

### Pseudonymization Coverage
- **Total scanned**: 170K+ decisions
- **Violations found**: 25,127 (14.8%)
- **High severity**: Email, phones, BSN numbers
- **Most common**: Street addresses, postcodes

---

## 🛠️ Development

```bash
# Dashboard development
cd dashboard
npm run dev              # http://localhost:3456

# Production build
npm run build
npm start

# Rebuild pseudonymization cache
npx tsx scripts/build-pseudo-cache.ts
```

---

## 📄 License

Open Data from Rechtspraak (Dutch Ministry of Justice)

---

**Built with ❤️ using Next.js, Python, and SQLite**
