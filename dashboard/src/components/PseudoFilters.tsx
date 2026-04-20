"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  types: string[];
  courts: string[];
  severities: string[];
  years: string[];
  activeFilters: {
    piiType?: string;
    court?: string;
    severity?: string;
    year?: string;
  };
  totalResults: number;
}

const SEVERITY_LABELS: Record<string, string> = {
  high: "Hoog",
  medium: "Midden",
  low: "Laag",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-yellow-100 text-yellow-800",
};

export default function PseudoFilters({
  types,
  courts,
  severities,
  years,
  activeFilters,
  totalResults,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when changing filters
      params.delete("page");
      startTransition(() => {
        router.push(`/pseudonimisering/bevindingen?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push("/pseudonimisering/bevindingen");
    });
  }, [router]);

  const hasFilters =
    activeFilters.piiType ||
    activeFilters.court ||
    activeFilters.severity ||
    activeFilters.year;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* PII Type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            PII Type
          </label>
          <select
            value={activeFilters.piiType || ""}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
          >
            <option value="">Alle types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Court */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Instantie
          </label>
          <select
            value={activeFilters.court || ""}
            onChange={(e) => updateFilter("court", e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          >
            <option value="">Alle instanties</option>
            {courts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Ernst
          </label>
          <select
            value={activeFilters.severity || ""}
            onChange={(e) => updateFilter("severity", e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
          >
            <option value="">Alle</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s] || s}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Jaar
          </label>
          <select
            value={activeFilters.year || ""}
            onChange={(e) => updateFilter("year", e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
          >
            <option value="">Alle jaren</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            Filters wissen
          </button>
        )}
      </div>

      {/* Active filters + results count */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-xs text-gray-500">
          {isPending ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Laden...
            </span>
          ) : (
            <>{totalResults} resultaten</>
          )}
        </span>

        {/* Active filter badges */}
        {activeFilters.piiType && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {activeFilters.piiType}
          </span>
        )}
        {activeFilters.court && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 max-w-[200px] truncate">
            {activeFilters.court}
          </span>
        )}
        {activeFilters.severity && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              SEVERITY_COLORS[activeFilters.severity] || "bg-gray-100 text-gray-800"
            }`}
          >
            {SEVERITY_LABELS[activeFilters.severity] || activeFilters.severity}
          </span>
        )}
        {activeFilters.year && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
            {activeFilters.year}
          </span>
        )}
      </div>
    </div>
  );
}
