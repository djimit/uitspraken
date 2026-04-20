import type { CompressionBucket } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IICompression({
  data,
}: {
  data: CompressionBucket[];
}) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Compressieverhouding</h2>
      <p className="text-sm text-gray-400 mb-4">
        Hoe verhoudt de lengte van de inhoudsindicatie zich tot de volledige
        uitspraaktekst? Een lagere ratio betekent meer samenvatting.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">
                Uitspraaklengte
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Aantal
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Gem. uitspraak
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Gem. inhoudsindicatie
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">
                Ratio
              </th>
              <th className="py-3 px-4 font-semibold text-gray-600">Visueel</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.body_category}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 font-medium">{row.body_category}</td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {formatNL(row.count)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-gray-500">
                  {formatNL(row.avg_body_length)} tekens
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-gray-500">
                  {formatNL(row.avg_ii_length)} tekens
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-purple-700">
                  {row.ratio_pct}%
                </td>
                <td className="py-3 px-4 w-32">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: `${Math.min(row.ratio_pct * 5, 100)}%`,
                        }}
                      />
                    </div>
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
