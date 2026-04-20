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
import type { WeekdayDistribution } from "@/lib/types";
import { formatNL } from "@/lib/format";

const DAY_COLORS = [
  "#e5e7eb", // Zondag - gray
  "#3b82f6", // Maandag
  "#2563eb", // Dinsdag
  "#1d4ed8", // Woensdag
  "#1e40af", // Donderdag
  "#1e3a8a", // Vrijdag
  "#e5e7eb", // Zaterdag - gray
];

export default function WeekdayChart({
  data,
}: {
  data: WeekdayDistribution[];
}) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
        Beslissingen per weekdag
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ left: 0, right: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v.slice(0, 2)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Beslissingen",
            ]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.day}
                fill={DAY_COLORS[entry.day_index]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
