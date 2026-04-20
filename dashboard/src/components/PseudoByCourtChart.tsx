"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PseudoSummary } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

export default function PseudoByCourtChart({ data }: { data: PseudoSummary["by_court"] }) {
  const top = data.slice(0, 15);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Schendingen per instantie</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, top.length * 32)}>
        <BarChart data={top} layout="vertical" margin={{ left: 180, right: 20 }}>
          <XAxis type="number" tickFormatter={(v) => formatNL(Number(v))} />
          <YAxis
            type="category"
            dataKey="court_name"
            width={170}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v) => formatNL(Number(v))} />
          <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
