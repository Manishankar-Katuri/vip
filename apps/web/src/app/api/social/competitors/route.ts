import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@vip/database";
import { workspaceIdSchema } from "@vip/shared/validators/workspace-id";
import { analyzeCompetitors } from "@vip/social-engine";

import { jsonError, readWorkspaceId, requireSocialWorkspaceId } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const competitorSchema = z.object({
  workspaceId: workspaceIdSchema,
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TWITTER", "LINKEDIN", "YOUTUBE", "TIKTOK", "OTHER"]),
  handle: z.string().min(1),
  displayName: z.string().optional(),
  profileUrl: z.string().url().optional(),
  tier: z.enum(["DIRECT", "ASPIRATIONAL", "LOCAL", "SPECIALTY"]).default("DIRECT"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const workspaceId = readWorkspaceId(req);
    const competitors = await analyzeCompetitors(workspaceId);

    return NextResponse.json({ success: true, competitors });
  } catch (error) {
    return jsonError(error, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = competitorSchema.parse(await req.json());
    await requireSocialWorkspaceId(input.workspaceId);
    const competitor = await prisma.competitorAccount.upsert({
      where: {
        workspaceId_platform_handle: {
          workspaceId: input.workspaceId,
          platform: input.platform,
          handle: input.handle,
        },
      },
      update: {
        displayName: input.displayName,
        profileUrl: input.profileUrl,
        tier: input.tier,
        notes: input.notes,
      },
      create: input,
    });

    return NextResponse.json({ success: true, competitor });
  } catch (error) {
    return jsonError(error, 400);
  }
}
