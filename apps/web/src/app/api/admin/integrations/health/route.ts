import { NextResponse } from "next/server";

import { listIntegrationHealth } from "@/lib/phase-e/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ integrations: await listIntegrationHealth() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load integration health." }, { status: 500 });
  }
}

