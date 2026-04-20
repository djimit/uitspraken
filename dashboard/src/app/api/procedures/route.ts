import { NextResponse } from "next/server";
import { getProcedureBreakdown } from "@/lib/queries";

export async function GET() {
  const procedures = getProcedureBreakdown({}, 30);
  return NextResponse.json(procedures);
}
