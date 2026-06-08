import { NextResponse } from "next/server";

import { listEndpointHealth, runEndpointValidation } from "@/lib/phase-e/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ endpoints: await listEndpointHealth() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load API audit." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await safeJson(request);
    const results = await runEndpointValidation(typeof body.baseUrl === "string" ? body.baseUrl : undefined);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to run API validation." }, { status: 500 });
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json() as { baseUrl?: string };
  } catch {
    return {};
  }
}

