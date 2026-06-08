import { NextResponse } from "next/server";

import { buildPlatformReadiness } from "@/lib/phase-e/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await buildPlatformReadiness());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to run platform verification." }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

