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
import type { LatencyByCourt } from "@/lib/types";
import ExportButton from "./ExportButton";

export default function LatencyByCourtChart({ data }: { data: LatencyByCourt[] }) {
  if (!data.length) return null;

  const maxDays = Math.max(...data.map(d => d.avg_days));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold">Gemiddelde vertraging per instantie</h2>
        <ExportButton
          data={data}
          filename="vertraging-per-instantie"
          columns={[
            { key: "court_name", label: "Instantie" },
            { key: "avg_days", label: "Gem. dagen" },
            { key: "count", label: "Aantal" },
          ]}
        />
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Gemiddeld aantal dagen tussen uitspraak en publicatie (top langzaamste)
      </p>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 28)}>
        <BarChart data={data} layout="vertical" margin={{ left: 180 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} label={{ value: "dagen", position: "insideBottomRight", offset: -5, fontSize: 11 }} />
          <YAxis type="category" dataKey="court_name" tick={{ fontSize: 11 }} width={170} />
          <Tooltip formatter={(value: unknown) => [`${Number(value)} dagen`, "Gemiddeld"]} />
          <Bar dataKey="avg_days" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.court_name}
                fill={
                  entry.avg_days > 60 ? "#dc2626" :
                  entry.avg_days > 30 ? "#ea580c" :
                  entry.avg_days > 14 ? "#ca8a04" :
                  "#059669"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
