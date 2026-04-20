import { getDb, cached, cachedSlow } from "./db";

// ── Types ──────────────────────────────────────────────────────────

export interface AppealKPIs {
  total_appeals: number;
  bekrachtigd: number;
  vernietigd: number;
  overig: number;
  vernietigings_pct: number;
  avg_days_between: number | null;
}

export interface AppealOutcomeByArea {
  legal_area: string;
  bekrachtigd: number;
  vernietigd: number;
  overig: number;
  total: number;
  vernietigings_pct: number;
}

export interface AppealOutcomeByCourt {
  court_name: string;
  bekrachtigd: number;
  vernietigd: number;
  overig: number;
  total: number;
  vernietigings_pct: number;
}

export interface AppealFlow {
  source_type: string;
  target_type: string;
  count: number;
}

export interface AppealTrendEntry {
  month: string;
  total: number;
  bekrachtigd: number;
  vernietigd: number;
  vernietigings_pct: number;
}

export interface AppealCourtPair {
  from_court: string;
  to_court: string;
  total: number;
  bekrachtigd: number;
  vernietigd: number;
  vernietigings_pct: number;
}

export interface AppealDurationEntry {
  bucket: string;
  count: number;
  sort_key: number;
}

export interface AppealTopOverturned {
  ecli: string;
  court_name: string | null;
  decision_date: string | null;
  legal_area: string | null;
  label: string | null;
  gevolg: string;
}

export interface AppealGevolgDetail {
  gevolg: string;
  count: number;
}

// ── Queries ──────────────────────────────────────────────────────────

const W = "dr.relation_gevolg IS NOT NULL";

function classifyGevolg(gevolg: string): "bekrachtigd" | "vernietigd" | "overig" {
  if (gevolg.includes("bekrachtiging") || gevolg.includes("bevestiging")) return "bekrachtigd";
  if (gevolg.includes("vernietiging")) return "vernietigd";
  return "overig";
}

/** Overall KPIs for the appeal analysis page */
export function getAppealKPIs(): AppealKPIs {
  return cachedSlow("appealKPIs", () => {
    const db = getDb();

    const rows = db.prepare(`
      SELECT relation_gevolg FROM decision_relations
      WHERE relation_gevolg IS NOT NULL
    `).all() as { relation_gevolg: string }[];

    let bekrachtigd = 0, vernietigd = 0, overig = 0;
    for (const r of rows) {
      const cat = classifyGevolg(r.relation_gevolg);
      if (cat === "bekrachtigd") bekrachtigd++;
      else if (cat === "vernietigd") vernietigd++;
      else overig++;
    }

    const total = rows.length;

    // Average time between instances
    const avgRow = db.prepare(`
      SELECT ROUND(AVG(ABS(julianday(d1.decision_date) - julianday(d2.decision_date))), 0) as avg_days
      FROM decision_relations dr
      JOIN decisions d1 ON dr.ecli = d1.ecli
      JOIN decisions d2 ON dr.related_ecli = d2.ecli
      WHERE dr.relation_gevolg IS NOT NULL
        AND d1.decision_date IS NOT NULL
        AND d2.decision_date IS NOT NULL
        AND ABS(julianday(d1.decision_date) - julianday(d2.decision_date)) < 3650
        AND ABS(julianday(d1.decision_date) - julianday(d2.decision_date)) > 0
    `).get() as { avg_days: number | null };

    return {
      total_appeals: total,
      bekrachtigd,
      vernietigd,
      overig,
      vernietigings_pct: total > 0 ? Math.round(1000 * vernietigd / total) / 10 : 0,
      avg_days_between: avgRow.avg_days,
    };
  });
}

/** Appeal outcomes broken down by legal area */
export function getAppealByLegalArea(): AppealOutcomeByArea[] {
  return cachedSlow("appealByArea", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT dla.legal_area_name as legal_area, dr.relation_gevolg
      FROM decision_relations dr
      JOIN decisions d ON dr.ecli = d.ecli
      JOIN decision_legal_areas dla ON d.ecli = dla.ecli
      WHERE dr.relation_gevolg IS NOT NULL
    `).all() as { legal_area: string; relation_gevolg: string }[];

    const map: Record<string, { bekrachtigd: number; vernietigd: number; overig: number }> = {};
    for (const r of rows) {
      if (!map[r.legal_area]) map[r.legal_area] = { bekrachtigd: 0, vernietigd: 0, overig: 0 };
      const cat = classifyGevolg(r.relation_gevolg);
      map[r.legal_area][cat]++;
    }

    return Object.entries(map)
      .map(([legal_area, v]) => {
        const total = v.bekrachtigd + v.vernietigd + v.overig;
        return {
          legal_area,
          ...v,
          total,
          vernietigings_pct: total > 0 ? Math.round(1000 * v.vernietigd / total) / 10 : 0,
        };
      })
      .filter(r => r.total >= 20)
      .sort((a, b) => b.vernietigings_pct - a.vernietigings_pct);
  });
}

/** Appeal outcomes by the court that decided the appeal (gerechtshof/Hoge Raad) */
export function getAppealByCourt(): AppealOutcomeByCourt[] {
  return cachedSlow("appealByCourt", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT d.court_name, dr.relation_gevolg
      FROM decision_relations dr
      JOIN decisions d ON dr.ecli = d.ecli
      WHERE dr.relation_gevolg IS NOT NULL AND d.court_name IS NOT NULL
    `).all() as { court_name: string; relation_gevolg: string }[];

    const map: Record<string, { bekrachtigd: number; vernietigd: number; overig: number }> = {};
    for (const r of rows) {
      if (!map[r.court_name]) map[r.court_name] = { bekrachtigd: 0, vernietigd: 0, overig: 0 };
      const cat = classifyGevolg(r.relation_gevolg);
      map[r.court_name][cat]++;
    }

    return Object.entries(map)
      .map(([court_name, v]) => {
        const total = v.bekrachtigd + v.vernietigd + v.overig;
        return {
          court_name,
          ...v,
          total,
          vernietigings_pct: total > 0 ? Math.round(1000 * v.vernietigd / total) / 10 : 0,
        };
      })
      .filter(r => r.total >= 10)
      .sort((a, b) => b.vernietigings_pct - a.vernietigings_pct);
  });
}

/** Monthly trend of appeal outcomes */
export function getAppealTrend(): AppealTrendEntry[] {
  return cachedSlow("appealTrend", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT substr(d.decision_date, 1, 7) as month, dr.relation_gevolg
      FROM decision_relations dr
      JOIN decisions d ON dr.ecli = d.ecli
      WHERE dr.relation_gevolg IS NOT NULL
        AND d.decision_date IS NOT NULL
      ORDER BY month
    `).all() as { month: string; relation_gevolg: string }[];

    const map: Record<string, { total: number; bekrachtigd: number; vernietigd: number }> = {};
    for (const r of rows) {
      if (!r.month) continue;
      if (!map[r.month]) map[r.month] = { total: 0, bekrachtigd: 0, vernietigd: 0 };
      map[r.month].total++;
      const cat = classifyGevolg(r.relation_gevolg);
      if (cat === "bekrachtigd") map[r.month].bekrachtigd++;
      if (cat === "vernietigd") map[r.month].vernietigd++;
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        ...v,
        vernietigings_pct: v.total > 0 ? Math.round(1000 * v.vernietigd / v.total) / 10 : 0,
      }));
  });
}

/** Court-to-court appeal flow (which courts appeal to which) */
export function getAppealCourtPairs(): AppealCourtPair[] {
  return cachedSlow("appealCourtPairs", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT d1.court_name as to_court, d2.court_name as from_court, dr.relation_gevolg
      FROM decision_relations dr
      JOIN decisions d1 ON dr.ecli = d1.ecli
      JOIN decisions d2 ON dr.related_ecli = d2.ecli
      WHERE dr.relation_gevolg IS NOT NULL
        AND dr.relation_aanleg = 'http://psi.rechtspraak.nl/eerdereAanleg'
        AND d1.court_name IS NOT NULL AND d2.court_name IS NOT NULL
    `).all() as { to_court: string; from_court: string; relation_gevolg: string }[];

    const map: Record<string, { total: number; bekrachtigd: number; vernietigd: number }> = {};
    for (const r of rows) {
      const key = `${r.from_court}|||${r.to_court}`;
      if (!map[key]) map[key] = { total: 0, bekrachtigd: 0, vernietigd: 0 };
      map[key].total++;
      const cat = classifyGevolg(r.relation_gevolg);
      if (cat === "bekrachtigd") map[key].bekrachtigd++;
      if (cat === "vernietigd") map[key].vernietigd++;
    }

    return Object.entries(map)
      .map(([key, v]) => {
        const [from_court, to_court] = key.split("|||");
        return {
          from_court,
          to_court,
          ...v,
          vernietigings_pct: v.total > 0 ? Math.round(1000 * v.vernietigd / v.total) / 10 : 0,
        };
      })
      .filter(r => r.total >= 5)
      .sort((a, b) => b.total - a.total);
  });
}

/** Time duration between first instance and appeal decision */
export function getAppealDuration(): AppealDurationEntry[] {
  return cachedSlow("appealDuration", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        CASE
          WHEN days <= 90 THEN '0-3 maanden'
          WHEN days <= 180 THEN '3-6 maanden'
          WHEN days <= 365 THEN '6-12 maanden'
          WHEN days <= 730 THEN '1-2 jaar'
          WHEN days <= 1095 THEN '2-3 jaar'
          ELSE '3+ jaar'
        END as bucket,
        COUNT(*) as count,
        CASE
          WHEN days <= 90 THEN 1
          WHEN days <= 180 THEN 2
          WHEN days <= 365 THEN 3
          WHEN days <= 730 THEN 4
          WHEN days <= 1095 THEN 5
          ELSE 6
        END as sort_key
      FROM (
        SELECT ABS(julianday(d1.decision_date) - julianday(d2.decision_date)) as days
        FROM decision_relations dr
        JOIN decisions d1 ON dr.ecli = d1.ecli
        JOIN decisions d2 ON dr.related_ecli = d2.ecli
        WHERE dr.relation_gevolg IS NOT NULL
          AND dr.relation_aanleg = 'http://psi.rechtspraak.nl/eerdereAanleg'
          AND d1.decision_date IS NOT NULL
          AND d2.decision_date IS NOT NULL
          AND ABS(julianday(d1.decision_date) - julianday(d2.decision_date)) > 0
          AND ABS(julianday(d1.decision_date) - julianday(d2.decision_date)) < 3650
      )
      GROUP BY bucket
      ORDER BY sort_key
    `).all() as AppealDurationEntry[];
    return rows;
  });
}

/** Detailed gevolg breakdown */
export function getAppealGevolgDetails(): AppealGevolgDetail[] {
  return cachedSlow("appealGevolg", () => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT relation_gevolg as gevolg_raw, COUNT(*) as count
      FROM decision_relations
      WHERE relation_gevolg IS NOT NULL
      GROUP BY relation_gevolg
      ORDER BY count DESC
    `).all() as { gevolg_raw: string; count: number }[];

    return rows.map(r => ({
      gevolg: r.gevolg_raw.split("#").pop()?.replace(/_/g, " ") || r.gevolg_raw,
      count: r.count,
    }));
  });
}

/** Recent overturned decisions (interesting for lawyers/journalists) */
export function getRecentOverturned(limit = 20): AppealTopOverturned[] {
  return cached("recentOverturned:" + limit, () => {
    const db = getDb();
    return db.prepare(`
      SELECT
        d.ecli,
        d.court_name,
        d.decision_date,
        dla.legal_area_name as legal_area,
        dr.label,
        dr.relation_gevolg as gevolg
      FROM decision_relations dr
      JOIN decisions d ON dr.ecli = d.ecli
      LEFT JOIN decision_legal_areas dla ON d.ecli = dla.ecli
      WHERE dr.relation_gevolg LIKE '%vernietiging%'
        AND d.decision_date IS NOT NULL
      GROUP BY d.ecli
      ORDER BY d.decision_date DESC
      LIMIT ?
    `).all(limit) as AppealTopOverturned[];
  });
}
