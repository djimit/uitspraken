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
import type { LatencyBucket } from "@/lib/types";
import { formatNL } from "@/lib/format";
import ExportButton from "./ExportButton";

const COLORS: Record<string, string> = {
  "Negatief": "#94a3b8",
  "< 1 week": "#059669",
  "1-2 weken": "#16a34a",
  "2-4 weken": "#65a30d",
  "1-3 maanden": "#ca8a04",
  "3-6 maanden": "#ea580c",
  "6-12 maanden": "#dc2626",
  "> 1 jaar": "#991b1b",
};

export default function LatencyChart({ data }: { data: LatencyBucket[] }) {
  const visible = data.filter(d => d.sort_key >= 0);
  if (!visible.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold">Publicatievertraging</h2>
        <ExportButton
          data={data}
          filename="publicatievertraging"
          columns={[
            { key: "bucket", label: "Categorie" },
            { key: "count", label: "Aantal" },
          ]}
        />
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Tijd tussen uitspraakdatum en publicatiedatum
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={visible}>
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: unknown) => [formatNL(Number(value)), "Beslissingen"]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {visible.map((entry) => (
              <Cell key={entry.bucket} fill={COLORS[entry.bucket] || "#64748b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
