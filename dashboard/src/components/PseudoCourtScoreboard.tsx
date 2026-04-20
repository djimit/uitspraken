"use client";

import type { CourtAdoptionEntry } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

function rateColor(rate: number): string {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 60) return "bg-yellow-500";
  if (rate >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function rateLabel(rate: number): string {
  if (rate >= 80) return "text-green-700 bg-green-50";
  if (rate >= 60) return "text-yellow-700 bg-yellow-50";
  if (rate >= 40) return "text-orange-700 bg-orange-50";
  return "text-red-700 bg-red-50";
}

export default function PseudoCourtScoreboard({ data }: { data: CourtAdoptionEntry[] }) {
  // Sort by rate ascending to show worst first
  const sorted = [...data].sort((a, b) => a.rate - b.rate);
  const best = sorted[sorted.length - 1];
  const worst = sorted[0];
  const spread = best && worst ? Math.round((best.rate - worst.rate) * 10) / 10 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          Adoptie per instantie — Scoreboard
        </h3>
        <span className="text-xs text-gray-400">
          Spreiding: {spread} procentpunt
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Percentage beslissingen met bracket-pseudonimisering (bijv. [verdachte], [eiser])
      </p>
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
        {sorted.map((c) => (
          <div key={c.court_name} className="flex items-center gap-2 text-xs">
            <span className="w-48 truncate text-gray-600 shrink-0" title={c.court_name}>
              {c.court_name}
            </span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${rateColor(c.rate)} transition-all`}
                style={{ width: `${c.rate}%` }}
              />
            </div>
            <span className={`w-14 text-right font-semibold px-1.5 py-0.5 rounded text-xs ${rateLabel(c.rate)}`}>
              {c.rate}%
            </span>
            <span className="w-16 text-right text-gray-400">
              {formatNL(c.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
