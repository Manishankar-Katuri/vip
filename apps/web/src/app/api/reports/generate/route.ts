import { NextRequest, NextResponse } from "next/server";

import { generateReport, ReportServiceError } from "@/lib/reports";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = await generateReport({
      reportType: body.reportType,
      clientId: body.clientId,
      workspaceId: body.workspaceId,
      workflowRunId: body.workflowRunId,
      date: body.date,
      forceRegenerate: Boolean(body.forceRegenerate),
    });

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof ReportServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate report." }, { status: 500 });
  }
}
