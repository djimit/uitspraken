"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LegalAreaAdoptionEntry } from "@/lib/pseudo-check";

function barColor(rate: number): string {
  if (rate >= 80) return "#22c55e";
  if (rate >= 60) return "#eab308";
  if (rate >= 40) return "#f97316";
  return "#ef4444";
}

export default function PseudoLegalAreaChart({ data }: { data: LegalAreaAdoptionEntry[] }) {
  // Show all, sorted by rate
  const sorted = [...data].sort((a, b) => a.rate - b.rate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Adoptie per rechtsgebied
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Strafrecht scoort het hoogst (90%), bestuursrecht en EU-recht het laagst
      </p>
      <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 24)}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 200, right: 30 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="legal_area"
            width={190}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, "Adoptie"]}
          />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
