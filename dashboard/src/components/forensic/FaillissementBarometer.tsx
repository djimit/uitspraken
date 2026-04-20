"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FaillissementTrend } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function FaillissementBarometer({ data }: { data: FaillissementTrend[] }) {
  // Calculate YoY delta for latest complete months
  const latest = data.filter(d => d.count > 50); // skip incomplete months
  const latestMonth = latest[latest.length - 1];
  const yearAgo = latest.find(d => {
    if (!latestMonth) return false;
    const [y, m] = latestMonth.month.split("-").map(Number);
    const target = `${y - 1}-${String(m).padStart(2, "0")}`;
    return d.month === target;
  });
  const yoyDelta = latestMonth && yearAgo
    ? Math.round(((latestMonth.count - yearAgo.count) / yearAgo.count) * 100)
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          Faillissementen barometer
        </h3>
        {yoyDelta !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            yoyDelta > 10 ? "bg-red-100 text-red-800" : yoyDelta > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
          }`}>
            {yoyDelta > 0 ? "+" : ""}{yoyDelta}% YoY
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Faillissementszaken als economische indicator. Blauwe lijn = voortschrijdend gemiddelde (3 mnd).
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                const d = payload[0].payload as FaillissementTrend;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-amber-700">Faillissementen: {formatNL(d.count)}</p>
                    {d.avg_prev_3 && <p className="text-blue-600">3-mnd gem.: {formatNL(d.avg_prev_3)}</p>}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" fill="#fbbf24" name="Faillissementen" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="avg_prev_3"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="3-mnd gemiddelde"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
