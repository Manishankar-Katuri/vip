import { NextResponse } from "next/server";
import { getBusinessLocations } from "@/lib/acquisition/business-info";

export async function GET() {
  try {
    const locations = await getBusinessLocations();
    return NextResponse.json({ success: true, count: locations.length, locations });
  } catch (error) {
    return NextResponse.json({ success: false, error: message(error) }, { status: 502 });
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Google Business Profile location request failed.";
}
