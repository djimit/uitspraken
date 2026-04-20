import { getDb, cachedSlow } from "./db";

// ── Types ──────────────────────────────────────────────────────────

export interface IILengthStats {
  avg_chars: number;
  min_chars: number;
  max_chars: number;
  avg_words: number;
  count: number;
  compliance_pct: number; // % onder 200 chars (40 woorden)
}

export interface IIByLegalArea {
  legal_area_name: string;
  count: number;
  avg_chars: number;
  avg_words: number;
  over_200_count: number;
  over_200_pct: number;
  over_400_count: number;
  over_400_pct: number;
}

export interface IILengthBucket {
  bucket: string;
  count: number;
  pct: number;
  avg_chars: number;
  avg_words: number;
}

export interface IITrendMonth {
  month: string;
  avg_chars: number;
  count: number;
  compliance_pct: number;
}

export interface IIQualityIssue {
  ecli: string;
  court_name: string;
  legal_area_name: string;
  decision_date: string;
  inhoudsindicatie_chars: number;
  inhoudsindicatie_words: number;
  inhoudsindicatie_preview: string;
  severity: "warning" | "critical"; // warning: 200-400c, critical: >400c
}

export interface IIRechtsgebiedComparison {
  area: string;
  avg_chars: number;
  avg_words: number;
  count: number;
  compliance_pct: number;
  severity: "good" | "ok" | "warning" | "critical";
}

// ── Maaike's Analysis Types ────────────────────────────────────────

export interface IIInstantieStats {
  instantie: string;
  instantie_label: string; // "Rechtbank", "Hoven", "CRvB", "HR", "RvS"
  count: number;
  avg_chars: number;
  avg_words: number;
  bucket_under_50w: number;  // < 50 words (~250 chars)
  bucket_50_100w: number;    // 50-100 words (250-500 chars)
  bucket_over_100w: number;  // > 100 words (>500 chars)
  compliance_pct: number;
}

export interface IIProblematicCase {
  ecli: string;
  court_name: string;
  legal_area_name: string;
  decision_date: string;
  inhoudsindicatie_chars: number;
  inhoudsindicatie_words: number;
  inhoudsindicatie_preview: string;
  severity: "warning" | "critical"; // warning: 240-400c (40-80w), critical: >400c (>80w)
}

export interface IIInstantieByArea {
  instantie: string;
  legal_area_name: string;
  count: number;
  avg_chars: number;
  avg_words: number;
  over_240_pct: number;  // % boven 40 woorden (240 chars)
  over_400_pct: number;  // % boven 80 woorden (400 chars)
}

// ── Queries ──────────────────────────────────────────────────────────

const W = "inhoudsindicatie IS NOT NULL AND inhoudsindicatie != ''";

/** Overall stats */
export function getIIOverallStats(): IILengthStats {
  return cachedSlow("iiOverallStats", () => {
    const db = getDb();
    const r = db
      .prepare(
        `
      SELECT
        ROUND(AVG(LENGTH(inhoudsindicatie))) as avg_chars,
        MIN(LENGTH(inhoudsindicatie)) as min_chars,
        MAX(LENGTH(inhoudsindicatie)) as max_chars,
        ROUND(AVG(LENGTH(inhoudsindicatie) / 5.0)) as avg_words,
        COUNT(*) as count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(inhoudsindicatie) <= 200 THEN 1 ELSE 0 END) / COUNT(*)) as compliance_pct
      FROM decisions
      WHERE ${W}
    `
      )
      .get() as IILengthStats;
    return r;
  });
}

/** By legal area (Hans' question) */
export function getIIByLegalArea(): IIByLegalArea[] {
  return cachedSlow("iiByLegalArea", () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        la.legal_area_name,
        COUNT(*) as count,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(d.inhoudsindicatie) / 5.0)) as avg_words,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 200 THEN 1 ELSE 0 END) as over_200_count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 200 THEN 1 ELSE 0 END) / COUNT(*)) as over_200_pct,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) as over_400_count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) / COUNT(*)) as over_400_pct
      FROM decisions d
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE d.${W}
      GROUP BY la.legal_area_name
      HAVING count > 100
      ORDER BY avg_chars DESC
    `
      )
      .all() as IIByLegalArea[];
  });
}

/** Length distribution buckets */
export function getIILengthBuckets(): IILengthBucket[] {
  return cachedSlow("iiLengthBuckets", () => {
    const db = getDb();

    return db
      .prepare(
        `
      WITH total_count AS (
        SELECT COUNT(*) as total FROM decisions WHERE ${W}
      )
      SELECT
        CASE
          WHEN LENGTH(inhoudsindicatie) < 100 THEN '<100 (< 20w)'
          WHEN LENGTH(inhoudsindicatie) < 200 THEN '100-200 (20-40w) ✓'
          WHEN LENGTH(inhoudsindicatie) < 300 THEN '200-300 (40-60w)'
          WHEN LENGTH(inhoudsindicatie) < 400 THEN '300-400 (60-80w)'
          WHEN LENGTH(inhoudsindicatie) < 500 THEN '400-500 (80-100w)'
          ELSE '>500 (>100w)'
        END as bucket,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / (SELECT total FROM total_count)) as pct,
        ROUND(AVG(LENGTH(inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(inhoudsindicatie) / 5.0)) as avg_words
      FROM decisions
      WHERE ${W}
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN '<100 (< 20w)' THEN 1
          WHEN '100-200 (20-40w) ✓' THEN 2
          WHEN '200-300 (40-60w)' THEN 3
          WHEN '300-400 (60-80w)' THEN 4
          WHEN '400-500 (80-100w)' THEN 5
          ELSE 6
        END
    `
      )
      .all() as IILengthBucket[];
  });
}

/** Trend over months (2024-2025) */
export function getIITrendMonth(): IITrendMonth[] {
  return cachedSlow("iiTrendMonth", () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        substr(decision_date, 1, 7) as month,
        ROUND(AVG(LENGTH(inhoudsindicatie))) as avg_chars,
        COUNT(*) as count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(inhoudsindicatie) <= 200 THEN 1 ELSE 0 END) / COUNT(*)) as compliance_pct
      FROM decisions
      WHERE ${W}
      GROUP BY month
      ORDER BY month
    `
      )
      .all() as IITrendMonth[];
  });
}

/** Strafrecht vs Familie (Civiel recht) - direct answer to Hans */
export function getIIStrafVsFamilie(): {
  strafrecht: IIRechtsgebiedComparison;
  familie: IIRechtsgebiedComparison;
  all_areas: IIRechtsgebiedComparison[];
} {
  return cachedSlow("iiStrafVsFamilie", () => {
    const db = getDb();

    const query = `
      SELECT
        la.legal_area_name,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(d.inhoudsindicatie) / 5.0)) as avg_words,
        COUNT(*) as count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) <= 200 THEN 1 ELSE 0 END) / COUNT(*)) as compliance_pct
      FROM decisions d
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE d.${W}
      GROUP BY la.legal_area_name
      HAVING COUNT(*) > 100
    `;

    const all_areas = db.prepare(query).all() as (IIRechtsgebiedComparison & { legal_area_name?: string })[];

    const withSeverity = all_areas.map((a) => {
      const severity: "good" | "ok" | "warning" | "critical" =
        a.compliance_pct >= 60 ? "good" :
        a.compliance_pct >= 40 ? "ok" :
        a.compliance_pct >= 20 ? "warning" :
        "critical";
      return {
        area: a.legal_area_name || a.area,
        avg_chars: a.avg_chars,
        avg_words: a.avg_words,
        count: a.count,
        compliance_pct: a.compliance_pct,
        severity,
      };
    });

    const strafrecht = withSeverity.find(a => a.area.includes("Strafrecht") && !a.area.includes(";")) || withSeverity[0];
    const familie = withSeverity.find(a => a.area.includes("Personen- en familierecht")) ||
                    withSeverity.find(a => a.area === "Civiel recht") || withSeverity[0];

    return {
      strafrecht,
      familie,
      all_areas: withSeverity.sort((a, b) => b.avg_chars - a.avg_chars),
    };
  });
}

/** Quality issues - suspiciously long inhoudsdicaties */
export function getIIQualityIssues(limit: number = 100): IIQualityIssue[] {
  return cachedSlow(`iiQualityIssues_${limit}`, () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        d.ecli,
        d.court_name,
        COALESCE(la.legal_area_name, 'Onbekend') as legal_area_name,
        d.decision_date,
        LENGTH(d.inhoudsindicatie) as inhoudsindicatie_chars,
        ROUND(LENGTH(d.inhoudsindicatie) / 5.0) as inhoudsindicatie_words,
        SUBSTR(d.inhoudsindicatie, 1, 100) || '...' as inhoudsindicatie_preview,
        CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 'critical' ELSE 'warning' END as severity
      FROM decisions d
      LEFT JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE d.${W} AND (LENGTH(d.inhoudsindicatie) > 200)
      ORDER BY LENGTH(d.inhoudsindicatie) DESC
      LIMIT ?
    `
      )
      .all(limit) as IIQualityIssue[];
  });
}

/** Best performers - compliant areas */
export function getIIBestPerformers(): IIByLegalArea[] {
  return cachedSlow("iiBestPerformers", () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        la.legal_area_name,
        COUNT(*) as count,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(d.inhoudsindicatie) / 5.0)) as avg_words,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 200 THEN 1 ELSE 0 END) as over_200_count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 200 THEN 1 ELSE 0 END) / COUNT(*)) as over_200_pct,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) as over_400_count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) / COUNT(*)) as over_400_pct
      FROM decisions d
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE d.${W}
      GROUP BY la.legal_area_name
      HAVING count > 100
      ORDER BY over_200_pct ASC
      LIMIT 5
    `
      )
      .all() as IIByLegalArea[];
  });
}

/** Worst performers - non-compliant areas */
export function getIIWorstPerformers(): IIByLegalArea[] {
  return cachedSlow("iiWorstPerformers", () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        la.legal_area_name,
        COUNT(*) as count,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(d.inhoudsindicatie) / 5.0)) as avg_words,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 200 THEN 1 ELSE 0 END) as over_200_count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 200 THEN 1 ELSE 0 END) / COUNT(*)) as over_200_pct,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) as over_400_count,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) / COUNT(*)) as over_400_pct
      FROM decisions d
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE d.${W}
      GROUP BY la.legal_area_name
      HAVING count > 100
      ORDER BY over_200_pct DESC
      LIMIT 5
    `
      )
      .all() as IIByLegalArea[];
  });
}

// ── Maaike's Analysis Queries ──────────────────────────────────────

/** Extract instantie type from ECLI (e.g., ECLI:NL:RBAMS:2024:1234 -> Rechtbank) */
function getInstantieFromEcli(ecli: string): string {
  const parts = ecli.split(":");
  if (parts.length < 3) return "Onbekend";
  const code = parts[2];

  // Supreme court (Hoge Raad)
  if (code === "HR" || code === "R") return "Hoge Raad";

  // Council of State (Raad van State)
  if (code === "RvS" || code === "VS") return "Raad van State";

  // Business appeals courts
  if (code === "CBb" || code === "BB") return "CBb";

  // Administrative appeals courts
  if (code === "CRvB" || code === "RVB") return "CRvB";

  // Special court (Centrale Grondkamer)
  if (code === "G") return "Centrale Grondkamer";

  // Rechtbanken (District courts) - includes 4-letter codes starting with B
  if (code.startsWith("RB") || (code.length === 4 && code[0] === "B")) return "Rechtbank";

  // Gerechtshoven (Appeal courts) - includes 4-letter codes starting with H
  if (code.startsWith("GH") || (code.length === 4 && code[0] === "H")) return "Gerechtshof";

  // Caribbean courts (first instance)
  if (code.startsWith("GE")) return "Caribbean Court (First Instance)";

  // Caribbean courts (administrative)
  if (code.startsWith("GA")) return "Caribbean Court (Administrative)";

  return "Onbekend";
}

/** 2026 data split by instantie */
export function getMaaike2026ByInstantie(): IIInstantieStats[] {
  return cachedSlow("maaike2026ByInstantie", () => {
    const db = getDb();
    const data = db
      .prepare(
        `
      SELECT
        CASE
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'RB%' OR
               (substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'B___' AND length(substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1)) = 4)
          THEN 'Rechtbank'
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'GH%' OR
               (substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'H___' AND length(substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1)) = 4)
          THEN 'Gerechtshof'
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'CRvB' OR substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'RVB'
          THEN 'CRvB'
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'CBb' OR substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'BB'
          THEN 'CBb'
          ELSE 'Overig'
        END as instantie_label,
        COUNT(*) as count,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(d.inhoudsindicatie) / 5.0)) as avg_words,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) <= 250 THEN 1 ELSE 0 END) as bucket_under_50w,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 250 AND LENGTH(d.inhoudsindicatie) <= 500 THEN 1 ELSE 0 END) as bucket_50_100w,
        SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 500 THEN 1 ELSE 0 END) as bucket_over_100w,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) <= 200 THEN 1 ELSE 0 END) / COUNT(*)) as compliance_pct
      FROM decisions d
      WHERE ${W} AND substr(d.decision_date, 1, 4) = '2026'
      GROUP BY instantie_label
      ORDER BY count DESC
    `
      )
      .all() as any[];

    return data.map((row) => ({
      instantie: row.instantie_label,
      instantie_label: row.instantie_label,
      count: row.count,
      avg_chars: row.avg_chars,
      avg_words: row.avg_words,
      bucket_under_50w: row.bucket_under_50w,
      bucket_50_100w: row.bucket_50_100w,
      bucket_over_100w: row.bucket_over_100w,
      compliance_pct: row.compliance_pct,
    }));
  });
}

/** 2026 data by instantie + rechtsgebied */
export function getMaaike2026ByInstantieAndArea(): IIInstantieByArea[] {
  return cachedSlow("maaike2026ByArea", () => {
    const db = getDb();
    const data = db
      .prepare(
        `
      SELECT
        CASE
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'RB%' OR
               (substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'B___' AND length(substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1)) = 4)
          THEN 'Rechtbank'
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'GH%' OR
               (substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) LIKE 'H___' AND length(substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1)) = 4)
          THEN 'Gerechtshof'
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'CRvB' OR substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'RVB'
          THEN 'CRvB'
          WHEN substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'CBb' OR substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) = 'BB'
          THEN 'CBb'
          ELSE 'Overig'
        END as instantie_label,
        la.legal_area_name,
        COUNT(*) as count,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(AVG(LENGTH(d.inhoudsindicatie) / 5.0)) as avg_words,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 240 THEN 1 ELSE 0 END) / COUNT(*)) as over_240_pct,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 1 ELSE 0 END) / COUNT(*)) as over_400_pct
      FROM decisions d
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE ${W} AND substr(d.decision_date, 1, 4) = '2026'
      GROUP BY instantie_label, la.legal_area_name
      HAVING count > 10
      ORDER BY instantie_label, over_240_pct DESC
    `
      )
      .all() as any[];

    return data.map((row) => ({
      instantie: row.instantie_label,
      legal_area_name: row.legal_area_name,
      count: row.count,
      avg_chars: row.avg_chars,
      avg_words: row.avg_words,
      over_240_pct: row.over_240_pct,
      over_400_pct: row.over_400_pct,
    }));
  });
}

/** Problematic cases for Maaike (>240 chars = >40 words) */
export function getMaaikeProblematicCases(limit: number = 200): IIProblematicCase[] {
  return cachedSlow(`maaikeProblematicCases_${limit}`, () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        d.ecli,
        d.court_name,
        COALESCE(la.legal_area_name, 'Onbekend') as legal_area_name,
        d.decision_date,
        LENGTH(d.inhoudsindicatie) as inhoudsindicatie_chars,
        ROUND(LENGTH(d.inhoudsindicatie) / 5.0) as inhoudsindicatie_words,
        SUBSTR(d.inhoudsindicatie, 1, 150) || '...' as inhoudsindicatie_preview,
        CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 'critical' ELSE 'warning' END as severity
      FROM decisions d
      LEFT JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE ${W} AND substr(d.decision_date, 1, 4) = '2026' AND LENGTH(d.inhoudsindicatie) > 240
      ORDER BY LENGTH(d.inhoudsindicatie) DESC
      LIMIT ?
    `
      )
      .all(limit) as IIProblematicCase[];
  });
}

/** HR/RvS problematic cases (last 6 months) */
export function getMaaikeHRRvSProblematicCases(limit: number = 100): IIProblematicCase[] {
  return cachedSlow(`maaikeHRRvS_${limit}`, () => {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        d.ecli,
        d.court_name,
        COALESCE(la.legal_area_name, 'Onbekend') as legal_area_name,
        d.decision_date,
        LENGTH(d.inhoudsindicatie) as inhoudsindicatie_chars,
        ROUND(LENGTH(d.inhoudsindicatie) / 5.0) as inhoudsindicatie_words,
        SUBSTR(d.inhoudsindicatie, 1, 150) || '...' as inhoudsindicatie_preview,
        CASE WHEN LENGTH(d.inhoudsindicatie) > 400 THEN 'critical' ELSE 'warning' END as severity
      FROM decisions d
      LEFT JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE ${W} AND (substr(d.ecli, 10, 2) = 'HR' OR substr(d.ecli, 10, 3) = 'RvS')
        AND d.decision_date >= date('now', '-6 months')
        AND LENGTH(d.inhoudsindicatie) > 200
      ORDER BY LENGTH(d.inhoudsindicatie) DESC
      LIMIT ?
    `
      )
      .all(limit) as IIProblematicCase[];
  });
}

/** Trend analysis by instantie (2024-2025) */
export function getMaaikeTrendByInstantie(): {
  instantie: string;
  month: string;
  avg_chars: number;
  compliance_pct: number;
}[] {
  return cachedSlow("maaikeTrendByInstantie", () => {
    const db = getDb();
    const data = db
      .prepare(
        `
      SELECT
        substr(d.ecli, 10, instr(substr(d.ecli, 10), ':') - 1) as ecli_code,
        substr(d.decision_date, 1, 7) as month,
        ROUND(AVG(LENGTH(d.inhoudsindicatie))) as avg_chars,
        ROUND(100.0 * SUM(CASE WHEN LENGTH(d.inhoudsindicatie) <= 200 THEN 1 ELSE 0 END) / COUNT(*)) as compliance_pct
      FROM decisions d
      WHERE ${W} AND d.decision_date >= '2024-01-01'
      GROUP BY ecli_code, month
      ORDER BY ecli_code, month
    `
      )
      .all() as any[];

    // Convert ecli_code to instantie_label for the chart
    return data.map((row: any) => ({
      instantie: getInstantieFromEcli("ECLI:NL:" + row.ecli_code + ":2024:0"),
      month: row.month,
      avg_chars: row.avg_chars,
      compliance_pct: row.compliance_pct,
    }));
  });
}
