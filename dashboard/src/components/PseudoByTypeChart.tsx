"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PseudoSummary } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

const SEVERITY_COLORS: Record<string, string> = {
  high: "#dc2626",
  medium: "#ea580c",
  low: "#ca8a04",
};

export default function PseudoByTypeChart({ data }: { data: PseudoSummary["by_type"] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Schendingen per type</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 120, right: 20 }}>
          <XAxis type="number" tickFormatter={(v) => formatNL(Number(v))} />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => formatNL(Number(v))} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={SEVERITY_COLORS[entry.severity] || "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> Hoog
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-orange-600 inline-block" /> Midden
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-600 inline-block" /> Laag
        </span>
      </div>
    </div>
  );
}
