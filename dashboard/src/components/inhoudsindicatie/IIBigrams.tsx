"use client";

import type { BigramEntry } from "@/lib/types";
import { formatNL } from "@/lib/format";

export default function IIBigrams({ data }: { data: BigramEntry[] }) {
  if (!data.length) return null;

  const maxCount = data[0]?.count ?? 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">
        Veelvoorkomende woordparen
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Meest gebruikte twee-woordcombinaties (bigrammen) in inhoudsindicaties
      </p>
      <div className="space-y-1.5">
        {data.map(({ bigram, count }) => (
          <div key={bigram} className="flex items-center gap-3">
            <span className="text-sm font-medium w-52 text-right text-gray-700 shrink-0">
              {bigram}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max((count / maxCount) * 100, 8)}%`,
                }}
              >
                <span className="text-[10px] text-white font-medium">
                  {formatNL(count)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
