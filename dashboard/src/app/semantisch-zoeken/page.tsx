import { hybridSearch } from "@/lib/hybrid-search";
import { getCourts, getLegalAreas, getProcedureBreakdown } from "@/lib/queries";
import type { CourtEntry, LegalAreaEntry, ProcedureEntry, HybridHit } from "@/lib/types";
import { formatNL } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

/** Renders an FTS5 snippet() string (delimited with [ ] around matched terms,
 *  see keywordSearchRanked in queries.ts) as text with <mark> around hits. */
function HighlightedSnippet({ snippet }: { snippet: string }) {
  const parts = snippet.split(/(\[[^\]]*\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function StrengthBadge({ strength }: { strength: HybridHit["semanticStrength"] }) {
  if (!strength) return null;
  const styles: Record<string, string> = {
    sterk: "bg-green-100 text-green-800",
    gemiddeld: "bg-blue-100 text-blue-800",
    zwak: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[strength]}`}>
      semantisch: {strength}
    </span>
  );
}

function ResultCard({ hit, age }: { hit: HybridHit; age: string | null }) {
  return (
    <li className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <a
            href={`/decisions/${encodeURIComponent(hit.ecli)}`}
            className="font-mono text-sm text-blue-700 hover:underline"
          >
            {hit.ecli}
          </a>
          {hit.title && <p className="text-sm text-gray-700 mt-0.5">{hit.title}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {hit.courtTier.label} (×{hit.courtTier.multiplier.toFixed(2)})
          </span>
          {hit.courtTier.advisory && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              niet-bindend advies
            </span>
          )}
        </div>
      </div>

      {hit.snippet && (
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          <HighlightedSnippet snippet={hit.snippet} />
        </p>
      )}

      {/* Relevance transparency panel: every component of final_score shown
          individually, never just one opaque number. */}
      <div className="flex items-center gap-3 flex-wrap mt-3 text-xs text-gray-500">
        <span>{hit.court_name || "onbekende instantie"}</span>
        <span>·</span>
        <span>{hit.decision_date || "datum onbekend"}{age && ` (${age})`}</span>
        {hit.keywordRank && (
          <>
            <span>·</span>
            <span>trefwoorden: #{hit.keywordRank}</span>
          </>
        )}
        {hit.semanticRank && (
          <>
            <span>·</span>
            <span>semantisch: #{hit.semanticRank}</span>
            <StrengthBadge strength={hit.semanticStrength} />
          </>
        )}
        {hit.recencyMultiplier > 1.001 && (
          <>
            <span>·</span>
            <span>recentheids-boost ×{hit.recencyMultiplier.toFixed(2)}</span>
          </>
        )}
        {hit.finalScore > 0 && (
          <>
            <span>·</span>
            <span title="gecombineerde score (RRF × instantie × recentheid)">
              score: {hit.finalScore.toFixed(4)}
            </span>
          </>
        )}
      </div>

      {(hit.relatedCases.length > 0 || hit.statuteRefs.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
          {hit.relatedCases.map((rel, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span className={`px-1.5 py-0.5 rounded font-medium ${
                rel.direction === "incoming" ? "bg-indigo-100 text-indigo-700" : "bg-teal-100 text-teal-700"
              }`}>
                {rel.direction === "incoming" ? "later beoordeeld in" : "eerdere aanleg"}
              </span>
              <span className="text-gray-500">{relationTypeLabel(rel.relation_type)}</span>
              {rel.other_ecli && (
                <a href={`/decisions/${encodeURIComponent(rel.other_ecli)}`} className="font-mono text-blue-700 hover:underline">
                  {rel.other_ecli}
                </a>
              )}
              {rel.relation_gevolg && (
                <span className="text-gray-400">({uriFragment(rel.relation_gevolg)})</span>
              )}
            </div>
          ))}
          {hit.statuteRefs.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-gray-400">Wetsverwijzingen:</span>
              {hit.statuteRefs.slice(0, 6).map((ref, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700" title={ref.identifier || undefined}>
                  {ref.label || ref.identifier}
                </span>
              ))}
              {hit.statuteRefs.length > 6 && (
                <span className="text-gray-400">+{hit.statuteRefs.length - 6} meer</span>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/** relation_type is a bare URI like "http://psi.rechtspraak.nl/hogerBeroep" --
 *  strip to the last path segment for a readable label. */
function relationTypeLabel(uri: string | null): string {
  if (!uri) return "onbekend";
  return uri.split("/").pop() || uri;
}

/** relation_gevolg/relation_aanleg use a "#" fragment, e.g.
 *  "http://psi.rechtspraak.nl/gevolg#bekrachtiging/bevestiging". */
function uriFragment(uri: string): string {
  return uri.split("#").pop() || uri;
}

function ageLabel(decisionDate: string | null): string | null {
  if (!decisionDate) return null;
  const date = new Date(decisionDate);
  if (Number.isNaN(date.getTime())) return null;
  const years = (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (years < 1) return "< 1 jaar oud";
  return `${Math.floor(years)} jaar oud`;
}

export default async function SemantischZoekenPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q || "";
  const court = params.court || "";
  const legalArea = params.legalArea || "";
  const procedure = params.procedure || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const page = parseInt(params.page || "1");
  const pageSize = Math.min(Math.max(parseInt(params.pageSize || "20"), 10), 100);

  const filters = {
    court: court || undefined,
    legalArea: legalArea || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    procedure: procedure || undefined,
  };

  const result = await hybridSearch(q || undefined, filters, page, pageSize);
  const courts = getCourts();
  const areas = getLegalAreas();
  const procedures = getProcedureBreakdown({}, 50);
  const totalPages = Math.ceil(result.total / result.pageSize);

  const buildParams = (overrides: Record<string, string> = {}) => {
    const base: Record<string, string> = {
      ...(q && { q }),
      ...(court && { court }),
      ...(legalArea && { legalArea }),
      ...(procedure && { procedure }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(pageSize !== 20 && { pageSize: String(pageSize) }),
      ...overrides,
    };
    Object.keys(base).forEach((k) => { if (!base[k]) delete base[k]; });
    return new URLSearchParams(base).toString();
  };

  const hasFilters = !!(court || legalArea || procedure || dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Semantisch zoeken</h1>
        <p className="text-sm text-gray-500 mt-1">
          Combineert trefwoordzoek (FTS5), semantisch zoeken (TurboVec) en een instantie-/recentheidsweging
          over het volledige corpus ({formatNL(195578)} uitspraken). Aanvulling op de{" "}
          <a href="/decisions" className="underline">gewone trefwoordzoek</a>, geen vervanging.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Dit is een retrieval-tool: het toont en rangschikt bestaande uitspraken, het genereert geen
          antwoorden of samenvattingen — verzonnen feiten of bronnen zijn daarmee structureel uitgesloten,
          niet enkel verminderd.
        </p>
      </div>

      {result.degraded === "keyword_only" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
          De semantische zoekservice is niet bereikbaar — resultaten zijn nu alleen op trefwoorden gebaseerd.
        </div>
      )}

      <form method="GET" className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Beschrijf waar de uitspraak over gaat..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 lg:col-span-2"
          />
          <select name="court" defaultValue={court} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Alle instanties</option>
            {courts.map((c: CourtEntry) => (
              <option key={c.court_name} value={c.court_name}>
                {c.court_name} ({formatNL(c.count)})
              </option>
            ))}
          </select>
          <select name="legalArea" defaultValue={legalArea} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Alle rechtsgebieden</option>
            {areas.map((a: LegalAreaEntry) => (
              <option key={a.legal_area_name} value={a.legal_area_name}>
                {a.legal_area_name} ({formatNL(a.count)})
              </option>
            ))}
          </select>
          <select name="procedure" defaultValue={procedure} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Alle procedures</option>
            {procedures.map((p: ProcedureEntry) => (
              <option key={p.procedure_type} value={p.procedure_type}>
                {p.procedure_type} ({formatNL(p.count)})
              </option>
            ))}
          </select>
          <input type="date" name="dateFrom" defaultValue={dateFrom} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input type="date" name="dateTo" defaultValue={dateTo} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-950 transition-colors">
              Zoeken
            </button>
            {(q || hasFilters) && (
              <a href="/semantisch-zoeken" className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium rounded-md hover:bg-red-50 transition-colors border border-red-200">
                Wissen
              </a>
            )}
          </div>
        </div>
      </form>

      <p className="text-sm text-gray-500">
        {formatNL(result.total)} resultaten{q && <> voor &quot;{q}&quot;</>} — Pagina {page} van {totalPages || 1}
      </p>

      <ul className="space-y-3">
        {result.hits.map((hit) => (
          <ResultCard key={hit.ecli} hit={hit} age={ageLabel(hit.decision_date)} />
        ))}
        {result.hits.length === 0 && (
          <li className="text-center text-gray-400 py-8">Geen resultaten gevonden.</li>
        )}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a href={`/semantisch-zoeken?${buildParams({ page: String(page - 1) })}`} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Vorige
            </a>
          )}
          <span className="text-sm text-gray-500">Pagina {page} van {totalPages}</span>
          {page < totalPages && (
            <a href={`/semantisch-zoeken?${buildParams({ page: String(page + 1) })}`} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Volgende
            </a>
          )}
        </div>
      )}
    </div>
  );
}
