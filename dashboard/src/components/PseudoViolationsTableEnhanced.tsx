import type { PseudoCandidate } from "@/lib/pseudo-check";

const TYPE_BADGE: Record<string, string> = {
  "Mobiel nummer": "bg-red-100 text-red-800",
  "Vast nummer": "bg-red-50 text-red-700",
  "E-mailadres": "bg-red-100 text-red-800",
  "Straatnaam + nummer": "bg-orange-100 text-orange-800",
  Postcode: "bg-orange-100 text-orange-800",
  "BSN-achtig nummer": "bg-red-200 text-red-900",
  Kenteken: "bg-yellow-100 text-yellow-800",
  Geboortedatum: "bg-red-100 text-red-800",
};

const SEVERITY_DOT: Record<string, string> = {
  "Mobiel nummer": "bg-red-500",
  "Vast nummer": "bg-orange-500",
  "E-mailadres": "bg-red-500",
  "Straatnaam + nummer": "bg-orange-500",
  Postcode: "bg-orange-500",
  "BSN-achtig nummer": "bg-red-500",
  Kenteken: "bg-yellow-500",
  Geboortedatum: "bg-red-500",
};

function maxSeverity(types: string[]): "high" | "medium" | "low" {
  const HIGH = new Set(["Mobiel nummer", "E-mailadres", "BSN-achtig nummer", "Geboortedatum"]);
  const MED = new Set(["Vast nummer", "Straatnaam + nummer", "Postcode"]);
  if (types.some((t) => HIGH.has(t))) return "high";
  if (types.some((t) => MED.has(t))) return "medium";
  return "low";
}

const SEVERITY_ROW: Record<string, string> = {
  high: "border-l-4 border-l-red-400",
  medium: "border-l-4 border-l-orange-400",
  low: "border-l-4 border-l-yellow-400",
};

interface Props {
  decisions: PseudoCandidate[];
  page: number;
  pageSize: number;
  total: number;
  baseUrl: string;
}

export default function PseudoViolationsTableEnhanced({
  decisions,
  page,
  pageSize,
  total,
  baseUrl,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600 w-8" />
              <th className="text-left p-3 font-medium text-gray-600">ECLI</th>
              <th className="text-left p-3 font-medium text-gray-600">Instantie</th>
              <th className="text-left p-3 font-medium text-gray-600">Datum</th>
              <th className="text-left p-3 font-medium text-gray-600">Type zaak</th>
              <th className="text-left p-3 font-medium text-gray-600">Gevonden PII</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d) => {
              const types = d.types
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              const sev = maxSeverity(types);

              return (
                <tr
                  key={d.ecli}
                  className={`border-b border-gray-50 hover:bg-gray-50/80 ${SEVERITY_ROW[sev]}`}
                >
                  <td className="p-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                        sev === "high"
                          ? "bg-red-500"
                          : sev === "medium"
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                      }`}
                      title={`Ernst: ${sev}`}
                    />
                  </td>
                  <td className="p-3">
                    <a
                      href={`/pseudonimisering/${encodeURIComponent(d.ecli)}`}
                      className="text-blue-700 hover:underline font-mono text-xs"
                    >
                      {d.ecli}
                    </a>
                  </td>
                  <td className="p-3 text-gray-600 text-xs max-w-[200px] truncate">
                    {d.court_name || "\u2014"}
                  </td>
                  <td className="p-3 text-gray-600 text-xs whitespace-nowrap">
                    {d.decision_date || "\u2014"}
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[150px] truncate">
                    {d.decision_type || "\u2014"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {types.map((t, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            TYPE_BADGE[t] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              SEVERITY_DOT[t] || "bg-gray-400"
                            }`}
                          />
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {decisions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                  Geen resultaten gevonden met de huidige filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Pagina {page} van {totalPages} ({total} resultaten)
          </span>
          <div className="flex gap-1">
            {page > 1 && (
              <a
                href={`${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${page - 1}`}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Vorige
              </a>
            )}

            {/* Page number buttons */}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <a
                  key={p}
                  href={`${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${p}`}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {p}
                </a>
              );
            })}

            {page < totalPages && (
              <a
                href={`${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${page + 1}`}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Volgende
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
