import { NextRequest, NextResponse } from "next/server";

import { ClientEmailDeliveryService } from "@/lib/content-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const service = new ClientEmailDeliveryService();

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const result = await service.sendDocument(id, body.recipientEmail);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send execution document";
    const status = message.includes("was not found") ? 404 : 500;

    return NextResponse.json(
      { success: false, error: status === 500 ? "Unable to send execution document" : message },
      { status }
    );
  }
}
