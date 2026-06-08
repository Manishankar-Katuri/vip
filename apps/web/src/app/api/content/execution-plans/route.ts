import { NextRequest, NextResponse } from "next/server";

import { listExecutionDocuments } from "@/lib/content-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") ?? req.headers.get("x-hospital-id") ?? "";

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "workspaceId is required" }, { status: 400 });
    }

    const documents = await listExecutionDocuments(workspaceId);

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list execution documents";
    const status = message.includes("was not found") ? 404 : 500;

    return NextResponse.json(
      { success: false, error: status === 500 ? "Unable to list execution documents" : message },
      { status }
    );
  }
}
