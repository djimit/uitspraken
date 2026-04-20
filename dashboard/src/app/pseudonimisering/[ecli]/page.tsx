import { notFound } from "next/navigation";
import { getPseudoDecisionDetail, getDecisionBodyText } from "@/lib/pseudo-check";
import PseudoHighlightedText from "@/components/PseudoHighlightedText";

export const revalidate = 120;

interface PageProps {
  params: Promise<{ ecli: string }>;
}

export default async function PseudoDecisionPage({ params }: PageProps) {
  const { ecli: rawEcli } = await params;
  const ecli = decodeURIComponent(rawEcli);

  const detail = getPseudoDecisionDetail(ecli);
  if (!detail) return notFound();

  const bodyText = getDecisionBodyText(ecli);
  if (!bodyText) return notFound();

  const highCount = detail.violations.filter((v) => v.severity === "high").length;
  const medCount = detail.violations.filter((v) => v.severity === "medium").length;
  const lowCount = detail.violations.filter((v) => v.severity === "low").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a
          href="/pseudonimisering"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Terug naar overzicht
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-2 font-mono">
          {ecli}
        </h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
          {detail.court_name && <span>{detail.court_name}</span>}
          {detail.decision_date && <span>{detail.decision_date}</span>}
          {detail.decision_type && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
              {detail.decision_type}
            </span>
          )}
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3">
        <span className="text-sm font-semibold">
          {detail.violations.length} schending{detail.violations.length !== 1 ? "en" : ""}:
        </span>
        {highCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
            {highCount} hoog
          </span>
        )}
        {medCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
            {medCount} midden
          </span>
        )}
        {lowCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
            {lowCount} laag
          </span>
        )}
      </div>

      {/* Link to original decision view */}
      <a
        href={`/decisions/${encodeURIComponent(ecli)}`}
        className="text-sm text-blue-600 hover:underline"
      >
        Bekijk volledige beslissing &rarr;
      </a>

      {/* Highlighted body text */}
      <PseudoHighlightedText bodyText={bodyText} violations={detail.violations} />
    </div>
  );
}
