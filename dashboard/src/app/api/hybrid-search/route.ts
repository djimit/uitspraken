import { NextRequest, NextResponse } from "next/server";
import { hybridSearch } from "@/lib/hybrid-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = await hybridSearch(
    params.get("q") || undefined,
    {
      court: params.get("court") || undefined,
      legalArea: params.get("legalArea") || undefined,
      dateFrom: params.get("dateFrom") || undefined,
      dateTo: params.get("dateTo") || undefined,
      type: params.get("type") || undefined,
      procedure: params.get("procedure") || undefined,
    },
    Math.max(1, parseInt(params.get("page") || "1")),
    Math.min(Math.max(1, parseInt(params.get("pageSize") || "25")), 100)
  );
  return NextResponse.json(data);
}
