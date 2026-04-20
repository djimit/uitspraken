"use client";

import type { JudgeDetail } from "@/lib/types";
import { formatNL } from "@/lib/format";
import ExportButton from "./ExportButton";
import { useState } from "react";

export default function JudgeTable({ judges }: { judges: JudgeDetail[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"count" | "uitspraken" | "conclusies">("count");

  const filtered = judges
    .filter(j => !search || j.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const exportData = filtered.map(j => ({
    name: j.name,
    count: j.count,
    uitspraken: j.uitspraken,
    conclusies: j.conclusies,
    rechtsgebieden: j.areas.join(", "),
    instanties: j.courts.join(", "),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Top Rechters</h2>
          <ExportButton
            data={exportData}
            filename="rechters"
            columns={[
              { key: "name", label: "Naam" },
              { key: "count", label: "Totaal" },
              { key: "uitspraken", label: "Uitspraken" },
              { key: "conclusies", label: "Conclusies" },
              { key: "rechtsgebieden", label: "Rechtsgebieden" },
              { key: "instanties", label: "Instanties" },
            ]}
          />
        </div>
        <input
          type="text"
          placeholder="Zoek rechter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
              <SortableHeader label="Totaal" field="count" current={sortBy} onSort={setSortBy} />
              <SortableHeader label="Uitspraken" field="uitspraken" current={sortBy} onSort={setSortBy} />
              <SortableHeader label="Conclusies" field="conclusies" current={sortBy} onSort={setSortBy} />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Rechtsgebieden</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Instanties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.slice(0, 50).map((j) => (
              <tr key={j.name} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <a
                    href={`/decisions?q=${encodeURIComponent(`"${j.name}"`)}`}
                    className="text-sm text-blue-700 hover:underline font-medium"
                  >
                    {j.name}
                  </a>
                </td>
                <td className="px-4 py-2.5 text-sm tabular-nums text-gray-700 font-semibold">{formatNL(j.count)}</td>
                <td className="px-4 py-2.5 text-sm tabular-nums text-gray-600">{formatNL(j.uitspraken)}</td>
                <td className="px-4 py-2.5 text-sm tabular-nums text-gray-600">{formatNL(j.conclusies)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {j.areas.map(a => (
                      <span key={a} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {j.courts.map(c => (
                      <span key={c} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-6">Geen rechters gevonden</p>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  field,
  current,
  onSort,
}: {
  label: string;
  field: "count" | "uitspraken" | "conclusies";
  current: string;
  onSort: (f: "count" | "uitspraken" | "conclusies") => void;
}) {
  return (
    <th
      className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
      onClick={() => onSort(field)}
    >
      {label} {current === field ? "▼" : ""}
    </th>
  );
}
