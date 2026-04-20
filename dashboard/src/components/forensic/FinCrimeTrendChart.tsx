"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FinCrimeTrend } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function FinCrimeTrendChart({ data }: { data: FinCrimeTrend[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Financieel-strafrechtelijke trends
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Maandelijks aantal beslissingen per delicttype
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNL(v)} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    {payload.map((p) => (
                      <p key={p.dataKey as string} style={{ color: p.color }}>
                        {p.name}: {formatNL(p.value as number)}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="witwassen" stroke="#ef4444" strokeWidth={2} dot={false} name="Witwassen" />
            <Line type="monotone" dataKey="fraude" stroke="#f97316" strokeWidth={2} dot={false} name="Fraude" />
            <Line type="monotone" dataKey="faillissement" stroke="#eab308" strokeWidth={2} dot={false} name="Faillissement" />
            <Line type="monotone" dataKey="crypto" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Crypto" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
