"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CourtTypeStats } from "@/lib/types";
import { formatNL } from "@/lib/format";

const COLORS = [
  "#1e40af",
  "#0369a1",
  "#059669",
  "#ca8a04",
  "#dc2626",
  "#7c3aed",
  "#64748b",
];

export default function CourtTypeOverview({
  data,
}: {
  data: CourtTypeStats[];
}) {
  if (!data.length) return null;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
        Verdeling per rechterlijke laag
      </h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="court_type"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => [
                formatNL(Number(value)),
                "Beslissingen",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.court_type} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs text-gray-600 flex-1">
                {d.court_type}
              </span>
              <span className="text-xs tabular-nums font-semibold text-gray-800">
                {formatNL(d.count)}
              </span>
              <span className="text-[10px] text-gray-400 w-10 text-right">
                {Math.round((d.count / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
