import { NextRequest, NextResponse } from "next/server";

import { ReportServiceError, sendReport } from "@/lib/reports";

type ReportSendRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function POST(request: NextRequest, { params }: ReportSendRouteContext) {
  const { reportId } = await params;
  try {
    const body = await request.json();
    const result = await sendReport(reportId, {
      recipients: Array.isArray(body.recipients) ? body.recipients : [],
      formats: body.formats,
      message: body.message,
    });
    if (!result) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ReportServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send report." }, { status: 500 });
  }
}
