import { getDb, cachedSlow } from "./db";

// ── Types ──────────────────────────────────────────────────────────

export interface FinCrimeTrend {
  month: string;
  witwassen: number;
  fraude: number;
  faillissement: number;
  crypto: number;
}

export interface FinCrimeKPIs {
  witwassen: number;
  fraude: number;
  faillissement: number;
  fiod: number;
  crypto: number;
  encrochat: number;
  criminele_org: number;
  ontruiming: number;
  toeslagen: number;
  bestuurdersaansprakelijkheid: number;
}

export interface FinCrimeByCourt {
  court_name: string;
  witwassen: number;
  fraude: number;
  fiod: number;
  total: number;
}

export interface FinCrimeJudge {
  name: string;
  witwassen: number;
  fraude: number;
  fiod: number;
  total_financial: number;
  total_all: number;
  courts: string;
}

export interface PanelAppealEntry {
  kamer: string;
  legal_area: string;
  bekrachtigd: number;
  vernietigd: number;
  total: number;
  vernietigings_pct: number;
}

export interface PanelSummary {
  enkelvoudig_pct: number;
  meervoudig_pct: number;
  enkelvoudig_total: number;
  meervoudig_total: number;
}

export interface BurgerImpactTrend {
  month: string;
  ontruiming: number;
  toeslagen: number;
  vreemdelingen: number;
}

export interface EncrochatEntry {
  month: string;
  count: number;
}

export interface FaillissementTrend {
  month: string;
  count: number;
  avg_prev_3: number | null;
}

export interface WeekendDecision {
  court_name: string;
  count: number;
}

export interface LawReference {
  law: string;
  count: number;
}

export interface SanctionTrend {
  month: string;
  count: number;
}

// ── Queries (use _forensic_cache for fast reads) ─────────────────────

const FC = "_forensic_cache";
const W = "body_text IS NOT NULL AND body_text != '' AND fetch_status = 'fetched'";

/** Overall KPIs */
export function getFinCrimeKPIs(): FinCrimeKPIs {
  return cachedSlow("finCrimeKPIs", () => {
    const db = getDb();
    const r = db.prepare(`
      SELECT
        SUM(witwassen) as witwassen, SUM(fraude) as fraude,
        SUM(faillissement) as faillissement, SUM(fiod) as fiod,
        SUM(crypto) as crypto, SUM(encrochat) as encrochat,
        SUM(criminele_org) as criminele_org, SUM(ontruiming) as ontruiming,
        SUM(toeslagen) as toeslagen,
        SUM(bestuurdersaansprakelijkheid) as bestuurdersaansprakelijkheid
      FROM ${FC}
    `).get() as FinCrimeKPIs;
    return r;
  });
}

/** Monthly trend of financial crime types */
export function getFinCrimeTrend(): FinCrimeTrend[] {
  return cachedSlow("finCrimeTrend", () => {
    const db = getDb();
    return db.prepare(`
      SELECT substr(decision_date, 1, 7) as month,
        SUM(witwassen) as witwassen, SUM(fraude) as fraude,
        SUM(faillissement) as faillissement, SUM(crypto) as crypto
      FROM ${FC}
      WHERE decision_date IS NOT NULL
      GROUP BY month HAVING month IS NOT NULL ORDER BY month
    `).all() as FinCrimeTrend[];
  });
}

/** Financial crime by court */
export function getFinCrimeByCourt(): FinCrimeByCourt[] {
  return cachedSlow("finCrimeByCourt", () => {
    const db = getDb();
    return db.prepare(`
      SELECT court_name,
        SUM(witwassen) as witwassen, SUM(fraude) as fraude, SUM(fiod) as fiod,
        SUM(witwassen) + SUM(fraude) + SUM(fiod) as total
      FROM ${FC}
      WHERE court_name IS NOT NULL
      GROUP BY court_name HAVING total > 20
      ORDER BY total DESC LIMIT 20
    `).all() as FinCrimeByCourt[];
  });
}

/** Top judges handling financial crime */
export function getFinCrimeJudges(): FinCrimeJudge[] {
  return cachedSlow("finCrimeJudges", () => {
    const db = getDb();
    return db.prepare(`
      SELECT dc.name,
        SUM(fc.witwassen) as witwassen,
        SUM(fc.fraude) as fraude,
        SUM(fc.fiod) as fiod,
        SUM(CASE WHEN fc.witwassen OR fc.fraude OR fc.fiod THEN 1 ELSE 0 END) as total_financial,
        COUNT(*) as total_all,
        GROUP_CONCAT(DISTINCT fc.court_name) as courts
      FROM decision_contributors dc
      JOIN ${FC} fc ON dc.ecli = fc.ecli
      WHERE dc.role IS NULL OR dc.role = 'rechter' OR dc.role = 'voorzitter'
      GROUP BY dc.name
      HAVING total_financial >= 15
      ORDER BY total_financial DESC
      LIMIT 30
    `).all() as FinCrimeJudge[];
  });
}

/** Panel size vs appeal outcome */
export function getPanelAppeal(): { entries: PanelAppealEntry[]; summary: PanelSummary } {
  return cachedSlow("panelAppeal", () => {
    const db = getDb();
    const entries = db.prepare(`
      WITH panel AS (
        SELECT ecli, COUNT(*) as size
        FROM decision_contributors
        WHERE role IS NULL OR role = 'rechter' OR role = 'voorzitter'
        GROUP BY ecli
      )
      SELECT
        CASE WHEN p.size = 1 THEN 'Enkelvoudig' ELSE 'Meervoudig' END as kamer,
        la.legal_area_name as legal_area,
        SUM(CASE WHEN dr.relation_gevolg LIKE '%bekrachtiging%' THEN 1 ELSE 0 END) as bekrachtigd,
        SUM(CASE WHEN dr.relation_gevolg LIKE '%vernietiging%' THEN 1 ELSE 0 END) as vernietigd,
        COUNT(*) as total
      FROM decision_relations dr
      JOIN decisions d ON dr.related_ecli = d.ecli
      JOIN panel p ON d.ecli = p.ecli
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE dr.relation_gevolg IS NOT NULL
        AND dr.relation_aanleg = 'http://psi.rechtspraak.nl/eerdereAanleg'
      GROUP BY kamer, la.legal_area_name
      HAVING total >= 10
      ORDER BY kamer, total DESC
    `).all() as (Omit<PanelAppealEntry, "vernietigings_pct">)[];

    const result = entries.map(e => ({
      ...e,
      vernietigings_pct: e.total > 0 ? Math.round(1000 * e.vernietigd / e.total) / 10 : 0,
    }));

    // Summary
    const summaryRows = db.prepare(`
      WITH panel AS (
        SELECT ecli, COUNT(*) as size
        FROM decision_contributors
        WHERE role IS NULL OR role = 'rechter' OR role = 'voorzitter'
        GROUP BY ecli
      )
      SELECT
        CASE WHEN p.size = 1 THEN 'Enkelvoudig' ELSE 'Meervoudig' END as kamer,
        SUM(CASE WHEN dr.relation_gevolg LIKE '%vernietiging%' THEN 1 ELSE 0 END) as vernietigd,
        COUNT(*) as total
      FROM decision_relations dr
      JOIN decisions d ON dr.related_ecli = d.ecli
      JOIN panel p ON d.ecli = p.ecli
      WHERE dr.relation_gevolg IS NOT NULL
        AND dr.relation_aanleg = 'http://psi.rechtspraak.nl/eerdereAanleg'
      GROUP BY kamer
    `).all() as { kamer: string; vernietigd: number; total: number }[];

    const enk = summaryRows.find(r => r.kamer === "Enkelvoudig") || { vernietigd: 0, total: 0 };
    const meer = summaryRows.find(r => r.kamer === "Meervoudig") || { vernietigd: 0, total: 0 };

    return {
      entries: result,
      summary: {
        enkelvoudig_pct: enk.total > 0 ? Math.round(1000 * enk.vernietigd / enk.total) / 10 : 0,
        meervoudig_pct: meer.total > 0 ? Math.round(1000 * meer.vernietigd / meer.total) / 10 : 0,
        enkelvoudig_total: enk.total,
        meervoudig_total: meer.total,
      },
    };
  });
}

/** Burger impact trends: ontruiming, toeslagen, vreemdelingenrecht per month */
export function getBurgerImpactTrend(): BurgerImpactTrend[] {
  return cachedSlow("burgerImpact", () => {
    const db = getDb();
    return db.prepare(`
      SELECT substr(decision_date, 1, 7) as month,
        SUM(ontruiming) as ontruiming,
        SUM(toeslagen) as toeslagen,
        0 as vreemdelingen
      FROM ${FC}
      WHERE decision_date IS NOT NULL
      GROUP BY month HAVING month IS NOT NULL ORDER BY month
    `).all() as BurgerImpactTrend[];
  });
}

/** Vreemdelingenrecht trend (separate query, needs join) */
export function getVreemdelingenTrend(): { month: string; count: number }[] {
  return cachedSlow("vreemdelingenTrend", () => {
    const db = getDb();
    return db.prepare(`
      SELECT substr(d.decision_date, 1, 7) as month, COUNT(*) as count
      FROM decisions d
      JOIN decision_legal_areas la ON d.ecli = la.ecli
      WHERE la.legal_area_name LIKE '%Vreemdelingenrecht%'
        AND d.decision_date IS NOT NULL
      GROUP BY month
      ORDER BY month
    `).all() as { month: string; count: number }[];
  });
}

/** EncroChat / PGP phone cases trend */
export function getEncrochatTrend(): EncrochatEntry[] {
  return cachedSlow("encrochatTrend", () => {
    const db = getDb();
    return db.prepare(`
      SELECT substr(decision_date, 1, 7) as month, SUM(encrochat) as count
      FROM ${FC}
      WHERE decision_date IS NOT NULL AND encrochat = 1
      GROUP BY month ORDER BY month
    `).all() as EncrochatEntry[];
  });
}

/** Faillissement trend with moving average */
export function getFaillissementTrend(): FaillissementTrend[] {
  return cachedSlow("faillissementTrend", () => {
    const db = getDb();
    const raw = db.prepare(`
      SELECT substr(decision_date, 1, 7) as month, SUM(faillissement) as count
      FROM ${FC}
      WHERE decision_date IS NOT NULL AND faillissement = 1
      GROUP BY month ORDER BY month
    `).all() as { month: string; count: number }[];

    return raw.map((r, i) => {
      let avg: number | null = null;
      if (i >= 3) {
        avg = Math.round((raw[i - 1].count + raw[i - 2].count + raw[i - 3].count) / 3);
      }
      return { ...r, avg_prev_3: avg };
    });
  });
}

/** Weekend decisions by court */
export function getWeekendDecisions(): WeekendDecision[] {
  return cachedSlow("weekendDecisions", () => {
    const db = getDb();
    return db.prepare(`
      SELECT court_name, COUNT(*) as count
      FROM decisions
      WHERE decision_date IS NOT NULL
        AND strftime('%w', decision_date) IN ('0', '6')
        AND court_name IS NOT NULL
      GROUP BY court_name
      ORDER BY count DESC
      LIMIT 15
    `).all() as WeekendDecision[];
  });
}

/** Financial law references — uses pre-computed values for speed */
export function getFinancialLawRefs(): LawReference[] {
  return cachedSlow("finLawRefs", () => {
    const db = getDb();
    // Use reference counts from decision_references + some from forensic cache
    const data: LawReference[] = [
      { law: "Art 420bis Sr (witwassen)", count: (db.prepare(`SELECT SUM(witwassen) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Faillissementswet", count: (db.prepare(`SELECT SUM(faillissement) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "FIOD-onderzoeken", count: (db.prepare(`SELECT SUM(fiod) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Fraude-gerelateerd", count: (db.prepare(`SELECT SUM(fraude) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Crypto/Bitcoin", count: (db.prepare(`SELECT SUM(crypto) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "EncroChat/PGP", count: (db.prepare(`SELECT SUM(encrochat) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Criminele organisatie", count: (db.prepare(`SELECT SUM(criminele_org) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Bestuurdersaansprak.", count: (db.prepare(`SELECT SUM(bestuurdersaansprakelijkheid) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Ondermijning", count: (db.prepare(`SELECT SUM(ondermijning) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Sancties (Rusland)", count: (db.prepare(`SELECT SUM(sanctie) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Ontruiming", count: (db.prepare(`SELECT SUM(ontruiming) as c FROM ${FC}`).get() as {c:number}).c },
      { law: "Toeslagenzaken", count: (db.prepare(`SELECT SUM(toeslagen) as c FROM ${FC}`).get() as {c:number}).c },
    ];
    return data.sort((a, b) => b.count - a.count);
  });
}

/** Sanctions-related decisions trend */
export function getSanctionTrend(): SanctionTrend[] {
  return cachedSlow("sanctionTrend", () => {
    const db = getDb();
    return db.prepare(`
      SELECT substr(decision_date, 1, 7) as month, SUM(sanctie) as count
      FROM ${FC}
      WHERE decision_date IS NOT NULL AND sanctie = 1
      GROUP BY month ORDER BY month
    `).all() as SanctionTrend[];
  });
}
