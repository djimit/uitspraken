"use client";

import type { VocabEntry } from "@/lib/pseudo-check";
import { formatNL } from "@/lib/format";

interface Props {
  labels: VocabEntry[];
  uniqueCount: number;
  sampleSize: number;
}

function categoryColor(label: string): string {
  if (/verdachte|medeverdachte|veroordeelde/i.test(label)) return "bg-red-100 text-red-800 border-red-200";
  if (/eiser|eiseres|eisers/i.test(label)) return "bg-blue-100 text-blue-800 border-blue-200";
  if (/gedaagde|gedaagden/i.test(label)) return "bg-purple-100 text-purple-800 border-purple-200";
  if (/appellant|appellante/i.test(label)) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (/naam|persoon|betrokkene/i.test(label)) return "bg-orange-100 text-orange-800 border-orange-200";
  if (/minderjarige|kind/i.test(label)) return "bg-pink-100 text-pink-800 border-pink-200";
  if (/adres|woonplaats|postcode|plaats|geboorte/i.test(label)) return "bg-green-100 text-green-800 border-green-200";
  if (/bedrijf|werkgever|werknemer/i.test(label)) return "bg-amber-100 text-amber-800 border-amber-200";
  if (/slachtoffer|benadeelde|aangever/i.test(label)) return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export default function PseudoVocabulary({ labels, uniqueCount, sampleSize }: Props) {
  const maxCount = labels[0]?.count || 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          Pseudonimisering vocabulaire
        </h3>
        <span className="text-xs font-bold text-orange-600">
          {formatNL(uniqueCount)} unieke labels
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Top 40 bracket-labels uit {formatNL(sampleSize)} beslissingen.
        De enorme diversiteit ({formatNL(uniqueCount)} varianten) wijst op gebrek aan standaardisatie.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {labels.map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-xs py-0.5">
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded border font-mono text-xs ${categoryColor(l.label)}`}
            >
              {l.label}
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${Math.max(2, (100 * l.count) / maxCount)}%` }}
              />
            </div>
            <span className="text-gray-500 w-12 text-right">{formatNL(l.count)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-200" /> Verdachte</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-200" /> Eiser</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-200" /> Gedaagde</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-200" /> Appellant</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-200" /> Locatie/datum</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-pink-200" /> Minderjarige</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-200" /> Slachtoffer</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-200" /> Organisatie</span>
      </div>
    </div>
  );
}
