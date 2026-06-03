import { NextResponse } from "next/server";
import { getCourts } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getCourts());
}
