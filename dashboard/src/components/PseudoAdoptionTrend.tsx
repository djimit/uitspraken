"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { AdoptionTrendEntry } from "@/lib/pseudo-check";

export default function PseudoAdoptionTrend({ data }: { data: AdoptionTrendEntry[] }) {
  const avg = data.length > 0
    ? Math.round(10 * data.reduce((s, d) => s + d.rate, 0) / data.length) / 10
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Pseudonimisering adoptie over tijd
        </h3>
        <span className="text-xs text-gray-400">
          Gemiddeld: {avg}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: 10, right: 10 }}>
          <defs>
            <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => {
              const [y, m] = v.split("-");
              return m === "01" ? y : m;
            }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
            width={45}
          />
          <ReferenceLine y={avg} stroke="#a5b4fc" strokeDasharray="4 4" />
          <Tooltip
            formatter={(v) => [`${v}%`, "Adoptie"]}
            labelFormatter={(l) => `Maand: ${l}`}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#6366f1"
            fill="url(#adoptionGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
