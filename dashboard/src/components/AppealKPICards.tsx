import type { AppealKPIs } from "@/lib/appeal-queries";
import { formatNL } from "@/lib/format";

export default function AppealKPICards({ data }: { data: AppealKPIs }) {
  const cards = [
    {
      label: "Totaal hoger beroep",
      value: formatNL(data.total_appeals),
      sub: "zaken met uitkomst",
      color: "border-blue-500",
    },
    {
      label: "Bekrachtigd",
      value: formatNL(data.bekrachtigd),
      sub: `${(100 - data.vernietigings_pct - (data.total_appeals > 0 ? Math.round(1000 * data.overig / data.total_appeals) / 10 : 0)).toFixed(1)}% van totaal`,
      color: "border-green-500",
    },
    {
      label: "Vernietigd",
      value: formatNL(data.vernietigd),
      sub: `${data.vernietigings_pct}% vernietigingspercentage`,
      color: "border-red-500",
    },
    {
      label: "Gem. doorlooptijd",
      value: data.avg_days_between ? `${formatNL(data.avg_days_between)} dagen` : "—",
      sub: "tussen eerste aanleg en beroep",
      color: "border-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-white rounded-lg border-l-4 ${c.color} p-4 shadow-sm`}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
          <p className="text-2xl font-bold mt-1">{c.value}</p>
          <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
