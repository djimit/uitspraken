"use client";

import { formatNL } from "@/lib/format";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ProblematicCase {
  ecli: string;
  court_name: string;
  legal_area_name: string;
  decision_date: string;
  inhoudsindicatie_chars: number;
  inhoudsindicatie_words: number;
  inhoudsindicatie_preview: string;
  severity: "warning" | "critical";
}

export function IIMaaikeProblematicCases({ cases }: { cases: ProblematicCase[] }) {
  const [expandedEcli, setExpandedEcli] = useState<string | null>(null);

  // Group by severity
  const critical = cases.filter((c) => c.severity === "critical");
  const warning = cases.filter((c) => c.severity === "warning");

  return (
    <div className="space-y-6">
      {/* Critical Section */}
      {critical.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">
              🔴 KRITISCH ({">"}80 woorden / 400 tekens) - {formatNL(critical.length)} cases
            </h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {critical.slice(0, 50).map((c) => (
              <CaseRow key={c.ecli} caseData={c} expanded={expandedEcli === c.ecli} onToggle={() => setExpandedEcli(expandedEcli === c.ecli ? null : c.ecli)} />
            ))}
          </div>

          {critical.length > 50 && (
            <p className="text-xs text-slate-600 italic">... en nog {critical.length - 50} meer (zie CSV export voor alles)</p>
          )}
        </div>
      )}

      {/* Warning Section */}
      {warning.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">
              🟠 WAARSCHUWING (40-80 woorden / 240-400 tekens) - {formatNL(warning.length)} cases
            </h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {warning.slice(0, 50).map((c) => (
              <CaseRow key={c.ecli} caseData={c} expanded={expandedEcli === c.ecli} onToggle={() => setExpandedEcli(expandedEcli === c.ecli ? null : c.ecli)} />
            ))}
          </div>

          {warning.length > 50 && (
            <p className="text-xs text-slate-600 italic">... en nog {warning.length - 50} meer (zie CSV export voor alles)</p>
          )}
        </div>
      )}

      {/* Insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-slate-700">
          <strong>Handmatige Review:</strong> Klik op een ECLI om de volledige inhoudsindicatie te zien. Beoordeel of
          de lengte inhoudelijk gerechtvaardigd is of dat de richtlijn onbekend/niet gevolgd is. Deze informatie kan
          gebruikt worden voor vervolgconversaties met rechtbanken/hoven.
        </p>
      </div>

      {/* Export suggestion */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
        <p className="text-slate-700">
          💡 <strong>Tip:</strong> Voor volledige export (alle {formatNL(cases.length)} cases met ECLIs), vraag Dennis
          om een CSV-export van getMaaikeProblematicCases().
        </p>
      </div>
    </div>
  );
}

function CaseRow({
  caseData,
  expanded,
  onToggle,
}: {
  caseData: {
    ecli: string;
    court_name: string;
    legal_area_name: string;
    decision_date: string;
    inhoudsindicatie_chars: number;
    inhoudsindicatie_words: number;
    inhoudsindicatie_preview: string;
    severity: "warning" | "critical";
  };
  expanded: boolean;
  onToggle: () => void;
}) {
  const bgColor = caseData.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200";
  const textColor = caseData.severity === "critical" ? "text-red-900" : "text-amber-900";

  return (
    <div className={`border rounded p-2 cursor-pointer hover:shadow-sm transition ${bgColor}`} onClick={onToggle}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-mono text-xs font-bold text-slate-700">{caseData.ecli}</div>
          <div className="text-xs text-slate-600 mt-1">
            {caseData.court_name} | {caseData.legal_area_name} | {caseData.decision_date}
          </div>
          <div className={`text-sm font-bold mt-1 ${textColor}`}>
            {formatNL(caseData.inhoudsindicatie_chars)} tekens (~{formatNL(caseData.inhoudsindicatie_words)} woorden)
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 p-2 bg-white border border-dashed border-slate-300 rounded text-xs text-slate-700">
          <strong>Inhoudsindicatie:</strong> <br />
          {caseData.inhoudsindicatie_preview}
        </div>
      )}
    </div>
  );
}
