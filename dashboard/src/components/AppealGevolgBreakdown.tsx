"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AppealGevolgDetail } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

const COLORS: Record<string, string> = {
  "bekrachtiging/bevestiging": "#22c55e",
  "(Gedeeltelijke) vernietiging en zelf afgedaan": "#ef4444",
  "overig": "#94a3b8",
  "niet ontvankelijk": "#f59e0b",
  "meerdere afhandelingswijzen": "#8b5cf6",
  "(Gedeeltelijke) vernietiging met terugwijzen": "#dc2626",
  "niet bevoegd": "#64748b",
};

function getColor(gevolg: string): string {
  if (gevolg.includes("bekrachtiging") || gevolg.includes("bevestiging")) return "#22c55e";
  if (gevolg.includes("vernietiging")) return "#ef4444";
  if (gevolg.includes("niet ontvankelijk")) return "#f59e0b";
  return COLORS[gevolg] || "#94a3b8";
}

export default function AppealGevolgBreakdown({ data }: { data: AppealGevolgDetail[] }) {
  // Group small entries into "overig"
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const threshold = total * 0.02;
  const significant: AppealGevolgDetail[] = [];
  let overig = 0;
  for (const d of data) {
    if (d.count >= threshold) significant.push(d);
    else overig += d.count;
  }
  if (overig > 0) significant.push({ gevolg: "Overig", count: overig });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Uitkomstverdeling hoger beroep
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={significant}
              dataKey="count"
              nameKey="gevolg"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={45}
              paddingAngle={2}
              label={false}
            >
              {significant.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.gevolg)} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{d.name}</p>
                    <p className="text-blue-600">{formatNL(d.value as number)} zaken</p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
