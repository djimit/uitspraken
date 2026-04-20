"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BurgerImpactTrend } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

interface Props {
  burgerData: BurgerImpactTrend[];
  vreemdelingenData: { month: string; count: number }[];
}

export default function BurgerImpactChart({ burgerData, vreemdelingenData }: Props) {
  // Merge vreemdelingen into burger data
  const vreemMap = new Map(vreemdelingenData.map((d) => [d.month, d.count]));
  const merged = burgerData.map((d) => ({
    ...d,
    vreemdelingen: vreemMap.get(d.month) || 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Burger-impact: maatschappelijke thema&apos;s
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Zaken die burgers direct raken: ontruimingen, toeslagenaffaire en vreemdelingenrecht
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={merged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(merged.length / 10))}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNL(v)} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    {payload.map((p) => (
                      <p key={p.dataKey as string} style={{ color: p.color }}>
                        {p.name}: {formatNL(p.value as number)}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="vreemdelingen" fill="#818cf8" stroke="#6366f1" fillOpacity={0.3} name="Vreemdelingenrecht" />
            <Area type="monotone" dataKey="ontruiming" fill="#f87171" stroke="#ef4444" fillOpacity={0.4} name="Ontruiming" />
            <Area type="monotone" dataKey="toeslagen" fill="#fbbf24" stroke="#f59e0b" fillOpacity={0.4} name="Toeslagen" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
