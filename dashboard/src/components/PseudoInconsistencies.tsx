import type { InconsistencyStats } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

function pct(part: number, total: number): string {
  if (total === 0) return "0";
  return (Math.round(1000 * part / total) / 10).toString();
}

export default function PseudoInconsistencies({ stats }: { stats: InconsistencyStats }) {
  const items = [
    {
      label: "Volledige geboortedatum zichtbaar",
      value: stats.with_exposed_dob,
      icon: "🎂",
      severity: "high" as const,
      desc: "Beslissingen met [verdachte]/[eiser] maar ook 'geboren op 12 maart 1985' in platte tekst",
    },
    {
      label: "E-mailadres zichtbaar",
      value: stats.with_exposed_email,
      icon: "📧",
      severity: "high" as const,
      desc: "E-mailadressen (niet van overheidsinstanties) in gepseudonimiseerde beslissingen",
    },
    {
      label: "Mobiel nummer zichtbaar",
      value: stats.with_exposed_phone,
      icon: "📱",
      severity: "high" as const,
      desc: "06-nummers in beslissingen die verder wel pseudonimisering toepassen",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Inconsistentie-analyse
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Van {formatNL(stats.total_pseudonymized)} gepseudonimiseerde beslissingen: hoeveel hebben toch
        onbeschermde persoonsgegevens?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="border border-red-200 bg-red-50 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-semibold text-red-800">
                {formatNL(item.value)}
              </span>
              <span className="text-xs text-red-600">
                ({pct(item.value, stats.total_pseudonymized)}%)
              </span>
            </div>
            <p className="text-xs font-medium text-red-700 mb-1">{item.label}</p>
            <p className="text-xs text-red-600/80">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
