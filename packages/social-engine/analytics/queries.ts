import prisma from "@vip/database";

import type { AnalyticsPost, AnalyticsQueryOptions } from "./types";
import { resolveSocialWorkspace } from "../workspace";

export const DEFAULT_MAX_ANALYTICS_RECORDS = 5000;

export async function loadAnalyticsPosts(options: AnalyticsQueryOptions) {
  await resolveSocialWorkspace(options.workspaceId);
  const maxRecords = options.maxRecords ?? DEFAULT_MAX_ANALYTICS_RECORDS;
  const posts = await prisma.socialPost.findMany({
    where: {
      workspaceId: options.workspaceId,
      postedAt: {
        gte: options.from,
        lte: options.to,
      },
    },
    select: {
      id: true,
      postId: true,
      platform: true,
      url: true,
      caption: true,
      mediaUrl: true,
      contentType: true,
      postedAt: true,
      contentCategory: { select: { name: true, type: true } },
      metrics: {
        select: {
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          clicks: true,
          reach: true,
          impressions: true,
          videoViews: true,
          engagementRate: true,
        },
      },
      hashtags: { select: { hashtag: { select: { tag: true } } } },
    },
    orderBy: { postedAt: "desc" },
    take: maxRecords + 1,
  });

  return {
    posts: posts.slice(0, maxRecords).map(
      (post): AnalyticsPost => ({
        ...post,
        category: post.contentCategory,
        hashtags: post.hashtags.map((entry) => entry.hashtag.tag),
      })
    ),
    truncated: posts.length > maxRecords,
  };
}
