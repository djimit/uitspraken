import { Suspense } from "react";
import {
  getPseudoSummaryFast,
  getPseudoCourtBreakdown,
  getPseudoAdoptionTrend,
  getPseudoCourtAdoption,
  getPseudoLegalAreaAdoption,
  getPseudoVocabulary,
  getPseudoCompleteness,
  getPseudoInconsistencies,
  getPseudoPiiTrend,
  getPseudoSeverityBreakdown,
} from "@/lib/pseudo-check";
import PseudoKPICards from "@/components/PseudoKPICards";
import PseudoByTypeChart from "@/components/PseudoByTypeChart";
import PseudoByCourtChart from "@/components/PseudoByCourtChart";
import PseudoAdoptionTrend from "@/components/PseudoAdoptionTrend";
import PseudoCourtScoreboard from "@/components/PseudoCourtScoreboard";
import PseudoLegalAreaChart from "@/components/PseudoLegalAreaChart";
import PseudoVocabulary from "@/components/PseudoVocabulary";
import PseudoCompleteness from "@/components/PseudoCompleteness";
import PseudoInconsistencies from "@/components/PseudoInconsistencies";
import PseudoPiiTrend from "@/components/PseudoPiiTrend";
import PseudoSeverityDonut from "@/components/PseudoSeverityDonut";
import PseudoSubNav from "@/components/PseudoSubNav";

export const revalidate = 120;

const Skeleton = ({ h = "h-80" }: { h?: string }) => (
  <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
);

// ── Section components (each awaits its own data) ──────────────────

async function OverviewSection() {
  const summary = getPseudoSummaryFast();
  return (
    <>
      <PseudoKPICards summary={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PseudoByTypeChart data={summary.by_type} />
        <SeveritySection />
      </div>
    </>
  );
}

async function SeveritySection() {
  const severity = getPseudoSeverityBreakdown();
  return <PseudoSeverityDonut data={severity} />;
}

async function PiiTrendSection() {
  const trend = getPseudoPiiTrend();
  return <PseudoPiiTrend data={trend} />;
}

async function AdoptionTrendSection() {
  const trend = getPseudoAdoptionTrend();
  return <PseudoAdoptionTrend data={trend} />;
}

async function InconsistencySection() {
  const stats = getPseudoInconsistencies();
  return <PseudoInconsistencies stats={stats} />;
}

async function CourtScoreboardSection() {
  const courts = getPseudoCourtAdoption();
  return <PseudoCourtScoreboard data={courts} />;
}

async function LegalAreaSection() {
  const areas = getPseudoLegalAreaAdoption();
  return <PseudoLegalAreaChart data={areas} />;
}

async function CompletenessSection() {
  const data = getPseudoCompleteness();
  return <PseudoCompleteness data={data} />;
}

async function VocabularySection() {
  const { labels, uniqueCount, sampleSize } = getPseudoVocabulary();
  return <PseudoVocabulary labels={labels} uniqueCount={uniqueCount} sampleSize={sampleSize} />;
}

async function PiiCourtSection() {
  const byCourt = getPseudoCourtBreakdown();
  return <PseudoByCourtChart data={byCourt} />;
}

// ── Page ────────────────────────────────────────────────────────────

export default async function PseudonimiseringPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pseudonimisering Audit
          </h1>
          <p className="text-gray-500 mt-1">
            Uitgebreide analyse van de naleving van de{" "}
            <a
              href="https://www.rechtspraak.nl/uitspraken/pseudonimiseringsrichtlijn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Pseudonimiseringsrichtlijn
            </a>
            . Visuele inzichten in adoptie, volledigheid en PII-lekken.
          </p>
        </div>
        <PseudoSubNav />
      </div>

      {/* ── Section 1: PII Leak Detection (KPI + type chart + severity) ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-red-500 rounded-full inline-block" />
          PII-lekdetectie
        </h2>
        <div className="space-y-4">
          <Suspense fallback={<Skeleton h="h-32" />}>
            <OverviewSection />
          </Suspense>
        </div>
      </section>

      {/* ── Section 2: PII Leak Trend ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-rose-500 rounded-full inline-block" />
          PII-lekken trend
        </h2>
        <Suspense fallback={<Skeleton h="h-64" />}>
          <PiiTrendSection />
        </Suspense>
      </section>

      {/* ── Section 3: Inconsistencies ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-500 rounded-full inline-block" />
          Inconsistenties in gepseudonimiseerde beslissingen
        </h2>
        <Suspense fallback={<Skeleton h="h-40" />}>
          <InconsistencySection />
        </Suspense>
      </section>

      {/* ── Section 4: Adoption Trend ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block" />
          Adoptie over tijd
        </h2>
        <Suspense fallback={<Skeleton h="h-72" />}>
          <AdoptionTrendSection />
        </Suspense>
      </section>

      {/* ── Section 5: Court Scoreboard ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-purple-500 rounded-full inline-block" />
          Adoptie per instantie
        </h2>
        <Suspense fallback={<Skeleton h="h-96" />}>
          <CourtScoreboardSection />
        </Suspense>
      </section>

      {/* ── Section 6: Legal Area ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-green-500 rounded-full inline-block" />
          Adoptie per rechtsgebied
        </h2>
        <Suspense fallback={<Skeleton h="h-96" />}>
          <LegalAreaSection />
        </Suspense>
      </section>

      {/* ── Section 7: Completeness (Strafrecht deep-dive) ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
          Volledigheid strafzaken
        </h2>
        <Suspense fallback={<Skeleton h="h-72" />}>
          <CompletenessSection />
        </Suspense>
      </section>

      {/* ── Section 8: Vocabulary ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-cyan-500 rounded-full inline-block" />
          Vocabulaire-analyse
        </h2>
        <Suspense fallback={<Skeleton h="h-96" />}>
          <VocabularySection />
        </Suspense>
      </section>

      {/* ── Section 9: PII by Court ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-violet-500 rounded-full inline-block" />
          PII-schendingen per instantie
        </h2>
        <Suspense fallback={<Skeleton />}>
          <PiiCourtSection />
        </Suspense>
      </section>

      {/* Link to bevindingen */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Individuele bevindingen bekijken?
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Bekijk en filter alle beslissingen met mogelijke PII-schendingen
          </p>
        </div>
        <a
          href="/pseudonimisering/bevindingen"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          Naar bevindingen &rarr;
        </a>
      </div>
    </div>
  );
}
