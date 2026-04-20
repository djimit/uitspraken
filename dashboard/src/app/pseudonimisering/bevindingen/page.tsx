import { Suspense } from "react";
import {
  getPseudoCandidatesFiltered,
  getPseudoFilterValues,
  type PseudoFilterOptions,
} from "@/lib/pseudo-check";
import PseudoSubNav from "@/components/PseudoSubNav";
import PseudoFilters from "@/components/PseudoFilters";
import PseudoViolationsTableEnhanced from "@/components/PseudoViolationsTableEnhanced";

export const revalidate = 120;

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

function buildBaseUrl(filters: PseudoFilterOptions): string {
  const params = new URLSearchParams();
  if (filters.piiType) params.set("type", filters.piiType);
  if (filters.court) params.set("court", filters.court);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.year) params.set("year", filters.year);
  const qs = params.toString();
  return qs ? `/pseudonimisering/bevindingen?${qs}` : "/pseudonimisering/bevindingen";
}

export default async function BevindigenPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const filters: PseudoFilterOptions = {
    piiType: params.type || undefined,
    court: params.court || undefined,
    severity: params.severity || undefined,
    year: params.year || undefined,
  };

  const filterValues = getPseudoFilterValues();
  const { decisions, total } = getPseudoCandidatesFiltered(page, PAGE_SIZE, filters);
  const baseUrl = buildBaseUrl(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pseudonimisering Bevindingen
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Alle beslissingen met mogelijke PII-schendingen. Filter op type, instantie, ernst of jaar.
          </p>
        </div>
        <PseudoSubNav />
      </div>

      {/* Filters */}
      <PseudoFilters
        types={filterValues.types}
        courts={filterValues.courts}
        severities={filterValues.severities}
        years={filterValues.years}
        activeFilters={filters}
        totalResults={total}
      />

      {/* Results table */}
      <PseudoViolationsTableEnhanced
        decisions={decisions}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        baseUrl={baseUrl}
      />
    </div>
  );
}
