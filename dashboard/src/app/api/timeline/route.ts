import { NextRequest, NextResponse } from "next/server";
import { getTimeline } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = getTimeline({
    court: params.get("court") || undefined,
    legalArea: params.get("legalArea") || undefined,
    dateFrom: params.get("dateFrom") || undefined,
    dateTo: params.get("dateTo") || undefined,
    type: params.get("type") || undefined,
  });
  return NextResponse.json(data);
}
