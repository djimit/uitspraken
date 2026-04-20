"use client";

import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ProcedureEntry } from "@/lib/types";
import { formatNL } from "@/lib/format";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";

const COLORS = [
  "#1e40af", "#0369a1", "#0e7490", "#0d9488", "#059669",
  "#16a34a", "#65a30d", "#ca8a04", "#ea580c", "#dc2626",
  "#be185d", "#7c3aed",
];

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
  count: number;
}

function CustomContent({ x, y, width, height, index, name, count }: TreemapContentProps) {
  if (width < 40 || height < 25) return null;
  return (
    <g style={{ cursor: "pointer" }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={COLORS[index % COLORS.length]}
        stroke="#fff"
        strokeWidth={2}
        className="transition-opacity hover:opacity-80"
      />
      {width > 60 && height > 35 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#fff"
            fontSize={Math.min(11, width / 8)}
            fontWeight={600}
          >
            {name.length > width / 7 ? name.slice(0, Math.floor(width / 7)) + "..." : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={10}
          >
            {formatNL(count)}
          </text>
        </>
      )}
    </g>
  );
}

export default function ProcedureTypeChart({
  data,
}: {
  data: ProcedureEntry[];
}) {
  const { toggleFilter } = useFilterNavigation();

  if (!data.length) return null;

  const treeData = data.slice(0, 12).map((d) => ({
    name: d.procedure_type,
    count: d.count,
    size: d.count,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Proceduresoorten
        </h3>
        <span className="text-xs text-gray-400">Klik om te filteren</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <Treemap
          data={treeData}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<CustomContent x={0} y={0} width={0} height={0} index={0} name="" count={0} />}
          onClick={(node) => {
            if (node?.name) {
              toggleFilter("procedure", node.name as string);
            }
          }}
        >
          <Tooltip
            formatter={(value: unknown) => [
              formatNL(Number(value)),
              "Beslissingen",
            ]}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
