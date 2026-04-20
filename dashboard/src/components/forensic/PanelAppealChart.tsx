"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PanelAppealEntry, PanelSummary } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function PanelAppealChart({
  entries,
  summary,
}: {
  entries: PanelAppealEntry[];
  summary: PanelSummary;
}) {
  // Group by kamer
  const enkelvoudig = entries.filter((e) => e.kamer === "Enkelvoudig");
  const meervoudig = entries.filter((e) => e.kamer === "Meervoudig");

  // Combined data for the comparison chart
  const areas = [...new Set(entries.map((e) => e.legal_area))];
  const combined = areas
    .map((area) => {
      const e = enkelvoudig.find((x) => x.legal_area === area);
      const m = meervoudig.find((x) => x.legal_area === area);
      return {
        legal_area: area.length > 35 ? area.slice(0, 32) + "..." : area,
        legal_area_full: area,
        enk_pct: e?.vernietigings_pct ?? null,
        meer_pct: m?.vernietigings_pct ?? null,
        enk_total: e?.total ?? 0,
        meer_total: m?.total ?? 0,
      };
    })
    .filter((d) => d.enk_pct !== null || d.meer_pct !== null)
    .sort((a, b) => ((b.meer_pct ?? 0) - (b.enk_pct ?? 0)) - ((a.meer_pct ?? 0) - (a.enk_pct ?? 0)));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Enkelvoudig vs. meervoudig: vernietigingspercentage
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Worden beslissingen van meervoudige kamers (3+ rechters) vaker vernietigd in hoger beroep?
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">Enkelvoudig (1 rechter)</p>
          <p className="text-2xl font-bold text-blue-900">{summary.enkelvoudig_pct}%</p>
          <p className="text-xs text-blue-500">vernietigd ({formatNL(summary.enkelvoudig_total)} zaken)</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Meervoudig (3+ rechters)</p>
          <p className="text-2xl font-bold text-red-900">{summary.meervoudig_pct}%</p>
          <p className="text-xs text-red-500">vernietigd ({formatNL(summary.meervoudig_total)} zaken)</p>
        </div>
      </div>

      {/* Grouped bar chart */}
      <div style={{ height: Math.max(250, combined.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={combined}
            layout="vertical"
            margin={{ left: 200, right: 30, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="legal_area" width={190} tick={{ fontSize: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{d.legal_area_full}</p>
                    {d.enk_pct !== null && (
                      <p className="text-blue-700">Enkelvoudig: {d.enk_pct}% ({formatNL(d.enk_total)} zaken)</p>
                    )}
                    {d.meer_pct !== null && (
                      <p className="text-red-700">Meervoudig: {d.meer_pct}% ({formatNL(d.meer_total)} zaken)</p>
                    )}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="enk_pct" fill="#3b82f6" name="Enkelvoudig" radius={[0, 4, 4, 0]} barSize={10} />
            <Bar dataKey="meer_pct" fill="#ef4444" name="Meervoudig" radius={[0, 4, 4, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
        <p className="text-xs text-amber-800">
          <strong>Inzicht:</strong> Meervoudige kamers behandelen complexere zaken die vaker in hoger beroep gaan.
          Het hogere vernietigingspercentage weerspiegelt de complexiteit, niet noodzakelijk een lagere kwaliteit.
          In strafrecht is het verschil het grootst: enkelvoudig ~5% vs. meervoudig ~62%.
        </p>
      </div>
    </div>
  );
}
