import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import {
  FacebookCollector,
  ingestInstagramPosts,
  ingestPosts,
  InstagramCollector,
  LinkedinCollector,
  TwitterCollector,
} from "@vip/social-engine";

import { jsonError } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ingestSchema = z.object({
  platforms: z
    .array(z.enum(["INSTAGRAM", "FACEBOOK", "LINKEDIN", "TWITTER"]))
    .default(["INSTAGRAM"]),
  workspaceName: z.string().min(1).optional(),
  workspaceSlug: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const input = ingestSchema.parse(await req.json().catch(() => ({})));

    if (input.platforms.length === 1 && input.platforms[0] === "INSTAGRAM") {
      const result = await ingestInstagramPosts(input);
      revalidateTag("product-experience", "max");
      return NextResponse.json({ success: true, result });
    }

    const collectors = buildCollectors(input.platforms);
    const result = await ingestPosts(collectors, input);
    revalidateTag("product-experience", "max");

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return jsonError(error);
  }
}

function buildCollectors(platforms: Array<"INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "TWITTER">) {
  return platforms.map((platform) => {
    if (platform === "INSTAGRAM") {
      return new InstagramCollector({
        accessToken: requiredEnv("INSTAGRAM_ACCESS_TOKEN"),
        instagramBusinessId: requiredEnv("INSTAGRAM_BUSINESS_ID"),
      });
    }

    if (platform === "FACEBOOK") {
      return new FacebookCollector({
        accessToken: requiredEnv("FACEBOOK_ACCESS_TOKEN"),
        pageId: requiredEnv("FACEBOOK_PAGE_ID"),
      });
    }

    if (platform === "LINKEDIN") {
      return new LinkedinCollector({
        accessToken: requiredEnv("LINKEDIN_ACCESS_TOKEN"),
        organizationUrn: requiredEnv("LINKEDIN_ORGANIZATION_URN"),
      });
    }

    return new TwitterCollector({
      bearerToken: requiredEnv("TWITTER_BEARER_TOKEN"),
      userId: requiredEnv("TWITTER_USER_ID"),
    });
  });
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for social ingestion.`);
  }

  return value;
}
