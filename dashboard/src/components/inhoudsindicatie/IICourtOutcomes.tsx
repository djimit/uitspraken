"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CourtOutcome } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IICourtOutcomes({ data }: { data: CourtOutcome[] }) {
  if (!data.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">
        Gegrond vs. ongegrond per instantie
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Hoe vaak wordt &quot;beroep gegrond&quot; vs. &quot;beroep
        ongegrond&quot; genoemd in de inhoudsindicatie (min. 10 zaken)
      </p>
      <ResponsiveContainer width="100%" height={Math.max(350, data.length * 35)}>
        <BarChart data={data} layout="vertical" margin={{ left: 180 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="court_name"
            tick={{ fontSize: 10 }}
            width={170}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              formatNL(Number(value)),
              String(name),
            ]}
          />
          <Legend />
          <Bar
            dataKey="gegrond"
            name="Gegrond"
            stackId="a"
            fill="#16a34a"
          />
          <Bar
            dataKey="ongegrond"
            name="Ongegrond"
            stackId="a"
            fill="#dc2626"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
