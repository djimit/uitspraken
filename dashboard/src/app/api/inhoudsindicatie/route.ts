import { NextResponse } from "next/server";
import {
  getInhoudsindicatieStats,
  getInhoudsindicatieByType,
  getInhoudsindicatieByCourt,
  getInhoudsindicatieByArea,
  getInhoudsindicatieLengthDistribution,
  getInhoudsindicatieTimeline,
  getInhoudsindicatieExamples,
  getInhoudsindicatieWordFrequency,
  getOutcomeDistribution,
  getCourtOutcomes,
  getLengthTrend,
  getCompressionRatio,
  getBigramFrequency,
  getLawReferences,
} from "@/lib/queries";

export const revalidate = 60;

export async function GET() {
  const stats = getInhoudsindicatieStats();
  const byType = getInhoudsindicatieByType();
  const byCourt = getInhoudsindicatieByCourt(25);
  const byArea = getInhoudsindicatieByArea(20);
  const lengthDist = getInhoudsindicatieLengthDistribution();
  const timeline = getInhoudsindicatieTimeline();
  const longest = getInhoudsindicatieExamples("longest", 5);
  const shortest = getInhoudsindicatieExamples("shortest", 5);
  const wordFreq = getInhoudsindicatieWordFrequency(40);
  const outcomes = getOutcomeDistribution();
  const courtOutcomes = getCourtOutcomes(15);
  const lengthTrend = getLengthTrend();
  const compression = getCompressionRatio();
  const bigrams = getBigramFrequency(25);
  const lawRefs = getLawReferences();

  return NextResponse.json({
    stats,
    byType,
    byCourt,
    byArea,
    lengthDist,
    timeline,
    longest,
    shortest,
    wordFreq,
    outcomes,
    courtOutcomes,
    lengthTrend,
    compression,
    bigrams,
    lawRefs,
  });
}
