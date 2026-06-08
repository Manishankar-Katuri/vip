import { NextRequest, NextResponse } from "next/server";

import { listReports } from "@/lib/reports";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reports = await listReports({
    clientId: searchParams.get("clientId"),
    workflowRunId: searchParams.get("workflowRunId"),
    reportType: searchParams.get("reportType"),
    status: searchParams.get("status"),
    date: searchParams.get("date"),
    limit: searchParams.get("limit"),
  });

  return NextResponse.json(reports);
}
