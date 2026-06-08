import { NextRequest, NextResponse } from "next/server";

import { actOnReportApproval, getReportApproval, ReportServiceError } from "@/lib/reports";

type ReportApprovalRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(_request: NextRequest, { params }: ReportApprovalRouteContext) {
  const { reportId } = await params;
  const approval = await getReportApproval(reportId);
  if (!approval) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json(approval);
}

export async function POST(request: NextRequest, { params }: ReportApprovalRouteContext) {
  const { reportId } = await params;
  try {
    const body = await request.json();
    const approval = await actOnReportApproval(reportId, {
      action: body.action,
      notes: body.notes,
      decidedBy: body.decidedBy,
    });
    if (!approval) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json(approval);
  } catch (error) {
    if (error instanceof ReportServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update approval." }, { status: 500 });
  }
}
