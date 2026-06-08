import { resolveContentPillar } from "./content-classification";
import { loadAnalyticsPosts } from "./queries";
import type {
  AnalyticsPost,
  AnalyticsQueryOptions,
  ContentPillar,
  ContentTypeBreakdownOutput,
} from "./types";
import {
  aggregateEngagement,
  calculateBenchmarks,
  calculatePerformanceScore,
  round,
} from "./utils";

export async function getContentTypeBreakdown(
  options: AnalyticsQueryOptions
): Promise<ContentTypeBreakdownOutput> {
  const { posts } = await loadAnalyticsPosts(options);
  return buildContentTypeBreakdown(posts);
}

export function buildContentTypeBreakdown(
  posts: AnalyticsPost[]
): ContentTypeBreakdownOutput {
  const pillarBuckets = new Map<ContentPillar, AnalyticsPost[]>();
  const formatBuckets = new Map<string, AnalyticsPost[]>();
  const benchmarks = calculateBenchmarks(posts);

  for (const post of posts) {
    const pillar = resolveContentPillar(post.caption, post.category?.type);
    pillarBuckets.set(pillar, [...(pillarBuckets.get(pillar) ?? []), post]);
    formatBuckets.set(post.contentType, [...(formatBuckets.get(post.contentType) ?? []), post]);
  }

  return {
    pillars: [...pillarBuckets.entries()]
      .map(([pillar, bucket]) => ({
        pillar,
        postCount: bucket.length,
        percentage: round((bucket.length / Math.max(posts.length, 1)) * 100, 2),
        avgEngagementRate: aggregateEngagement(bucket).avgEngagementRate,
        avgPerformanceScore: round(
          bucket.reduce(
            (total, post) => total + calculatePerformanceScore(post.metrics, benchmarks),
            0
          ) / bucket.length,
          2
        ),
      }))
      .sort((left, right) => right.avgPerformanceScore - left.avgPerformanceScore),
    formats: [...formatBuckets.entries()]
      .map(([contentType, bucket]) => ({
        contentType,
        postCount: bucket.length,
        percentage: round((bucket.length / Math.max(posts.length, 1)) * 100, 2),
        avgEngagementRate: aggregateEngagement(bucket).avgEngagementRate,
      }))
      .sort((left, right) => right.avgEngagementRate - left.avgEngagementRate),
  };
}
