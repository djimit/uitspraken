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
import type { CourtEntry } from "@/lib/types";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatNL } from "@/lib/format";
import ExportButton from "./ExportButton";

export default function CourtBreakdown({ data }: { data: CourtEntry[] }) {
  const { toggleFilter, getFilter } = useFilterNavigation();
  const activeCourt = getFilter("court");

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Top Instanties</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Top Instanties</h2>
          <ExportButton
            data={data}
            filename="instanties"
            columns={[
              { key: "court_name", label: "Instantie" },
              { key: "count", label: "Aantal" },
            ]}
          />
        </div>
        <span className="text-xs text-gray-400">Klik om te filteren</span>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ left: 180 }} style={{ cursor: "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="court_name"
            tick={{ fontSize: 11 }}
            width={170}
          />
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Beslissingen",
            ]}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            animationDuration={400}
            onClick={(_data, _index, e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payload = (_data as any)?.payload ?? _data;
              if (payload?.court_name) toggleFilter("court", payload.court_name);
              e?.stopPropagation();
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.court_name}
                fill={entry.court_name === activeCourt ? "#1e3a8a" : "#1e40af"}
                stroke={entry.court_name === activeCourt ? "#fbbf24" : "none"}
                strokeWidth={entry.court_name === activeCourt ? 2 : 0}
                opacity={activeCourt && entry.court_name !== activeCourt ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
