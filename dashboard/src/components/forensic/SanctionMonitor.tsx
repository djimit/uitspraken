"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SanctionTrend } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function SanctionMonitor({ data }: { data: SanctionTrend[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          Sanctie-monitor (Rusland / sanctielijst)
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          {formatNL(total)} totaal
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Zaken gerelateerd aan internationale sancties, sanctielijsten en Rusland-sancties
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-blue-600">{formatNL(payload[0].value as number)} sanctiezaken</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
