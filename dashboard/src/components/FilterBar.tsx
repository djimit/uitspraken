"use client";

import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatNL } from "@/lib/format";

interface FilterBarProps {
  courts: { court_name: string; count: number }[];
  legalAreas: { legal_area_name: string; count: number }[];
  procedures: { procedure_type: string; count: number }[];
}

export default function FilterBar({ courts, legalAreas, procedures }: FilterBarProps) {
  const { setFilter, clearFilters, getFilter, hasFilters, isPending } =
    useFilterNavigation();

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-end gap-3">
        {/* Court */}
        <div className="min-w-[180px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Instantie
          </label>
          <select
            value={getFilter("court") ?? ""}
            onChange={(e) => setFilter("court", e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle instanties</option>
            {courts.map((c) => (
              <option key={c.court_name} value={c.court_name}>
                {c.court_name} ({formatNL(c.count)})
              </option>
            ))}
          </select>
        </div>

        {/* Legal Area */}
        <div className="min-w-[180px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Rechtsgebied
          </label>
          <select
            value={getFilter("legalArea") ?? ""}
            onChange={(e) => setFilter("legalArea", e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle rechtsgebieden</option>
            {legalAreas.map((a) => (
              <option key={a.legal_area_name} value={a.legal_area_name}>
                {a.legal_area_name} ({formatNL(a.count)})
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Type
          </label>
          <select
            value={getFilter("type") ?? ""}
            onChange={(e) => setFilter("type", e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle typen</option>
            <option value="Uitspraak">Uitspraak</option>
            <option value="Conclusie">Conclusie</option>
          </select>
        </div>

        {/* Procedure */}
        <div className="min-w-[180px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Procedure
          </label>
          <select
            value={getFilter("procedure") ?? ""}
            onChange={(e) => setFilter("procedure", e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle procedures</option>
            {procedures.map((p) => (
              <option key={p.procedure_type} value={p.procedure_type}>
                {p.procedure_type} ({formatNL(p.count)})
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Datum van
          </label>
          <input
            type="date"
            value={getFilter("dateFrom") ?? ""}
            onChange={(e) => setFilter("dateFrom", e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div className="min-w-[140px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Datum tot
          </label>
          <input
            type="date"
            value={getFilter("dateTo") ?? ""}
            onChange={(e) => setFilter("dateTo", e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          >
            Wis filters
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <ActiveChips />
      )}
    </div>
  );
}

function ActiveChips() {
  const { getFilter, setFilter } = useFilterNavigation();

  const filters = [
    { key: "court", label: "Instantie" },
    { key: "legalArea", label: "Rechtsgebied" },
    { key: "type", label: "Type" },
    { key: "procedure", label: "Procedure" },
    { key: "dateFrom", label: "Vanaf" },
    { key: "dateTo", label: "Tot" },
  ];

  const active = filters
    .map((f) => ({ ...f, value: getFilter(f.key) }))
    .filter((f) => f.value);

  if (!active.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
      {active.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full"
        >
          <span className="font-medium">{f.label}:</span> {f.value}
          <button
            onClick={() => setFilter(f.key, null)}
            className="ml-0.5 hover:text-blue-900 font-bold"
            aria-label={`Verwijder filter ${f.label}`}
          >
            &times;
          </button>
        </span>
      ))}
    </div>
  );
}
