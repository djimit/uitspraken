import { getMaaike2026ByInstantieAndArea } from "@/lib/inhoudsindicatie-queries";
import { formatNL } from "@/lib/format";

export function IIMaaike2026BreakdownByArea() {
  const data = getMaaike2026ByInstantieAndArea();

  // Group by instantie (use instantie label which is now properly mapped)
  const grouped = data.reduce(
    (acc, row) => {
      const key = row.instantie || "Onbekend";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    },
    {} as Record<string, typeof data>
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([instantie, areas]) => (
        <div key={instantie} className="space-y-3">
          <h3 className="font-semibold text-slate-900">{instantie}</h3>

          {/* Sort by over_240_pct (problematic first) */}
          {[...areas]
            .sort((a, b) => b.over_240_pct - a.over_240_pct)
            .map((area) => {
              const isProblematic = area.over_240_pct > 50;

              return (
                <div key={area.legal_area_name} className={`border rounded-lg p-3 ${isProblematic ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{area.legal_area_name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {formatNL(area.count)} zaken | {formatNL(area.avg_chars)}c avg (~{formatNL(area.avg_words)}w)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${isProblematic ? "text-red-900" : "text-slate-900"}`}>{area.over_240_pct}%</div>
                      <div className={`text-xs ${isProblematic ? "text-red-700" : "text-slate-600"}`}>boven 40w (240c)</div>
                    </div>
                  </div>

                  {/* Extra info: how many over 80w? */}
                  {area.over_400_pct > 0 && (
                    <div className="mt-2 text-xs text-slate-600 p-2 bg-white rounded border border-slate-200">
                      <strong>{area.over_400_pct}%</strong> ook boven 80 woorden (400c) - ALERT!
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ))}

      {/* Insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-slate-700">
          <strong>Gebruik:</strong> Deze tabel laat per instantie en rechtsgebied zien welke combinaties problematisch
          zijn ({">"}40% boven 40 woorden). Dit helpt gericht in gesprek te gaan met de juiste teams/afdeli ngen.
        </p>
      </div>
    </div>
  );
}
