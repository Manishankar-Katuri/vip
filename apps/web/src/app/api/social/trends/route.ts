import { NextRequest, NextResponse } from "next/server";

import { analyzeTrends } from "@vip/social-engine";

import { jsonError, readWorkspaceId } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = readWorkspaceId(req);
    const trends = await analyzeTrends(workspaceId);

    return NextResponse.json({ success: true, trends });
  } catch (error) {
    return jsonError(error, 400);
  }
}
