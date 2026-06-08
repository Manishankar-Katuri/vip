import { NextRequest, NextResponse } from "next/server";

import { getExecutionDocument } from "@/lib/content-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const document = await getExecutionDocument(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      executionWindow: document.executionWindow,
      document: document.contentJson,
      email: {
        subject: document.emailSubject,
        body: document.emailBody,
      },
      fileUrl: document.fileUrl,
      deliveryStatus: document.deliveryStatus,
      deliveryLogs: document.deliveryLogs,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load execution document" },
      { status: 500 }
    );
  }
}
