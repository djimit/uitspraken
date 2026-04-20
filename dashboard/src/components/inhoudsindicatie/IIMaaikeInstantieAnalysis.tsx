import { getMaaike2026ByInstantie } from "@/lib/inhoudsindicatie-queries";
import { formatNL } from "@/lib/format";

export async function IIMaaikeInstantieAnalysis() {
  const data = getMaaike2026ByInstantie().sort((a, b) => b.avg_chars - a.avg_chars);

  return (
    <div className="space-y-4">
      {data.map((inst) => {
        const totalBucket = inst.bucket_under_50w + inst.bucket_50_100w + inst.bucket_over_100w;
        const pct_under = totalBucket > 0 ? Math.round((inst.bucket_under_50w / totalBucket) * 100) : 0;
        const pct_50_100 = totalBucket > 0 ? Math.round((inst.bucket_50_100w / totalBucket) * 100) : 0;
        const pct_over = totalBucket > 0 ? Math.round((inst.bucket_over_100w / totalBucket) * 100) : 0;

        const statusColor = pct_under >= 60 ? "green" : pct_under >= 40 ? "amber" : "red";
        const statusLabel =
          pct_under >= 60
            ? "✓ Goed (≥60%)"
            : pct_under >= 40
              ? "⚠ Redelijk (40-60%)"
              : "✗ Problematisch (<40%)";

        return (
          <div key={inst.instantie} className={`border rounded-lg p-4 ${statusColor === "green" ? "border-green-200 bg-green-50" : statusColor === "amber" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{inst.instantie_label}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {formatNL(inst.count)} zaken | Gemiddeld: {formatNL(inst.avg_chars)}c (~{formatNL(inst.avg_words)}w)
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${statusColor === "green" ? "text-green-900" : statusColor === "amber" ? "text-amber-900" : "text-red-900"}`}>
                  {pct_under}%
                </div>
                <div className={`text-xs ${statusColor === "green" ? "text-green-700" : statusColor === "amber" ? "text-amber-700" : "text-red-700"}`}>
                  {"<50w"}
                </div>
              </div>
            </div>

            {/* Buckets */}
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-32">{"<50w (<250c):"}</span>
                <div className="flex-1 bg-gray-200 rounded h-2">
                  <div className="bg-green-500 h-2 rounded" style={{ width: `${pct_under}%` }} />
                </div>
                <span className="w-12 text-right">{pct_under}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-32">50-100w (250-500c):</span>
                <div className="flex-1 bg-gray-200 rounded h-2">
                  <div className="bg-yellow-500 h-2 rounded" style={{ width: `${pct_50_100}%` }} />
                </div>
                <span className="w-12 text-right">{pct_50_100}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-32">{">100w (>500c):"}</span>
                <div className="flex-1 bg-gray-200 rounded h-2">
                  <div className="bg-red-500 h-2 rounded" style={{ width: `${pct_over}%` }} />
                </div>
                <span className="w-12 text-right">{pct_over}%</span>
              </div>
            </div>

            {/* Status */}
            <div className={`mt-3 p-2 rounded text-xs font-semibold ${statusColor === "green" ? "bg-green-100 text-green-800" : statusColor === "amber" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
              {statusLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}
