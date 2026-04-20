import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stats = getStats({
    court: params.get("court") || undefined,
    legalArea: params.get("legalArea") || undefined,
    dateFrom: params.get("dateFrom") || undefined,
    dateTo: params.get("dateTo") || undefined,
    type: params.get("type") || undefined,
    procedure: params.get("procedure") || undefined,
  });
  return NextResponse.json(stats);
}
