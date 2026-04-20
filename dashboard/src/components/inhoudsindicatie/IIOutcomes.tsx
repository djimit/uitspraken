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
import type { OutcomeCount } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IIOutcomes({ data }: { data: OutcomeCount[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">
        Uitkomsten in inhoudsindicaties
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Hoe vaak worden specifieke uitkomsten genoemd? Een beslissing kan
        meerdere uitkomsten bevatten.
      </p>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 170 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="outcome"
            tick={{ fontSize: 11 }}
            width={160}
          />
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Aantal",
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
