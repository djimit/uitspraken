import ExportButton from "./ExportButton";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  filterContext?: string | null;
  exportData?: Record<string, unknown>[];
  exportFilename?: string;
  exportColumns?: { key: string; label: string }[];
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  filterContext,
  exportData,
  exportFilename,
  exportColumns,
  children,
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-semibold">
            {title}
            {filterContext && (
              <span className="text-sm font-normal text-blue-600 ml-2">
                {filterContext}
              </span>
            )}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>
        {exportData && exportFilename && (
          <ExportButton
            data={exportData}
            filename={exportFilename}
            columns={exportColumns}
          />
        )}
      </div>
      {children}
    </div>
  );
}
