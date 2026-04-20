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
import type { LegalAreaEntry } from "@/lib/types";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatNL } from "@/lib/format";
import ExportButton from "./ExportButton";

export default function LegalAreaBreakdown({
  data,
}: {
  data: LegalAreaEntry[];
}) {
  const { toggleFilter, getFilter } = useFilterNavigation();
  const activeArea = getFilter("legalArea");

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Rechtsgebieden</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Rechtsgebieden</h2>
          <ExportButton
            data={data}
            filename="rechtsgebieden"
            columns={[
              { key: "legal_area_name", label: "Rechtsgebied" },
              { key: "count", label: "Aantal" },
            ]}
          />
        </div>
        <span className="text-xs text-gray-400">Klik om te filteren</span>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ left: 200 }} style={{ cursor: "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="legal_area_name"
            tick={{ fontSize: 11 }}
            width={190}
          />
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Beslissingen",
            ]}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            animationDuration={400}
            onClick={(_data, _index, e) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payload = (_data as any)?.payload ?? _data;
              if (payload?.legal_area_name) toggleFilter("legalArea", payload.legal_area_name);
              e?.stopPropagation();
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.legal_area_name}
                fill={entry.legal_area_name === activeArea ? "#5b21b6" : "#7c3aed"}
                stroke={entry.legal_area_name === activeArea ? "#fbbf24" : "none"}
                strokeWidth={entry.legal_area_name === activeArea ? 2 : 0}
                opacity={activeArea && entry.legal_area_name !== activeArea ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
