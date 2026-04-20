"use client";

interface ExportButtonProps {
  data: readonly Record<string, unknown>[] | unknown[];
  filename: string;
  columns?: { key: string; label: string }[];
  className?: string;
}

export default function ExportButton({
  data,
  filename,
  columns,
  className = "",
}: ExportButtonProps) {
  function handleExport() {
    if (!data.length) return;

    const cols =
      columns ??
      Object.keys(data[0] as Record<string, unknown>).map((k) => ({ key: k, label: k }));

    const header = cols.map((c) => `"${c.label}"`).join(";");
    const rows = data.map((row) =>
      cols
        .map((c) => {
          const val = (row as Record<string, unknown>)[c.key];
          if (val === null || val === undefined) return "";
          const s = String(val).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(";")
    );

    const bom = "\uFEFF";
    const csv = bom + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className={`text-xs text-gray-400 hover:text-gray-600 transition-colors ${className}`}
      title="Exporteer als CSV"
      aria-label="Exporteer als CSV"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
  );
}
