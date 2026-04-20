import type { PipelineStats } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function PipelineStatus({ stats }: { stats: PipelineStats }) {
  const segments = [
    { label: "Opgehaald", value: stats.fetched, color: "bg-emerald-500" },
    { label: "Geen inhoud", value: stats.no_content, color: "bg-gray-300" },
    { label: "Mislukt", value: stats.failed, color: "bg-red-400" },
    { label: "Wachtend", value: stats.pending, color: "bg-blue-200" },
  ].filter((s) => s.value > 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Data Pipeline
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {stats.pct_complete}% compleet
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">
            {formatNL(stats.db_size_mb)} MB database
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {stats.courts_ref} instanties &middot; {stats.legal_areas_ref}{" "}
            rechtsgebieden &middot; {stats.procedure_types_ref} proceduresoorten
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${(seg.value / stats.total) * 100}%` }}
            title={`${seg.label}: ${formatNL(seg.value)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <span className="text-xs text-gray-500">
              {seg.label}:{" "}
              <span className="font-semibold text-gray-700">
                {formatNL(seg.value)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
