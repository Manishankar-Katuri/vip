import { NextRequest, NextResponse } from "next/server";

import { exportReport, listReportExports, ReportServiceError } from "@/lib/reports";

type ReportExportsRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(_request: NextRequest, { params }: ReportExportsRouteContext) {
  const { reportId } = await params;
  const exports = await listReportExports(reportId);

  if (!exports) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json(exports);
}

export async function POST(request: NextRequest, { params }: ReportExportsRouteContext) {
  const { reportId } = await params;

  try {
    const body = await request.json();
    const result = await exportReport(reportId, {
      format: body.format,
      forceRegenerate: Boolean(body.forceRegenerate),
    });

    if (!result) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ReportServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to export report." }, { status: 500 });
  }
}
