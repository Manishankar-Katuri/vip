import { loadAnalyticsPosts } from "./queries";
import type { AnalyticsPost, AnalyticsQueryOptions, EngagementTrendOutput } from "./types";
import {
  aggregateEngagement,
  bucketPostsByDate,
  calculateTrend,
  detectTrendAnomalies,
  movingAverage,
} from "./utils";

export async function getEngagementTrends(
  options: AnalyticsQueryOptions
): Promise<EngagementTrendOutput> {
  const { posts } = await loadAnalyticsPosts(options);
  return buildEngagementTrends(posts);
}

export function buildEngagementTrends(posts: AnalyticsPost[]): EngagementTrendOutput {
  const series = bucketPostsByDate(posts).map(({ date, posts: bucket }) => {
    const totals = aggregateEngagement(bucket);
    return {
      date,
      postCount: bucket.length,
      avgEngagementRate: totals.avgEngagementRate,
      movingAverage7Day: 0,
      reach: totals.totalReach,
      impressions: totals.totalImpressions,
      saves: totals.totalSaves,
      comments: totals.totalComments,
    };
  });
  const averages = movingAverage(
    series.map((point) => point.avgEngagementRate),
    7
  );
  const chartSeries = series.map((point, index) => ({
    ...point,
    movingAverage7Day: averages[index],
  }));

  return {
    series: chartSeries,
    ...calculateTrend(chartSeries.map((point) => point.avgEngagementRate)),
    anomalies: detectTrendAnomalies(chartSeries),
  };
}
