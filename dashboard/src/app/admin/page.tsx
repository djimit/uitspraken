import PipelineStatus from "@/components/PipelineStatus";
import DataCompleteness from "@/components/DataCompleteness";
import { getPipelineStats, getDataCompleteness } from "@/lib/queries";

export const revalidate = 10; // admin page: refresh more often

export default function AdminPage() {
  const pipelineStats = getPipelineStats();
  const completeness = getDataCompleteness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline & Datakwaliteit</h1>
        <p className="text-gray-500 mt-1">
          Status van de data-import en volledigheid van de opgehaalde beslissingen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineStatus stats={pipelineStats} />
        <DataCompleteness data={completeness} />
      </div>
    </div>
  );
}
