"use client";

import { formatNL } from "@/lib/format";

export default function IIWordCloud({
  data,
}: {
  data: { word: string; count: number }[];
}) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Veelgebruikte woorden</h2>
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  const maxCount = data[0]?.count ?? 1;
  const minCount = data[data.length - 1]?.count ?? 1;

  function getSize(count: number): number {
    if (maxCount === minCount) return 20;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 12 + ratio * 28; // 12px to 40px
  }

  function getColor(count: number): string {
    const ratio = (count - minCount) / (maxCount - minCount || 1);
    if (ratio > 0.7) return "text-blue-900 font-bold";
    if (ratio > 0.4) return "text-blue-700 font-semibold";
    if (ratio > 0.2) return "text-blue-500 font-medium";
    return "text-blue-400";
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-1">Veelgebruikte woorden</h2>
      <p className="text-sm text-gray-400 mb-4">
        Meest voorkomende woorden in inhoudsindicaties (excl. stopwoorden)
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4 min-h-[200px]">
        {data.map(({ word, count }) => (
          <span
            key={word}
            className={`inline-block ${getColor(count)} hover:text-amber-600 cursor-default transition-colors`}
            style={{ fontSize: `${getSize(count)}px` }}
            title={`${word}: ${formatNL(count)} keer`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
