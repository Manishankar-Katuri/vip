import { NextResponse } from "next/server";
import { fetchGBPData } from "@/lib/acquisition/gbp";

export async function POST() {
  try {
    const data = await fetchGBPData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: message(error) }, { status: 502 });
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Google Business Profile request failed.";
}
