"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatNL } from "@/lib/format";

interface TrendDataItem {
  instantie: string;
  month: string;
  avg_chars: number;
  compliance_pct: number;
}

export function IIMaaikeTrendAnalysis({ trendData }: { trendData: TrendDataItem[] }) {

  // Group by instantie for the chart
  const instanties = Array.from(new Set(trendData.map((d) => d.instantie)));

  // Get color for each instantie
  const colors: Record<string, string> = {
    RBAMS: "#3b82f6",
    GHAMS: "#8b5cf6",
    CBb: "#ef4444",
    RvS: "#ec4899",
    RBROT: "#06b6d4",
    GHDEN: "#f59e0b",
  };

  return (
    <div className="space-y-6">
      {/* Main Trend Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: "Compliance %", angle: -90, position: "insideLeft" }} domain={[0, 100]} />
            <Tooltip formatter={(value: any) => `${value}%`} labelFormatter={(label) => `Maand: ${label}`} />
            <Legend />
            <ReferenceLine
              y={50}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "Target: 50%+", position: "right", fill: "#991b1b", fontSize: 12 }}
            />

            {/* Line per instantie */}
            {instanties.map((instantie) => (
              <Line
                key={instantie}
                type="monotone"
                dataKey="compliance_pct"
                stroke={colors[instantie] || "#94a3b8"}
                name={instantie}
                data={trendData.filter((d) => d.instantie === instantie)}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Instantie Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instanties.map((instantie) => {
          const instData = trendData.filter((d) => d.instantie === instantie).sort((a, b) => a.month.localeCompare(b.month));

          if (instData.length === 0) return null;

          const first = instData[0];
          const last = instData[instData.length - 1];
          const trend = last.compliance_pct - first.compliance_pct;
          const improving = trend > 0;
          const change = Math.abs(trend);

          return (
            <div key={instantie} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="font-semibold text-slate-900">{instantie}</div>
              <div className="space-y-2 mt-3 text-sm">
                <div>
                  <span className="text-slate-600">Start:</span> <span className="font-bold text-slate-900">{first.compliance_pct}%</span> ({first.month})
                </div>
                <div>
                  <span className="text-slate-600">Nu:</span> <span className="font-bold text-slate-900">{last.compliance_pct}%</span> ({last.month})
                </div>
                <div className={`font-bold ${improving ? "text-green-700" : "text-red-700"}`}>
                  {improving ? "↑" : "↓"} {change.toFixed(1)} pp
                </div>
                <div className={`text-xs px-2 py-1 rounded ${improving ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {improving ? "✓ Verbetert" : "✗ Verslechtert"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-slate-700">
          <strong>Interpretatie:</strong> Als compliance stijgt, betekent dit dat meer zaaksbehandelaars de richtlijn
          naleven = bewustzijn groeit. Als compliance stabiel/daalt, is meer training of communicatie nodig. Let op:
          dit kan ook te maken hebben met casemix veranderingen per instantie!
        </p>
      </div>
    </div>
  );
}
