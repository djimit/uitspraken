import { Suspense } from "react";
import {
  getJudgeDetails,
  getJudgesByArea,
  getJudgesByCourt,
  getJudgeKPIs,
  getCourts,
  getLegalAreas,
  getProcedureBreakdown,
} from "@/lib/queries";
import type { Filters } from "@/lib/queries";
import JudgeTable from "@/components/JudgeTable";
import JudgeAreaChart from "@/components/JudgeAreaChart";
import JudgeCourtChart from "@/components/JudgeCourtChart";
import JudgeKPICards from "@/components/JudgeKPICards";
import FilterBar from "@/components/FilterBar";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const Skeleton = ({ h = "h-80" }: { h?: string }) => (
  <div className={`${h} bg-gray-100 rounded-lg animate-pulse`} />
);

async function KPISection({ filters }: { filters: Filters }) {
  const kpis = getJudgeKPIs(filters);
  return <JudgeKPICards kpis={kpis} />;
}

async function ChartsSection({ filters }: { filters: Filters }) {
  const byArea = getJudgesByArea(filters, 15);
  const byCourt = getJudgesByCourt(filters, 15);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <JudgeAreaChart data={byArea} />
      <JudgeCourtChart data={byCourt} />
    </div>
  );
}

async function TableSection({ filters }: { filters: Filters }) {
  const judges = getJudgeDetails(filters, 100);
  return <JudgeTable judges={judges} />;
}

export default async function JudgesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: Filters = {
    court: params.court || undefined,
    legalArea: params.legalArea || undefined,
    type: params.type || undefined,
    procedure: params.procedure || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
  };

  const filterParts: string[] = [];
  if (filters.court) filterParts.push(filters.court);
  if (filters.legalArea) filterParts.push(filters.legalArea);
  if (filters.type) filterParts.push(filters.type);
  const filterContext = filterParts.length > 0 ? ` — ${filterParts.join(", ")}` : "";

  // Only lightweight queries before first byte
  const allCourts = getCourts();
  const allAreas = getLegalAreas();
  const allProcedures = getProcedureBreakdown({}, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Rechters & Raadsheren
          {filterContext && (
            <span className="text-lg font-normal text-blue-600 ml-2">
              {filterContext}
            </span>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Analyse van rechters, hun activiteit, rechtsgebieden en instanties.
        </p>
      </div>

      <div className="sticky top-0 z-30">
        <FilterBar
          courts={allCourts}
          legalAreas={allAreas}
          procedures={allProcedures}
        />
      </div>

      <Suspense fallback={<Skeleton h="h-24" />}>
        <KPISection filters={filters} />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <ChartsSection filters={filters} />
      </Suspense>

      <Suspense fallback={<Skeleton h="h-96" />}>
        <TableSection filters={filters} />
      </Suspense>
    </div>
  );
}
