"use client";

import type { AppealCourtPair } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

function getBarColor(pct: number): string {
  if (pct >= 40) return "bg-red-500";
  if (pct >= 30) return "bg-orange-500";
  if (pct >= 20) return "bg-yellow-500";
  return "bg-green-500";
}

export default function AppealCourtFlow({ data }: { data: AppealCourtPair[] }) {
  const top = data.slice(0, 20);
  const maxTotal = Math.max(...top.map((d) => d.total), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Hoger beroep stromen tussen instanties
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Welke rechtbanken worden het meest door welke gerechtshoven beoordeeld?
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
              <th className="py-2 pr-3">Eerste aanleg</th>
              <th className="py-2 px-3">Hoger beroep</th>
              <th className="py-2 px-3 text-right">Zaken</th>
              <th className="py-2 px-3 w-48">Uitkomst</th>
              <th className="py-2 pl-3 text-right">Vernietigd</th>
            </tr>
          </thead>
          <tbody>
            {top.map((d, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 pr-3 text-gray-800 font-medium text-xs">
                  {d.from_court.replace("Rechtbank ", "Rb ").replace("Gerechtshof ", "Hof ")}
                </td>
                <td className="py-2 px-3 text-gray-600 text-xs">
                  {d.to_court.replace("Rechtbank ", "Rb ").replace("Gerechtshof ", "Hof ")}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs">{formatNL(d.total)}</td>
                <td className="py-2 px-3">
                  <div className="flex h-4 rounded overflow-hidden" style={{ width: `${Math.max(20, (d.total / maxTotal) * 100)}%` }}>
                    <div
                      className="bg-green-500"
                      style={{ width: `${d.total > 0 ? (d.bekrachtigd / d.total) * 100 : 0}%` }}
                      title={`Bekrachtigd: ${d.bekrachtigd}`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${d.total > 0 ? (d.vernietigd / d.total) * 100 : 0}%` }}
                      title={`Vernietigd: ${d.vernietigd}`}
                    />
                    <div
                      className="bg-gray-300"
                      style={{ width: `${d.total > 0 ? ((d.total - d.bekrachtigd - d.vernietigd) / d.total) * 100 : 0}%` }}
                    />
                  </div>
                </td>
                <td className="py-2 pl-3 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getBarColor(d.vernietigings_pct)}`}>
                    {d.vernietigings_pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Bekrachtigd</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Vernietigd</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 inline-block" /> Overig</span>
      </div>
    </div>
  );
}
