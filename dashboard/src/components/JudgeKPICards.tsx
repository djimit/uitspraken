"use client";

import type { JudgeKPIs } from "@/lib/types";
import AnimatedNumber from "./AnimatedNumber";

export default function JudgeKPICards({ kpis }: { kpis: JudgeKPIs }) {
  const cards = [
    {
      label: "Actieve rechters",
      value: kpis.active_judges,
      sub: "Unieke namen in de dataset",
      color: "border-blue-500",
    },
    {
      label: "Gem. zaken per rechter",
      value: kpis.avg_cases_per_judge,
      sub: "Gemiddeld aantal beslissingen",
      color: "border-green-500",
    },
    {
      label: "Conclusie ratio",
      value: kpis.conclusie_ratio,
      suffix: "%",
      sub: kpis.top_areas.length > 0
        ? `Top: ${kpis.top_areas.join(", ")}`
        : "Percentage conclusies",
      color: "border-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-lg border-l-4 ${card.color} border border-gray-200 p-5`}
        >
          <p className="text-sm text-gray-500 font-medium">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            <AnimatedNumber value={card.value} />
            {"suffix" in card && card.suffix}
          </p>
          <p className="text-xs text-gray-400 mt-1 truncate" title={card.sub}>
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
