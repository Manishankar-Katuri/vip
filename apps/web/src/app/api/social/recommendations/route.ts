import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateSocialStrategyRecommendations } from "@vip/social-engine";
import type { MarketContext } from "@vip/market-intelligence";
import { workspaceIdSchema } from "@vip/shared/validators/workspace-id";

import { jsonError, requireSocialWorkspaceId } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recommendationSchema = z.object({
  workspaceId: workspaceIdSchema,
  hospitalName: z.string().optional(),
  specialtyFocus: z.array(z.string()).optional(),
  marketContext: z.custom<MarketContext>().optional(),
  persist: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const input = recommendationSchema.parse(await req.json());
    await requireSocialWorkspaceId(input.workspaceId);
    const recommendations = await generateSocialStrategyRecommendations(input);

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
