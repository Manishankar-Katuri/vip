import { NextRequest, NextResponse } from "next/server";

import { getReportDetail, patchReport, ReportServiceError } from "@/lib/reports";

type ReportRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(_request: NextRequest, { params }: ReportRouteContext) {
  const { reportId } = await params;
  const report = await getReportDetail(reportId);

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function PATCH(request: NextRequest, { params }: ReportRouteContext) {
  const { reportId } = await params;

  try {
    const body = await request.json();
    const report = await patchReport(reportId, {
      title: body.title,
      summary: body.summary,
      status: body.status,
      sections: body.sections,
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof ReportServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update report." }, { status: 500 });
  }
}
