"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { JudgeAreaEntry } from "@/lib/types";
import ExportButton from "./ExportButton";

export default function JudgeAreaChart({ data }: { data: JudgeAreaEntry[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Rechters per rechtsgebied</h2>
        <ExportButton
          data={data}
          filename="rechters-per-rechtsgebied"
          columns={[
            { key: "legal_area_name", label: "Rechtsgebied" },
            { key: "judge_count", label: "Aantal rechters" },
            { key: "decision_count", label: "Beslissingen" },
          ]}
        />
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ left: 180 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="legal_area_name"
            tick={{ fontSize: 11 }}
            width={170}
          />
          <Tooltip />
          <Bar dataKey="judge_count" name="Rechters" fill="#4f46e5" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
