import type { RelationStats } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function RelationNetwork({ data }: { data: RelationStats }) {
  if (!data.total_relations) return null;

  const maxCount = data.by_type[0]?.count ?? 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
        Relatienetwerk
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {formatNL(data.decisions_with_relations)} beslissingen met{" "}
        {formatNL(data.total_relations)} onderlinge relaties
      </p>
      <div className="space-y-2">
        {data.by_type.map((r) => (
          <div key={r.type} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-32 text-right shrink-0 font-medium">
              {r.type}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-1.5"
                style={{
                  width: `${Math.max((r.count / maxCount) * 100, 10)}%`,
                }}
              >
                <span className="text-[9px] text-white font-medium">
                  {formatNL(r.count)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
