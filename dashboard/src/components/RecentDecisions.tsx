import type { DecisionListItem } from "@/lib/types";

export default function RecentDecisions({
  decisions,
}: {
  decisions: DecisionListItem[];
}) {
  if (!decisions.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Decisions</h2>
        <p className="text-gray-400">No decisions available yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Decisions</h2>
      <div className="space-y-3">
        {decisions.map((d) => (
          <a
            key={d.ecli}
            href={`/decisions/${encodeURIComponent(d.ecli)}`}
            className="block p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-blue-700">
                {d.ecli}
              </span>
              <span className="text-xs text-gray-400">{d.decision_date}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {d.decision_type && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    d.decision_type === "Uitspraak"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {d.decision_type}
                </span>
              )}
              {d.court_name && (
                <span className="text-xs text-gray-500">{d.court_name}</span>
              )}
            </div>
            {d.inhoudsindicatie && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {d.inhoudsindicatie}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
