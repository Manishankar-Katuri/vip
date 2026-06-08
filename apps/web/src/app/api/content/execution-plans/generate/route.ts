import { NextRequest, NextResponse } from "next/server";

import { ThreeDayExecutionPlanService } from "@/lib/content-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new ThreeDayExecutionPlanService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = String(body.workspaceId ?? req.headers.get("x-hospital-id") ?? "");

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "workspaceId is required" }, { status: 400 });
    }

    const runDate = body.runDate ? new Date(String(body.runDate)) : undefined;
    if (runDate && Number.isNaN(runDate.getTime())) {
      return NextResponse.json({ success: false, error: "runDate must be a valid ISO date" }, { status: 400 });
    }
    const mode = body.mode === "preview" ? "preview" : body.mode === "real" || body.mode === undefined ? "real" : null;
    if (!mode) {
      return NextResponse.json({ success: false, error: "mode must be real or preview" }, { status: 400 });
    }
    const generationMode = body.generationMode === "scheduled"
      ? "scheduled"
      : body.generationMode === "fromToday" || body.generationMode === undefined
        ? "fromToday"
        : null;
    if (!generationMode) {
      return NextResponse.json({ success: false, error: "generationMode must be scheduled or fromToday" }, { status: 400 });
    }
    const result = await service.generate({ workspaceId, runDate, mode, generationMode });

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      executionWindowId: result.executionWindowId,
      document: result.document,
      email: result.email,
      file: result.file,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate execution plan";
    const status = message.includes("was not found")
      ? 404
      : message.includes("No content calendar data found")
        ? 400
        : 500;

    return NextResponse.json(
      { success: false, error: status === 500 ? "Unable to generate execution plan" : message },
      { status }
    );
  }
}
