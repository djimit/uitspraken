"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AppealTrendEntry } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

export default function AppealTrendChart({ data }: { data: AppealTrendEntry[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Hoger beroep uitkomsten over tijd
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              interval={Math.max(0, Math.floor(data.length / 12))}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => formatNL(v)}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              domain={[0, 60]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as AppealTrendEntry;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    <p className="text-blue-600">Totaal: {formatNL(d.total)}</p>
                    <p className="text-green-600">Bekrachtigd: {formatNL(d.bekrachtigd)}</p>
                    <p className="text-red-600">Vernietigd: {formatNL(d.vernietigd)}</p>
                    <p className="text-purple-600">Vernietigings%: {d.vernietigings_pct}%</p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => {
                if (value === "bekrachtigd") return "Bekrachtigd";
                if (value === "vernietigd") return "Vernietigd";
                if (value === "vernietigings_pct") return "Vernietigings%";
                return value;
              }}
            />
            <Bar yAxisId="left" dataKey="bekrachtigd" fill="#22c55e" stackId="a" name="bekrachtigd" />
            <Bar yAxisId="left" dataKey="vernietigd" fill="#ef4444" stackId="a" name="vernietigd" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              dataKey="vernietigings_pct"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              name="vernietigings_pct"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
