import type { InhoudsindicatieStats } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IIStatsCards({
  stats,
}: {
  stats: InhoudsindicatieStats;
}) {
  const cards = [
    {
      label: "Dekking",
      value: `${stats.coverage_pct}%`,
      sub: `${formatNL(stats.with_inhoudsindicatie)} van ${formatNL(stats.total_decisions)} beslissingen`,
      color: "text-emerald-700",
    },
    {
      label: "Zonder inhoudsindicatie",
      value: formatNL(stats.without_inhoudsindicatie),
      sub: `${(100 - stats.coverage_pct).toFixed(1)}% van alle beslissingen`,
      color: "text-amber-700",
    },
    {
      label: "Gemiddelde lengte",
      value: `${formatNL(stats.avg_length)} tekens`,
      sub: `Mediaan: ${formatNL(stats.median_length)} tekens`,
      color: "text-blue-700",
    },
    {
      label: "Bereik",
      value: `${stats.min_length} — ${formatNL(stats.max_length)}`,
      sub: "Kortste tot langste (in tekens)",
      color: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg border border-gray-200 p-5"
        >
          <p className="text-sm text-gray-500 font-medium">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>
            {card.value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
