"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { InhoudsindicatieByCourt } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IIByCourtChart({
  data,
}: {
  data: InhoudsindicatieByCourt[];
}) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Per instantie</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  // Sort by coverage percentage for this chart
  const sorted = [...data]
    .filter((d) => d.total >= 50)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 15);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Dekking per instantie</h2>
      <p className="text-sm text-gray-400 mb-4">
        Percentage beslissingen met inhoudsindicatie (min. 50 beslissingen)
      </p>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 180 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="court_name"
            tick={{ fontSize: 10 }}
            width={170}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              if (name === "Dekking") return [`${value}%`, String(name)];
              return [formatNL(Number(value)), String(name)];
            }}
            labelFormatter={(label) => label}
          />
          <Bar
            dataKey="pct"
            name="Dekking"
            fill="#1e40af"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
