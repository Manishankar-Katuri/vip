import { NextResponse } from "next/server";

import { listAiHealth, runAiHealthChecks } from "@/lib/phase-e/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ providers: await listAiHealth() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load AI health." }, { status: 500 });
  }
}

export async function POST() {
  try {
    return NextResponse.json({ providers: await runAiHealthChecks() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to run AI health checks." }, { status: 500 });
  }
}

