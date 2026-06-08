import { loadAnalyticsPosts } from "./queries";
import type { AnalyticsPost, AnalyticsQueryOptions, GrowthSummaryOutput } from "./types";
import { aggregateEngagement, round, withinRollingDays } from "./utils";

export async function getGrowthSummary(
  options: AnalyticsQueryOptions
): Promise<GrowthSummaryOutput> {
  const { posts } = await loadAnalyticsPosts(options);
  return buildGrowthSummary(posts);
}

export function buildGrowthSummary(posts: AnalyticsPost[]): GrowthSummaryOutput {
  const hashtags = new Map<string, AnalyticsPost[]>();

  for (const post of posts) {
    for (const tag of post.hashtags) {
      hashtags.set(tag, [...(hashtags.get(tag) ?? []), post]);
    }
  }

  return {
    ...aggregateEngagement(posts),
    rolling7Day: aggregateEngagement(withinRollingDays(posts, 7)),
    rolling30Day: aggregateEngagement(withinRollingDays(posts, 30)),
    followerGrowth: {
      available: false,
      currentFollowers: null,
      change: null,
      percentageChange: null,
      series: [],
      reason: "Follower history is not collected by the ingestion pipeline yet.",
    },
    hashtagPerformance: [...hashtags.entries()]
      .map(([tag, taggedPosts]) => ({
        tag,
        postCount: taggedPosts.length,
        avgEngagementRate: round(aggregateEngagement(taggedPosts).avgEngagementRate),
      }))
      .sort(
        (left, right) =>
          right.avgEngagementRate - left.avgEngagementRate ||
          right.postCount - left.postCount
      )
      .slice(0, 20),
  };
}
