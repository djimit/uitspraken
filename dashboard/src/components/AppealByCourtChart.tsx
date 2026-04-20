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
import type { AppealOutcomeByCourt } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

function getColor(pct: number): string {
  if (pct >= 40) return "#ef4444"; // red
  if (pct >= 30) return "#f97316"; // orange
  if (pct >= 20) return "#eab308"; // yellow
  return "#22c55e"; // green
}

export default function AppealByCourtChart({ data }: { data: AppealOutcomeByCourt[] }) {
  const top = data.slice(0, 20);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Vernietigingspercentage per instantie
      </h3>
      <div style={{ height: Math.max(300, top.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ left: 220, right: 50, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `${v}%`} />
            <YAxis
              type="category"
              dataKey="court_name"
              width={210}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as AppealOutcomeByCourt;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    <p className="text-green-700">Bekrachtigd: {formatNL(d.bekrachtigd)} ({d.total > 0 ? Math.round(100 * d.bekrachtigd / d.total) : 0}%)</p>
                    <p className="text-red-700">Vernietigd: {formatNL(d.vernietigd)} ({d.vernietigings_pct}%)</p>
                    <p className="text-gray-500">Overig: {formatNL(d.overig)}</p>
                    <p className="text-gray-400 mt-1 text-xs">Totaal: {formatNL(d.total)} zaken</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="vernietigings_pct" radius={[0, 4, 4, 0]}>
              {top.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.vernietigings_pct)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> &ge;40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> 30-40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> 20-30%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> &lt;20%</span>
      </div>
    </div>
  );
}
