import { NextRequest, NextResponse } from "next/server";

import { getEngagementTrends, getGrowthSummary } from "@vip/social-engine";

import { jsonError, readAnalyticsQuery } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const query = readAnalyticsQuery(req);
    const [engagementTrend, growthSummary] = await Promise.all([
      getEngagementTrends(query),
      getGrowthSummary(query),
    ]);

    return NextResponse.json({
      success: true,
      engagementTrend,
      rolling7Day: growthSummary.rolling7Day,
      rolling30Day: growthSummary.rolling30Day,
      hashtagPerformance: growthSummary.hashtagPerformance,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
