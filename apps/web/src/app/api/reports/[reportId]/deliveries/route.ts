import { NextRequest, NextResponse } from "next/server";

import { listReportDeliveries } from "@/lib/reports";

type ReportDeliveriesRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(_request: NextRequest, { params }: ReportDeliveriesRouteContext) {
  const { reportId } = await params;
  const deliveries = await listReportDeliveries(reportId);
  if (!deliveries) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json(deliveries);
}
