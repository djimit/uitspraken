import type { DataCompletenessField } from "@/lib/types";

export default function DataCompleteness({
  data,
}: {
  data: DataCompletenessField[];
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
        Datakwaliteit
      </h3>
      <div className="space-y-2.5">
        {data.map((f) => (
          <div key={f.field} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-28 text-right shrink-0 font-medium">
              {f.label}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  f.pct >= 95
                    ? "bg-emerald-500"
                    : f.pct >= 70
                      ? "bg-blue-500"
                      : f.pct >= 40
                        ? "bg-amber-500"
                        : "bg-red-400"
                }`}
                style={{ width: `${f.pct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-gray-500 w-12 text-right shrink-0">
              {f.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
