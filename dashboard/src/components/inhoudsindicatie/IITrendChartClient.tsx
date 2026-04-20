"use client";

import { formatNL } from "@/lib/format";
import type { IITrendMonth } from "@/lib/inhoudsindicatie-queries";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export function IITrendChartClient({ data }: { data: IITrendMonth[] }) {
  const trend = data;

  return (
    <div className="space-y-4 bg-white rounded-lg border border-slate-200 p-6">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={trend} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 11 }}
          />
          <YAxis label={{ value: "Tekens", angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(value: any) => [formatNL(value), value < 300 ? "Gemiddelde" : "Gemiddelde"]}
            labelFormatter={(label) => `Maand: ${label}`}
          />
          <Legend />
          <ReferenceLine
            y={200}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{ value: "Richtlijn (200c = 40w)", position: "right", fill: "#991b1b" }}
          />
          <Line
            type="monotone"
            dataKey="avg_chars"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Avg lengte (tekens)"
            dot={{ fill: "#3b82f6", r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="compliance_pct"
            stroke="#10b981"
            strokeWidth={2}
            name="% compliant"
            yAxisId="right"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-slate-700">
          <strong>Waarneming:</strong> De gemiddelde inhoudsindicatie-lengte is <strong>stabiel</strong> gebleven
          over 2024-2025 (rond de 310 tekens). Dit suggereert dat het{" "}
          <strong>bewustzijn van de 40-woorden richtlijn nog niet heeft geleid tot kortere teksten</strong>.
        </p>
      </div>
    </div>
  );
}
