import { NextResponse } from "next/server";

import { manualStartWorkflow } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await manualStartWorkflow({
      workspaceId: typeof body.workspaceId === "string" ? body.workspaceId : undefined,
      clientId: typeof body.clientId === "string" ? body.clientId : undefined,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to manually start workflow." },
      { status: 500 }
    );
  }
}

