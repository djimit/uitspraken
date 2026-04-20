import { NextRequest, NextResponse } from "next/server";
import { searchDecisions } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = searchDecisions(
    params.get("q") || undefined,
    {
      court: params.get("court") || undefined,
      legalArea: params.get("legalArea") || undefined,
      dateFrom: params.get("dateFrom") || undefined,
      dateTo: params.get("dateTo") || undefined,
      type: params.get("type") || undefined,
    },
    Math.max(1, parseInt(params.get("page") || "1")),
    Math.min(Math.max(1, parseInt(params.get("pageSize") || "25")), 100)
  );
  return NextResponse.json(data);
}
