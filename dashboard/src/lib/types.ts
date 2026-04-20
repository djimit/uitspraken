export interface Decision {
  ecli: string;
  title: string | null;
  summary: string | null;
  decision_type: string | null;
  decision_date: string | null;
  issued_date: string | null;
  modified_date: string | null;
  court_identifier: string | null;
  court_name: string | null;
  court_division: string | null;
  case_number: string | null;
  procedure_type: string | null;
  coverage: string | null;
  alternative_title: string | null;
  spatial: string | null;
  temporal_start: string | null;
  temporal_end: string | null;
  public_url: string | null;
  replaces: string | null;
  is_replaced_by: string | null;
  access_rights: string | null;
  body_text: string | null;
  inhoudsindicatie: string | null;
  fetch_status: string;
}

export interface DecisionListItem {
  ecli: string;
  title: string | null;
  summary: string | null;
  decision_type: string | null;
  decision_date: string | null;
  court_name: string | null;
  procedure_type: string | null;
  inhoudsindicatie: string | null;
  alternative_title: string | null;
  case_number: string | null;
  issued_date: string | null;
}

export interface Stats {
  total: number;
  fetched: number;
  uitspraak_count: number;
  conclusie_count: number;
  court_count: number;
  legal_area_count: number;
  judge_count: number;
  reference_count: number;
  date_min: string | null;
  date_max: string | null;
}

export interface TimelineEntry {
  period: string;
  count: number;
}

export interface CourtEntry {
  court_name: string;
  count: number;
}

export interface LegalAreaEntry {
  legal_area_name: string;
  count: number;
}

export interface SearchResult {
  results: DecisionListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LegalArea {
  ecli: string;
  legal_area_identifier: string;
  legal_area_name: string;
}

export interface DecisionRelation {
  related_ecli: string | null;
  relation_type: string | null;
  relation_aanleg: string | null;
  relation_gevolg: string | null;
  label: string | null;
}

export interface DecisionContributor {
  name: string;
  role: string | null;
}

export interface DecisionReference {
  reference_type: string | null;
  identifier: string | null;
  label: string | null;
}

export interface JudgeEntry {
  name: string;
  count: number;
}

export interface ProcedureEntry {
  procedure_type: string;
  count: number;
}

// Inhoudsindicatie analysis types
export interface InhoudsindicatieStats {
  total_decisions: number;
  with_inhoudsindicatie: number;
  without_inhoudsindicatie: number;
  coverage_pct: number;
  avg_length: number;
  median_length: number;
  min_length: number;
  max_length: number;
}

export interface InhoudsindicatieByType {
  decision_type: string;
  total: number;
  with_ii: number;
  pct: number;
  avg_length: number;
}

export interface InhoudsindicatieByCourt {
  court_name: string;
  total: number;
  with_ii: number;
  pct: number;
  avg_length: number;
}

export interface InhoudsindicatieByArea {
  legal_area_name: string;
  total: number;
  with_ii: number;
  pct: number;
  avg_length: number;
}

export interface InhoudsindicatieLengthBucket {
  bucket: string;
  count: number;
  sort_key: number;
}

export interface InhoudsindicatieTimeline {
  period: string;
  total: number;
  with_ii: number;
  pct: number;
}

export interface InhoudsindicatieExample {
  ecli: string;
  court_name: string | null;
  decision_date: string | null;
  decision_type: string | null;
  inhoudsindicatie: string;
  length: number;
}

export interface OutcomeCount {
  outcome: string;
  count: number;
  color: string;
}

export interface CourtOutcome {
  court_name: string;
  gegrond: number;
  ongegrond: number;
  total_with_outcome: number;
  pct_gegrond: number;
}

export interface LengthTrend {
  period: string;
  avg_length: number;
  count: number;
}

export interface CompressionBucket {
  body_category: string;
  count: number;
  avg_ii_length: number;
  avg_body_length: number;
  ratio_pct: number;
}

export interface BigramEntry {
  bigram: string;
  count: number;
}

export interface LawReference {
  law: string;
  count: number;
}

// ─── Enhanced overview types ──────────────────────────────────────

export interface PipelineStats {
  fetched: number;
  pending: number;
  no_content: number;
  failed: number;
  total: number;
  pct_complete: number;
  db_size_mb: number;
  courts_ref: number;
  legal_areas_ref: number;
  procedure_types_ref: number;
}

export interface DataCompletenessField {
  field: string;
  label: string;
  filled: number;
  total: number;
  pct: number;
}

export interface WeekdayDistribution {
  day: string;
  count: number;
  day_index: number;
}

export interface CourtTypeStats {
  court_type: string;
  count: number;
  avg_body_length: number;
  avg_ii_length: number;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export interface RelationStats {
  decisions_with_relations: number;
  total_relations: number;
  by_type: { type: string; count: number }[];
}

// ─── Decision latency types ───────────────────────────────────────

export interface LatencyBucket {
  bucket: string;
  count: number;
  sort_key: number;
}

export interface LatencyByCourt {
  court_name: string;
  avg_days: number;
  median_days: number;
  count: number;
}

export interface LatencyTrend {
  period: string;
  avg_days: number;
  count: number;
}

// ─── Trend delta types ────────────────────────────────────────────

export interface TrendDelta {
  current: number;
  previous: number;
  delta_pct: number;
}

export interface StatsTrend {
  total: TrendDelta;
  uitspraken: TrendDelta;
  conclusies: TrendDelta;
}

// ─── Judge analytics types ────────────────────────────────────────

export interface JudgeDetail {
  name: string;
  count: number;
  areas: string[];
  courts: string[];
  uitspraken: number;
  conclusies: number;
}

export interface JudgeAreaEntry {
  legal_area_name: string;
  judge_count: number;
  decision_count: number;
}

export interface JudgeCourtEntry {
  court_name: string;
  judge_count: number;
  decision_count: number;
}

// ─── Judge KPI types ─────────────────────────────────────────────

export interface JudgeKPIs {
  active_judges: number;
  avg_cases_per_judge: number;
  conclusie_ratio: number;
  top_areas: string[];
}

// ─── YoY timeline types ─────────────────────────────────────────

export interface TimelineYoYEntry {
  period: string;
  count: number;
  prev_count: number;
}

// ─── Cross-tab types ─────────────────────────────────────────────

export interface CrossTabEntry {
  row: string;
  col: string;
  count: number;
}

export interface CrossTabData {
  entries: CrossTabEntry[];
  rows: string[];
  cols: string[];
  maxCount: number;
}
