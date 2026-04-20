import type { WeekendDecision } from "@/lib/forensic-queries";

export default function WeekendAnomalies({ data }: { data: WeekendDecision[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          Weekend-uitspraken
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {total} totaal
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Uitspraken op zaterdag of zondag — ongebruikelijk en wijst op urgente zaken (bewaring, voorlopige voorziening).
      </p>
      <div className="space-y-1.5">
        {data.map((d) => {
          const maxCount = data[0]?.count || 1;
          return (
            <div key={d.court_name} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-56 truncate shrink-0">
                {d.court_name.replace("Rechtbank ", "Rb ").replace("Gerechtshof ", "Hof ")}
              </span>
              <div className="flex-1 h-4 bg-gray-50 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-500 w-8 text-right">{d.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
