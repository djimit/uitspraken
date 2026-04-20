import { getDb, cached } from "./db";
import type {
  Stats,
  TimelineEntry,
  CourtEntry,
  LegalAreaEntry,
  DecisionListItem,
  Decision,
  SearchResult,
  LegalArea,
  DecisionRelation,
  DecisionContributor,
  DecisionReference,
  JudgeEntry,
  ProcedureEntry,
  InhoudsindicatieStats,
  InhoudsindicatieByType,
  InhoudsindicatieByCourt,
  InhoudsindicatieByArea,
  InhoudsindicatieLengthBucket,
  InhoudsindicatieTimeline,
  InhoudsindicatieExample,
  OutcomeCount,
  CourtOutcome,
  LengthTrend,
  CompressionBucket,
  BigramEntry,
  LawReference,
  PipelineStats,
  DataCompletenessField,
  WeekdayDistribution,
  CourtTypeStats,
  CalendarDay,
  RelationStats,
  LatencyBucket,
  LatencyByCourt,
  LatencyTrend,
  StatsTrend,
  JudgeDetail,
  JudgeAreaEntry,
  JudgeCourtEntry,
  JudgeKPIs,
  TimelineYoYEntry,
  CrossTabEntry,
  CrossTabData,
} from "./types";

export interface Filters {
  court?: string;
  legalArea?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  procedure?: string;
}

/** Stable cache key from function name + filters */
function cacheKey(name: string, filters: Filters = {}, extra = ""): string {
  return `${name}:${JSON.stringify(filters)}:${extra}`;
}

function buildWhereClause(filters: Filters, prefix = "d"): { where: string; params: unknown[] } {
  const conditions: string[] = [`${prefix}.fetch_status = 'fetched'`];
  const params: unknown[] = [];

  if (filters.court) {
    conditions.push(`${prefix}.court_name = ?`);
    params.push(filters.court);
  }
  if (filters.type) {
    conditions.push(`${prefix}.decision_type = ?`);
    params.push(filters.type);
  }
  if (filters.procedure) {
    conditions.push(`${prefix}.procedure_type = ?`);
    params.push(filters.procedure);
  }
  if (filters.dateFrom) {
    conditions.push(`${prefix}.decision_date >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`${prefix}.decision_date <= ?`);
    params.push(filters.dateTo);
  }
  if (filters.legalArea) {
    conditions.push(
      `EXISTS (SELECT 1 FROM decision_legal_areas dla WHERE dla.ecli = ${prefix}.ecli AND dla.legal_area_name = ?)`
    );
    params.push(filters.legalArea);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export function getStats(filters: Filters = {}): Stats {
  return cached(cacheKey("stats", filters), () => _getStats(filters));
}

/** Try reading from the precomputed _stats_cache table (instant). */
function _tryStatsCache(key: string): string | null {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM _stats_cache WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  } catch { return null; }
}

function _getStats(filters: Filters): Stats {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  const hasFilters = params.length > 0;

  // Unfiltered: read from precomputed cache (instant!)
  if (!hasFilters) {
    const basicRaw = _tryStatsCache("basic_stats");
    if (basicRaw) {
      const basic = JSON.parse(basicRaw);
      const areaCount = parseInt(_tryStatsCache("legal_area_count") || "0");
      const judgeCount = parseInt(_tryStatsCache("judge_count") || "0");
      const refCount = parseInt(_tryStatsCache("reference_count") || "0");
      return {
        total: basic.total,
        fetched: basic.fetched,
        uitspraak_count: basic.uitspraak_count,
        conclusie_count: basic.conclusie_count,
        court_count: basic.court_count,
        legal_area_count: areaCount,
        judge_count: judgeCount,
        reference_count: refCount,
        date_min: basic.date_min,
        date_max: basic.date_max,
      };
    }
  }

  // Filtered: run live queries (fast with indexes for filtered subsets)
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN d.decision_type = 'Uitspraak' THEN 1 ELSE 0 END) as uitspraak_count,
      SUM(CASE WHEN d.decision_type = 'Conclusie' THEN 1 ELSE 0 END) as conclusie_count,
      COUNT(DISTINCT d.court_name) as court_count,
      MIN(d.decision_date) as date_min,
      MAX(d.decision_date) as date_max
    FROM decisions d ${where}
  `).get(...params) as {
    total: number; uitspraak_count: number; conclusie_count: number;
    court_count: number; date_min: string | null; date_max: string | null;
  };

  const extras = db.prepare(`
    SELECT 'areas' as k, COUNT(DISTINCT dla.legal_area_name) as c
      FROM decision_legal_areas dla JOIN decisions d ON d.ecli = dla.ecli ${where}
    UNION ALL
    SELECT 'judges', COUNT(DISTINCT dc.name)
      FROM decision_contributors dc JOIN decisions d ON d.ecli = dc.ecli ${where}
    UNION ALL
    SELECT 'refs', COUNT(*)
      FROM decision_references dr JOIN decisions d ON d.ecli = dr.ecli ${where}
    UNION ALL
    SELECT 'fetched', COUNT(*)
      FROM decisions WHERE fetch_status = 'fetched'
  `).all(...params, ...params, ...params) as { k: string; c: number }[];
  const extMap = Object.fromEntries(extras.map(r => [r.k, r.c]));

  return {
    total: row.total,
    fetched: extMap.fetched ?? 0,
    uitspraak_count: row.uitspraak_count,
    conclusie_count: row.conclusie_count,
    court_count: row.court_count,
    legal_area_count: extMap.areas ?? 0,
    judge_count: extMap.judges ?? 0,
    reference_count: extMap.refs ?? 0,
    date_min: row.date_min,
    date_max: row.date_max,
  };
}

export function getTimeline(filters: Filters = {}): TimelineEntry[] {
  return cached(cacheKey("timeline", filters), () => {
    const db = getDb();
    const { where, params } = buildWhereClause(filters);
    return db.prepare(
      `SELECT strftime('%Y-%m', decision_date) as period, COUNT(*) as count
       FROM decisions d ${where} AND decision_date IS NOT NULL
       GROUP BY period ORDER BY period`
    ).all(...params) as TimelineEntry[];
  });
}

export function getTimelineYoY(filters: Filters = {}): TimelineYoYEntry[] {
  return cached(cacheKey("timelineYoY", filters), () => _getTimelineYoY(filters));
}
function _getTimelineYoY(filters: Filters): TimelineYoYEntry[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);

  // Get the current timeline
  const current = db.prepare(
    `SELECT strftime('%Y-%m', decision_date) as period, COUNT(*) as count
     FROM decisions d ${where} AND decision_date IS NOT NULL
     GROUP BY period ORDER BY period`
  ).all(...params) as TimelineEntry[];

  // For each month, find the count from the same month one year ago
  // Build a lookup from the full unfiltered set (but respecting non-date filters)
  const noDateFilters: Filters = { ...filters, dateFrom: undefined, dateTo: undefined };
  const { where: w2, params: p2 } = buildWhereClause(noDateFilters);
  const allMonths = db.prepare(
    `SELECT strftime('%Y-%m', decision_date) as period, COUNT(*) as count
     FROM decisions d ${w2} AND decision_date IS NOT NULL
     GROUP BY period ORDER BY period`
  ).all(...p2) as TimelineEntry[];

  const lookup = new Map(allMonths.map(r => [r.period, r.count]));

  return current.map(r => {
    const [y, m] = r.period.split("-");
    const prevPeriod = `${Number(y) - 1}-${m}`;
    return {
      period: r.period,
      count: r.count,
      prev_count: lookup.get(prevPeriod) ?? 0,
    };
  });
}

export function getCourtBreakdown(filters: Filters = {}, limit = 20): CourtEntry[] {
  return cached(cacheKey("courts", filters, String(limit)), () => {
    const db = getDb();
    const { where, params } = buildWhereClause(filters);
    return db.prepare(
      `SELECT court_name, COUNT(*) as count FROM decisions d ${where} AND court_name IS NOT NULL
       GROUP BY court_name ORDER BY count DESC LIMIT ?`
    ).all(...params, limit) as CourtEntry[];
  });
}

export function getLegalAreaBreakdown(filters: Filters = {}, limit = 20): LegalAreaEntry[] {
  return cached(cacheKey("areas", filters, String(limit)), () => {
    const db = getDb();
    const { where, params } = buildWhereClause(filters);
    return db.prepare(
      `SELECT dla.legal_area_name, COUNT(*) as count
       FROM decision_legal_areas dla JOIN decisions d ON d.ecli = dla.ecli ${where}
       GROUP BY dla.legal_area_name ORDER BY count DESC LIMIT ?`
    ).all(...params, limit) as LegalAreaEntry[];
  });
}

const VALID_SORT_COLUMNS: Record<string, string> = {
  decision_date: "d.decision_date",
  court_name: "d.court_name",
  decision_type: "d.decision_type",
  procedure_type: "d.procedure_type",
  issued_date: "d.issued_date",
};

const SELECT_COLS = `d.ecli, d.title, d.summary, d.decision_type, d.decision_date, d.court_name, d.procedure_type, d.inhoudsindicatie, d.alternative_title, d.case_number, d.issued_date`;

export function searchDecisions(
  query: string | undefined,
  filters: Filters = {},
  page = 1,
  pageSize = 25,
  sort = "decision_date",
  sortDir: "asc" | "desc" = "desc",
): SearchResult {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  const orderCol = VALID_SORT_COLUMNS[sort] || "d.decision_date";
  const orderDir = sortDir === "asc" ? "ASC" : "DESC";
  const orderClause = `ORDER BY ${orderCol} IS NULL, ${orderCol} ${orderDir}`;

  if (query && query.trim()) {
    // FTS search — quote each term to avoid FTS5 syntax errors with special chars like ':'
    const ftsQuery = query
      .trim()
      .split(/\s+/)
      .map((term) => `"${term.replace(/"/g, '""')}"`)
      .join(" ");
    const { where, params } = buildWhereClause(filters);
    const ftsCondition = where ? `${where} AND d.ecli IN (SELECT ecli FROM decisions_fts WHERE decisions_fts MATCH ?)` : `WHERE d.ecli IN (SELECT ecli FROM decisions_fts WHERE decisions_fts MATCH ?)`;
    const allParams = [...params, ftsQuery];

    const total = db
      .prepare(`SELECT COUNT(*) as c FROM decisions d ${ftsCondition}`)
      .get(...allParams) as { c: number };

    const results = db
      .prepare(
        `SELECT ${SELECT_COLS}
         FROM decisions d ${ftsCondition}
         ${orderClause} LIMIT ? OFFSET ?`
      )
      .all(...allParams, pageSize, offset) as DecisionListItem[];

    return { results, total: total.c, page, pageSize };
  } else {
    const { where, params } = buildWhereClause(filters);

    const total = db
      .prepare(`SELECT COUNT(*) as c FROM decisions d ${where}`)
      .get(...params) as { c: number };

    const results = db
      .prepare(
        `SELECT ${SELECT_COLS}
         FROM decisions d ${where}
         ${orderClause} LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as DecisionListItem[];

    return { results, total: total.c, page, pageSize };
  }
}

export function getDecision(ecli: string): Decision | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT ecli, title, summary, decision_type, decision_date, issued_date, modified_date,
              court_identifier, court_name, court_division, case_number, procedure_type, coverage,
              alternative_title, spatial, temporal_start, temporal_end, public_url,
              replaces, is_replaced_by, access_rights,
              body_text, inhoudsindicatie, fetch_status
       FROM decisions WHERE ecli = ?`
    )
    .get(ecli) as Decision | undefined;
  return row || null;
}

export function getDecisionLegalAreas(ecli: string): LegalArea[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM decision_legal_areas WHERE ecli = ?")
    .all(ecli) as LegalArea[];
}

export function getDecisionRelations(ecli: string): DecisionRelation[] {
  const db = getDb();
  return db
    .prepare("SELECT related_ecli, relation_type, relation_aanleg, relation_gevolg, label FROM decision_relations WHERE ecli = ?")
    .all(ecli) as DecisionRelation[];
}

export function getDecisionContributors(ecli: string): DecisionContributor[] {
  const db = getDb();
  return db
    .prepare("SELECT name, role FROM decision_contributors WHERE ecli = ?")
    .all(ecli) as DecisionContributor[];
}

export function getDecisionReferences(ecli: string): DecisionReference[] {
  const db = getDb();
  return db
    .prepare("SELECT reference_type, identifier, label FROM decision_references WHERE ecli = ?")
    .all(ecli) as DecisionReference[];
}

export function getDecisionVindplaatsen(ecli: string): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT vindplaats FROM decision_vindplaatsen WHERE ecli = ?")
    .all(ecli) as { vindplaats: string }[];
  return rows.map(r => r.vindplaats);
}

export function getTopJudges(limit = 20): JudgeEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT dc.name, COUNT(*) as count FROM decision_contributors dc
       JOIN decisions d ON d.ecli = dc.ecli WHERE d.fetch_status = 'fetched'
       GROUP BY dc.name ORDER BY count DESC LIMIT ?`
    )
    .all(limit) as JudgeEntry[];
}

export function getProcedureBreakdown(filters: Filters = {}, limit = 20): ProcedureEntry[] { return cached(cacheKey("procs", filters, String(limit)), () => _getProcedureBreakdown(filters, limit)); } function _getProcedureBreakdown(filters: Filters, limit: number): ProcedureEntry[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db
    .prepare(
      `SELECT procedure_type, COUNT(*) as count FROM decisions d ${where} AND procedure_type IS NOT NULL
       GROUP BY procedure_type ORDER BY count DESC LIMIT ?`
    )
    .all(...params, limit) as ProcedureEntry[];
}

export function getRecentDecisions(filters: Filters = {}, limit = 10): DecisionListItem[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db
    .prepare(
      `SELECT d.ecli, d.title, d.summary, d.decision_type, d.decision_date, d.court_name, d.procedure_type, d.inhoudsindicatie, d.alternative_title
       FROM decisions d ${where} AND d.decision_date IS NOT NULL
       ORDER BY d.decision_date DESC LIMIT ?`
    )
    .all(...params, limit) as DecisionListItem[];
}

export function getCourts(): CourtEntry[] { return cached("allCourts", () => _getCourts()); } function _getCourts(): CourtEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT court_name, COUNT(*) as count FROM decisions
       WHERE court_name IS NOT NULL
       GROUP BY court_name ORDER BY court_name`
    )
    .all() as CourtEntry[];
}

export function getLegalAreas(): LegalAreaEntry[] { return cached("allAreas", () => _getLegalAreas()); } function _getLegalAreas(): LegalAreaEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT legal_area_name, COUNT(*) as count FROM decision_legal_areas
       GROUP BY legal_area_name ORDER BY legal_area_name`
    )
    .all() as LegalAreaEntry[];
}

// ─── Inhoudsindicatie analysis queries (all read from pre-computed cache) ──

export function getInhoudsindicatieStats(): InhoudsindicatieStats {
  return cached("iiStats", () => {
    const raw = _readIICache("ii_stats");
    if (raw) return JSON.parse(raw) as InhoudsindicatieStats;
    // Fallback: minimal query
    const db = getDb();
    return db.prepare(`
      SELECT COUNT(*) as total_decisions, 0 as with_inhoudsindicatie,
        0 as without_inhoudsindicatie, 0 as coverage_pct,
        0 as avg_length, 0 as min_length, 0 as max_length, 0 as median_length
      FROM decisions WHERE fetch_status = 'fetched'
    `).get() as InhoudsindicatieStats;
  });
}

export function getInhoudsindicatieByType(): InhoudsindicatieByType[] {
  return cached("iiByType", () => {
    const raw = _readIICache("ii_by_type");
    if (raw) return JSON.parse(raw) as InhoudsindicatieByType[];
    return [];
  });
}

export function getInhoudsindicatieByCourt(limit = 20): InhoudsindicatieByCourt[] {
  return cached("iiByCourt", () => {
    const raw = _readIICache("ii_by_court");
    if (raw) return (JSON.parse(raw) as InhoudsindicatieByCourt[]).slice(0, limit);
    return [];
  });
}

export function getInhoudsindicatieByArea(limit = 20): InhoudsindicatieByArea[] {
  return cached("iiByArea", () => {
    const raw = _readIICache("ii_by_area");
    if (raw) return (JSON.parse(raw) as InhoudsindicatieByArea[]).slice(0, limit);
    return [];
  });
}

export function getInhoudsindicatieLengthDistribution(): InhoudsindicatieLengthBucket[] {
  return cached("iiLengthDist", () => {
    const raw = _readIICache("ii_length_distribution");
    if (raw) return JSON.parse(raw) as InhoudsindicatieLengthBucket[];
    return [];
  });
}

export function getInhoudsindicatieTimeline(): InhoudsindicatieTimeline[] {
  return cached("iiTimeline", () => {
    const raw = _readIICache("ii_timeline");
    if (raw) return JSON.parse(raw) as InhoudsindicatieTimeline[];
    return [];
  });
}

export function getInhoudsindicatieExamples(
  sort: "longest" | "shortest" = "longest",
  limit = 10
): InhoudsindicatieExample[] {
  return cached(`iiExamples_${sort}`, () => {
    const key = sort === "longest" ? "ii_examples_longest" : "ii_examples_shortest";
    const raw = _readIICache(key);
    if (raw) return (JSON.parse(raw) as InhoudsindicatieExample[]).slice(0, limit);
    return [];
  });
}

// ─── Pre-computed inhoudsindicatie analysis ───────────────────────
// Heavy text scanning (LIKE patterns, word freq, bigrams, compression)
// is now done once by the Python importer and stored in _ii_analysis_cache.
// Dashboard reads JSON results instantly from the cache table.

// ── Pre-computed II analysis (reads from _ii_analysis_cache table) ──
// The importer pre-computes outcomes, court outcomes, law refs, word freq,
// bigrams, and compression ratios in a single Python pass (~3s) and stores
// the JSON results.  Reading from cache is instant (<1ms).

function _readIICache(key: string): string | null {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM _ii_analysis_cache WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  } catch { return null; }
}

export function getInhoudsindicatieWordFrequency(limit = 30): { word: string; count: number }[] {
  return cached("iiWordFreq", () => {
    const raw = _readIICache("word_frequency");
    if (!raw) return [];
    const all = JSON.parse(raw) as { word: string; count: number }[];
    return all.slice(0, limit);
  });
}

export function getOutcomeDistribution(): OutcomeCount[] {
  return cached("iiOutcomes", () => {
    const raw = _readIICache("outcomes");
    if (!raw) return [];
    return JSON.parse(raw) as OutcomeCount[];
  });
}

export function getCourtOutcomes(limit = 15): CourtOutcome[] {
  return cached("iiCourtOutcomes", () => {
    const raw = _readIICache("court_outcomes");
    if (!raw) return [];
    const all = JSON.parse(raw) as CourtOutcome[];
    return all.slice(0, limit);
  });
}

export function getLengthTrend(): LengthTrend[] {
  return cached("iiLengthTrend", () => {
    const raw = _readIICache("ii_length_trend");
    if (raw) return JSON.parse(raw) as LengthTrend[];
    return [];
  });
}

export function getCompressionRatio(): CompressionBucket[] {
  return cached("iiCompression", () => {
    const raw = _readIICache("compression_ratio");
    if (raw) return JSON.parse(raw) as CompressionBucket[];
    // Fallback: use pre-computed body_text_length column (fast, no LENGTH() scan)
    const db = getDb();
    return db.prepare(`
      SELECT
        CASE
          WHEN body_text_length < 5000 THEN 'Kort (< 5K)'
          WHEN body_text_length < 15000 THEN 'Middel (5–15K)'
          WHEN body_text_length < 40000 THEN 'Lang (15–40K)'
          ELSE 'Zeer lang (40K+)'
        END as body_category,
        COUNT(*) as count,
        CAST(AVG(LENGTH(inhoudsindicatie)) AS INT) as avg_ii_length,
        CAST(AVG(body_text_length) AS INT) as avg_body_length,
        ROUND(AVG(100.0 * LENGTH(inhoudsindicatie) / body_text_length), 2) as ratio_pct
      FROM decisions
      WHERE fetch_status = 'fetched'
        AND inhoudsindicatie IS NOT NULL AND inhoudsindicatie != ''
        AND body_text_length > 0
      GROUP BY body_category
      ORDER BY MIN(body_text_length)
    `).all() as CompressionBucket[];
  });
}

export function getBigramFrequency(limit = 25): BigramEntry[] {
  return cached("iiBigrams", () => {
    const raw = _readIICache("bigram_frequency");
    if (!raw) return [];
    const all = JSON.parse(raw) as BigramEntry[];
    return all.slice(0, limit);
  });
}

export function getLawReferences(): LawReference[] {
  return cached("iiLawRefs", () => {
    const raw = _readIICache("law_references");
    if (!raw) return [];
    return JSON.parse(raw) as LawReference[];
  });
}

// ─── Enhanced overview queries ─────────────────────────────────────

export function getPipelineStats(): PipelineStats {
  const db = getDb();
  const statuses = db.prepare(
    "SELECT fetch_status, COUNT(*) as c FROM decisions GROUP BY fetch_status"
  ).all() as { fetch_status: string; c: number }[];

  const statusMap: Record<string, number> = {};
  let total = 0;
  for (const s of statuses) {
    statusMap[s.fetch_status] = s.c;
    total += s.c;
  }

  const dbSize = db.prepare(
    "SELECT page_count * page_size / 1048576.0 as mb FROM pragma_page_count(), pragma_page_size()"
  ).get() as { mb: number };

  const courts = db.prepare("SELECT COUNT(*) as c FROM courts").get() as { c: number };
  const areas = db.prepare("SELECT COUNT(*) as c FROM legal_areas").get() as { c: number };
  const procs = db.prepare("SELECT COUNT(*) as c FROM procedure_types").get() as { c: number };

  return {
    fetched: statusMap["fetched"] ?? 0,
    pending: statusMap["pending"] ?? 0,
    no_content: statusMap["no_content"] ?? 0,
    failed: statusMap["failed"] ?? 0,
    total,
    pct_complete: total > 0 ? Math.round((100 * (statusMap["fetched"] ?? 0)) / total) : 0,
    db_size_mb: Math.round(dbSize.mb * 10) / 10,
    courts_ref: courts.c,
    legal_areas_ref: areas.c,
    procedure_types_ref: procs.c,
  };
}

// Allowed column names for data completeness — prevents SQL injection
const COMPLETENESS_FIELDS: readonly { col: string; label: string; checkEmpty: boolean }[] = [
  { col: "decision_date", label: "Beslisdatum", checkEmpty: false },
  { col: "court_name", label: "Instantie", checkEmpty: false },
  { col: "decision_type", label: "Type", checkEmpty: false },
  { col: "body_text", label: "Uitspraaktekst", checkEmpty: true },
  { col: "procedure_type", label: "Proceduresoort", checkEmpty: false },
  { col: "inhoudsindicatie", label: "Inhoudsindicatie", checkEmpty: true },
  { col: "spatial", label: "Zittingsplaats", checkEmpty: false },
  { col: "case_number", label: "Zaaknummer", checkEmpty: false },
  { col: "summary", label: "Samenvatting", checkEmpty: true },
] as const;

export function getDataCompleteness(): DataCompletenessField[] {
  const db = getDb();

  const total = (db.prepare(
    "SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'fetched'"
  ).get() as { c: number }).c;

  // Build one query that counts all fields in a single pass (avoids N+1 queries too)
  const selectParts = COMPLETENESS_FIELDS.map(({ col, checkEmpty }) => {
    // Column names are from the hardcoded allowlist above — safe to interpolate
    const cond = checkEmpty
      ? `${col} IS NOT NULL AND ${col} != ''`
      : `${col} IS NOT NULL`;
    return `SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END) as "${col}"`;
  });

  const row = db.prepare(`
    SELECT ${selectParts.join(", ")}
    FROM decisions WHERE fetch_status = 'fetched'
  `).get() as Record<string, number>;

  return COMPLETENESS_FIELDS.map(({ col, label }) => {
    const filled = row[col] ?? 0;
    return { field: col, label, filled, total, pct: total > 0 ? Math.round((1000 * filled) / total) / 10 : 0 };
  });
}

export function getWeekdayDistribution(filters: Filters = {}): WeekdayDistribution[] { return cached(cacheKey("weekday", filters), () => _getWeekdayDistribution(filters)); } function _getWeekdayDistribution(filters: Filters): WeekdayDistribution[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
  const rows = db.prepare(`
    SELECT CAST(strftime('%w', decision_date) AS INT) as day_index, COUNT(*) as count
    FROM decisions d ${where} AND decision_date IS NOT NULL
    GROUP BY day_index ORDER BY day_index
  `).all(...params) as { day_index: number; count: number }[];

  return rows.map(r => ({ day: dayNames[r.day_index], count: r.count, day_index: r.day_index }));
}

export function getCourtTypeStats(filters: Filters = {}): CourtTypeStats[] { return cached(cacheKey("courtType", filters), () => _getCourtTypeStats(filters)); } function _getCourtTypeStats(filters: Filters): CourtTypeStats[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT
      CASE WHEN d.court_name LIKE 'Hoge Raad%' THEN 'Hoge Raad'
           WHEN d.court_name LIKE 'Gerechtshof%' THEN 'Gerechtshoven'
           WHEN d.court_name LIKE 'Rechtbank%' THEN 'Rechtbanken'
           WHEN d.court_name LIKE 'Raad van State%' THEN 'Raad van State'
           WHEN d.court_name LIKE 'Centrale Raad%' THEN 'CRvB'
           WHEN d.court_name LIKE 'Parket%' OR d.court_name LIKE 'College%' THEN 'Overige rechtscolleges'
           ELSE 'Overig' END as court_type,
      COUNT(*) as count,
      0 as avg_body_length,
      0 as avg_ii_length
    FROM decisions d ${where} AND d.court_name IS NOT NULL
    GROUP BY court_type ORDER BY count DESC
  `).all(...params) as CourtTypeStats[];
}

export function getCalendarData(filters: Filters = {}): CalendarDay[] { return cached(cacheKey("calendar", filters), () => _getCalendarData(filters)); } function _getCalendarData(filters: Filters): CalendarDay[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT d.decision_date as date, COUNT(*) as count
    FROM decisions d ${where} AND d.decision_date IS NOT NULL
    GROUP BY d.decision_date ORDER BY d.decision_date
  `).all(...params) as CalendarDay[];
}

export function getCrossTab(filters: Filters = {}, rowLimit = 10, colLimit = 10): CrossTabData { return cached(cacheKey("crossTab", filters, `${rowLimit}:${colLimit}`), () => _getCrossTab(filters, rowLimit, colLimit)); } function _getCrossTab(filters: Filters, rowLimit: number, colLimit: number): CrossTabData {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);

  const topCourts = db.prepare(`
    SELECT court_name, COUNT(*) as c FROM decisions d ${where} AND court_name IS NOT NULL
    GROUP BY court_name ORDER BY c DESC LIMIT ?
  `).all(...params, rowLimit) as { court_name: string; c: number }[];

  const topAreas = db.prepare(`
    SELECT dla.legal_area_name, COUNT(*) as c
    FROM decision_legal_areas dla JOIN decisions d ON d.ecli = dla.ecli ${where}
    GROUP BY dla.legal_area_name ORDER BY c DESC LIMIT ?
  `).all(...params, colLimit) as { legal_area_name: string; c: number }[];

  const rows = topCourts.map(r => r.court_name);
  const cols = topAreas.map(r => r.legal_area_name);

  if (!rows.length || !cols.length) {
    return { entries: [], rows: [], cols: [], maxCount: 0 };
  }

  const rowPh = rows.map(() => "?").join(",");
  const colPh = cols.map(() => "?").join(",");

  const entries = db.prepare(`
    SELECT d.court_name as row, dla.legal_area_name as col, COUNT(*) as count
    FROM decisions d
    JOIN decision_legal_areas dla ON d.ecli = dla.ecli
    ${where}
    AND d.court_name IN (${rowPh})
    AND dla.legal_area_name IN (${colPh})
    GROUP BY d.court_name, dla.legal_area_name
  `).all(...params, ...rows, ...cols) as CrossTabEntry[];

  const maxCount = entries.reduce((m, e) => Math.max(m, e.count), 0);

  return { entries, rows, cols, maxCount };
}

export function getRelationStats(): RelationStats {
  const db = getDb();
  const withRel = db.prepare("SELECT COUNT(DISTINCT ecli) as c FROM decision_relations").get() as { c: number };
  const totalRel = db.prepare("SELECT COUNT(*) as c FROM decision_relations").get() as { c: number };

  const RELATION_LABELS: Record<string, string> = {
    "http://psi.rechtspraak.nl/hogerBeroep": "Hoger beroep",
    "http://psi.rechtspraak.nl/conclusie": "Conclusie",
    "http://psi.rechtspraak.nl/cassatie": "Cassatie",
    "http://psi.rechtspraak.nl/tussenuitspraak": "Tussenuitspraak",
    "http://psi.rechtspraak.nl/herziening": "Herziening",
    "http://psi.rechtspraak.nl/sprongcassatie": "Sprongcassatie",
    "http://psi.rechtspraak.nl/prejudicieleVraag": "Prejudiciele vraag",
  };

  const byType = db.prepare(
    "SELECT relation_type as type, COUNT(*) as count FROM decision_relations GROUP BY relation_type ORDER BY count DESC LIMIT 8"
  ).all() as { type: string; count: number }[];

  return {
    decisions_with_relations: withRel.c,
    total_relations: totalRel.c,
    by_type: byType.map(r => ({
      type: RELATION_LABELS[r.type] || r.type.replace(/.*\//, ""),
      count: r.count,
    })),
  };
}

// ─── Decision latency queries ─────────────────────────────────────

export function getLatencyDistribution(filters: Filters = {}): LatencyBucket[] { return cached(cacheKey("latDist", filters), () => _getLatencyDistribution(filters)); } function _getLatencyDistribution(filters: Filters): LatencyBucket[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT
      CASE
        WHEN julianday(issued_date) - julianday(decision_date) < 0 THEN 'Negatief'
        WHEN julianday(issued_date) - julianday(decision_date) < 7 THEN '< 1 week'
        WHEN julianday(issued_date) - julianday(decision_date) < 14 THEN '1-2 weken'
        WHEN julianday(issued_date) - julianday(decision_date) < 30 THEN '2-4 weken'
        WHEN julianday(issued_date) - julianday(decision_date) < 90 THEN '1-3 maanden'
        WHEN julianday(issued_date) - julianday(decision_date) < 180 THEN '3-6 maanden'
        WHEN julianday(issued_date) - julianday(decision_date) < 365 THEN '6-12 maanden'
        ELSE '> 1 jaar'
      END as bucket,
      COUNT(*) as count,
      CASE
        WHEN julianday(issued_date) - julianday(decision_date) < 0 THEN -1
        WHEN julianday(issued_date) - julianday(decision_date) < 7 THEN 0
        WHEN julianday(issued_date) - julianday(decision_date) < 14 THEN 1
        WHEN julianday(issued_date) - julianday(decision_date) < 30 THEN 2
        WHEN julianday(issued_date) - julianday(decision_date) < 90 THEN 3
        WHEN julianday(issued_date) - julianday(decision_date) < 180 THEN 4
        WHEN julianday(issued_date) - julianday(decision_date) < 365 THEN 5
        ELSE 6
      END as sort_key
    FROM decisions d ${where}
      AND d.decision_date IS NOT NULL AND d.issued_date IS NOT NULL
    GROUP BY sort_key ORDER BY sort_key
  `).all(...params) as LatencyBucket[];
}

export function getLatencyByCourt(filters: Filters = {}, limit = 20): LatencyByCourt[] { return cached(cacheKey("latCourt", filters, String(limit)), () => _getLatencyByCourt(filters, limit)); } function _getLatencyByCourt(filters: Filters, limit: number): LatencyByCourt[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT court_name,
      CAST(AVG(julianday(issued_date) - julianday(decision_date)) AS INT) as avg_days,
      CAST(AVG(julianday(issued_date) - julianday(decision_date)) AS INT) as median_days,
      COUNT(*) as count
    FROM decisions d ${where}
      AND d.decision_date IS NOT NULL AND d.issued_date IS NOT NULL AND d.court_name IS NOT NULL
      AND julianday(issued_date) - julianday(decision_date) >= 0
    GROUP BY court_name
    HAVING COUNT(*) >= 10
    ORDER BY avg_days DESC LIMIT ?
  `).all(...params, limit) as LatencyByCourt[];
}

export function getLatencyTrend(filters: Filters = {}): LatencyTrend[] { return cached(cacheKey("latTrend", filters), () => _getLatencyTrend(filters)); } function _getLatencyTrend(filters: Filters): LatencyTrend[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT strftime('%Y-%m', decision_date) as period,
      CAST(AVG(julianday(issued_date) - julianday(decision_date)) AS INT) as avg_days,
      COUNT(*) as count
    FROM decisions d ${where}
      AND d.decision_date IS NOT NULL AND d.issued_date IS NOT NULL
      AND julianday(issued_date) - julianday(decision_date) >= 0
    GROUP BY period ORDER BY period
  `).all(...params) as LatencyTrend[];
}

// ─── Trend delta queries ──────────────────────────────────────────

export function getStatsTrend(filters: Filters = {}): StatsTrend { return cached(cacheKey("statsTrend", filters), () => _getStatsTrend(filters)); } function _getStatsTrend(filters: Filters): StatsTrend {
  const db = getDb();
  // Find the date range of filtered data to compute "previous equivalent period"
  const { where, params } = buildWhereClause(filters);

  const range = db.prepare(`
    SELECT MIN(decision_date) as dmin, MAX(decision_date) as dmax
    FROM decisions d ${where} AND decision_date IS NOT NULL
  `).get(...params) as { dmin: string | null; dmax: string | null };

  if (!range.dmin || !range.dmax) {
    return {
      total: { current: 0, previous: 0, delta_pct: 0 },
      uitspraken: { current: 0, previous: 0, delta_pct: 0 },
      conclusies: { current: 0, previous: 0, delta_pct: 0 },
    };
  }

  // Use previous month vs current month for comparison
  const now = range.dmax;
  const curMonth = now.slice(0, 7);
  const [y, m] = curMonth.split("-").map(Number);
  const prevMonth = m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;

  function countForMonth(month: string, type?: string): number {
    const extra = type ? ` AND d.decision_type = '${type}'` : "";
    const row = db.prepare(`
      SELECT COUNT(*) as c FROM decisions d ${where}
        AND strftime('%Y-%m', d.decision_date) = ?${extra}
    `).get(...params, month) as { c: number };
    return row.c;
  }

  function makeDelta(current: number, previous: number) {
    return {
      current,
      previous,
      delta_pct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0,
    };
  }

  return {
    total: makeDelta(countForMonth(curMonth), countForMonth(prevMonth)),
    uitspraken: makeDelta(countForMonth(curMonth, "Uitspraak"), countForMonth(prevMonth, "Uitspraak")),
    conclusies: makeDelta(countForMonth(curMonth, "Conclusie"), countForMonth(prevMonth, "Conclusie")),
  };
}

// ─── Judge analytics queries ──────────────────────────────────────

export function getJudgeDetails(filters: Filters = {}, limit = 50): JudgeDetail[] { return cached(cacheKey("judgeDetails", filters, String(limit)), () => _getJudgeDetails(filters, limit)); } function _getJudgeDetails(filters: Filters, limit: number): JudgeDetail[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);

  // Single query: get top judges with aggregated areas and courts (no N+1)
  const rows = db.prepare(`
    SELECT dc.name,
      COUNT(DISTINCT dc.ecli) as count,
      SUM(CASE WHEN d.decision_type = 'Uitspraak' THEN 1 ELSE 0 END) as uitspraken,
      SUM(CASE WHEN d.decision_type = 'Conclusie' THEN 1 ELSE 0 END) as conclusies,
      GROUP_CONCAT(DISTINCT d.court_name) as courts_csv
    FROM decision_contributors dc
    JOIN decisions d ON d.ecli = dc.ecli
    ${where}
    GROUP BY dc.name
    ORDER BY count DESC
    LIMIT ?
  `).all(...params, limit) as { name: string; count: number; uitspraken: number; conclusies: number; courts_csv: string | null }[];

  // Batch-fetch areas for all top judges at once
  const names = rows.map(r => r.name);
  const areaMap = new Map<string, string[]>();
  if (names.length > 0) {
    const ph = names.map(() => "?").join(",");
    const areaRows = db.prepare(`
      SELECT dc.name, dla.legal_area_name
      FROM decision_contributors dc
      JOIN decision_legal_areas dla ON dla.ecli = dc.ecli
      WHERE dc.name IN (${ph})
      GROUP BY dc.name, dla.legal_area_name
    `).all(...names) as { name: string; legal_area_name: string }[];
    for (const r of areaRows) {
      const existing = areaMap.get(r.name) || [];
      if (existing.length < 5) existing.push(r.legal_area_name);
      areaMap.set(r.name, existing);
    }
  }

  return rows.map(r => ({
    ...r,
    areas: areaMap.get(r.name) || [],
    courts: r.courts_csv ? r.courts_csv.split(",").slice(0, 3) : [],
  }));
}

export function getJudgesByArea(filters: Filters = {}, limit = 15): JudgeAreaEntry[] { return cached(cacheKey("judgeArea", filters, String(limit)), () => _getJudgesByArea(filters, limit)); } function _getJudgesByArea(filters: Filters, limit: number): JudgeAreaEntry[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT dla.legal_area_name,
      COUNT(DISTINCT dc.name) as judge_count,
      COUNT(*) as decision_count
    FROM decision_contributors dc
    JOIN decisions d ON d.ecli = dc.ecli
    JOIN decision_legal_areas dla ON dla.ecli = dc.ecli
    ${where}
    GROUP BY dla.legal_area_name
    ORDER BY judge_count DESC
    LIMIT ?
  `).all(...params, limit) as JudgeAreaEntry[];
}

export function getJudgesByCourt(filters: Filters = {}, limit = 15): JudgeCourtEntry[] { return cached(cacheKey("judgeCourt", filters, String(limit)), () => _getJudgesByCourt(filters, limit)); } function _getJudgesByCourt(filters: Filters, limit: number): JudgeCourtEntry[] {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  return db.prepare(`
    SELECT d.court_name,
      COUNT(DISTINCT dc.name) as judge_count,
      COUNT(*) as decision_count
    FROM decision_contributors dc
    JOIN decisions d ON d.ecli = dc.ecli
    ${where} AND d.court_name IS NOT NULL
    GROUP BY d.court_name
    ORDER BY judge_count DESC
    LIMIT ?
  `).all(...params, limit) as JudgeCourtEntry[];
}

export function getJudgeKPIs(filters: Filters = {}): JudgeKPIs { return cached(cacheKey("judgeKPIs", filters), () => _getJudgeKPIs(filters)); } function _getJudgeKPIs(filters: Filters): JudgeKPIs {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);

  const counts = db.prepare(`
    SELECT
      COUNT(DISTINCT dc.name) as active_judges,
      COUNT(*) as total_cases,
      SUM(CASE WHEN d.decision_type = 'Conclusie' THEN 1 ELSE 0 END) as conclusies
    FROM decision_contributors dc
    JOIN decisions d ON d.ecli = dc.ecli
    ${where}
  `).get(...params) as { active_judges: number; total_cases: number; conclusies: number };

  const topAreas = db.prepare(`
    SELECT dla.legal_area_name, COUNT(DISTINCT dc.name) as jc
    FROM decision_contributors dc
    JOIN decisions d ON d.ecli = dc.ecli
    JOIN decision_legal_areas dla ON dla.ecli = dc.ecli
    ${where}
    GROUP BY dla.legal_area_name ORDER BY jc DESC LIMIT 3
  `).all(...params) as { legal_area_name: string }[];

  return {
    active_judges: counts.active_judges,
    avg_cases_per_judge: counts.active_judges > 0
      ? Math.round(counts.total_cases / counts.active_judges)
      : 0,
    conclusie_ratio: counts.total_cases > 0
      ? Math.round((100 * counts.conclusies) / counts.total_cases)
      : 0,
    top_areas: topAreas.map(a => a.legal_area_name),
  };
}

// ─── Bulk export query ────────────────────────────────────────────

export function exportDecisions(
  query: string | undefined,
  filters: Filters = {},
  maxRows = 10000
): DecisionListItem[] {
  const db = getDb();

  if (query && query.trim()) {
    const ftsQuery = query.trim().split(/\s+/).map(t => `"${t.replace(/"/g, '""')}"`).join(" ");
    const { where, params } = buildWhereClause(filters);
    const ftsCondition = where
      ? `${where} AND d.ecli IN (SELECT ecli FROM decisions_fts WHERE decisions_fts MATCH ?)`
      : `WHERE d.ecli IN (SELECT ecli FROM decisions_fts WHERE decisions_fts MATCH ?)`;

    return db.prepare(`
      SELECT d.ecli, d.title, d.summary, d.decision_type, d.decision_date, d.court_name, d.procedure_type, d.inhoudsindicatie, d.alternative_title
      FROM decisions d ${ftsCondition}
      ORDER BY d.decision_date DESC LIMIT ?
    `).all(...params, ftsQuery, maxRows) as DecisionListItem[];
  } else {
    const { where, params } = buildWhereClause(filters);
    return db.prepare(`
      SELECT d.ecli, d.title, d.summary, d.decision_type, d.decision_date, d.court_name, d.procedure_type, d.inhoudsindicatie, d.alternative_title
      FROM decisions d ${where}
      ORDER BY d.decision_date DESC LIMIT ?
    `).all(...params, maxRows) as DecisionListItem[];
  }
}
