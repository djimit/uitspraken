import { Suspense } from "react";
import {
  getFinCrimeKPIs,
  getFinCrimeTrend,
  getFinCrimeByCourt,
  getFinCrimeJudges,
  getPanelAppeal,
  getBurgerImpactTrend,
  getVreemdelingenTrend,
  getEncrochatTrend,
  getFaillissementTrend,
  getWeekendDecisions,
  getFinancialLawRefs,
  getSanctionTrend,
} from "@/lib/forensic-queries";
import ForensicKPICards from "@/components/forensic/ForensicKPICards";
import FinCrimeTrendChart from "@/components/forensic/FinCrimeTrendChart";
import FinCrimeByCourtChart from "@/components/forensic/FinCrimeByCourtChart";
import FinCrimeJudgesTable from "@/components/forensic/FinCrimeJudgesTable";
import PanelAppealChart from "@/components/forensic/PanelAppealChart";
import BurgerImpactChart from "@/components/forensic/BurgerImpactChart";
import FaillissementBarometer from "@/components/forensic/FaillissementBarometer";
import EncrochatTimeline from "@/components/forensic/EncrochatTimeline";
import FinancialLawRefs from "@/components/forensic/FinancialLawRefs";
import SanctionMonitor from "@/components/forensic/SanctionMonitor";
import WeekendAnomalies from "@/components/forensic/WeekendAnomalies";
import Section from "@/components/Section";

export const revalidate = 120;

const Skeleton = ({ h = "h-80" }: { h?: string }) => (
  <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
);

// ── Async section wrappers ──

async function KPISection() {
  const kpis = getFinCrimeKPIs();
  return <ForensicKPICards data={kpis} />;
}

async function TrendSection() {
  const trend = getFinCrimeTrend();
  return <FinCrimeTrendChart data={trend} />;
}

async function CourtSection() {
  const courts = getFinCrimeByCourt();
  return <FinCrimeByCourtChart data={courts} />;
}

async function JudgesSection() {
  const judges = getFinCrimeJudges();
  return <FinCrimeJudgesTable data={judges} />;
}

async function PanelSection() {
  const { entries, summary } = getPanelAppeal();
  return <PanelAppealChart entries={entries} summary={summary} />;
}

async function FaillissementSection() {
  const data = getFaillissementTrend();
  return <FaillissementBarometer data={data} />;
}

async function EncrochatSection() {
  const data = getEncrochatTrend();
  return <EncrochatTimeline data={data} />;
}

async function BurgerSection() {
  const burger = getBurgerImpactTrend();
  const vreem = getVreemdelingenTrend();
  return <BurgerImpactChart burgerData={burger} vreemdelingenData={vreem} />;
}

async function LawRefsSection() {
  const data = getFinancialLawRefs();
  return <FinancialLawRefs data={data} />;
}

async function SanctionSection() {
  const data = getSanctionTrend();
  return <SanctionMonitor data={data} />;
}

async function WeekendSection() {
  const data = getWeekendDecisions();
  return <WeekendAnomalies data={data} />;
}

// ── Page ──

export default async function ForensischPage() {
  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Forensisch &amp; Financieel
        </h1>
        <p className="text-gray-500 mt-1">
          Analyse van financieel-strafrechtelijke patronen, economische indicatoren
          en maatschappelijke impact vanuit het perspectief van forensisch rechercheurs,
          financieel analisten en burgers.
        </p>
      </div>

      {/* ── KPIs ── */}
      <Section id="ff-radar" title="Financial Crime Radar" subtitle="Overzicht van financieel-strafrechtelijke zaken in de dataset" color="blue">
        <Suspense fallback={<Skeleton h="h-24" />}>
          <KPISection />
        </Suspense>
      </Section>

      {/* ── Trend ── */}
      <Section id="ff-trend" title="Trendanalyse" subtitle="Witwassen, fraude, faillissement en crypto over tijd" color="orange">
        <Suspense fallback={<Skeleton />}>
          <TrendSection />
        </Suspense>
      </Section>

      {/* ── Faillissementen ── */}
      <Section id="ff-faillissement" title="Faillissementen Barometer" subtitle="Economische stresstest: faillissementszaken als vroege indicator" color="amber">
        <Suspense fallback={<Skeleton h="h-64" />}>
          <FaillissementSection />
        </Suspense>
      </Section>

      {/* ── Per instantie ── */}
      <Section id="ff-instantie" title="Per instantie" subtitle="Welke rechtbanken behandelen het meeste financieel-strafrechtelijke zaken?" color="green">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <CourtSection />
        </Suspense>
      </Section>

      {/* ── Gespecialiseerde rechters ── */}
      <Section id="ff-rechters" title="Gespecialiseerde rechters" subtitle="Rechters met de meeste financieel-strafrechtelijke ervaring" color="indigo">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <JudgesSection />
        </Suspense>
      </Section>

      {/* ── EncroChat ── */}
      <Section id="ff-encrochat" title="EncroChat Impact" subtitle="De nasleep van de EncroChat-hack op de Nederlandse strafrechtketen" color="purple">
        <Suspense fallback={<Skeleton h="h-48" />}>
          <EncrochatSection />
        </Suspense>
      </Section>

      {/* ── Panel vs Appeal ── */}
      <Section id="ff-panel" title="Enkelvoudig vs. Meervoudig" subtitle="Worden complexere zaken (meervoudige kamer) vaker vernietigd?" color="blue">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <PanelSection />
        </Suspense>
      </Section>

      {/* ── Burger Impact ── */}
      <Section id="ff-burger" title="Burger Impact" subtitle="Zaken die burgers direct raken: ontruimingen, toeslagen, vreemdelingenrecht" color="green">
        <Suspense fallback={<Skeleton />}>
          <BurgerSection />
        </Suspense>
      </Section>

      {/* ── Wetsartikelen ── */}
      <Section id="ff-wetten" title="Wetsartikelen" subtitle="Meest toegepaste financieel-juridische artikelen" color="orange">
        <Suspense fallback={<Skeleton h="h-96" />}>
          <LawRefsSection />
        </Suspense>
      </Section>

      {/* ── Sanctions + Weekend side by side ── */}
      <Section id="ff-signalen" title="Bijzondere signalen" subtitle="Sanctie-monitor en weekend-anomalieën" color="amber">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<Skeleton h="h-64" />}>
            <SanctionSection />
          </Suspense>
          <Suspense fallback={<Skeleton h="h-64" />}>
            <WeekendSection />
          </Suspense>
        </div>
      </Section>
    </div>
  );
}
