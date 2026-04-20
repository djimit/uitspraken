# Rechtspraak Dashboard

Dutch court decisions importer and analytics dashboard using the Rechtspraak Open Data API.

## 📊 Project Structure

### `importer/`
Python 3.14 data import pipeline with asyncio
- Full-import: Index crawl + content fetch
- Incremental updates
- Database: SQLite with FTS5 at `data/rechtspraak.db`

### `dashboard/`
Next.js 16 + TypeScript + Tailwind v4 analytics interface
- Decision overview and filtering
- Judge statistics
- Inhoudsindicatie quality analysis
- Pseudonymization audit
- Hoger Beroep and Forensisch analysis

## 🚀 Quick Start

### Importer
```bash
cd importer
source .venv/bin/activate
python3 -m rechtspraak full-import --from 2024-01-01 --to 2026-04-17
```

### Dashboard
```bash
cd dashboard
npm run dev  # http://localhost:3456
```

## 📈 Key Features

- **Inhoudsindicatie Analysis**: Quality assessment by broad court categories (Rechtbank, Hoven, CRvB, CBb)
- **Pseudonymization Audit**: Scans 170K+ decisions for PII violations (25K+ violations found)
- **Responsive Analytics**: Charts, tables, and KPI cards with Recharts
- **Full-text Search**: FTS5-indexed decisions for fast searching

## 🗄️ Database

- **174,210** total decisions indexed
- **170,170** decisions with content fetched
- Latest date: **2026-04-10**
- Violation cache: **25,127** pseudonymization violations

## 🛠️ Tech Stack

- **Backend**: Python 3.14, asyncio, httpx, lxml
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4
- **Data**: SQLite with FTS5
- **Charts**: Recharts
- **Icons**: lucide-react

## 📝 Recent Changes

- Removed Hans & Maaike analysis routes
- Consolidated into main Inhoudsindicatie analysis
- Navigation simplified

## 🔗 API Reference

**Rechtspraak Open Data**
- Base: `https://data.rechtspraak.nl/`
- Search: `/uitspraken/zoeken?date=YYYY-MM-DD&max=1000&from=N&return=DOC`
- Content: `/uitspraken/content?id=ECLI:...`
- No authentication required
- Rate limit: ~5 req/s recommended

