import { NextRequest, NextResponse } from "next/server";

import { persistProvenanceSnapshot } from "@/lib/phase-e/server";
import { getInstagramAnalyticsPayload } from "@/lib/server/instagram-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const hospitalId = req.nextUrl.searchParams.get("hospitalId") ?? "";
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const safeDays = Number.isFinite(days) && days >= 7 && days <= 90 ? days : 30;

  try {
    const payload = await getInstagramAnalyticsPayload(hospitalId, safeDays);
    persistProvenanceSnapshot("admin.analytics.instagram", "overview", payload.provenance, payload.workspaceId).catch((error) => {
      console.error({ source: "phase-e-provenance", error });
    });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to load Instagram analytics.",
      },
      { status: 500 }
    );
  }
}
