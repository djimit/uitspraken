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
import type { LawReference } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
  "#06b6d4", "#84cc16",
];

export default function FinancialLawRefs({ data }: { data: LawReference[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Meest toegepaste financieel-juridische wetsartikelen
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Welke wetten en artikelen komen het vaakst voor in beslissingen?
      </p>
      <div style={{ height: Math.max(250, data.length * 30) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 200, right: 30, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatNL(v)} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="law" width={190} tick={{ fontSize: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as LawReference;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{d.law}</p>
                    <p className="text-blue-600">{formatNL(d.count)} beslissingen</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
