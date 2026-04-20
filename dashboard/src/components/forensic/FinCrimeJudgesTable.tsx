import type { FinCrimeJudge } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function FinCrimeJudgesTable({ data }: { data: FinCrimeJudge[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Gespecialiseerde financieel-strafrechtelijke rechters
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Rechters met de meeste witwas-, fraude- en FIOD-zaken. Specialisatie-index = % financieel van totaal.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
              <th className="py-2 pr-3">Rechter</th>
              <th className="py-2 px-2 text-right">Witwas</th>
              <th className="py-2 px-2 text-right">Fraude</th>
              <th className="py-2 px-2 text-right">FIOD</th>
              <th className="py-2 px-2 text-right">Fin. totaal</th>
              <th className="py-2 px-2 text-right">Alle zaken</th>
              <th className="py-2 px-2 w-28">Specialisatie</th>
              <th className="py-2 pl-2">Instantie(s)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const specPct = d.total_all > 0 ? Math.round(100 * d.total_financial / d.total_all) : 0;
              return (
                <tr key={d.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 pr-3 font-medium text-gray-800 text-xs whitespace-nowrap">
                    {d.name}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-red-700">{d.witwassen}</td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-orange-700">{d.fraude}</td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-blue-700">{d.fiod}</td>
                  <td className="py-2 px-2 text-right font-mono text-xs font-semibold">{formatNL(d.total_financial)}</td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-gray-400">{formatNL(d.total_all)}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${specPct > 60 ? "bg-red-500" : specPct > 40 ? "bg-orange-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(specPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{specPct}%</span>
                    </div>
                  </td>
                  <td className="py-2 pl-2 text-xs text-gray-500 max-w-[200px] truncate">
                    {d.courts?.split(",").map(c => c.replace("Rechtbank ", "Rb ").replace("Gerechtshof ", "Hof ").trim()).join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
