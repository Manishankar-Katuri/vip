import { NextRequest, NextResponse } from "next/server";

import { listOwnerClients } from "@/lib/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const result = await listOwnerClients({
      status: params.get("status"),
      search: params.get("search"),
      limit: params.get("limit"),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list clients." },
      { status: 500 }
    );
  }
}
