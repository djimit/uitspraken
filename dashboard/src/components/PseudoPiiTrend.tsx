"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PiiTrendEntry } from "@/lib/pseudo-check";

export default function PseudoPiiTrend({ data }: { data: PiiTrendEntry[] }) {
  const avg =
    data.length > 0
      ? Math.round(100 * data.reduce((s, d) => s + d.rate, 0) / data.length) / 100
      : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          PII-lekken over tijd
        </h3>
        <span className="text-xs text-gray-400">
          Gemiddeld: {avg}% van gescande beslissingen
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Percentage beslissingen met gedetecteerde persoonsgegevens per maand
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ left: 10, right: 10 }}>
          <defs>
            <linearGradient id="piiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
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
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
            width={45}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, "PII-lek ratio"]}
            labelFormatter={(l) => `Maand: ${l}`}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#ef4444"
            fill="url(#piiGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
