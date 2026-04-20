import type { InhoudsindicatieByType } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IIByTypeTable({
  data,
}: {
  data: InhoudsindicatieByType[];
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Per type beslissing</h2>
      <p className="text-sm text-gray-400 mb-4">
        Vergelijking inhoudsindicatie-gebruik tussen uitspraken en conclusies
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">
                Type
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Totaal
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Met inhoudsindicatie
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Dekking
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Gem. lengte
              </th>
              <th className="py-3 px-4 font-semibold text-gray-600">
                Visueel
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.decision_type}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 font-medium">{row.decision_type}</td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {formatNL(row.total)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {formatNL(row.with_ii)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold">
                  {row.pct}%
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-gray-500">
                  {row.avg_length
                    ? `${formatNL(row.avg_length)} tekens`
                    : "—"}
                </td>
                <td className="py-3 px-4 w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {row.pct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
