import { getDb } from "./db";
import { keywordSearchRanked, buildWhereClause, searchDecisions, type Filters } from "./queries";
import { courtAuthorityInfo } from "./court-tiers";
import type { HybridHit, HybridSearchResult } from "./types";

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:8123";
const CANDIDATE_POOL = 200;
const RRF_K = 60;

interface SidecarHit {
  ecli: string;
  court_name: string | null;
  decision_date: string | null;
  snippet: string;
  score: number;
}

/** Fetch the semantic candidate pool from the FastAPI sidecar. Returns null
 *  (not throws) when the sidecar is unreachable, so callers can degrade to
 *  keyword-only results instead of surfacing an error page. */
async function semanticSearchCandidates(query: string, k: number): Promise<SidecarHit[] | null> {
  try {
    const res = await fetch(`${SEARCH_SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, k }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.hits as SidecarHit[]) ?? [];
  } catch {
    return null;
  }
}

/** Boost-only recency weighting: Dutch case law does not "expire" -- a
 *  decades-old Hoge Raad ruling can still be controlling precedent, so age
 *  is never penalized, only mildly rewarded for freshness. Half-life 5y,
 *  bounded [1.0, 1.10]. */
export function recencyMultiplier(decisionDate: string | null | undefined): number {
  if (!decisionDate) return 1.0;
  const date = new Date(decisionDate);
  if (Number.isNaN(date.getTime())) return 1.0;
  const ageYears = (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageYears < 0) return 1.0; // future-dated data glitch guard
  return 1.0 + 0.10 * Math.exp((-Math.LN2 * ageYears) / 5);
}

// A pure absolute threshold turned out to have no discriminative power
// within a real, on-topic result set: verified empirically that for a
// genuine legal query ("onrechtmatige daad causaal verband"), scores stay
// in a narrow 0.78-0.82 band from rank 1 all the way to rank 178 of 200 --
// everything cleared 0.70, so everything was labeled "sterk," rank
// notwithstanding. Meanwhile an out-of-domain query ("purple elephant
// quantum banana") tops out around 0.53-0.55. So the useful signal has two
// parts: (1) an absolute floor that catches off-topic queries where NOTHING
// looks confident, and (2) *within* an on-topic pool, how close a hit is to
// that query's own best match -- which is what actually varies and is worth
// showing the user, since nomic-embed-text's cosine scores don't have a
// stable absolute meaning across queries, only a stable relative ordering
// within one.
function semanticStrength(score: number, topScoreInPool: number): "sterk" | "gemiddeld" | "zwak" {
  if (score < 0.60) return "zwak"; // off-topic query floor, regardless of pool
  const gapFromBest = topScoreInPool - score;
  if (gapFromBest <= 0.02) return "sterk";
  if (gapFromBest <= 0.06) return "gemiddeld";
  return "zwak";
}

interface DecisionMeta {
  ecli: string;
  title: string | null;
  court_name: string | null;
  decision_date: string | null;
}

/** Batch-fetch title/court/date for a set of eclis, applying the same filters
 *  as the keyword search -- this is also how filters get applied to the
 *  semantic candidates, which the sidecar has no filter awareness of by
 *  design (it stays a single-responsibility embed+ANN service). An ecli
 *  absent from the returned map failed the filter (or doesn't exist) and
 *  must be dropped from the fused result set, not silently kept. */
function fetchFilteredMeta(eclis: string[], filters: Filters): Map<string, DecisionMeta> {
  const map = new Map<string, DecisionMeta>();
  if (eclis.length === 0) return map;
  const db = getDb();
  const { where, params } = buildWhereClause(filters);
  const placeholders = eclis.map(() => "?").join(",");
  const condition = where ? `${where} AND d.ecli IN (${placeholders})` : `WHERE d.ecli IN (${placeholders})`;
  const rows = db
    .prepare(`SELECT d.ecli, d.title, d.court_name, d.decision_date FROM decisions d ${condition}`)
    .all(...params, ...eclis) as DecisionMeta[];
  for (const row of rows) map.set(row.ecli, row);
  return map;
}

export async function hybridSearch(
  query: string | undefined,
  filters: Filters = {},
  page = 1,
  pageSize = 25,
): Promise<HybridSearchResult> {
  if (!query || !query.trim()) {
    // No query: browsing/filtering only, same semantics as /decisions --
    // there is no relevance to rank, so hits carry neutral scoring fields.
    const plain = searchDecisions(undefined, filters, page, pageSize);
    return {
      hits: plain.results.map((d) => ({
        ecli: d.ecli,
        title: d.title,
        court_name: d.court_name,
        decision_date: d.decision_date,
        courtTier: courtAuthorityInfo(d.court_name),
        recencyMultiplier: recencyMultiplier(d.decision_date),
        keywordRank: null,
        snippet: d.summary,
        semanticRank: null,
        semanticStrength: null,
        rrfScore: 0,
        finalScore: 0,
      })),
      total: plain.total,
      page,
      pageSize,
      degraded: null,
    };
  }

  const [keywordHits, semanticHits] = await Promise.all([
    Promise.resolve(keywordSearchRanked(query, filters, CANDIDATE_POOL)),
    semanticSearchCandidates(query, CANDIDATE_POOL),
  ]);
  const degraded: "keyword_only" | null = semanticHits === null ? "keyword_only" : null;

  const keywordRankByEcli = new Map<string, number>();
  const keywordSnippetByEcli = new Map<string, string>();
  keywordHits.forEach((hit, i) => {
    keywordRankByEcli.set(hit.ecli, i + 1);
    keywordSnippetByEcli.set(hit.ecli, hit.snippet);
  });

  const semanticRankByEcli = new Map<string, number>();
  const semanticSnippetByEcli = new Map<string, string>();
  const semanticScoreByEcli = new Map<string, number>();
  (semanticHits ?? []).forEach((hit, i) => {
    semanticRankByEcli.set(hit.ecli, i + 1);
    semanticSnippetByEcli.set(hit.ecli, hit.snippet);
    semanticScoreByEcli.set(hit.ecli, hit.score);
  });

  const candidateEclis = Array.from(new Set([...keywordRankByEcli.keys(), ...semanticRankByEcli.keys()]));
  const metaByEcli = fetchFilteredMeta(candidateEclis, filters);
  const topSemanticScore = semanticHits?.[0]?.score ?? 0;

  const fused: HybridHit[] = [];
  for (const ecli of candidateEclis) {
    const meta = metaByEcli.get(ecli);
    if (!meta) continue; // filtered out (or stale/missing) -- never silently kept

    const kRank = keywordRankByEcli.get(ecli) ?? null;
    const sRank = semanticRankByEcli.get(ecli) ?? null;
    const rrfScore = (kRank ? 1 / (RRF_K + kRank) : 0) + (sRank ? 1 / (RRF_K + sRank) : 0);

    const tier = courtAuthorityInfo(meta.court_name);
    const recency = recencyMultiplier(meta.decision_date);

    fused.push({
      ecli,
      title: meta.title,
      court_name: meta.court_name,
      decision_date: meta.decision_date,
      courtTier: tier,
      recencyMultiplier: recency,
      keywordRank: kRank,
      snippet: keywordSnippetByEcli.get(ecli) ?? null,
      semanticRank: sRank,
      semanticStrength: sRank ? semanticStrength(semanticScoreByEcli.get(ecli) ?? 0, topSemanticScore) : null,
      rrfScore,
      finalScore: rrfScore * tier.multiplier * recency,
    });
  }

  fused.sort((a, b) => b.finalScore - a.finalScore);

  // Fall back to a semantic snippet when there's no keyword hit for this doc.
  for (const hit of fused) {
    if (!hit.snippet) {
      const semanticSnippet = semanticSnippetByEcli.get(hit.ecli);
      if (semanticSnippet) hit.snippet = semanticSnippet;
    }
  }

  const total = fused.length;
  const start = (page - 1) * pageSize;
  const hits = fused.slice(start, start + pageSize);

  return { hits, total, page, pageSize, degraded };
}
