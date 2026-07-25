import fs from "fs";
import path from "path";

// Precomputed by search_service/train_word2vec.py: a word2vec model trained
// on this corpus's own vocabulary (50,000-decision sample), giving
// corpus-specific legal-term neighbors ("ontslag" -> "beeindiging",
// "opzegging") rather than generic word associations. Loaded once and
// cached in memory -- this is a static lookup table, not a live model, so
// there's no inference cost per query.
const SYNONYMS_PATH = path.join(process.cwd(), "..", "search_service", "word2vec_synonyms.json");

let cache: Record<string, [string, number][]> | null = null;

function loadSynonyms(): Record<string, [string, number][]> {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(SYNONYMS_PATH, "utf-8"));
  } catch {
    // Not trained yet, or file missing -- degrade to no expansion rather
    // than throw, same "never a hard failure for a soft signal" posture as
    // the rest of the hybrid search's optional weighting layers.
    cache = {};
  }
  return cache!;
}

export function getSynonyms(term: string, max = 2): string[] {
  const table = loadSynonyms();
  const entries = table[term.toLowerCase()] || [];
  return entries.slice(0, max).map(([word]) => word);
}
