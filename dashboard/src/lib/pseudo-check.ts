import { getDb, cached, cachedSlow } from "./db";

// ── Types ──────────────────────────────────────────────────────────

export type ViolationType =
  | "phone_mobile"
  | "phone_landline"
  | "email"
  | "postcode"
  | "street_address"
  | "bsn"
  | "license_plate"
  | "date_of_birth";

export type Severity = "high" | "medium" | "low";

export interface Violation {
  type: ViolationType;
  severity: Severity;
  label: string;
  match: string;
  startIdx: number;
  endIdx: number;
  suggestion: string;
}

export interface DecisionViolations {
  ecli: string;
  court_name: string | null;
  decision_date: string | null;
  decision_type: string | null;
  violations: Violation[];
}

export interface PseudoSummary {
  total_scanned: number;
  with_violations: number;
  violation_rate: number;
  by_type: { type: string; label: string; count: number; severity: Severity }[];
  by_court: { court_name: string; count: number }[];
}

// ── Constants ──────────────────────────────────────────────────────

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

// Institutional email domains that are NOT personal data
const SAFE_EMAIL_DOMAINS = new Set([
  "rechtspraak.nl", "overheid.nl", "rijksoverheid.nl", "belastingdienst.nl",
  "minvenj.nl", "minjenv.nl", "om.nl", "politie.nl", "ind.nl",
  "uwv.nl", "svb.nl", "duo.nl", "rvo.nl", "kadaster.nl",
  "kvk.nl", "cbr.nl", "rdw.nl", "rivm.nl", "knb.nl",
  "notaris.nl", "advocatenorde.nl", "tuchtrecht.nl",
  "caribjustitia.org", "gmail.com", "outlook.com", "hotmail.com",
]);

// ── Detection ──────────────────────────────────────────────────────

/** Check if a character position falls inside [...] brackets */
function isInsideBracket(text: string, idx: number): boolean {
  // Search backwards for [ or ]
  for (let i = idx - 1; i >= Math.max(0, idx - 80); i--) {
    if (text[i] === "]") return false; // found closing bracket first = we're outside
    if (text[i] === "[") return true;  // found opening bracket = we're inside
  }
  return false;
}

/** Professional / institutional organisation keywords.
 *  If any of these appear in the ~300 chars before a postcode or address,
 *  the PII likely belongs to the organisation, not a natural person. */
const ORG_KEYWORDS = /reclassering|advocatenkantoor|advocaten|notariskantoor|notaris|accountant|belastingdienst|politie|gemeente|waterschap|ministerie|rechtbank|gerechtshof|raad van state|openbaar ministerie|griffie|kantonrechter|B\.V\.|N\.V\.|Stichting|werkzaam\s+bij|kantoor|maatschap|incassobureau|deurwaarder|woningcorporatie|ziekenhuis|huisarts|tandarts|apotheek|school|universiteit|hogeschool|ggz|ggd|jeugdzorg|veilig\s+thuis|bureau|instelling|instantie|organisatie|bedrijf|onderneming|raadsman|raadsvrouw|gemachtigde|deskundige|makelaars?|taxateur|accountants?|ingenieursbureau|laboratorium|kliniek|centrum/i;

/** Reference housing / property context keywords.
 *  If an address or postcode appears near these terms, it likely refers to a
 *  property object (e.g. in WOZ or real estate context), not a personal address. */
const REF_HOUSING_KEYWORDS = /referentiewoning|vergelijkingsobject|vergelijkbare?\s+woning|vergelijkingspand|taxatie(?:rapport|waarde|verslag)?|woz[-\s]?waarde|woz[-\s]?beschikking|waardepeildatum|heffingsmaatstaf|onroerende\s+zaak|registergoed|kadastr|kadaster|perceel(?:nummer)?|grondoppervlak|m[²2]\s|oppervlakte|bouwjaar\s+\d|woningtype|type\s+woning|inhoud\s+\d|gebruiksoppervlak|bruto\s+vloer|pandoppervlak|aanbouw|garage\s+\d|berging|tussenwoning|hoekwoning|vrijstaand|geschakeld|twee[-\s]?onder[-\s]?een[-\s]?kap|appartement\s+\d|etage|verdieping|bouwnummer|koopsom|verkoopprijs|transactie(?:prijs|datum)|overdracht|eigendom|huur(?:prijs|waarde)|erfpacht|bestemmingsplan|bouwvergunning|omgevingsvergunning/i;

/** Check if the text before a match position contains an organisation keyword,
 *  suggesting the postcode/address belongs to the org, not a natural person. */
function isNearOrganisation(text: string, idx: number): boolean {
  // Look at the ~300 characters before this position
  const lookback = text.slice(Math.max(0, idx - 300), idx);
  return ORG_KEYWORDS.test(lookback);
}

/** Check if the text around a match position is in a reference housing /
 *  property valuation context, meaning the address is a property object
 *  and not PII of a natural person. */
function isReferenceHousing(text: string, idx: number): boolean {
  // Look at the ~400 chars before and ~100 chars after
  const lookback = text.slice(Math.max(0, idx - 400), idx + 100);
  return REF_HOUSING_KEYWORDS.test(lookback);
}

/** Check if position is in the first 500 chars (court header/footer area) */
function isInHeader(text: string, idx: number): boolean {
  // Court headers with phone/fax/email are typically in first or last 500 chars
  return idx < 500 || idx > text.length - 500;
}

/** Additional false-positive filter: common patterns that look like postcodes
 *  but are actually case numbers, legal references, etc. */
const POSTCODE_FALSE_POSITIVE = /^\d{4}\s?(EU|EG|CE|BW|Sr|Sv|WW|PW|ZW|AW|Wm|Fw|Rv|EJ|AZ|HA|KG|JE|FA|CA|CB|CU)$/i;

/** Scan a single decision body_text for pseudonymization violations */
export function scanDecision(text: string): Violation[] {
  if (!text) return [];
  const violations: Violation[] = [];

  // Mobile phone: 06-12345678 or 06 12345678
  for (const m of text.matchAll(/06[-\s]?\d{8}/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    violations.push(makeViolation("phone_mobile", m[0], m.index!));
  }

  // Landline: 020-1234567, 0226-399320
  for (const m of text.matchAll(/0[1-9]\d{1,2}[-\s]\d{6,7}/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isInHeader(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    violations.push(makeViolation("phone_landline", m[0], m.index!));
  }

  // Email addresses
  for (const m of text.matchAll(/[\w.+-]+@[\w.-]+\.\w{2,}/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    const domain = m[0].split("@")[1].toLowerCase();
    if (SAFE_EMAIL_DOMAINS.has(domain)) continue;
    if (isInHeader(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    violations.push(makeViolation("email", m[0], m.index!));
  }

  // Dutch postcode: 1234 AB
  for (const m of text.matchAll(/\b(\d{4})\s?([A-Z]{2})\b/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isInHeader(text, m.index!)) continue;
    // Skip if it looks like a legal reference (e.g., "2013 EU", "24/6455 PW")
    const num = parseInt(m[1]);
    if (num < 1000 || num > 9999) continue;
    if (POSTCODE_FALSE_POSITIVE.test(m[0])) continue;
    // Skip if preceded by a professional organisation name (not personal PII)
    if (isNearOrganisation(text, m.index!)) continue;
    // Skip if in a reference housing / property valuation context
    if (isReferenceHousing(text, m.index!)) continue;
    violations.push(makeViolation("postcode", m[0], m.index!));
  }

  // Street name + house number
  for (const m of text.matchAll(/((?:straat|weg|laan|plein|singel|gracht|kade|dijk|dreef|hof|park|allee|boulevard|steeg|pad)\s+\d+[\s,a-zA-Z]{0,5})/gi)) {
    if (isInsideBracket(text, m.index!)) continue;
    if (isInHeader(text, m.index!)) continue;
    if (isNearOrganisation(text, m.index!)) continue;
    // Skip if in a reference housing context (WOZ, taxatie, vergelijkingsobject)
    if (isReferenceHousing(text, m.index!)) continue;
    violations.push(makeViolation("street_address", m[0].trim(), m.index!));
  }

  // BSN-like: exactly 9 digits (not part of longer number)
  for (const m of text.matchAll(/(?<!\d)\d{9}(?!\d)/g)) {
    if (isInsideBracket(text, m.index!)) continue;
    // Skip ECLIs, parketnummers, phone numbers, dates
    const context = text.slice(Math.max(0, m.index! - 40), m.index! + 40);
    if (/ECLI|parketnummer|parket|zaakn|registratien|kenmerk|dossiern|telefo|06[-\s]|fax/i.test(context)) continue;
    violations.push(makeViolation("bsn", m[0], m.index!));
  }

  // Full dates of birth (should be [geboortedatum] or [geboortedag] YYYY)
  for (const m of text.matchAll(/geboren\s+(?:op\s+)?(\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4})/gi)) {
    if (isInsideBracket(text, m.index!)) continue;
    violations.push(makeViolation("date_of_birth", m[1], m.index! + m[0].indexOf(m[1])));
  }

  // Dutch license plates: XX-999-X, 99-XXX-9, XX-99-XX, 99-XX-99, etc.
  for (const m of text.matchAll(/\b([A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{1,2}|\d{2}[-\s]?[A-Z]{3}[-\s]?\d{1}|\d{1}[-\s]?[A-Z]{3}[-\s]?\d{2}|[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{2}|\d{2}[-\s]?[A-Z]{2}[-\s]?\d{2})\b/g)) {
    if (!isInsideBracket(text, m.index!)) {
      // Skip if it looks like a legal reference
      const pre = text.slice(Math.max(0, m.index! - 20), m.index!);
      if (/artikel|lid|ECLI|nr\.|zaak/i.test(pre)) continue;
      violations.push(makeViolation("license_plate", m[0], m.index!));
    }
  }

  return violations;
}

function makeViolation(type: ViolationType, match: string, startIdx: number): Violation {
  const meta = VIOLATION_META[type];
  return {
    type,
    severity: meta.severity,
    label: meta.label,
    match,
    startIdx,
    endIdx: startIdx + match.length,
    suggestion: meta.suggestion,
  };
}

// ── Fast SQL-based scan (no body_text transfer) ───────────────────

export interface PseudoCandidate {
  ecli: string;
  court_name: string | null;
  decision_date: string | null;
  decision_type: string | null;
  types: string; // comma-separated violation types from SQL
}

const W = "fetch_status = 'fetched' AND body_text IS NOT NULL AND body_text != ''";
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

/** JS-verified summary — accurate stats derived from verified candidates */
export function getPseudoSummaryFast(): PseudoSummary {
  return cachedSlow("pseudoSummary", () => {
    const db = getDb();
    const totalScanned = (db.prepare(
      `SELECT COUNT(*) as c FROM decisions WHERE ${W}`
    ).get() as { c: number }).c;

    const verified = getVerifiedCandidates();

    // Count by type — a decision can have multiple types
    const typeCounts: Record<string, number> = {};
    for (const d of verified) {
      for (const t of d.types.split(",")) {
        const trimmed = t.trim();
        if (trimmed) typeCounts[trimmed] = (typeCounts[trimmed] || 0) + 1;
      }
    }

    // Map label back to ViolationType for severity
    const labelToType: Record<string, ViolationType> = {};
    for (const [k, v] of Object.entries(VIOLATION_META)) {
      labelToType[v.label] = k as ViolationType;
    }

    const byType = Object.entries(typeCounts)
      .map(([label, count]) => ({
        type: labelToType[label] || label,
        label,
        count,
        severity: VIOLATION_META[labelToType[label]]?.severity || "low" as Severity,
      }))
      .sort((a, b) => b.count - a.count);

    const withViolations = verified.length;
    return {
      total_scanned: totalScanned,
      with_violations: withViolations,
      violation_rate: totalScanned > 0 ? Math.round((1000 * withViolations) / totalScanned) / 10 : 0,
      by_type: byType,
      by_court: [],
    };
  });
}

/** Court breakdown — derived from JS-verified candidates */
export function getPseudoCourtBreakdown(): PseudoSummary["by_court"] {
  return cachedSlow("pseudoCourt", () => {
    const verified = getVerifiedCandidates();
    const courtCounts: Record<string, number> = {};
    for (const d of verified) {
      const court = d.court_name || "Onbekend";
      courtCounts[court] = (courtCounts[court] || 0) + 1;
    }
    return Object.entries(courtCounts)
      .map(([court_name, count]) => ({ court_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  });
}

// ── Persistent SQLite cache for violation scan results ──────────────
// The cache is pre-built by `scripts/build-pseudo-cache.ts` (offline).
// The dashboard only reads from it — no writable DB connection needed.

/** Build JS-verified candidates list from pre-built SQLite cache.
 *  Cache must be populated offline via: npx tsx scripts/build-pseudo-cache.ts */
function getVerifiedCandidates(): PseudoCandidate[] {
  return cachedSlow("pseudoVerified", () => {
    const db = getDb();
    try {
      return db.prepare(`
        SELECT ecli, court_name, decision_date, decision_type, types
        FROM _pseudo_cache
        ORDER BY decision_date DESC
      `).all() as PseudoCandidate[];
    } catch {
      // Cache table doesn't exist — return empty until script is run
      console.warn("_pseudo_cache table not found. Run: cd dashboard && npx tsx scripts/build-pseudo-cache.ts");
      return [];
    }
  });
}

/** Paginated candidate decisions — JS-verified (no false positives) */
export function getPseudoCandidates(page: number, pageSize: number): { decisions: PseudoCandidate[]; total: number } {
  const all = getVerifiedCandidates();
  const offset = (page - 1) * pageSize;
  return {
    decisions: all.slice(offset, offset + pageSize),
    total: all.length,
  };
}

/** Filter options for the bevindingen list */
export interface PseudoFilterOptions {
  piiType?: string;     // e.g. "Mobiel nummer", "Postcode"
  court?: string;       // court_name
  severity?: string;    // "high" | "medium" | "low"
  year?: string;        // e.g. "2024"
}

/** Get unique filter values from verified candidates */
export function getPseudoFilterValues(): { types: string[]; courts: string[]; severities: string[]; years: string[] } {
  return cachedSlow("pseudoFilterValues", () => {
    const all = getVerifiedCandidates();
    const types = new Set<string>();
    const courts = new Set<string>();
    const years = new Set<string>();

    for (const d of all) {
      for (const t of d.types.split(",")) {
        const trimmed = t.trim();
        if (trimmed) types.add(trimmed);
      }
      if (d.court_name) courts.add(d.court_name);
      if (d.decision_date) years.add(d.decision_date.slice(0, 4));
    }

    // Derive severities from type labels
    const severities = new Set<string>();
    for (const [, v] of Object.entries(VIOLATION_META)) {
      severities.add(v.severity);
    }

    return {
      types: [...types].sort(),
      courts: [...courts].sort(),
      severities: [...severities],
      years: [...years].sort().reverse(),
    };
  });
}

/** Get severity for a PII type label */
function severityForLabel(label: string): Severity {
  for (const [, v] of Object.entries(VIOLATION_META)) {
    if (v.label === label) return v.severity;
  }
  return "low";
}

/** Filtered + paginated candidate decisions */
export function getPseudoCandidatesFiltered(
  page: number,
  pageSize: number,
  filters: PseudoFilterOptions
): { decisions: PseudoCandidate[]; total: number } {
  const all = getVerifiedCandidates();

  const filtered = all.filter((d) => {
    if (filters.piiType) {
      const types = d.types.split(",").map((t) => t.trim());
      if (!types.includes(filters.piiType)) return false;
    }
    if (filters.court && d.court_name !== filters.court) return false;
    if (filters.severity) {
      const types = d.types.split(",").map((t) => t.trim()).filter(Boolean);
      const hasSeverity = types.some((t) => severityForLabel(t) === filters.severity);
      if (!hasSeverity) return false;
    }
    if (filters.year && (!d.decision_date || !d.decision_date.startsWith(filters.year))) return false;
    return true;
  });

  const offset = (page - 1) * pageSize;
  return {
    decisions: filtered.slice(offset, offset + pageSize),
    total: filtered.length,
  };
}

/** PII exposure trend over time (monthly, how many decisions have PII leaks) */
export interface PiiTrendEntry {
  month: string;
  total_scanned: number;
  with_pii: number;
  rate: number;
}

export function getPseudoPiiTrend(): PiiTrendEntry[] {
  return cachedSlow("pseudoPiiTrend", () => {
    const all = getVerifiedCandidates();
    const monthMap: Record<string, { scanned: number; pii: number }> = {};

    // Get total scanned per month
    const db = getDb();
    const rows = db.prepare(`
      SELECT substr(decision_date, 1, 7) as month, COUNT(*) as total
      FROM decisions WHERE ${W}
      GROUP BY month HAVING month IS NOT NULL AND month != ''
      ORDER BY month
    `).all() as { month: string; total: number }[];

    for (const r of rows) {
      monthMap[r.month] = { scanned: r.total, pii: 0 };
    }

    for (const d of all) {
      if (!d.decision_date) continue;
      const month = d.decision_date.slice(0, 7);
      if (monthMap[month]) monthMap[month].pii++;
    }

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        total_scanned: v.scanned,
        with_pii: v.pii,
        rate: v.scanned > 0 ? Math.round(10000 * v.pii / v.scanned) / 100 : 0,
      }));
  });
}

/** Severity breakdown across all verified violations */
export interface SeverityBreakdown {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export function getPseudoSeverityBreakdown(): SeverityBreakdown {
  return cachedSlow("pseudoSeverityBreakdown", () => {
    const all = getVerifiedCandidates();
    let high = 0, medium = 0, low = 0;
    for (const d of all) {
      for (const t of d.types.split(",")) {
        const trimmed = t.trim();
        if (!trimmed) continue;
        const sev = severityForLabel(trimmed);
        if (sev === "high") high++;
        else if (sev === "medium") medium++;
        else low++;
      }
    }
    return { high, medium, low, total: high + medium + low };
  });
}

/** Get violations for a single decision by ECLI */
export function getPseudoDecisionDetail(ecli: string): DecisionViolations | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT ecli, court_name, decision_date, decision_type, body_text FROM decisions WHERE ecli = ? AND fetch_status = 'fetched'"
  ).get(ecli) as { ecli: string; court_name: string | null; decision_date: string | null; decision_type: string | null; body_text: string | null } | undefined;

  if (!row || !row.body_text) return null;

  return {
    ecli: row.ecli,
    court_name: row.court_name,
    decision_date: row.decision_date,
    decision_type: row.decision_type,
    violations: scanDecision(row.body_text),
  };
}

/** Get body text for a decision */
export function getDecisionBodyText(ecli: string): string | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT body_text FROM decisions WHERE ecli = ?"
  ).get(ecli) as { body_text: string | null } | undefined;
  return row?.body_text ?? null;
}

// ── New insight queries ─────────────────────────────────────────────

const PSEUDO_LIKE = `(
  body_text LIKE '%[verdachte]%' OR body_text LIKE '%[appellant]%'
  OR body_text LIKE '%[eiser]%' OR body_text LIKE '%[gedaagde]%'
  OR body_text LIKE '%[betrokkene]%' OR body_text LIKE '%[naam%'
  OR body_text LIKE '%[slachtoffer]%' OR body_text LIKE '%[minderjarige%'
)`;

export interface AdoptionTrendEntry {
  month: string;
  total: number;
  with_pseudo: number;
  rate: number;
}

/** Monthly pseudonymization adoption trend */
export function getPseudoAdoptionTrend(): AdoptionTrendEntry[] {
  return cachedSlow("pseudoAdoptionTrend", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        substr(d.decision_date, 1, 7) as month,
        COUNT(*) as total,
        SUM(COALESCE(f.has_pseudo, 0)) as with_pseudo
      FROM decisions d
      LEFT JOIN _pseudo_flags f ON d.ecli = f.ecli
      WHERE ${W}
      GROUP BY month
      HAVING month IS NOT NULL AND month != ''
      ORDER BY month
    `).all() as { month: string; total: number; with_pseudo: number }[];
    return rows.map(r => ({
      ...r,
      rate: r.total > 0 ? Math.round(1000 * r.with_pseudo / r.total) / 10 : 0,
    }));
  });
}

export interface CourtAdoptionEntry {
  court_name: string;
  total: number;
  with_pseudo: number;
  rate: number;
}

/** Court-level pseudonymization adoption scoreboard */
export function getPseudoCourtAdoption(): CourtAdoptionEntry[] {
  return cachedSlow("pseudoCourtAdoption", () => {
    const db = getDb();
    return db.prepare(`
      SELECT
        d.court_name,
        COUNT(*) as total,
        SUM(COALESCE(f.has_pseudo, 0)) as with_pseudo,
        ROUND(100.0 * SUM(COALESCE(f.has_pseudo, 0)) / COUNT(*), 1) as rate
      FROM decisions d
      LEFT JOIN _pseudo_flags f ON d.ecli = f.ecli
      WHERE ${W}
      GROUP BY d.court_name
      HAVING total > 100
      ORDER BY rate ASC
    `).all() as CourtAdoptionEntry[];
  });
}

export interface LegalAreaAdoptionEntry {
  legal_area: string;
  total: number;
  with_pseudo: number;
  rate: number;
}

/** Pseudonymization adoption by legal area */
export function getPseudoLegalAreaAdoption(): LegalAreaAdoptionEntry[] {
  return cachedSlow("pseudoLegalAreaAdoption", () => {
    const db = getDb();
    return db.prepare(`
      SELECT
        dla.legal_area_name as legal_area,
        COUNT(*) as total,
        SUM(COALESCE(f.has_pseudo, 0)) as with_pseudo,
        ROUND(100.0 * SUM(COALESCE(f.has_pseudo, 0)) / COUNT(*), 1) as rate
      FROM decisions d
      JOIN decision_legal_areas dla ON d.ecli = dla.ecli
      LEFT JOIN _pseudo_flags f ON d.ecli = f.ecli
      WHERE ${W}
      GROUP BY dla.legal_area_name
      HAVING total > 50
      ORDER BY rate ASC
    `).all() as LegalAreaAdoptionEntry[];
  });
}

export interface ProcedureAdoptionEntry {
  procedure: string;
  total: number;
  rate: number;
}

/** Pseudonymization adoption by procedure type */
export function getPseudoProcedureAdoption(): ProcedureAdoptionEntry[] {
  return cachedSlow("pseudoProcedureAdoption", () => {
    const db = getDb();
    return db.prepare(`
      SELECT
        COALESCE(d.procedure_type, '(onbekend)') as procedure,
        COUNT(*) as total,
        ROUND(100.0 * SUM(COALESCE(f.has_pseudo, 0)) / COUNT(*), 1) as rate
      FROM decisions d
      LEFT JOIN _pseudo_flags f ON d.ecli = f.ecli
      WHERE ${W}
      GROUP BY d.procedure_type
      HAVING total > 50
      ORDER BY rate ASC
    `).all() as ProcedureAdoptionEntry[];
  });
}

export interface CompletenessEntry {
  label: string;
  count: number;
  total: number;
  rate: number;
}

/** Completeness analysis: for criminal cases with [verdachte], what other
 *  bracket types are also used? Reveals gaps in pseudonymization thoroughness. */
export function getPseudoCompleteness(): CompletenessEntry[] {
  return cachedSlow("pseudoCompleteness", () => {
    const db = getDb();
    const totalRow = db.prepare(`
      SELECT COUNT(*) as c FROM _pseudo_flags WHERE has_verdachte = 1
    `).get() as { c: number };
    const total = totalRow.c;

    const checks = [
      { label: "[geboortedatum]", col: "has_geboortedatum" },
      { label: "[geboorteplaats]", col: "has_geboorteplaats" },
      { label: "[adres]", col: "has_adres" },
      { label: "[woonplaats]", col: "has_woonplaats" },
      { label: "[slachtoffer]", col: "has_slachtoffer" },
      { label: "[benadeelde]", col: "has_benadeelde" },
      { label: "[medeverdachte]", col: "has_medeverdachte" },
      { label: "[aangever]", col: "has_aangever" },
      { label: "[getuige]", col: "has_getuige" },
    ];

    return checks.map(({ label, col }) => {
      const row = db.prepare(`
        SELECT COUNT(*) as c FROM _pseudo_flags
        WHERE has_verdachte = 1 AND ${col} = 1
      `).get() as { c: number };
      return {
        label,
        count: row.c,
        total,
        rate: total > 0 ? Math.round(1000 * row.c / total) / 10 : 0,
      };
    });
  });
}

export interface VocabEntry {
  label: string;
  count: number;
}

/** Top bracket labels across sample of decisions (vocabulary analysis) */
export function getPseudoVocabulary(): { labels: VocabEntry[]; uniqueCount: number; sampleSize: number } {
  return cachedSlow("pseudoVocabulary", () => {
    const db = getDb();
    // Sample 5000 decisions for bracket extraction
    const rows = db.prepare(`
      SELECT body_text FROM decisions
      WHERE ${W} AND ${PSEUDO_LIKE}
      ORDER BY RANDOM() LIMIT 5000
    `).all() as { body_text: string }[];

    const counts: Record<string, number> = {};
    const bracketRe = /\[([a-zA-Z][a-zA-Z 0-9._/-]*)\]/g;
    for (const row of rows) {
      for (const m of row.body_text.matchAll(bracketRe)) {
        const label = m[1].trim();
        if (label.length > 1 && label.length < 60) {
          counts[label] = (counts[label] || 0) + 1;
        }
      }
    }

    const labels = Object.entries(counts)
      .map(([label, count]) => ({ label: `[${label}]`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    return {
      labels,
      uniqueCount: Object.keys(counts).length,
      sampleSize: rows.length,
    };
  });
}

export interface InconsistencyStats {
  total_pseudonymized: number;
  with_exposed_dob: number;
  with_exposed_phone: number;
  with_exposed_email: number;
}

/** Decisions that use bracket pseudonymization but ALSO have exposed PII */
export function getPseudoInconsistencies(): InconsistencyStats {
  return cachedSlow("pseudoInconsistencies", () => {
    const db = getDb();
    // Use _pseudo_flags for the pseudo check, _pseudo_cache for violation types
    const total = (db.prepare(`
      SELECT COUNT(*) as c FROM _pseudo_flags WHERE has_pseudo = 1
    `).get() as { c: number }).c;

    // Decisions with pseudo markers AND exposed PII (from violations cache)
    const dob = (db.prepare(`
      SELECT COUNT(*) as c FROM _pseudo_flags f
      JOIN _pseudo_cache c ON f.ecli = c.ecli
      WHERE f.has_pseudo = 1 AND c.types LIKE '%Geboortedatum%'
    `).get() as { c: number }).c;

    const phone = (db.prepare(`
      SELECT COUNT(*) as c FROM _pseudo_flags f
      JOIN _pseudo_cache c ON f.ecli = c.ecli
      WHERE f.has_pseudo = 1 AND (c.types LIKE '%Mobiel nummer%' OR c.types LIKE '%Vast nummer%')
    `).get() as { c: number }).c;

    const email = (db.prepare(`
      SELECT COUNT(*) as c FROM _pseudo_flags f
      JOIN _pseudo_cache c ON f.ecli = c.ecli
      WHERE f.has_pseudo = 1 AND c.types LIKE '%E-mailadres%'
    `).get() as { c: number }).c;

    return { total_pseudonymized: total, with_exposed_dob: dob, with_exposed_phone: phone, with_exposed_email: email };
  });
}
