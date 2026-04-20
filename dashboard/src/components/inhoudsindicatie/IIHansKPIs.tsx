
import { getIIOverallStats, getIIStrafVsFamilie } from "@/lib/inhoudsindicatie-queries";
import { formatNL } from "@/lib/format";
import { AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";

export function IIHansKPIs() {
  const overall = getIIOverallStats();
  const { strafrecht, familie } = getIIStrafVsFamilie();

  const richtlijnChars = 200; // 40 woorden

  return (
    <div className="space-y-8">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-xs text-slate-600 uppercase font-semibold">Richtlijn</div>
          <div className="text-2xl font-bold text-slate-900">{richtlijnChars} tekens</div>
          <div className="text-sm text-slate-600">= 40 woorden</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-xs text-slate-600 uppercase font-semibold">Huidige gemiddelde</div>
          <div className="text-2xl font-bold text-blue-900">{formatNL(overall.avg_chars)} tekens</div>
          <div className="text-sm text-blue-700">~{formatNL(overall.avg_words)} woorden</div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-xs text-slate-600 uppercase font-semibold">Over norm</div>
          <div className="text-2xl font-bold text-red-900">+{formatNL(overall.avg_chars - richtlijnChars)}</div>
          <div className="text-sm text-red-700">
            {overall.compliance_pct}% compliant
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-xs text-slate-600 uppercase font-semibold">Totaal zaken</div>
          <div className="text-2xl font-bold text-amber-900">{formatNL(overall.count)}</div>
          <div className="text-sm text-amber-700">met inhoudsindicatie</div>
        </div>
      </div>

      {/* Strafrecht vs Familie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strafrecht */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Strafrecht</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Gemiddelde lengte:</span>
              <span className="font-bold text-red-900">
                {formatNL(strafrecht.avg_chars)} tekens (~{formatNL(strafrecht.avg_words)} w)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Over 200 tekens:</span>
              <span className="font-bold text-red-900">
                {formatNL(Math.round(100 - (strafrecht.compliance_pct || 0)))}%
              </span>
            </div>
            <div className="text-sm text-red-700 mt-4">
              ⚠️ Strafrecht schrijft <strong>gemiddeld langer</strong> dan de richtlijn toestaat
            </div>
          </div>
        </div>

        {/* Familie */}
        <div className="border border-green-200 bg-green-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Civiel recht (Familie)</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Gemiddelde lengte:</span>
              <span className="font-bold text-green-900">
                {formatNL(familie.avg_chars)} tekens (~{formatNL(familie.avg_words)} w)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Over 200 tekens:</span>
              <span className="font-bold text-green-900">
                {formatNL(Math.round(100 - (familie.compliance_pct || 0)))}%
              </span>
            </div>
            <div className="text-sm text-green-700 mt-4">
              ✓ Familie houdt zich <strong>beter aan richtlijn</strong> dan strafrecht
            </div>
          </div>
        </div>
      </div>

      {/* Insight box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-slate-900 mb-2">💡 Antwoord op jouw vraag (Hans)</h4>
        <p className="text-slate-700">
          <strong>Ja, strafrecht schrijft aanzienlijk langere inhoudsdicaties.</strong> Strafrecht gemiddeld{" "}
          <span className="font-bold text-red-700">{formatNL(strafrecht.avg_chars)} tekens</span> vs Familie{" "}
          <span className="font-bold text-green-700">{formatNL(familie.avg_chars)} tekens</span> — een verschil van{" "}
          <strong>{formatNL(strafrecht.avg_chars - familie.avg_chars)} tekens</strong> ({Math.round(((strafrecht.avg_chars - familie.avg_chars) / familie.avg_chars) * 100)}% langer).
        </p>
        <p className="text-slate-700 mt-3">
          Dit kan wijzen op een grotere behoefte aan context in strafrecht (verdachte, feiten, bewijzen), of
          onbekendheid met de 40-woorden richtlijn op strafafdelingen.
        </p>
      </div>
    </div>
  );
}
