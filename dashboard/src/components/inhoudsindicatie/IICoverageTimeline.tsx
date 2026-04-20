"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { InhoudsindicatieTimeline } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IICoverageTimeline({
  data,
}: {
  data: InhoudsindicatieTimeline[];
}) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">
          Dekking over tijd
        </h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Dekking over tijd</h2>
      <p className="text-sm text-gray-400 mb-4">
        Totaal aantal beslissingen per maand vs. aantal met inhoudsindicatie
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            label={{
              value: "Aantal",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{
              value: "Dekking %",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 12 },
            }}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              if (name === "Dekking %") return [`${value}%`, String(name)];
              return [formatNL(Number(value)), String(name)];
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="total"
            name="Totaal beslissingen"
            fill="#dbeafe"
            stroke="#93c5fd"
          />
          <Bar
            yAxisId="left"
            dataKey="with_ii"
            name="Met inhoudsindicatie"
            fill="#1e40af"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pct"
            name="Dekking %"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
