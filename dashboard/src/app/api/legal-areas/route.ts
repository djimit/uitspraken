import { NextResponse } from "next/server";
import { getLegalAreas } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getLegalAreas());
}
