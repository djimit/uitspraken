"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";
import type { TimelineEntry, TimelineYoYEntry } from "@/lib/types";
import { formatNL } from "@/lib/format";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import ExportButton from "./ExportButton";

interface Props {
  data: TimelineEntry[];
  yoyData?: TimelineYoYEntry[];
}

export default function TimelineChart({ data, yoyData }: Props) {
  const { setFilters } = useFilterNavigation();
  const [showYoY, setShowYoY] = useState(false);

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Beslissingen over tijd</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  const hasYoY = yoyData && yoyData.length > 0 && yoyData.some(d => d.prev_count > 0);
  const chartData = showYoY && hasYoY ? yoyData : data;

  function handleClick(entry: TimelineEntry) {
    if (!entry?.period) return;
    const [year, month] = entry.period.split("-").map(Number);
    const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    setFilters({ dateFrom, dateTo });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Beslissingen over tijd</h2>
          <ExportButton
            data={data}
            filename="tijdlijn"
            columns={[
              { key: "period", label: "Periode" },
              { key: "count", label: "Aantal" },
            ]}
          />
          {hasYoY && (
            <button
              onClick={() => setShowYoY(!showYoY)}
              className={`ml-2 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                showYoY
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              YoY
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">Klik op een maand om te filteren</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} style={{ cursor: "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const label = name === "prev_count" ? "Vorig jaar" : "Dit jaar";
              return [formatNL(Number(value)), showYoY ? label : "Beslissingen"];
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="count"
            stroke="#1e40af"
            fill="#dbeafe"
            strokeWidth={2}
            animationDuration={600}
            onClick={(_data) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payload = (_data as any)?.payload ?? _data;
              if (payload?.period) handleClick(payload as TimelineEntry);
            }}
          />
          {showYoY && hasYoY && (
            <Area
              type="monotone"
              dataKey="prev_count"
              name="prev_count"
              stroke="#9ca3af"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              animationDuration={600}
            />
          )}
          {showYoY && (
            <Legend
              formatter={(value) =>
                value === "count" ? "Dit jaar" : "Vorig jaar"
              }
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
          {chartData.length > 12 && (
            <Brush
              dataKey="period"
              height={25}
              stroke="#93c5fd"
              fill="#f0f5ff"
              tickFormatter={(v) => v}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
