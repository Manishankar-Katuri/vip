import { NextRequest, NextResponse } from "next/server";

import { createReportRecipient, listReportRecipients, ReportServiceError } from "@/lib/reports";

type ClientRecipientsRouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: NextRequest, { params }: ClientRecipientsRouteContext) {
  const { clientId } = await params;
  const recipients = await listReportRecipients(clientId);
  if (!recipients) return NextResponse.json({ error: "Client/workspace not found." }, { status: 404 });
  return NextResponse.json(recipients);
}

export async function POST(request: NextRequest, { params }: ClientRecipientsRouteContext) {
  const { clientId } = await params;
  try {
    const body = await request.json();
    const recipient = await createReportRecipient(clientId, {
      name: body.name,
      email: body.email,
      role: body.role,
      isDefault: body.isDefault,
      receivesReports: body.receivesReports,
    });
    return NextResponse.json({ recipient });
  } catch (error) {
    if (error instanceof ReportServiceError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save recipient." }, { status: 500 });
  }
}
