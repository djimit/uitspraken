import { getIITrendMonth } from "@/lib/inhoudsindicatie-queries";
import type { IITrendMonth } from "@/lib/inhoudsindicatie-queries";
import { IITrendChartClient } from "./IITrendChartClient";

// Server component - fetches data and renders client component
export function IITrendChartServer() {
  const data = getIITrendMonth();
  return <IITrendChartClient data={data} />;
}
