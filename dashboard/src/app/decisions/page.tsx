import { searchDecisions, getCourts, getLegalAreas, getProcedureBreakdown } from "@/lib/queries";
import type { DecisionListItem, CourtEntry, LegalAreaEntry, ProcedureEntry } from "@/lib/types";
import { formatNL } from "@/lib/format";
import ExportButton from "@/components/ExportButton";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const SORTABLE_COLUMNS = [
  { field: "decision_date", label: "Datum" },
  { field: "court_name", label: "Instantie" },
  { field: "decision_type", label: "Type" },
  { field: "procedure_type", label: "Procedure" },
] as const;

const OPTIONAL_COLUMNS = [
  { field: "procedure_type", label: "Procedure" },
  { field: "case_number", label: "Zaaknummer" },
  { field: "issued_date", label: "Publicatiedatum" },
] as const;

const DEFAULT_COLS = new Set(["ecli", "court_name", "decision_date", "decision_type", "summary"]);

export default async function DecisionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q || "";
  const court = params.court || "";
  const legalArea = params.legalArea || "";
  const type = params.type || "";
  const procedure = params.procedure || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const page = parseInt(params.page || "1");
  const pageSize = Math.min(Math.max(parseInt(params.pageSize || "25"), 10), 250);
  const sort = params.sort || "decision_date";
  const sortDir = (params.sortDir === "asc" ? "asc" : "desc") as "asc" | "desc";
  const colsParam = params.cols || "";

  // Parse visible optional columns
  const visibleOptional = new Set(colsParam ? colsParam.split(",") : []);

  const filters = {
    court: court || undefined,
    legalArea: legalArea || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    type: type || undefined,
    procedure: procedure || undefined,
  };

  const result = searchDecisions(q || undefined, filters, page, pageSize, sort, sortDir);

  const courts = getCourts();
  const areas = getLegalAreas();
  const procedures = getProcedureBreakdown({}, 50);
  const totalPages = Math.ceil(result.total / result.pageSize);

  // Export data is fetched lazily via API on button click (not on every page load)
  const exportData: Record<string, string>[] = [];

  // Build URL params helper
  const buildParams = (overrides: Record<string, string> = {}) => {
    const base: Record<string, string> = {
      ...(q && { q }),
      ...(court && { court }),
      ...(legalArea && { legalArea }),
      ...(type && { type }),
      ...(procedure && { procedure }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(pageSize !== 25 && { pageSize: String(pageSize) }),
      ...(sort !== "decision_date" && { sort }),
      ...(sortDir !== "desc" && { sortDir }),
      ...(colsParam && { cols: colsParam }),
      ...overrides,
    };
    // Remove keys with empty values
    Object.keys(base).forEach(k => { if (!base[k]) delete base[k]; });
    return new URLSearchParams(base).toString();
  };

  const hasFilters = !!(q || court || legalArea || type || procedure || dateFrom || dateTo);

  function sortUrl(field: string) {
    const nextDir = sort === field && sortDir === "desc" ? "asc" : "desc";
    return `/decisions?${buildParams({ sort: field, sortDir: nextDir, page: "1" })}`;
  }

  function sortIndicator(field: string) {
    if (sort !== field) return "";
    return sortDir === "desc" ? " ▼" : " ▲";
  }

  function toggleColUrl(field: string) {
    const next = new Set(visibleOptional);
    if (next.has(field)) {
      next.delete(field);
    } else {
      next.add(field);
    }
    const cols = Array.from(next).join(",");
    return `/decisions?${buildParams({ cols: cols || "", page: "1" })}`;
  }

  const colCount = 5 + visibleOptional.size;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Zoek beslissingen</h1>

      {/* Filters */}
      <form method="GET" className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Preserve sort/cols through form submission */}
        {sort !== "decision_date" && <input type="hidden" name="sort" value={sort} />}
        {sortDir !== "desc" && <input type="hidden" name="sortDir" value={sortDir} />}
        {colsParam && <input type="hidden" name="cols" value={colsParam} />}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Zoek in tekst..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 lg:col-span-2"
          />
          <select
            name="court"
            defaultValue={court}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Alle instanties</option>
            {courts.map((c: CourtEntry) => (
              <option key={c.court_name} value={c.court_name}>
                {c.court_name} ({formatNL(c.count)})
              </option>
            ))}
          </select>
          <select
            name="legalArea"
            defaultValue={legalArea}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Alle rechtsgebieden</option>
            {areas.map((a: LegalAreaEntry) => (
              <option key={a.legal_area_name} value={a.legal_area_name}>
                {a.legal_area_name} ({formatNL(a.count)})
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={type}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Alle typen</option>
            <option value="Uitspraak">Uitspraak</option>
            <option value="Conclusie">Conclusie</option>
          </select>
          <select
            name="procedure"
            defaultValue={procedure}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Alle procedures</option>
            {procedures.map((p: ProcedureEntry) => (
              <option key={p.procedure_type} value={p.procedure_type}>
                {p.procedure_type} ({formatNL(p.count)})
              </option>
            ))}
          </select>
          <input
            type="date"
            name="dateFrom"
            defaultValue={dateFrom}
            placeholder="Datum van"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="dateTo"
            defaultValue={dateTo}
            placeholder="Datum tot"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Zoeken
            </button>
            {hasFilters && (
              <a
                href="/decisions"
                className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium rounded-md hover:bg-red-50 transition-colors border border-red-200"
              >
                Wissen
              </a>
            )}
          </div>
        </div>
      </form>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {q && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Zoektekst: &quot;{q}&quot;
            </span>
          )}
          {court && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Instantie: {court}
            </span>
          )}
          {legalArea && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Rechtsgebied: {legalArea}
            </span>
          )}
          {type && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Type: {type}
            </span>
          )}
          {procedure && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Procedure: {procedure}
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Vanaf: {dateFrom}
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              Tot: {dateTo}
            </span>
          )}
        </div>
      )}

      {/* Results summary + controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            {formatNL(result.total)} resultaten
            {q && <> voor &quot;{q}&quot;</>}
            {" "} — Pagina {page} van {totalPages || 1}
          </p>
          <ExportButton
            data={exportData}
            filename={`beslissingen${q ? `-${q}` : ""}${court ? `-${court}` : ""}`}
            columns={[
              { key: "ecli", label: "ECLI" },
              { key: "instantie", label: "Instantie" },
              { key: "datum", label: "Datum" },
              { key: "type", label: "Type" },
              { key: "procedure", label: "Procedure" },
              { key: "zaaknummer", label: "Zaaknummer" },
              { key: "publicatiedatum", label: "Publicatiedatum" },
              { key: "samenvatting", label: "Samenvatting" },
            ]}
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Column toggles */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Kolommen:</span>
            {OPTIONAL_COLUMNS.map(col => (
              <a
                key={col.field}
                href={toggleColUrl(col.field)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  visibleOptional.has(col.field)
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {col.label}
              </a>
            ))}
          </div>
          {/* Row count */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Rijen:</span>
            {[25, 50, 100].map(size => (
              <a
                key={size}
                href={`/decisions?${buildParams({ pageSize: String(size), page: "1" })}`}
                className={`text-xs px-2 py-1 rounded ${
                  pageSize === size
                    ? "bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {size}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ECLI
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <a href={sortUrl("court_name")} className="hover:text-gray-700">
                  Instantie{sortIndicator("court_name")}
                </a>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <a href={sortUrl("decision_date")} className="hover:text-gray-700">
                  Datum{sortIndicator("decision_date")}
                </a>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <a href={sortUrl("decision_type")} className="hover:text-gray-700">
                  Type{sortIndicator("decision_type")}
                </a>
              </th>
              {visibleOptional.has("procedure_type") && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <a href={sortUrl("procedure_type")} className="hover:text-gray-700">
                    Procedure{sortIndicator("procedure_type")}
                  </a>
                </th>
              )}
              {visibleOptional.has("case_number") && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Zaaknummer
                </th>
              )}
              {visibleOptional.has("issued_date") && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <a href={sortUrl("issued_date")} className="hover:text-gray-700">
                    Publicatie{sortIndicator("issued_date")}
                  </a>
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Samenvatting
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {result.results.map((d: DecisionListItem) => (
              <tr key={d.ecli} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a
                    href={`/decisions/${encodeURIComponent(d.ecli)}`}
                    className="text-sm font-mono text-blue-700 hover:underline"
                  >
                    {d.ecli}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {d.court_name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {d.decision_date || "-"}
                </td>
                <td className="px-4 py-3">
                  {d.decision_type && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        d.decision_type === "Uitspraak"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {d.decision_type}
                    </span>
                  )}
                </td>
                {visibleOptional.has("procedure_type") && (
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {d.procedure_type || "-"}
                  </td>
                )}
                {visibleOptional.has("case_number") && (
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                    {d.case_number || "-"}
                  </td>
                )}
                {visibleOptional.has("issued_date") && (
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {d.issued_date || "-"}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {d.inhoudsindicatie || d.summary || "-"}
                </td>
              </tr>
            ))}
            {result.results.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                  Geen beslissingen gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/decisions?${buildParams({ page: String(page - 1) })}`}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Vorige
            </a>
          )}
          <span className="text-sm text-gray-500">
            Pagina {page} van {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/decisions?${buildParams({ page: String(page + 1) })}`}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Volgende
            </a>
          )}
        </div>
      )}
    </div>
  );
}
