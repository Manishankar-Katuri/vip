import { buildBestPostingTimes } from "./get-best-posting-times";
import { buildContentTypeBreakdown } from "./get-content-type-breakdown";
import { buildEngagementTrends } from "./get-engagement-trends";
import { buildGrowthSummary } from "./get-growth-summary";
import { buildTopPosts } from "./get-top-posts";
import { loadAnalyticsPosts } from "./queries";
import type { AnalyticsQueryOptions, SocialAnalyticsOverview } from "./types";

export async function getAnalyticsOverview(
  options: AnalyticsQueryOptions
): Promise<SocialAnalyticsOverview> {
  const { posts, truncated } = await loadAnalyticsPosts(options);
  const topPosts = buildTopPosts(posts, { pageSize: 10 });
  const growth = buildGrowthSummary(posts);
  const posting = buildBestPostingTimes(posts);

  return {
    workspaceId: options.workspaceId,
    period: {
      from: options.from?.toISOString() ?? null,
      to: options.to?.toISOString() ?? null,
    },
    avgEngagementRate: growth.avgEngagementRate,
    topPosts: topPosts.posts,
    engagementTrend: buildEngagementTrends(posts),
    bestPostingTimes: posting.bestPostingTimes,
    postingFrequency: posting.postingFrequency,
    contentTypeBreakdown: buildContentTypeBreakdown(posts),
    followerGrowth: growth.followerGrowth,
    totalPosts: growth.totalPosts,
    totalReach: growth.totalReach,
    totalImpressions: growth.totalImpressions,
    rolling7Day: growth.rolling7Day,
    rolling30Day: growth.rolling30Day,
    bestByFormat: topPosts.bestByFormat,
    hashtagPerformance: growth.hashtagPerformance,
    meta: { sampledPosts: posts.length, truncated },
  };
}
