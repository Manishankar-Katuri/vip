import { NextRequest, NextResponse } from "next/server";

import {
  analyzeAudience,
  analyzeEngagement,
  analyzePostingFrequency,
} from "@vip/social-engine";

import { jsonError, readWorkspaceId } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = readWorkspaceId(req);
    const [engagement, audience, postingFrequency] = await Promise.all([
      analyzeEngagement(workspaceId),
      analyzeAudience(workspaceId),
      analyzePostingFrequency(workspaceId),
    ]);

    return NextResponse.json({
      success: true,
      dashboard: {
        engagement,
        audience,
        postingFrequency,
      },
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
