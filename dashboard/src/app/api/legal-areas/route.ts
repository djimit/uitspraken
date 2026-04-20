import { NextResponse } from "next/server";
import { getLegalAreas } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(getLegalAreas());
}
