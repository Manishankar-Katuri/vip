import { loadAnalyticsPosts } from "./queries";
import type { AnalyticsPost, AnalyticsQueryOptions, PostingTimeOutput } from "./types";
import {
  aggregateEngagement,
  bucketPostsByDate,
  calculateBenchmarks,
  calculatePerformanceScore,
  round,
} from "./utils";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getBestPostingTimes(
  options: AnalyticsQueryOptions
): Promise<PostingTimeOutput> {
  const { posts } = await loadAnalyticsPosts(options);
  return buildBestPostingTimes(posts);
}

export function buildBestPostingTimes(posts: AnalyticsPost[]): PostingTimeOutput {
  const benchmarks = calculateBenchmarks(posts);
  const timeBuckets = new Map<string, AnalyticsPost[]>();

  for (const post of posts) {
    const key = `${post.postedAt.getUTCDay()}:${post.postedAt.getUTCHours()}`;
    timeBuckets.set(key, [...(timeBuckets.get(key) ?? []), post]);
  }

  const bestPostingTimes = [...timeBuckets.entries()]
    .map(([key, bucket]) => {
      const [dayOfWeek, hourOfDay] = key.split(":").map(Number);
      const totals = aggregateEngagement(bucket);
      const avgPerformanceScore = bucket.reduce(
        (sum, post) => sum + calculatePerformanceScore(post.metrics, benchmarks),
        0
      ) / bucket.length;

      return {
        dayOfWeek,
        dayLabel: dayLabels[dayOfWeek],
        hourOfDay,
        postCount: bucket.length,
        avgEngagementRate: totals.avgEngagementRate,
        avgPerformanceScore: round(avgPerformanceScore, 2),
      };
    })
    .sort(
      (left, right) =>
        right.avgPerformanceScore - left.avgPerformanceScore ||
        right.avgEngagementRate - left.avgEngagementRate
    )
    .slice(0, 10);

  return {
    bestPostingTimes,
    postingFrequency: bucketPostsByDate(posts).map(({ date, posts: bucket }) => ({
      date,
      postCount: bucket.length,
    })),
  };
}
