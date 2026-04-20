"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FinCrimeByCourt } from "@/lib/forensic-queries";
import { formatNL } from "@/lib/format";

export default function FinCrimeByCourtChart({ data }: { data: FinCrimeByCourt[] }) {
  const short = data.map((d) => ({
    ...d,
    court_short: d.court_name
      .replace("Rechtbank ", "Rb ")
      .replace("Gerechtshof ", "Hof ")
      .replace("Parket bij de ", "Parket ")
      .replace("Centrale Raad van Beroep", "CRvB"),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Financieel-strafrechtelijke zaken per instantie
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Welke rechtbanken behandelen het meeste witwassen, fraude en FIOD-zaken?
      </p>
      <div style={{ height: Math.max(300, short.length * 28) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={short}
            layout="vertical"
            margin={{ left: 160, right: 20, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatNL(v)} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="court_short"
              width={150}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as FinCrimeByCourt;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">{d.court_name}</p>
                    <p className="text-red-600">Witwassen: {formatNL(d.witwassen)}</p>
                    <p className="text-orange-600">Fraude: {formatNL(d.fraude)}</p>
                    <p className="text-blue-600">FIOD: {formatNL(d.fiod)}</p>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="witwassen" fill="#ef4444" stackId="a" name="Witwassen" />
            <Bar dataKey="fraude" fill="#f97316" stackId="a" name="Fraude" />
            <Bar dataKey="fiod" fill="#3b82f6" stackId="a" name="FIOD" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
