"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SeverityBreakdown } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

const COLORS = {
  high: "#dc2626",
  medium: "#ea580c",
  low: "#ca8a04",
};

const LABELS = {
  high: "Hoog",
  medium: "Midden",
  low: "Laag",
};

export default function PseudoSeverityDonut({ data }: { data: SeverityBreakdown }) {
  const chartData = [
    { name: "Hoog", value: data.high, fill: COLORS.high },
    { name: "Midden", value: data.medium, fill: COLORS.medium },
    { name: "Laag", value: data.low, fill: COLORS.low },
  ].filter((d) => d.value > 0);

  const pctHigh = data.total > 0 ? Math.round((1000 * data.high) / data.total) / 10 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Ernstverdeling PII-bevindingen
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {formatNL(data.total)} individuele PII-bevindingen over alle beslissingen
      </p>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatNL(Number(v))} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2">
          {(["high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[sev] }}
              />
              <span className="text-xs text-gray-600 w-14">{LABELS[sev]}</span>
              <span className="text-sm font-bold">{formatNL(data[sev])}</span>
              <span className="text-xs text-gray-400">
                ({data.total > 0 ? Math.round((1000 * data[sev]) / data.total) / 10 : 0}%)
              </span>
            </div>
          ))}

          {pctHigh > 50 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <strong>{pctHigh}%</strong> van alle bevindingen heeft hoge ernst
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
