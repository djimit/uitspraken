import type { InhoudsindicatieExample } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IIExamples({
  title,
  examples,
}: {
  title: string;
  examples: InhoudsindicatieExample[];
}) {
  if (!examples.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {examples.map((ex) => (
          <div
            key={ex.ecli}
            className="border border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <a
                href={`/decisions/${encodeURIComponent(ex.ecli)}`}
                className="text-sm font-mono text-blue-700 hover:underline break-all"
              >
                {ex.ecli}
              </a>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                {formatNL(ex.length)} tekens
              </span>
            </div>
            <div className="flex gap-2 text-xs text-gray-500 mb-2">
              {ex.court_name && <span>{ex.court_name}</span>}
              {ex.decision_date && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{ex.decision_date}</span>
                </>
              )}
              {ex.decision_type && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{ex.decision_type}</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {ex.inhoudsindicatie}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
