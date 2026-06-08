import { NextRequest, NextResponse } from "next/server";

import { getTopPosts } from "@vip/social-engine";

import { jsonError, readAnalyticsQuery } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const query = readAnalyticsQuery(req);
    const topPosts = await getTopPosts(query);

    return NextResponse.json({ success: true, topPosts });
  } catch (error) {
    return jsonError(error, 400);
  }
}
