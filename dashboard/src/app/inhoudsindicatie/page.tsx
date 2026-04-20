import { Suspense } from "react";
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
  getCourts,
  getLegalAreas,
  getProcedureBreakdown,
} from "@/lib/queries";
import FilterBar from "@/components/FilterBar";
import IIStatsCards from "@/components/inhoudsindicatie/IIStatsCards";
import IICoverageTimeline from "@/components/inhoudsindicatie/IICoverageTimeline";
import IILengthDistribution from "@/components/inhoudsindicatie/IILengthDistribution";
import IIByCourtChart from "@/components/inhoudsindicatie/IIByCourtChart";
import IIByAreaChart from "@/components/inhoudsindicatie/IIByAreaChart";
import IIByTypeTable from "@/components/inhoudsindicatie/IIByTypeTable";
import IIWordCloud from "@/components/inhoudsindicatie/IIWordCloud";
import IIExamples from "@/components/inhoudsindicatie/IIExamples";
import IIOutcomes from "@/components/inhoudsindicatie/IIOutcomes";
import IICourtOutcomes from "@/components/inhoudsindicatie/IICourtOutcomes";
import IILengthTrend from "@/components/inhoudsindicatie/IILengthTrend";
import IICompression from "@/components/inhoudsindicatie/IICompression";
import IIBigrams from "@/components/inhoudsindicatie/IIBigrams";
import IILawReferences from "@/components/inhoudsindicatie/IILawReferences";

export const revalidate = 60;

const Skeleton = ({ h = "h-80" }: { h?: string }) => (
  <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
);

// ── Streamed section components ──

async function StatsSection() {
  const stats = getInhoudsindicatieStats();
  return <IIStatsCards stats={stats} />;
}

async function CoverageSection() {
  const timeline = getInhoudsindicatieTimeline();
  const lengthTrend = getLengthTrend();
  const lengthDist = getInhoudsindicatieLengthDistribution();
  const byCourt = getInhoudsindicatieByCourt(25);
  const byArea = getInhoudsindicatieByArea(20);
  const byType = getInhoudsindicatieByType();
  return (
    <>
      <IICoverageTimeline data={timeline} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IILengthTrend data={lengthTrend} />
        <IILengthDistribution data={lengthDist} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IIByCourtChart data={byCourt} />
        <IIByAreaChart data={byArea} />
      </div>
      <IIByTypeTable data={byType} />
    </>
  );
}

async function ContentSection() {
  const outcomes = getOutcomeDistribution();
  const courtOutcomes = getCourtOutcomes(15);
  const lawRefs = getLawReferences();
  const bigrams = getBigramFrequency(25);
  const wordFreq = getInhoudsindicatieWordFrequency(40);
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IIOutcomes data={outcomes} />
        <IICourtOutcomes data={courtOutcomes} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IILawReferences data={lawRefs} />
        <IIBigrams data={bigrams} />
      </div>
      <IIWordCloud data={wordFreq} />
    </>
  );
}

async function StructureSection() {
  const compression = getCompressionRatio();
  const longest = getInhoudsindicatieExamples("longest", 5);
  const shortest = getInhoudsindicatieExamples("shortest", 5);
  return (
    <>
      <IICompression data={compression} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IIExamples title="Langste inhoudsindicaties" examples={longest} />
        <IIExamples title="Kortste inhoudsindicaties" examples={shortest} />
      </div>
    </>
  );
}

export default async function InhoudsindicatiePage() {
  const allCourts = getCourts();
  const allAreas = getLegalAreas();
  const allProcedures = getProcedureBreakdown({}, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Inhoudsindicatie Analyse
        </h1>
        <p className="text-gray-500 mt-1">
          Hoe wordt de inhoudsindicatie gebruikt in de rechtspraak? Analyse van
          aanwezigheid, lengte, inhoud, uitkomsten en wetsverwijzingen per
          instantie, rechtsgebied en type beslissing.
        </p>
      </div>

      <div className="sticky top-0 z-30">
        <FilterBar
          courts={allCourts}
          legalAreas={allAreas}
          procedures={allProcedures}
        />
      </div>

      {/* Stats stream first */}
      <Suspense fallback={<Skeleton h="h-24" />}>
        <StatsSection />
      </Suspense>

      {/* Coverage & Trends */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block" />
          Dekking &amp; Trends
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Wanneer en waar worden inhoudsindicaties gebruikt?
        </p>
      </div>
      <Suspense fallback={<Skeleton h="h-96" />}>
        <CoverageSection />
      </Suspense>

      {/* Content Analysis */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-purple-600 rounded-full inline-block" />
          Inhoudelijke analyse
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Wat staat er in de inhoudsindicaties? Uitkomsten, wetsverwijzingen en
          veelgebruikte termen.
        </p>
      </div>
      <Suspense fallback={<Skeleton h="h-96" />}>
        <ContentSection />
      </Suspense>

      {/* Structure & Compression */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block" />
          Structuur &amp; Compressie
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Hoe verhoudt de inhoudsindicatie zich tot de volledige uitspraak?
        </p>
      </div>
      <Suspense fallback={<Skeleton h="h-80" />}>
        <StructureSection />
      </Suspense>
    </div>
  );
}
