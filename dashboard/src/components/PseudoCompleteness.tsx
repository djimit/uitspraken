"use client";

import type { CompletenessEntry } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

function rateColor(rate: number): string {
  if (rate >= 70) return "text-green-700";
  if (rate >= 40) return "text-yellow-700";
  return "text-red-700";
}

function barColor(rate: number): string {
  if (rate >= 70) return "bg-green-500";
  if (rate >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export default function PseudoCompleteness({ data }: { data: CompletenessEntry[] }) {
  const total = data[0]?.total || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Volledigheid strafzaken — wat wordt er naast [verdachte] gepseudonimiseerd?
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Van {formatNL(total)} beslissingen met [verdachte]: welke aanvullende PII-categorieën worden ook afgeschermd?
      </p>

      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3 text-sm">
            <span className="w-36 font-mono text-xs text-gray-600 shrink-0">
              {d.label}
            </span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full ${barColor(d.rate)} transition-all`}
                style={{ width: `${d.rate}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                {formatNL(d.count)} van {formatNL(d.total)}
              </span>
            </div>
            <span className={`w-12 text-right font-bold text-sm ${rateColor(d.rate)}`}>
              {d.rate}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
        <strong>Bevinding:</strong> Slechts ~47% van strafzaken met [verdachte] pseudonimiseert ook de geboortedatum.
        Dit betekent dat in meer dan de helft van de zaken de volledige geboortedatum zichtbaar is naast een gepseudonimiseerde naam.
      </div>
    </div>
  );
}
