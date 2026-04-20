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
import type { InhoudsindicatieLengthBucket } from "@/lib/types";
import { formatNL } from "@/lib/format";

const COLORS = [
  "#fef3c7",
  "#fde68a",
  "#fcd34d",
  "#fbbf24",
  "#f59e0b",
  "#d97706",
  "#b45309",
];

export default function IILengthDistribution({
  data,
}: {
  data: InhoudsindicatieLengthBucket[];
}) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Lengteverdeling</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">
        Lengteverdeling inhoudsindicatie
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Aantal beslissingen per lengtecategorie (in tekens)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Beslissingen",
            ]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                stroke="#92400e"
                strokeWidth={0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
