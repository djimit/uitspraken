#!/usr/bin/env npx tsx
/**
 * Pre-build the pseudonymization violation cache table.
 * Run this once (or after importing new decisions) to make the
 * Pseudonimisering dashboard page load instantly.
 *
 * Usage: npx tsx scripts/build-pseudo-cache.ts
 */

import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "..", "data", "rechtspraak.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("cache_size = -64000");
db.pragma("mmap_size = 268435456");

// Import the scan function inline (to avoid Next.js module issues)
// -- These are copies of the core types & logic from pseudo-check.ts --

type ViolationType = "phone_mobile" | "phone_landline" | "email" | "postcode" | "street_address" | "bsn" | "license_plate" | "date_of_birth";
type Severity = "high" | "medium" | "low";

interface Violation {
  type: ViolationType;
  severity: Severity;
  label: string;
  match: string;
  startIdx: number;
  endIdx: number;
  suggestion: string;
}

const VIOLATION_META: Record<ViolationType, { label: string; severity: Severity; suggestion: string }> = {
  phone_mobile: { label: "Mobiel nummer", severity: "high", suggestion: "[telefoonnummer]" },
  phone_landline: { label: "Vast nummer", severity: "medium", suggestion: "[telefoonnummer]" },
  email: { label: "E-mailadres", severity: "high", suggestion: "[e-mailadres]" },
  postcode: { label: "Postcode", severity: "medium", suggestion: "[postcode]" },
  street_address: { label: "Straatnaam + nummer", severity: "medium", suggestion: "[adres]" },
  bsn: { label: "BSN-achtig nummer", severity: "high", suggestion: "[BSN]" },
  license_plate: { label: "Kenteken", severity: "low", suggestion: "[kenteken]" },
  date_of_birth: { label: "Geboortedatum", severity: "high", suggestion: "[geboortedatum]" },
};

const SAFE_EMAIL_DOMAINS = new Set([
  "rechtspraak.nl", "overheid.nl", "rijksoverheid.nl", "belastingdienst.nl",
  "minvenj.nl", "minjenv.nl", "om.nl", "politie.nl", "ind.nl",
  "uwv.nl", "svb.nl", "duo.nl", "rvo.nl", "kadaster.nl",
  "kvk.nl", "cbr.nl", "rdw.nl", "rivm.nl", "knb.nl",
  "notaris.nl", "advocatenorde.nl", "tuchtrecht.nl",
  "caribjustitia.org", "gmail.com", "outlook.com", "hotmail.com",
]);

const ORG_KEYWORDS = /reclassering|advocatenkantoor|advocaten|notariskantoor|notaris|accountant|belastingdienst|politie|gemeente|waterschap|ministerie|rechtbank|gerechtshof|raad van state|openbaar ministerie|griffie|kantonrechter|B\.V\.|N\.V\.|Stichting|werkzaam\s+bij|kantoor|maatschap|incassobureau|deurwaarder|woningcorporatie|ziekenhuis|huisarts|tandarts|apotheek|school|universiteit|hogeschool|ggz|ggd|jeugdzorg|veilig\s+thuis|bureau|instelling|instantie|organisatie|bedrijf|onderneming|raadsman|raadsvrouw|gemachtigde|deskundige|makelaars?|taxateur|accountants?|ingenieursbureau|laboratorium|kliniek|centrum/i;
const REF_HOUSING_KEYWORDS = /referentiewoning|vergelijkingsobject|vergelijkbare?\s+woning|vergelijkingspand|taxatie(?:rapport|waarde|verslag)?|woz[-\s]?waarde|woz[-\s]?beschikking|waardepeildatum|heffingsmaatstaf|onroerende\s+zaak|registergoed|kadastr|kadaster|perceel(?:nummer)?|grondoppervlak|m[²2]\s|oppervlakte|bouwjaar\s+\d|woningtype|type\s+woning|inhoud\s+\d|gebruiksoppervlak|bruto\s+vloer|pandoppervlak|aanbouw|garage\s+\d|berging|tussenwoning|hoekwoning|vrijstaand|geschakeld|twee[-\s]?onder[-\s]?een[-\s]?kap|appartement\s+\d|etage|verdieping|bouwnummer|koopsom|verkoopprijs|transactie(?:prijs|datum)|overdracht|eigendom|huur(?:prijs|waarde)|erfpacht|bestemmingsplan|bouwvergunning|omgevingsvergunning/i;
const POSTCODE_FALSE_POSITIVE = /^\d{4}\s?(EU|EG|CE|BW|Sr|Sv|WW|PW|ZW|AW|Wm|Fw|Rv|EJ|AZ|HA|KG|JE|FA|CA|CB|CU)$/i;

function isInsideBracket(text: string, idx: number): boolean {
  for (let i = idx - 1; i >= Math.max(0, idx - 80); i--) {
    if (text[i] === "]") return false;
    if (text[i] === "[") return true;
  }
  return false;
}
function isNearOrganisation(text: string, idx: number): boolean {
  return ORG_KEYWORDS.test(text.slice(Math.max(0, idx - 300), idx));
}
function isReferenceHousing(text: string, idx: number): boolean {
  return REF_HOUSING_KEYWORDS.test(text.slice(Math.max(0, idx - 400), idx + 100));
}
function isInHeader(text: string, idx: number): boolean {
  return idx < 500 || idx > text.length - 500;
}
function makeViolation(type: ViolationType, match: string, startIdx: number): Violation {
  const meta = VIOLATION_META[type];
  return { type, severity: meta.severity, label: meta.label, match, startIdx, endIdx: startIdx + match.length, suggestion: meta.suggestion };
}

function scanDecision(text: string): Violation[] {
  if (!text) return [];
  const violations: Violation[] = [];

  for (const m of text.matchAll(/06[-\s]?\d{8}/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    violations.push(makeViolation("phone_mobile", m[0], m.index!));
  }
  for (const m of text.matchAll(/0[1-9]\d{1,2}[-\s]\d{6,7}/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isInHeader(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    violations.push(makeViolation("phone_landline", m[0], m.index!));
  }
  for (const m of text.matchAll(/[\w.+-]+@[\w.-]+\.\w{2,}/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    const domain = m[0].split("@")[1].toLowerCase();
    if (SAFE_EMAIL_DOMAINS.has(domain)) continue;
    if (isInHeader(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    violations.push(makeViolation("email", m[0], m.index!));
  }
  for (const m of text.matchAll(/\b(\d{4})\s?([A-Z]{2})\b/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isInHeader(text, m.index!)) continue;
    const num = parseInt(m[1]);
    if (num < 1000 || num > 9999) continue;
    if (POSTCODE_FALSE_POSITIVE.test(m[0])) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    if (isReferenceHousing(text, m.index!)) continue;
    violations.push(makeViolation("postcode", m[0], m.index!));
  }
  for (const m of text.matchAll(/((?:straat|weg|laan|plein|singel|gracht|kade|dijk|dreef|hof|park|allee|boulevard|steeg|pad)\s+\d+[\s,a-zA-Z]{0,5})/gi)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isInHeader(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    if (isReferenceHousing(text, m.index!)) continue;
    violations.push(makeViolation("street_address", m[0].trim(), m.index!));
  }
  for (const m of text.matchAll(/(?<!\d)\d{9}(?!\d)/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    const context = text.slice(Math.max(0, m.index! - 40), m.index! + 40);
    if (/ECLI|parketnummer|parket|zaakn|registratien|kenmerk|dossiern|telefo|06[-\s]|fax/i.test(context)) continue;
    violations.push(makeViolation("bsn", m[0], m.index!));
  }
  for (const m of text.matchAll(/geboren\s+(?:op\s+)?(\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4})/gi)) {
    if (isInsideBracket(text, m.index!)) continue;
    violations.push(makeViolation("date_of_birth", m[1], m.index! + m[0].indexOf(m[1])));
  }
  for (const m of text.matchAll(/\b([A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{1,2}|\d{2}[-\s]?[A-Z]{3}[-\s]?\d{1}|\d{1}[-\s]?[A-Z]{3}[-\s]?\d{2}|[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{2}|\d{2}[-\s]?[A-Z]{2}[-\s]?\d{2})\b/g)) {
    if (!isInsideBracket(text, m.index!)) {
      const pre = text.slice(Math.max(0, m.index! - 20), m.index!);
      if (/artikel|lid|ECLI|nr\.|zaak/i.test(pre)) continue;
      violations.push(makeViolation("license_plate", m[0], m.index!));
    }
  }
  return violations;
}

// ── Main ──────────────────────────────────────────────────────────────

const W = `fetch_status = 'fetched' AND body_text IS NOT NULL AND body_text != ''`;
const ANY_VIOLATION = `(
  body_text GLOB '*06-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'
  OR (body_text LIKE '%@%.%' AND body_text NOT LIKE '%rechtspraak.nl%' AND body_text NOT LIKE '%overheid.nl%')
  OR body_text GLOB '*straat [0-9]*' OR body_text GLOB '*weg [0-9]*'
  OR body_text GLOB '*laan [0-9]*' OR body_text GLOB '*plein [0-9]*'
  OR body_text GLOB '*gracht [0-9]*' OR body_text GLOB '*kade [0-9]*'
  OR body_text LIKE '%geboren op % januari %' OR body_text LIKE '%geboren op % februari %'
  OR body_text LIKE '%geboren op % maart %' OR body_text LIKE '%geboren op % april %'
  OR body_text LIKE '%geboren op % mei %' OR body_text LIKE '%geboren op % juni %'
  OR body_text LIKE '%geboren op % juli %' OR body_text LIKE '%geboren op % augustus %'
  OR body_text LIKE '%geboren op % september %' OR body_text LIKE '%geboren op % oktober %'
  OR body_text LIKE '%geboren op % november %' OR body_text LIKE '%geboren op % december %'
)`;

console.log("Building pseudonymization violation cache...");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS _pseudo_cache (
    ecli TEXT PRIMARY KEY,
    court_name TEXT,
    decision_date TEXT,
    decision_type TEXT,
    types TEXT NOT NULL
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS _pseudo_cache_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);
// Flags table: per-decision flags for fast aggregation queries
db.exec(`
  CREATE TABLE IF NOT EXISTS _pseudo_flags (
    ecli TEXT PRIMARY KEY,
    has_pseudo INTEGER NOT NULL DEFAULT 0,
    has_verdachte INTEGER NOT NULL DEFAULT 0,
    has_geboortedatum INTEGER NOT NULL DEFAULT 0,
    has_geboorteplaats INTEGER NOT NULL DEFAULT 0,
    has_adres INTEGER NOT NULL DEFAULT 0,
    has_woonplaats INTEGER NOT NULL DEFAULT 0,
    has_slachtoffer INTEGER NOT NULL DEFAULT 0,
    has_benadeelde INTEGER NOT NULL DEFAULT 0,
    has_medeverdachte INTEGER NOT NULL DEFAULT 0,
    has_aangever INTEGER NOT NULL DEFAULT 0,
    has_getuige INTEGER NOT NULL DEFAULT 0
  )
`);

const totalRow = db.prepare(`SELECT COUNT(*) as c FROM decisions WHERE ${W}`).get() as { c: number };
console.log(`Total decisions with body text: ${totalRow.c}`);

// Clear old caches
db.prepare("DELETE FROM _pseudo_cache").run();
db.prepare("DELETE FROM _pseudo_flags").run();

let totalScanned = 0;
let totalVerified = 0;

const insert = db.prepare(
  "INSERT INTO _pseudo_cache (ecli, court_name, decision_date, decision_type, types) VALUES (?, ?, ?, ?, ?)"
);
const insertFlags = db.prepare(`
  INSERT INTO _pseudo_flags (ecli, has_pseudo, has_verdachte, has_geboortedatum,
    has_geboorteplaats, has_adres, has_woonplaats, has_slachtoffer,
    has_benadeelde, has_medeverdachte, has_aangever, has_getuige)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Pseudo bracket patterns (same as PSEUDO_LIKE SQL)
const PSEUDO_PATTERNS = [
  /\[verdachte\]/i, /\[appellant\]/i, /\[eiser\]/i, /\[gedaagde\]/i,
  /\[betrokkene\]/i, /\[naam/i, /\[slachtoffer\]/i, /\[minderjarige/i,
];

function hasPseudo(text: string): boolean {
  return PSEUDO_PATTERNS.some(p => p.test(text));
}

const startTime = Date.now();

// Scan ALL decisions directly with JS regex — much faster than SQLite GLOB/LIKE
console.log("Scanning all decisions with JS regex (no SQL pre-filter)...");
const BATCH_SIZE = 500;
let lastRowid = 0;

while (true) {
  const rows = db.prepare(`
    SELECT rowid, ecli, court_name, decision_date, decision_type, body_text
    FROM decisions
    WHERE rowid > ? AND ${W}
    ORDER BY rowid ASC
    LIMIT ${BATCH_SIZE}
  `).all(lastRowid) as { rowid: number; ecli: string; court_name: string | null; decision_date: string | null; decision_type: string | null; body_text: string }[];

  if (rows.length === 0) break;
  lastRowid = rows[rows.length - 1].rowid;

  db.transaction(() => {
    for (const row of rows) {
      const text = row.body_text;

      // Violations cache
      const violations = scanDecision(text);
      if (violations.length > 0) {
        const typeSet = new Set(violations.map(v => VIOLATION_META[v.type].label));
        insert.run(row.ecli, row.court_name, row.decision_date, row.decision_type, [...typeSet].join(","));
        totalVerified++;
      }

      // Flags for fast aggregation
      const hp = hasPseudo(text) ? 1 : 0;
      insertFlags.run(
        row.ecli,
        hp,
        /\[verdachte\]/i.test(text) ? 1 : 0,
        /\[geboortedatum\]/i.test(text) ? 1 : 0,
        /\[geboorteplaats\]/i.test(text) ? 1 : 0,
        /\[adres\]/i.test(text) ? 1 : 0,
        /\[woonplaats\]/i.test(text) ? 1 : 0,
        /\[slachtoffer\]/i.test(text) ? 1 : 0,
        /\[benadeelde\]/i.test(text) ? 1 : 0,
        /\[medeverdachte/i.test(text) ? 1 : 0,
        /\[aangever/i.test(text) ? 1 : 0,
        /\[getuige/i.test(text) ? 1 : 0,
      );
    }
  })();

  totalScanned += rows.length;

  if (totalScanned % 10000 < BATCH_SIZE) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = Math.round(100 * totalScanned / totalRow.c);
    console.log(`  ${totalScanned}/${totalRow.c} (${pct}%) — ${totalVerified} violations found — ${elapsed}s`);
  }
}

// Store metadata
db.prepare(
  "INSERT OR REPLACE INTO _pseudo_cache_meta (key, value) VALUES ('total_decisions', ?)"
).run(String(totalRow.c));

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone! Scanned ${totalScanned} decisions, found ${totalVerified} with violations.`);
console.log(`Cache built in ${elapsed}s.`);
console.log(`Cache stored in _pseudo_cache table (${totalVerified} rows).`);

db.close();
