import { NextRequest, NextResponse } from "next/server";

import { ThreeDayExecutionPlanService } from "@/lib/content-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new ThreeDayExecutionPlanService();

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId") ?? req.headers.get("x-hospital-id") ?? "";

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "workspaceId is required" }, { status: 400 });
    }

    const runDateParam = req.nextUrl.searchParams.get("runDate");
    const runDate = runDateParam ? new Date(runDateParam) : new Date();
    if (Number.isNaN(runDate.getTime())) {
      return NextResponse.json({ success: false, error: "runDate must be a valid ISO date" }, { status: 400 });
    }
    const preview = await service.previewNextWindow(
      workspaceId,
      runDate
    );

    return NextResponse.json({ success: true, ...preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview execution plan";
    const status = message.includes("was not found") ? 404 : 500;

    return NextResponse.json(
      { success: false, error: status === 500 ? "Unable to preview execution plan" : message },
      { status }
    );
  }
}
