"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AppealOutcomeByArea } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

export default function AppealByAreaChart({ data }: { data: AppealOutcomeByArea[] }) {
  // Show top 15 by total volume
  const top = data.slice(0, 15);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Vernietigingspercentage per rechtsgebied
      </h3>
      <div style={{ height: Math.max(300, top.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top}
            layout="vertical"
            margin={{ left: 200, right: 30, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} />
            <YAxis
              type="category"
              dataKey="legal_area"
              width={190}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as AppealOutcomeByArea;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    <p className="text-green-700">Bekrachtigd: {formatNL(d.bekrachtigd)}</p>
                    <p className="text-red-700">Vernietigd: {formatNL(d.vernietigd)} ({d.vernietigings_pct}%)</p>
                    <p className="text-gray-500">Overig: {formatNL(d.overig)}</p>
                    <p className="text-gray-400 mt-1 text-xs">Totaal: {formatNL(d.total)} zaken</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="vernietigings_pct"
              fill="#ef4444"
              radius={[0, 4, 4, 0]}
              name="vernietigings_pct"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Percentage hoger beroepzaken dat (gedeeltelijk) vernietigd wordt. Alleen rechtsgebieden met &ge;20 zaken.
      </p>
    </div>
  );
}
