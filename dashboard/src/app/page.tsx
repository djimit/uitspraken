import { Suspense } from "react";
import StatsCards from "@/components/StatsCards";
import TimelineChart from "@/components/TimelineChart";
import CourtBreakdown from "@/components/CourtBreakdown";
import LegalAreaBreakdown from "@/components/LegalAreaBreakdown";
import RecentDecisions from "@/components/RecentDecisions";
import WeekdayChart from "@/components/WeekdayChart";
import CourtTypeOverview from "@/components/CourtTypeOverview";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import RelationNetwork from "@/components/RelationNetwork";
import ProcedureTypeChart from "@/components/ProcedureTypeChart";
import FilterBar from "@/components/FilterBar";
import LatencyChart from "@/components/LatencyChart";
import LatencyByCourtChart from "@/components/LatencyByCourtChart";
import LatencyTrendChart from "@/components/LatencyTrendChart";
import Section from "@/components/Section";
import SectionNav from "@/components/SectionNav";
import CrossTabHeatmap from "@/components/CrossTabHeatmap";
import {
  getStats,
  getTimeline,
  getCourtBreakdown,
  getLegalAreaBreakdown,
  getRecentDecisions,
  getWeekdayDistribution,
  getCourtTypeStats,
  getCalendarData,
  getRelationStats,
  getProcedureBreakdown,
  getCourts,
  getLegalAreas,
  getStatsTrend,
  getLatencyDistribution,
  getLatencyByCourt,
  getLatencyTrend,
  getTimelineYoY,
  getCrossTab,
} from "@/lib/queries";
import type { Filters } from "@/lib/queries";

export const revalidate = 60;

const SECTIONS = [
  { id: "overzicht", label: "Overzicht" },
  { id: "tijdlijn", label: "Tijdlijn" },
  { id: "instanties", label: "Instanties" },
  { id: "analyse", label: "Analyse" },
  { id: "publicatie", label: "Publicatie" },
  { id: "relaties", label: "Relaties" },
  { id: "recent", label: "Recent" },
];

function parseFilters(params: Record<string, string | undefined>): Filters {
  return {
    court: params.court || undefined,
    legalArea: params.legalArea || undefined,
    type: params.type || undefined,
    procedure: params.procedure || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };
}

// ── Async section components for streaming ──
// Each runs its own queries and streams independently via Suspense

async function OverviewSection({ filters }: { filters: Filters }) {
  const stats = getStats(filters);
  const trend = getStatsTrend(filters);
  return <StatsCards stats={stats} trend={trend} />;
}

async function TimelineSection({ filters }: { filters: Filters }) {
  const timeline = getTimeline(filters);
  const yoy = getTimelineYoY(filters);
  const calendarData = getCalendarData(filters);
  return (
    <>
      <TimelineChart data={timeline} yoyData={yoy} />
      <CalendarHeatmap data={calendarData} />
    </>
  );
}

async function CourtsSection({ filters }: { filters: Filters }) {
  const courts = getCourtBreakdown(filters, 15);
  const legalAreas = getLegalAreaBreakdown(filters, 15);
  const courtTypes = getCourtTypeStats(filters);
  const weekdays = getWeekdayDistribution(filters);
  const procedures = getProcedureBreakdown(filters, 12);
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CourtBreakdown data={courts} />
        <LegalAreaBreakdown data={legalAreas} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourtTypeOverview data={courtTypes} />
        <WeekdayChart data={weekdays} />
        <ProcedureTypeChart data={procedures} />
      </div>
    </>
  );
}

async function AnalyseSection({ filters }: { filters: Filters }) {
  const crossTab = getCrossTab(filters);
  return <CrossTabHeatmap data={crossTab} />;
}

async function LatencySection({ filters }: { filters: Filters }) {
  const latencyDist = getLatencyDistribution(filters);
  const latencyByCourt = getLatencyByCourt(filters, 15);
  const latencyTrend = getLatencyTrend(filters);
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyChart data={latencyDist} />
        <LatencyTrendChart data={latencyTrend} />
      </div>
      <LatencyByCourtChart data={latencyByCourt} />
    </>
  );
}

async function RelationsSection() {
  const relations = getRelationStats();
  return <RelationNetwork data={relations} />;
}

async function RecentSection({ filters }: { filters: Filters }) {
  const recent = getRecentDecisions(filters, 10);
  return <RecentDecisions decisions={recent} />;
}

const SectionSkeleton = ({ h = "h-80" }: { h?: string }) => (
  <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
);

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const hasFilters = Object.values(filters).some(Boolean);

  const filterParts: string[] = [];
  if (filters.court) filterParts.push(filters.court);
  if (filters.legalArea) filterParts.push(filters.legalArea);
  if (filters.type) filterParts.push(filters.type);
  if (filters.procedure) filterParts.push(filters.procedure);
  const filterContext = filterParts.length > 0 ? `voor ${filterParts.join(", ")}` : null;

  // Only these lightweight queries run before first byte
  const allCourts = getCourts();
  const allAreas = getLegalAreas();
  const allProcedures = getProcedureBreakdown({}, 50);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Overview
          {filterContext && (
            <span className="text-lg font-normal text-blue-600 ml-2">
              {filterContext}
            </span>
          )}
        </h1>
        {hasFilters && (
          <a
            href={`/decisions?${new URLSearchParams(
              Object.fromEntries(
                Object.entries(params).filter(([, v]) => v)
              ) as Record<string, string>
            ).toString()}`}
            className="text-sm text-blue-700 hover:text-blue-900 font-medium hover:underline"
          >
            Bekijk beslissingen &rarr;
          </a>
        )}
      </div>

      <div className="sticky top-0 z-30">
        <FilterBar
          courts={allCourts}
          legalAreas={allAreas}
          procedures={allProcedures}
        />
      </div>

      <SectionNav sections={SECTIONS} />

      {/* ── Overzicht ── streams first */}
      <Section id="overzicht" title="Overzicht" subtitle="Kerngetallen en trends" color="blue">
        <Suspense fallback={<SectionSkeleton h="h-32" />}>
          <OverviewSection filters={filters} />
        </Suspense>
      </Section>

      {/* ── Tijdlijn ── */}
      <Section id="tijdlijn" title="Tijdlijn" subtitle="Beslissingen over tijd" color="blue">
        <Suspense fallback={<SectionSkeleton />}>
          <TimelineSection filters={filters} />
        </Suspense>
      </Section>

      {/* ── Instanties & Rechtsgebieden ── */}
      <Section id="instanties" title="Instanties & Rechtsgebieden" subtitle="Verdeling per instantie, rechtsgebied en procedure" color="green">
        <Suspense fallback={<SectionSkeleton h="h-96" />}>
          <CourtsSection filters={filters} />
        </Suspense>
      </Section>

      {/* ── Analyse ── */}
      <Section id="analyse" title="Analyse" subtitle="Hoe verhouden instanties en rechtsgebieden zich tot elkaar?" color="indigo">
        <Suspense fallback={<SectionSkeleton />}>
          <AnalyseSection filters={filters} />
        </Suspense>
      </Section>

      {/* ── Publicatievertraging ── */}
      <Section id="publicatie" title="Publicatievertraging" subtitle="Hoe lang duurt het voordat een uitspraak wordt gepubliceerd?" color="orange">
        <Suspense fallback={<SectionSkeleton h="h-96" />}>
          <LatencySection filters={filters} />
        </Suspense>
      </Section>

      {/* ── Relaties ── */}
      <Section id="relaties" title="Relaties" subtitle="Onderlinge verbanden tussen beslissingen" color="purple">
        <Suspense fallback={<SectionSkeleton />}>
          <RelationsSection />
        </Suspense>
      </Section>

      {/* ── Recent ── */}
      <Section id="recent" title="Recente beslissingen" subtitle="Laatst gepubliceerde beslissingen" color="gray">
        <Suspense fallback={<SectionSkeleton />}>
          <RecentSection filters={filters} />
        </Suspense>
      </Section>
    </div>
  );
}
