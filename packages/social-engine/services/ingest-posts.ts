import prisma from "@vip/database";

import {
  NormalizedSocialPost,
  SocialCollector,
  SocialPlatform,
} from "../collectors";
import { classifyContent } from "../analytics/content-classification";
import { normalizeMetrics } from "./normalize-metrics";
import { inferAudienceSignals } from "./demographic-analysis";
import { resolveSocialWorkspace } from "../workspace";

export interface IngestPostsOptions {
  workspaceName?: string;
  workspaceSlug?: string;
  limit?: number;
}

export interface IngestPostsResult {
  workspaceId: string;
  socialAccountIds: string[];
  fetched: number;
  upserted: number;
  posts: Array<{
    postId: string;
    databaseId: string;
    platform: SocialPlatform;
    engagementRate: number;
  }>;
}

export async function ingestPosts(
  collectors: SocialCollector[],
  options: IngestPostsOptions = {}
): Promise<IngestPostsResult> {
  if (collectors.length === 0) {
    throw new Error("At least one social collector is required.");
  }

  const workspaceSlug =
    options.workspaceSlug ?? `social-${collectors[0].platform.toLowerCase()}`;

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: { name: options.workspaceName ?? "VIP Social Intelligence" },
    create: {
      name: options.workspaceName ?? "VIP Social Intelligence",
      slug: workspaceSlug,
    },
  });
  await resolveSocialWorkspace(workspace.id);

  const socialAccountIds = new Set<string>();
  const ingestedPosts: IngestPostsResult["posts"] = [];
  let fetched = 0;

  for (const collector of collectors) {
    const posts = await collector.fetchPosts(options.limit);
    fetched += posts.length;

    for (const post of posts) {
      const socialAccount = await prisma.socialAccount.upsert({
        where: {
          platform_externalAccountId: {
            platform: post.platform,
            externalAccountId: post.externalAccountId,
          },
        },
        update: { workspaceId: workspace.id, status: "ACTIVE" },
        create: {
          workspaceId: workspace.id,
          platform: post.platform,
          externalAccountId: post.externalAccountId,
          status: "ACTIVE",
        },
      });

      socialAccountIds.add(socialAccount.id);
      const normalizedMetrics = normalizeMetrics(post);
      const category = await ensureContentCategory(workspace.id, post);

      const storedPost = await prisma.socialPost.upsert({
        where: {
          platform_postId: {
            platform: post.platform,
            postId: post.postId,
          },
        },
        update: {
          workspaceId: workspace.id,
          socialAccountId: socialAccount.id,
          url: post.url,
          caption: post.caption,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          contentType: post.contentType,
          postedAt: post.postedAt,
          contentCategoryId: category.id,
          rawData: toJson(post.rawData),
        },
        create: {
          workspaceId: workspace.id,
          socialAccountId: socialAccount.id,
          platform: post.platform,
          postId: post.postId,
          url: post.url,
          caption: post.caption,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          contentType: post.contentType,
          postedAt: post.postedAt,
          contentCategoryId: category.id,
          rawData: toJson(post.rawData),
        },
      });

      await prisma.postMetrics.upsert({
        where: { socialPostId: storedPost.id },
        update: { ...normalizedMetrics, rawMetrics: toJson(post.metrics) },
        create: {
          socialPostId: storedPost.id,
          ...normalizedMetrics,
          rawMetrics: toJson(post.metrics),
        },
      });

      await prisma.engagementSnapshot.create({
        data: {
          workspaceId: workspace.id,
          socialPostId: storedPost.id,
          platform: post.platform,
          likes: normalizedMetrics.likes,
          comments: normalizedMetrics.comments,
          shares: normalizedMetrics.shares,
          saves: normalizedMetrics.saves,
          reach: normalizedMetrics.reach,
          impressions: normalizedMetrics.impressions,
          engagementRate: normalizedMetrics.engagementRate,
        },
      });

      await syncHashtags(storedPost.id, post.caption ?? "");

      ingestedPosts.push({
        postId: post.postId,
        databaseId: storedPost.id,
        platform: post.platform,
        engagementRate: normalizedMetrics.engagementRate,
      });
    }
  }

  await syncInferredAudience(workspace.id);

  return {
    workspaceId: workspace.id,
    socialAccountIds: [...socialAccountIds],
    fetched,
    upserted: ingestedPosts.length,
    posts: ingestedPosts,
  };
}

export function extractHashtags(text: string) {
  return [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((match) =>
    match[1].toLowerCase()
  );
}

async function syncHashtags(socialPostId: string, caption: string) {
  const tags = [...new Set(extractHashtags(caption))];

  for (let index = 0; index < tags.length; index += 1) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag: tags[index] },
      update: {},
      create: { tag: tags[index] },
    });

    await prisma.postHashtag.upsert({
      where: {
        socialPostId_hashtagId: {
          socialPostId,
          hashtagId: hashtag.id,
        },
      },
      update: { position: index },
      create: { socialPostId, hashtagId: hashtag.id, position: index },
    });
  }
}

async function ensureContentCategory(workspaceId: string, post: NormalizedSocialPost) {
  const classification = classifyContent(post.caption);

  return prisma.contentCategory.upsert({
    where: { workspaceId_name: { workspaceId, name: classification.name } },
    update: {
      type: classification.type,
      description: classification.rationale,
    },
    create: {
      workspaceId,
      name: classification.name,
      type: classification.type,
      description: classification.rationale,
    },
  });
}

async function syncInferredAudience(workspaceId: string) {
  const posts = await prisma.socialPost.findMany({
    where: { workspaceId },
    select: { caption: true },
    orderBy: { postedAt: "desc" },
    take: 100,
  });

  for (const signal of inferAudienceSignals(
    posts.map((post) => post.caption ?? "")
  )) {
    await prisma.audienceInsight.create({
      data: {
        workspaceId,
        platform: null,
        type: signal.type,
        label: signal.label,
        value: signal.value,
        confidence: signal.confidence,
        metadata: { source: "caption-inference" },
      },
    });
  }
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null));
}
