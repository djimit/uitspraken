import type { PseudoSummary } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

export default function PseudoKPICards({ summary }: { summary: PseudoSummary }) {
  const topType = summary.by_type[0];

  const cards = [
    {
      label: "Gescand",
      value: formatNL(summary.total_scanned),
      sub: "beslissingen met body tekst",
      color: "border-blue-500",
    },
    {
      label: "Met schendingen",
      value: formatNL(summary.with_violations),
      sub: `${summary.violation_rate}% van totaal`,
      color: "border-red-500",
    },
    {
      label: "Schendingspercentage",
      value: `${summary.violation_rate}%`,
      sub: "beslissingen met mogelijke PII",
      color: "border-orange-500",
    },
    {
      label: "Meest voorkomend",
      value: topType?.label ?? "—",
      sub: topType ? `${formatNL(topType.count)} beslissingen` : "",
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
