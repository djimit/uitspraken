"use client";

import { useRef, useCallback } from "react";
import type { Violation } from "@/lib/pseudo-check";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-200 text-red-900 border-b-2 border-red-500",
  medium: "bg-orange-200 text-orange-900 border-b-2 border-orange-500",
  low: "bg-yellow-200 text-yellow-900 border-b-2 border-yellow-500",
};

interface Props {
  bodyText: string;
  violations: Violation[];
}

export default function PseudoHighlightedText({ bodyText, violations }: Props) {
  const textRef = useRef<HTMLDivElement>(null);

  const scrollToViolation = useCallback((idx: number) => {
    const el = document.getElementById(`v-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-blue-400");
      setTimeout(() => el.classList.remove("ring-4", "ring-blue-400"), 2000);
    }
  }, []);

  // Sort violations by startIdx to build segments
  const sorted = [...violations].sort((a, b) => a.startIdx - b.startIdx);

  // Build React elements: alternating text and highlighted spans
  const elements: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < sorted.length; i++) {
    const v = sorted[i];
    // Skip overlapping violations
    if (v.startIdx < cursor) continue;

    // Text before this violation
    if (v.startIdx > cursor) {
      elements.push(bodyText.slice(cursor, v.startIdx));
    }

    // Highlighted violation
    elements.push(
      <mark
        key={`v-${i}`}
        id={`v-${i}`}
        className={`${SEVERITY_STYLES[v.severity] || ""} rounded px-0.5 cursor-help transition-all`}
        title={`${v.label}: "${v.match}" → ${v.suggestion}`}
      >
        {bodyText.slice(v.startIdx, v.endIdx)}
      </mark>
    );

    cursor = v.endIdx;
  }

  // Remaining text
  if (cursor < bodyText.length) {
    elements.push(bodyText.slice(cursor));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Violation summary sidebar */}
      <div className="lg:w-72 shrink-0">
        <div className="sticky top-4 bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Gevonden schendingen ({violations.length})
          </h3>
          {sorted.map((v, i) => (
            <button
              key={i}
              onClick={() => scrollToViolation(i)}
              className={`w-full text-left text-xs p-2 rounded hover:bg-gray-50 border ${
                v.severity === "high"
                  ? "border-red-200 bg-red-50"
                  : v.severity === "medium"
                  ? "border-orange-200 bg-orange-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <span className="font-semibold">{v.label}</span>
              <br />
              <span className="font-mono text-gray-600">
                &quot;{v.match.length > 30 ? v.match.slice(0, 30) + "..." : v.match}&quot;
              </span>
              <br />
              <span className="text-gray-400">→ {v.suggestion}</span>
            </button>
          ))}
          {violations.length === 0 && (
            <p className="text-xs text-green-600">Geen schendingen gevonden.</p>
          )}
        </div>
      </div>

      {/* Body text with highlights */}
      <div
        ref={textRef}
        className="flex-1 bg-white border border-gray-200 rounded-lg p-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-mono overflow-x-auto"
      >
        {elements}
      </div>
    </div>
  );
}
