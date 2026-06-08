import { NextResponse } from "next/server";

import { recordPdfExport } from "@/lib/phase-e/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return NextResponse.json({ exportRun: await recordPdfExport(payload) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to record PDF export." }, { status: 500 });
  }
}

