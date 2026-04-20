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
import type { AppealDurationEntry } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

const COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#dc2626"];

export default function AppealDurationChart({ data }: { data: AppealDurationEntry[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Doorlooptijd hoger beroep
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Tijd tussen uitspraak eerste aanleg en uitspraak hoger beroep
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatNL(v)} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">Doorlooptijd: {label}</p>
                    <p className="text-blue-600">{formatNL(payload[0].value as number)} zaken</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
