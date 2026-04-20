"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import type { LatencyTrend } from "@/lib/types";
import ExportButton from "./ExportButton";

export default function LatencyTrendChart({ data }: { data: LatencyTrend[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold">Vertraging over tijd</h2>
        <ExportButton
          data={data}
          filename="vertraging-trend"
          columns={[
            { key: "period", label: "Periode" },
            { key: "avg_days", label: "Gem. dagen" },
            { key: "count", label: "Aantal" },
          ]}
        />
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Gemiddeld aantal dagen publicatievertraging per maand
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: "dagen", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <Tooltip formatter={(value: unknown) => [`${Number(value)} dagen`, "Gem. vertraging"]} />
          <Area
            type="monotone"
            dataKey="avg_days"
            stroke="#ea580c"
            fill="#fed7aa"
            strokeWidth={2}
            animationDuration={600}
          />
          {data.length > 12 && (
            <Brush dataKey="period" height={25} stroke="#fdba74" fill="#fff7ed" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
