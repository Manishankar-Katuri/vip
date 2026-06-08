import { NextRequest, NextResponse } from "next/server";

import { deleteReportRecipient, ReportServiceError, updateReportRecipient } from "@/lib/reports";

type ClientRecipientRouteContext = {
  params: Promise<{ clientId: string; recipientId: string }>;
};

export async function PATCH(request: NextRequest, { params }: ClientRecipientRouteContext) {
  const { clientId, recipientId } = await params;
  try {
    const body = await request.json();
    const recipient = await updateReportRecipient(clientId, recipientId, {
      name: body.name,
      email: body.email,
      role: body.role,
      isDefault: body.isDefault,
      receivesReports: body.receivesReports,
    });
    if (!recipient) return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
    return NextResponse.json({ recipient });
  } catch (error) {
    if (error instanceof ReportServiceError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update recipient." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: ClientRecipientRouteContext) {
  const { clientId, recipientId } = await params;
  const result = await deleteReportRecipient(clientId, recipientId);
  if (!result) return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  return NextResponse.json(result);
}
