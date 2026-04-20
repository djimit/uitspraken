import type { CalendarDay } from "@/lib/types";

function getColor(count: number, max: number): string {
  if (count === 0) return "#f3f4f6";
  const ratio = count / max;
  if (ratio > 0.75) return "#1e3a8a";
  if (ratio > 0.5) return "#1e40af";
  if (ratio > 0.3) return "#3b82f6";
  if (ratio > 0.15) return "#93c5fd";
  return "#dbeafe";
}

const MONTH_NAMES = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

/** Parse "YYYY-MM-DD" without timezone issues */
function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

/** Get day-of-week (0=Sun) for a YYYY-MM-DD string */
function dayOfWeek(y: number, m: number, d: number): number {
  // Tomohiko Sakamoto's algorithm (m is 0-indexed)
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yr = m < 2 ? y - 1 : y;
  return (yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) + t[m] + d) % 7;
}

/** Add days to YYYY-MM-DD and return new YYYY-MM-DD */
function addDays(dateStr: string, n: number): string {
  // Use UTC to avoid timezone shifts
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Format date string as "DD-MM-YYYY" */
function formatDateNL(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  return `${String(day).padStart(2, "0")}-${String(month + 1).padStart(2, "0")}-${year}`;
}

interface CellData {
  dateStr: string;
  count: number;
  weekIndex: number;
  dayIndex: number;
}

export default function CalendarHeatmap({ data }: { data: CalendarDay[] }) {
  if (!data.length) return null;

  // Build a map of date -> count
  const dateMap = new Map<string, number>();
  let maxCount = 0;
  for (const d of data) {
    dateMap.set(d.date, d.count);
    if (d.count > maxCount) maxCount = d.count;
  }

  const startStr = data[0].date;
  const endStr = data[data.length - 1].date;

  // Walk from start-of-week of startStr to endStr
  const startParsed = parseDate(startStr);
  const startDow = dayOfWeek(startParsed.year, startParsed.month, startParsed.day);
  const weekStartStr = addDays(startStr, -startDow); // Go to Sunday

  const cells: CellData[] = [];
  let weekIndex = 0;
  let dayIndex = 0;
  let cursor = weekStartStr;

  while (cursor <= endStr) {
    const count = dateMap.get(cursor) ?? 0;
    cells.push({ dateStr: cursor, count, weekIndex, dayIndex });

    dayIndex++;
    if (dayIndex === 7) {
      dayIndex = 0;
      weekIndex++;
    }
    cursor = addDays(cursor, 1);
  }

  const totalWeeks = weekIndex + (dayIndex > 0 ? 1 : 0);

  // Month labels
  const months: { label: string; index: number }[] = [];
  let lastMonth = -1;
  for (const cell of cells) {
    if (cell.dateStr < startStr || cell.dateStr > endStr) continue;
    const { month } = parseDate(cell.dateStr);
    if (month !== lastMonth) {
      months.push({ label: MONTH_NAMES[month], index: cell.weekIndex });
      lastMonth = month;
    }
  }

  const cellSize = 11;
  const gap = 2;
  const totalWidth = totalWeeks * (cellSize + gap);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Beslissingen per dag
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <span>Minder</span>
          {[0, 0.15, 0.3, 0.5, 0.75, 1].map((r) => (
            <div
              key={r}
              className="w-[10px] h-[10px] rounded-sm"
              style={{ backgroundColor: getColor(r * maxCount, maxCount) }}
            />
          ))}
          <span>Meer</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          width={totalWidth + 30}
          height={7 * (cellSize + gap) + 20}
          className="block"
        >
          {/* Month labels */}
          {months.map((m) => (
            <text
              key={`${m.label}-${m.index}`}
              x={30 + m.index * (cellSize + gap)}
              y={10}
              className="fill-gray-400"
              fontSize={9}
            >
              {m.label}
            </text>
          ))}
          {/* Day labels */}
          {["Ma", "Wo", "Vr"].map((d, i) => (
            <text
              key={d}
              x={0}
              y={18 + (i * 2 + 1) * (cellSize + gap) + cellSize / 2 + 3}
              className="fill-gray-400"
              fontSize={9}
            >
              {d}
            </text>
          ))}
          {/* Cells */}
          {cells.map((cell) => {
            if (cell.dateStr < startStr || cell.dateStr > endStr) return null;
            const cx = 30 + cell.weekIndex * (cellSize + gap);
            const cy = 18 + cell.dayIndex * (cellSize + gap);
            if (cell.count === 0) {
              return (
                <rect
                  key={cell.dateStr}
                  x={cx}
                  y={cy}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={getColor(0, maxCount)}
                >
                  <title>{`${formatDateNL(cell.dateStr)}: 0 beslissingen`}</title>
                </rect>
              );
            }
            return (
              <a
                key={cell.dateStr}
                href={`/decisions?dateFrom=${cell.dateStr}&dateTo=${cell.dateStr}`}
                className="cursor-pointer"
              >
                <rect
                  x={cx}
                  y={cy}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={getColor(cell.count, maxCount)}
                  className="hover:stroke-amber-400 hover:stroke-2"
                >
                  <title>{`${formatDateNL(cell.dateStr)}: ${cell.count} beslissingen — klik om te bekijken`}</title>
                </rect>
              </a>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
