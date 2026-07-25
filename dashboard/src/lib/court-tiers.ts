/** Court-authority tier table: a soft tie-breaker on top of retrieval relevance,
 *  never a hard filter. Multiplier range is deliberately narrow (0.90-1.15) --
 *  a wide range risks structurally burying smaller-volume courts (the JLAIF
 *  "bias" error type), which must never happen just because a court has fewer
 *  decisions in the corpus. See the plan doc for the full rationale and the
 *  judgment calls flagged below.
 */

export interface CourtTierInfo {
  tier: number;
  multiplier: number;
  label: string;
  /** AG-conclusie (Parket bij de Hoge Raad): advisory, not a binding ruling. */
  advisory: boolean;
}

const UNKNOWN: CourtTierInfo = { tier: 4, multiplier: 1.0, label: "Onbekende instantie", advisory: false };

export function courtAuthorityInfo(courtName: string | null | undefined): CourtTierInfo {
  const name = (courtName || "").trim();
  if (!name) return UNKNOWN;

  // Advisory AG opinions -- checked first and excluded from the "Hoge Raad"
  // match below, since they are not binding rulings despite the name overlap.
  // Judgment call: 0.90 is arguable vs. neutral (1.00) + badge-only -- AG
  // conclusies are still authoritative legal analysis, just not dispositive.
  // The badge matters more here than the multiplier: the real risk is a user
  // mistaking an advisory opinion for a binding ruling, not a minor rank shift.
  if (name.includes("Parket bij de Hoge Raad")) {
    return { tier: 5, multiplier: 0.90, label: "AG-conclusie (niet-bindend advies)", advisory: true };
  }
  if (name.includes("Hoge Raad")) {
    return { tier: 1, multiplier: 1.15, label: "Hoge Raad (cassatie)", advisory: false };
  }
  if (
    name.includes("Raad van State") ||
    name.includes("Centrale Raad van Beroep") ||
    name.includes("College van Beroep voor het bedrijfsleven")
  ) {
    return { tier: 2, multiplier: 1.10, label: "Hoogste instantie (gespecialiseerd)", advisory: false };
  }
  // Checked before the generic Gerechtshof/Rechtbank patterns below: a small
  // Caribbean civil-service tribunal whose name ("Raad van Beroep in...")
  // would otherwise risk misclassification by naive substring matching.
  if (name.includes("Raad van Beroep in Ambtenarenzaken")) {
    return { tier: 3, multiplier: 1.05, label: "Appelinstantie", advisory: false };
  }
  if (name.includes("Gerechtshof") || name.includes("Gemeenschappelijk Hof van Justitie")) {
    // Judgment call: Gemeenschappelijk Hof (shared appellate court for Aruba,
    // Curacao, Sint Maarten, and the BES islands) is placed at appellate
    // parity with mainland Gerechtshoven on structural-function grounds, not
    // because the substantive law is identical -- flagged as a real judgment
    // call, not an obviously-correct one.
    return { tier: 3, multiplier: 1.05, label: "Appelinstantie", advisory: false };
  }
  if (name.includes("Rechtbank") || name.includes("Gerecht in eerste aanleg") || name.includes("Gerecht in Ambtenarenzaken")) {
    return { tier: 4, multiplier: 1.0, label: "Eerste aanleg", advisory: false };
  }

  // Unmatched (e.g. "Centrale Grondkamer", n=20): deliberately left neutral
  // rather than inventing a tier for an edge case this small.
  return UNKNOWN;
}
