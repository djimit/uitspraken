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
import type { LengthTrend } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IILengthTrend({ data }: { data: LengthTrend[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Lengte-ontwikkeling</h2>
      <p className="text-sm text-gray-400 mb-4">
        Worden inhoudsindicaties langer of korter over de tijd?
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            label={{
              value: "Gem. tekens",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{
              value: "Aantal",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 12 },
            }}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              formatNL(Number(value)),
              String(name),
            ]}
          />
          <Legend />
          <Bar
            yAxisId="right"
            dataKey="count"
            name="Aantal beslissingen"
            fill="#e2e8f0"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avg_length"
            name="Gem. lengte (tekens)"
            stroke="#7c3aed"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
