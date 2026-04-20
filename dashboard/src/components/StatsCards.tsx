"use client";

import type { Stats, StatsTrend } from "@/lib/types";
import { formatNL } from "@/lib/format";
import AnimatedNumber from "./AnimatedNumber";
import TrendBadge from "./TrendBadge";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";

export default function StatsCards({ stats, trend }: { stats: Stats; trend?: StatsTrend }) {
  const { setFilter, getFilter } = useFilterNavigation();

  const typeFilter = getFilter("type");

  const cards = [
    {
      label: "Beslissingen",
      value: stats.total,
      sub: `${formatNL(stats.uitspraak_count)} uitspraken, ${formatNL(stats.conclusie_count)} conclusies`,
      trend: trend?.total,
      clickable: false,
    },
    {
      label: "Uitspraken",
      value: stats.uitspraak_count,
      sub: "Rechterlijke beslissingen",
      trend: trend?.uitspraken,
      clickable: true,
      active: typeFilter === "Uitspraak",
      onClick: () => setFilter("type", typeFilter === "Uitspraak" ? null : "Uitspraak"),
    },
    {
      label: "Conclusies",
      value: stats.conclusie_count,
      sub: "Conclusies van advocaat-generaal",
      trend: trend?.conclusies,
      clickable: true,
      active: typeFilter === "Conclusie",
      onClick: () => setFilter("type", typeFilter === "Conclusie" ? null : "Conclusie"),
    },
    {
      label: "Instanties",
      value: stats.court_count,
      sub: "Unieke rechtbanken",
      clickable: false,
    },
    {
      label: "Rechtsgebieden",
      value: stats.legal_area_count,
      sub: "Verschillende rechtsgebieden",
      clickable: false,
    },
    {
      label: "Periode",
      value: null as number | null,
      display:
        stats.date_min && stats.date_max
          ? `${stats.date_min.slice(0, 7)} — ${stats.date_max.slice(0, 7)}`
          : "N/A",
      sub: "Oudste tot nieuwste beslissing",
      clickable: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-lg border p-5 transition-all duration-200 ${
            card.clickable
              ? "cursor-pointer hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5"
              : ""
          } ${
            "active" in card && card.active
              ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
              : "border-gray-200"
          }`}
          onClick={"onClick" in card ? card.onClick : undefined}
          role={card.clickable ? "button" : undefined}
          tabIndex={card.clickable ? 0 : undefined}
          onKeyDown={
            card.clickable
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if ("onClick" in card && card.onClick) card.onClick();
                  }
                }
              : undefined
          }
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            {"trend" in card && card.trend && <TrendBadge trend={card.trend} />}
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {card.value !== null && card.value !== undefined ? (
              <AnimatedNumber value={card.value} />
            ) : (
              "display" in card ? card.display : "N/A"
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
