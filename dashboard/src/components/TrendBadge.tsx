import type { TrendDelta } from "@/lib/types";

export default function TrendBadge({ trend }: { trend: TrendDelta }) {
  if (trend.previous === 0) return null;
  const pct = trend.delta_pct;
  if (pct === 0) return null;

  const isUp = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        isUp
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
      title={`Vorige maand: ${trend.previous}`}
    >
      {isUp ? "+" : ""}{pct}%
    </span>
  );
}
