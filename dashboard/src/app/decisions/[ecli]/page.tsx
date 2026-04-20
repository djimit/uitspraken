import { notFound } from "next/navigation";
import {
  getDecision,
  getDecisionLegalAreas,
  getDecisionRelations,
  getDecisionContributors,
  getDecisionReferences,
  getDecisionVindplaatsen,
} from "@/lib/queries";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ ecli: string }>;
}

export default async function DecisionDetailPage({ params }: PageProps) {
  const { ecli } = await params;
  const decodedEcli = decodeURIComponent(ecli);
  const decision = getDecision(decodedEcli);

  if (!decision) {
    notFound();
  }

  const legalAreas = getDecisionLegalAreas(decodedEcli);
  const relations = getDecisionRelations(decodedEcli);
  const contributors = getDecisionContributors(decodedEcli);
  const references = getDecisionReferences(decodedEcli);
  const vindplaatsen = getDecisionVindplaatsen(decodedEcli);

  return (
    <div className="space-y-6">
      <a
        href="/decisions"
        className="text-sm text-blue-700 hover:underline inline-flex items-center gap-1"
      >
        &larr; Terug naar zoeken
      </a>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono text-blue-900">
              {decision.ecli}
            </h1>
            {decision.alternative_title && (
              <p className="text-lg font-semibold text-amber-700 mt-1">
                &ldquo;{decision.alternative_title}&rdquo;
              </p>
            )}
            {decision.title && (
              <p className="text-gray-600 mt-1">{decision.title}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {decision.decision_type && (
              <a
                href={`/decisions?type=${decision.decision_type}`}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  decision.decision_type === "Uitspraak"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                }`}
              >
                {decision.decision_type}
              </a>
            )}
            {decision.public_url?.startsWith("https://") && (
              <a
                href={decision.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                rechtspraak.nl &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {decision.court_name && (
            <div>
              <p className="text-sm font-medium text-gray-500">Instantie</p>
              <a
                href={`/decisions?court=${encodeURIComponent(decision.court_name)}`}
                className="text-sm text-blue-700 hover:underline mt-0.5 inline-block"
              >
                {decision.court_name}
              </a>
            </div>
          )}
          <MetadataField label="Afdeling" value={decision.court_division} />
          <MetadataField label="Datum uitspraak" value={decision.decision_date} />
          <MetadataField label="Datum publicatie" value={decision.issued_date} />
          <MetadataField label="Zaaknummer" value={decision.case_number} />
          {decision.procedure_type && (
            <div>
              <p className="text-sm font-medium text-gray-500">Procedure</p>
              <a
                href={`/decisions?procedure=${encodeURIComponent(decision.procedure_type)}`}
                className="text-sm text-blue-700 hover:underline mt-0.5 inline-block"
              >
                {decision.procedure_type}
              </a>
            </div>
          )}
          <MetadataField label="Zittingsplaats" value={decision.spatial} />
          {decision.temporal_start && (
            <MetadataField
              label="Periode"
              value={decision.temporal_end ? `${decision.temporal_start} - ${decision.temporal_end}` : decision.temporal_start}
            />
          )}
          {decision.replaces && (
            <MetadataField label="Vervangt" value={decision.replaces} />
          )}
        </div>

        {/* Legal Areas */}
        {legalAreas.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Rechtsgebieden</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {legalAreas.map((area) => (
                <a
                  key={area.legal_area_identifier}
                  href={`/decisions?legalArea=${encodeURIComponent(area.legal_area_name)}`}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                >
                  {area.legal_area_name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contributors (judges) */}
        {contributors.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Rechters</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {contributors.map((c, i) => (
                <a
                  key={i}
                  href={`/decisions?q=${encodeURIComponent(`"${c.name}"`)}`}
                  className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full hover:bg-indigo-200 transition-colors"
                  title={c.role || undefined}
                >
                  {c.name}
                  {c.role && (
                    <span className="ml-1 text-indigo-500">({c.role})</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Vindplaatsen */}
        {vindplaatsen.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Vindplaatsen</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {vindplaatsen.map((vp, i) => (
                <span
                  key={i}
                  className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                >
                  {vp}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inhoudsindicatie */}
      {decision.inhoudsindicatie && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-3">Inhoudsindicatie</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {decision.inhoudsindicatie}
          </p>
        </div>
      )}

      {/* Law References */}
      {references.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-3">Wetsverwijzingen</h2>
          <div className="space-y-1">
            {references.map((ref, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {ref.reference_type && (
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    ref.reference_type === "bwb" ? "bg-blue-100 text-blue-700" :
                    ref.reference_type === "ecli" ? "bg-purple-100 text-purple-700" :
                    ref.reference_type === "eu" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {ref.reference_type.toUpperCase()}
                  </span>
                )}
                <span className="text-gray-700">{ref.label || ref.identifier}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full text */}
      {decision.body_text && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-3">Volledige tekst</h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
            {decision.body_text}
          </div>
        </div>
      )}

      {/* Relations */}
      {relations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-3">Gerelateerde zaken</h2>
          <div className="space-y-2">
            {relations.map((rel, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {rel.related_ecli ? (
                  <a
                    href={`/decisions/${encodeURIComponent(rel.related_ecli)}`}
                    className="font-mono text-blue-700 hover:underline"
                  >
                    {rel.related_ecli}
                  </a>
                ) : (
                  <span className="text-gray-400">Onbekend</span>
                )}
                {rel.relation_type && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {rel.relation_type.split("#").pop()}
                  </span>
                )}
                {rel.relation_aanleg && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                    {rel.relation_aanleg.split("#").pop()}
                  </span>
                )}
                {rel.relation_gevolg && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    {rel.relation_gevolg.split("#").pop()}
                  </span>
                )}
                {rel.label && (
                  <span className="text-gray-500">{rel.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
