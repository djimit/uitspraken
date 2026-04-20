import { NextResponse } from "next/server";
import { getTopJudges } from "@/lib/queries";

export async function GET() {
  const judges = getTopJudges(50);
  return NextResponse.json(judges);
}
