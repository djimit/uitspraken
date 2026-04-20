import type { PseudoCandidate } from "@/lib/pseudo-check";

const TYPE_BADGE: Record<string, string> = {
  Mobiel: "bg-red-100 text-red-800",
  Email: "bg-red-100 text-red-800",
  Adres: "bg-orange-100 text-orange-800",
  Postcode: "bg-orange-100 text-orange-800",
  Geboortedatum: "bg-red-100 text-red-800",
};

interface Props {
  decisions: PseudoCandidate[];
  page: number;
  pageSize: number;
  total: number;
}

export default function PseudoViolationsTable({ decisions, page, pageSize, total }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Beslissingen met mogelijke schendingen ({total})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600">ECLI</th>
              <th className="text-left p-3 font-medium text-gray-600">Instantie</th>
              <th className="text-left p-3 font-medium text-gray-600">Datum</th>
              <th className="text-left p-3 font-medium text-gray-600">Gevonden types</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d) => {
              const types = d.types
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

              return (
                <tr key={d.ecli} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3">
                    <a
                      href={`/pseudonimisering/${encodeURIComponent(d.ecli)}`}
                      className="text-blue-700 hover:underline font-mono text-xs"
                    >
                      {d.ecli}
                    </a>
                  </td>
                  <td className="p-3 text-gray-600 text-xs">{d.court_name || "—"}</td>
                  <td className="p-3 text-gray-600 text-xs">{d.decision_date || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {types.map((t, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE[t] || "bg-gray-100 text-gray-700"}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Pagina {page} van {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/pseudonimisering?page=${page - 1}`}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                Vorige
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/pseudonimisering?page=${page + 1}`}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
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
