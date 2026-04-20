
import { getIIByLegalArea } from "@/lib/inhoudsindicatie-queries";
import { formatNL } from "@/lib/format";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function IIRechtsgebiedenAnalysis() {
  const areas = getIIByLegalArea();

  const getSeverity = (pct: number) => {
    if (pct >= 60) return { label: "✓ Goed", color: "bg-green-50 border-green-200" };
    if (pct >= 40) return { label: "≈ Matig", color: "bg-amber-50 border-amber-200" };
    if (pct >= 20) return { label: "⚠ Slecht", color: "bg-orange-50 border-orange-200" };
    return { label: "🚨 Kritiek", color: "bg-red-50 border-red-200" };
  };

  return (
    <div className="space-y-4">
      {areas.map((area, index) => {
        const compliancePct = 100 - area.over_200_pct;
        const severity = getSeverity(compliancePct);
        const isTop3 = index < 3;

        return (
          <div
            key={`area-${index}`}
            className={`border rounded-lg p-4 ${severity.color} ${isTop3 ? "ring-2 ring-amber-400" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{area.legal_area_name}</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {formatNL(area.count)} zaken | avg {formatNL(area.avg_chars)} tekens (~{formatNL(area.avg_words)} w)
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{compliancePct}%</div>
                <div className="text-xs text-slate-600">compliant</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  compliancePct >= 60
                    ? "bg-green-500"
                    : compliancePct >= 40
                      ? "bg-amber-500"
                      : compliancePct >= 20
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${compliancePct}%` }}
              />
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
              <div>
                <div className="text-slate-600">≤200c (✓)</div>
                <div className="font-semibold text-slate-900">
                  {formatNL(area.count - area.over_200_count)}
                </div>
              </div>
              <div>
                <div className="text-slate-600">200-400c (⚠)</div>
                <div className="font-semibold text-slate-900">
                  {formatNL(area.over_200_count - area.over_400_count)}
                </div>
              </div>
              <div>
                <div className="text-slate-600">&gt;400c (🚨)</div>
                <div className="font-semibold text-slate-900">{formatNL(area.over_400_count)}</div>
              </div>
            </div>

            {/* Badge */}
            <div className="mt-3 text-xs font-semibold text-slate-600">{severity.label}</div>
          </div>
        );
      })}
    </div>
  );
}
