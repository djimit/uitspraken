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
import type { LawReference } from "@/lib/types";
import { formatNL } from "@/lib/format";

const COLORS = [
  "#1e40af", "#0369a1", "#0e7490", "#0d9488", "#059669",
  "#16a34a", "#65a30d", "#ca8a04", "#ea580c", "#dc2626",
  "#be185d", "#7c3aed", "#6d28d9", "#4f46e5", "#2563eb",
  "#0284c7", "#0891b2", "#14b8a6",
];

export default function IILawReferences({ data }: { data: LawReference[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">
        Wetsverwijzingen in inhoudsindicaties
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Welke wetten en wetboeken worden het vaakst aangehaald?
      </p>
      <ResponsiveContainer
        width="100%"
        height={Math.max(300, data.length * 30)}
      >
        <BarChart data={data} layout="vertical" margin={{ left: 250 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="law"
            tick={{ fontSize: 10 }}
            width={240}
          />
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Aantal",
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
