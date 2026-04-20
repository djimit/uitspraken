import type { AppealTopOverturned } from "@/lib/appeal-queries";

function shortGevolg(g: string): string {
  const part = g.split("#").pop() || g;
  return part.replace(/_/g, " ");
}

export default function AppealRecentOverturned({ data }: { data: AppealTopOverturned[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Recent vernietigde beslissingen
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Laatste hoger beroep uitspraken die (gedeeltelijk) zijn vernietigd
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
              <th className="py-2 pr-3">ECLI</th>
              <th className="py-2 px-3">Instantie</th>
              <th className="py-2 px-3">Datum</th>
              <th className="py-2 px-3">Rechtsgebied</th>
              <th className="py-2 pl-3">Uitkomst</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 pr-3">
                  <a
                    href={`/decisions/${encodeURIComponent(d.ecli)}`}
                    className="text-blue-600 hover:underline text-xs font-mono"
                  >
                    {d.ecli.replace("ECLI:NL:", "")}
                  </a>
                </td>
                <td className="py-2 px-3 text-xs text-gray-700">
                  {d.court_name?.replace("Rechtbank ", "Rb ").replace("Gerechtshof ", "Hof ") || "—"}
                </td>
                <td className="py-2 px-3 text-xs text-gray-500 font-mono">
                  {d.decision_date || "—"}
                </td>
                <td className="py-2 px-3 text-xs text-gray-600">
                  {d.legal_area || "—"}
                </td>
                <td className="py-2 pl-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {shortGevolg(d.gevolg)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
