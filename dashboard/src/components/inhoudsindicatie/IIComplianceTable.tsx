
import { getIIBestPerformers, getIIWorstPerformers } from "@/lib/inhoudsindicatie-queries";
import { formatNL } from "@/lib/format";
import { Trophy, AlertTriangle } from "lucide-react";

export function IIComplianceTable() {
  const best = getIIBestPerformers();
  const worst = getIIWorstPerformers();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Best performers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-slate-900">🏆 Beste performers (≤200c)</h3>
        </div>

        <div className="space-y-2">
          {best.map((area, i) => {
            const compliancePct = 100 - area.over_200_pct;
            return (
              <div key={`best-${i}`} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {i + 1}. {area.legal_area_name}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatNL(area.count)} zaken | {formatNL(area.avg_chars)}c avg
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-700">{compliancePct}%</div>
                    <div className="text-xs text-green-700">compliant</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="text-slate-700">
            <strong>💡 Inzicht:</strong> Deze rechtsgebieden houden zich{" "}
            <strong>het best aan de richtlijn</strong>. Onderzoek hun praktijk — dit kan dienen als
            model voor andere gebieden.
          </p>
        </div>
      </div>

      {/* Worst performers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-slate-900">⚠️ Slechtste performers (&gt;200c)</h3>
        </div>

        <div className="space-y-2">
          {worst.map((area, i) => {
            const compliancePct = 100 - area.over_200_pct;
            return (
              <div key={`worst-${i}`} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {i + 1}. {area.legal_area_name}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {formatNL(area.count)} zaken | {formatNL(area.avg_chars)}c avg
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-700">{compliancePct}%</div>
                    <div className="text-xs text-red-700">compliant</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <p className="text-slate-700">
            <strong>⚠️ Actie nodig:</strong> Deze rechtsgebieden schrijven{" "}
            <strong>systematisch veel langer</strong> dan de richtlijn toestaat. Gerichte
            communicatie over de 40-woorden regel zou hier veel impact hebben.
          </p>
        </div>
      </div>
    </div>
  );
}
