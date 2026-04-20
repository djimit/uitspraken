"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EncrochatEntry } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function EncrochatTimeline({ data }: { data: EncrochatEntry[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        EncroChat / PGP-telefoon zaken
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        De EncroChat-hack (2020) leidde tot honderden strafzaken. Dit toont het doorlopende effect op de Nederlandse rechtspraak.
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(data.length / 8))}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-indigo-600">{formatNL(payload[0].value as number)} zaken</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              fill="#818cf8"
              stroke="#6366f1"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
