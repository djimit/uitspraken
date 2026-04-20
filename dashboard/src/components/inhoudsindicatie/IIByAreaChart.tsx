"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { InhoudsindicatieByArea } from "@/lib/types";
import { formatNL } from "@/lib/format";

const AREA_COLORS = [
  "#1e40af", "#0369a1", "#0e7490", "#0d9488", "#059669",
  "#16a34a", "#65a30d", "#ca8a04", "#ea580c", "#dc2626",
  "#be185d", "#7c3aed", "#6d28d9", "#4f46e5", "#2563eb",
];

export default function IIByAreaChart({
  data,
}: {
  data: InhoudsindicatieByArea[];
}) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Per rechtsgebied</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  // Shorten long legal area names
  const chartData = data.slice(0, 12).map((d) => ({
    ...d,
    short_name:
      d.legal_area_name.length > 35
        ? d.legal_area_name.slice(0, 32) + "..."
        : d.legal_area_name,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Per rechtsgebied</h2>
      <p className="text-sm text-gray-400 mb-4">
        Dekking en gemiddelde lengte per rechtsgebied
      </p>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 200 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="short_name"
            tick={{ fontSize: 10 }}
            width={190}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              if (name === "Dekking") return [`${value}%`, String(name)];
              return [formatNL(Number(value)), String(name)];
            }}
            labelFormatter={(_, payload) => {
              if (payload?.[0]?.payload?.legal_area_name) {
                return payload[0].payload.legal_area_name;
              }
              return "";
            }}
          />
          <Bar dataKey="pct" name="Dekking" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
