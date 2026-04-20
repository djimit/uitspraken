import { getMaaike2026ByInstantie } from "@/lib/inhoudsindicatie-queries";
import { formatNL } from "@/lib/format";

export function IIQualityKPIs() {
  const data = getMaaike2026ByInstantie();

  // Calculate aggregate stats from 2026 data
  const totalCases = data.reduce((sum, row) => sum + row.count, 0);
  const totalChars = data.reduce((sum, row) => sum + row.avg_chars * row.count, 0);
  const avgChars = totalCases > 0 ? Math.round(totalChars / totalCases) : 0;
  const avgWords = Math.round(avgChars / 5);

  const compliantCases = data.reduce((sum, row) => {
    return sum + Math.round(row.count * (row.compliance_pct / 100));
  }, 0);
  const complianceRate = totalCases > 0 ? Math.round((compliantCases / totalCases) * 100) : 0;

  const guideline = 200; // characters (40 words)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Guideline */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-700 font-semibold">Richtlijn</div>
        <div className="text-2xl font-bold text-blue-900 mt-2">{formatNL(guideline)}c</div>
        <div className="text-xs text-blue-600 mt-1">~40 woorden</div>
      </div>

      {/* Current Average */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-sm text-slate-700 font-semibold">Huidig Gemiddelde</div>
        <div className="text-2xl font-bold text-slate-900 mt-2">{formatNL(avgChars)}c</div>
        <div className="text-xs text-slate-600 mt-1">~{formatNL(avgWords)} woorden</div>
      </div>

      {/* Over Norm */}
      <div className={`border rounded-lg p-4 ${avgChars > guideline ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <div className={`text-sm font-semibold ${avgChars > guideline ? "text-red-700" : "text-green-700"}`}>
          Verschil vs Norm
        </div>
        <div className={`text-2xl font-bold mt-2 ${avgChars > guideline ? "text-red-900" : "text-green-900"}`}>
          {avgChars > guideline ? "+" : ""}{avgChars - guideline}c
        </div>
        <div className={`text-xs mt-1 ${avgChars > guideline ? "text-red-600" : "text-green-600"}`}>
          {avgChars > guideline ? "❌ Boven norm" : "✓ Onder norm"}
        </div>
      </div>

      {/* Compliance Rate */}
      <div className={`border rounded-lg p-4 ${complianceRate >= 60 ? "bg-green-50 border-green-200" : complianceRate >= 40 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
        <div className={`text-sm font-semibold ${complianceRate >= 60 ? "text-green-700" : complianceRate >= 40 ? "text-yellow-700" : "text-red-700"}`}>
          Compliance Rate
        </div>
        <div className={`text-2xl font-bold mt-2 ${complianceRate >= 60 ? "text-green-900" : complianceRate >= 40 ? "text-yellow-900" : "text-red-900"}`}>
          {complianceRate}%
        </div>
        <div className={`text-xs mt-1 ${complianceRate >= 60 ? "text-green-600" : complianceRate >= 40 ? "text-yellow-600" : "text-red-600"}`}>
          {formatNL(compliantCases)} / {formatNL(totalCases)} cases
        </div>
      </div>
    </div>
  );
}
