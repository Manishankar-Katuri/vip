import { NextRequest, NextResponse } from "next/server";

import { listWorkflows } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const result = await listWorkflows({
      clientId: params.get("clientId"),
      status: params.get("status"),
      date: params.get("date"),
      limit: params.get("limit"),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list workflows." },
      { status: 500 }
    );
  }
}

