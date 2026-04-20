import { NextResponse } from "next/server";
import { getCourts } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(getCourts());
}
