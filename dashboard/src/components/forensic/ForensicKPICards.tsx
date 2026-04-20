import type { FinCrimeKPIs } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

const cards = (d: FinCrimeKPIs) => [
  { label: "Witwassen", value: formatNL(d.witwassen), icon: "💰", color: "border-red-500" },
  { label: "Fraude", value: formatNL(d.fraude), icon: "🔍", color: "border-orange-500" },
  { label: "Faillissement", value: formatNL(d.faillissement), icon: "📉", color: "border-amber-500" },
  { label: "FIOD-zaken", value: formatNL(d.fiod), icon: "🏛️", color: "border-blue-500" },
  { label: "Crypto/Bitcoin", value: formatNL(d.crypto), icon: "₿", color: "border-purple-500" },
  { label: "EncroChat/PGP", value: formatNL(d.encrochat), icon: "📱", color: "border-indigo-500" },
  { label: "Criminele org.", value: formatNL(d.criminele_org), icon: "🕸️", color: "border-rose-500" },
  { label: "Ontruimingen", value: formatNL(d.ontruiming), icon: "🏠", color: "border-green-500" },
  { label: "Toeslagenzaken", value: formatNL(d.toeslagen), icon: "📋", color: "border-teal-500" },
  { label: "Bestuurdersaanspr.", value: formatNL(d.bestuurdersaansprakelijkheid), icon: "👔", color: "border-cyan-500" },
];

export default function ForensicKPICards({ data }: { data: FinCrimeKPIs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards(data).map((c) => (
        <div
          key={c.label}
          className={`bg-white rounded-lg border-l-4 ${c.color} p-3 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            <span className="text-lg">{c.icon}</span>
          </div>
          <p className="text-xl font-bold mt-1">{c.value}</p>
          <p className="text-xs text-gray-400">beslissingen</p>
        </div>
      ))}
    </div>
  );
}
