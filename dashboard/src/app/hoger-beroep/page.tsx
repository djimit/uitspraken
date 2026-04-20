import { Suspense } from "react";
import {
  getAppealKPIs,
  getAppealByLegalArea,
  getAppealByCourt,
  getAppealTrend,
  getAppealCourtPairs,
  getAppealDuration,
  getAppealGevolgDetails,
  getRecentOverturned,
} from "@/lib/appeal-queries";
import AppealKPICards from "@/components/AppealKPICards";
import AppealByAreaChart from "@/components/AppealByAreaChart";
import AppealByCourtChart from "@/components/AppealByCourtChart";
import AppealTrendChart from "@/components/AppealTrendChart";
import AppealCourtFlow from "@/components/AppealCourtFlow";
import AppealDurationChart from "@/components/AppealDurationChart";
import AppealGevolgBreakdown from "@/components/AppealGevolgBreakdown";
import AppealRecentOverturned from "@/components/AppealRecentOverturned";
import Section from "@/components/Section";

export const revalidate = 120;

const Skeleton = ({ h = "h-80" }: { h?: string }) => (
  <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
);

// ── Section wrappers ──

async function KPISection() {
  const kpis = getAppealKPIs();
  return <AppealKPICards data={kpis} />;
}

async function GevolgSection() {
  const gevolg = getAppealGevolgDetails();
  return <AppealGevolgBreakdown data={gevolg} />;
}

async function TrendSection() {
  const trend = getAppealTrend();
  return <AppealTrendChart data={trend} />;
}

async function ByAreaSection() {
  const areas = getAppealByLegalArea();
  return <AppealByAreaChart data={areas} />;
}

async function ByCourtSection() {
  const courts = getAppealByCourt();
  return <AppealByCourtChart data={courts} />;
}

async function CourtFlowSection() {
  const pairs = getAppealCourtPairs();
  return <AppealCourtFlow data={pairs} />;
}

async function DurationSection() {
  const duration = getAppealDuration();
  return <AppealDurationChart data={duration} />;
}

async function RecentSection() {
  const recent = getRecentOverturned(25);
  return <AppealRecentOverturned data={recent} />;
}

// ── Page ──

export default async function HogerBeroepPage() {
  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hoger Beroep Analyse
        </h1>
        <p className="text-gray-500 mt-1">
          Inzicht in uitkomsten, vernietigingspercentages en doorlooptijden van
          hoger beroep zaken. Gebaseerd op de relaties tussen beslissingen in de
          Rechtspraak Open Data.
        </p>
      </div>

      {/* ── KPIs ── */}
      <Section id="hb-overzicht" title="Overzicht" subtitle="Kerngetallen hoger beroep" color="blue">
        <Suspense fallback={<Skeleton h="h-32" />}>
          <KPISection />
        </Suspense>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<Skeleton />}>
            <GevolgSection />
          </Suspense>
          <Suspense fallback={<Skeleton />}>
            <DurationSection />
          </Suspense>
        </div>
      </Section>

      {/* ── Trend ── */}
      <Section id="hb-trend" title="Trend" subtitle="Hoger beroep uitkomsten over tijd" color="indigo">
        <Suspense fallback={<Skeleton />}>
          <TrendSection />
        </Suspense>
      </Section>

      {/* ── Per rechtsgebied ── */}
      <Section id="hb-rechtsgebied" title="Per rechtsgebied" subtitle="Waar wordt het meest vernietigd?" color="orange">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <ByAreaSection />
        </Suspense>
      </Section>

      {/* ── Per instantie ── */}
      <Section id="hb-instantie" title="Per instantie" subtitle="Vernietigingspercentage per gerecht" color="green">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <ByCourtSection />
        </Suspense>
      </Section>

      {/* ── Court flow ── */}
      <Section id="hb-stromen" title="Stromen" subtitle="Welke rechtbanken worden door welke hoven beoordeeld?" color="purple">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <CourtFlowSection />
        </Suspense>
      </Section>

      {/* ── Recent overturned ── */}
      <Section id="hb-recent" title="Recent vernietigd" subtitle="Laatste vernietigde uitspraken" color="amber">
        <Suspense fallback={<Skeleton />}>
          <RecentSection />
        </Suspense>
      </Section>
    </div>
  );
}
