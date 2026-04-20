"use client";

import type { CrossTabData } from "@/lib/types";
import { formatNL } from "@/lib/format";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";

function cellColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return "hsl(220, 20%, 97%)";
  const ratio = count / maxCount;
  // Light blue to dark blue
  const lightness = 92 - ratio * 52; // 92% → 40%
  const saturation = 40 + ratio * 40; // 40% → 80%
  return `hsl(220, ${saturation}%, ${lightness}%)`;
}

function textColor(count: number, maxCount: number): string {
  if (maxCount === 0) return "#6b7280";
  return count / maxCount > 0.45 ? "#ffffff" : "#374151";
}

export default function CrossTabHeatmap({ data }: { data: CrossTabData }) {
  const { setFilters, getFilter } = useFilterNavigation();
  const activeCourt = getFilter("court");
  const activeArea = getFilter("legalArea");

  if (!data.rows.length || !data.cols.length) return null;

  // Build a lookup map: "row|col" → count
  const lookup = new Map<string, number>();
  for (const e of data.entries) {
    lookup.set(`${e.row}|${e.col}`, e.count);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Instantie × Rechtsgebied</h2>
        <p className="text-sm text-gray-400">
          Top {data.rows.length} instanties vs top {data.cols.length} rechtsgebieden — klik een cel om te filteren
        </p>
      </div>
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-1" />
            {data.cols.map((col) => (
              <th
                key={col}
                className="p-1 font-normal text-gray-500"
                style={{ minWidth: 60 }}
              >
                <div
                  className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 90 }}
                  title={col}
                >
                  {col}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row}>
              <td
                className={`pr-2 py-1 text-right font-medium whitespace-nowrap max-w-[160px] truncate ${
                  row === activeCourt ? "text-blue-700 font-bold" : "text-gray-600"
                }`}
                title={row}
              >
                {row}
              </td>
              {data.cols.map((col) => {
                const count = lookup.get(`${row}|${col}`) ?? 0;
                const isActive = row === activeCourt && col === activeArea;
                return (
                  <td
                    key={col}
                    className={`p-0 cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 hover:z-10 relative ${
                      isActive ? "ring-2 ring-amber-400 z-10" : ""
                    }`}
                    style={{
                      backgroundColor: cellColor(count, data.maxCount),
                      color: textColor(count, data.maxCount),
                      minWidth: 52,
                      height: 32,
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: count > 0 ? 600 : 400,
                      fontVariantNumeric: "tabular-nums",
                    }}
                    onClick={() => {
                      if (count > 0) {
                        setFilters({ court: row, legalArea: col });
                      }
                    }}
                    title={`${row} × ${col}: ${formatNL(count)}`}
                  >
                    {count > 0 ? formatNL(count) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
