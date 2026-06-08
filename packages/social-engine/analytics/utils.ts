import type {
  AggregatedEngagement,
  AnalyticsMetricValues,
  AnalyticsPost,
  EngagementTrendPoint,
} from "./types";

export function aggregateEngagement(posts: AnalyticsPost[]): AggregatedEngagement {
  const metrics = posts.flatMap((post) => (post.metrics ? [post.metrics] : []));
  const totals = metrics.reduce(
    (sum, value) => ({
      engagementRate: sum.engagementRate + value.engagementRate,
      reach: sum.reach + value.reach,
      impressions: sum.impressions + value.impressions,
      likes: sum.likes + value.likes,
      comments: sum.comments + value.comments,
      saves: sum.saves + value.saves,
    }),
    { engagementRate: 0, reach: 0, impressions: 0, likes: 0, comments: 0, saves: 0 }
  );

  return {
    totalPosts: posts.length,
    postsWithMetrics: metrics.length,
    avgEngagementRate: round(metrics.length ? totals.engagementRate / metrics.length : 0),
    totalReach: totals.reach,
    totalImpressions: totals.impressions,
    totalLikes: totals.likes,
    totalComments: totals.comments,
    totalSaves: totals.saves,
  };
}

export function calculateBenchmarks(posts: AnalyticsPost[]) {
  return posts.reduce(
    (maximums, post) => {
      const metrics = post.metrics;
      if (!metrics) return maximums;

      return {
        engagementRate: Math.max(maximums.engagementRate, metrics.engagementRate),
        saves: Math.max(maximums.saves, metrics.saves),
        comments: Math.max(maximums.comments, metrics.comments),
        reach: Math.max(maximums.reach, metrics.reach),
        impressions: Math.max(maximums.impressions, metrics.impressions),
      };
    },
    { engagementRate: 0, saves: 0, comments: 0, reach: 0, impressions: 0 }
  );
}

export function calculatePerformanceScore(
  metrics: AnalyticsMetricValues | null,
  benchmarks: ReturnType<typeof calculateBenchmarks>
) {
  if (!metrics) return 0;

  const weightedScore =
    ratio(metrics.engagementRate, benchmarks.engagementRate) * 40 +
    ratio(metrics.saves, benchmarks.saves) * 20 +
    ratio(metrics.comments, benchmarks.comments) * 15 +
    ratio(metrics.reach, benchmarks.reach) * 15 +
    ratio(metrics.impressions, benchmarks.impressions) * 10;

  return round(weightedScore, 2);
}

export function bucketPostsByDate(posts: AnalyticsPost[]) {
  const buckets = new Map<string, AnalyticsPost[]>();

  for (const post of posts) {
    const key = post.postedAt.toISOString().slice(0, 10);
    buckets.set(key, [...(buckets.get(key) ?? []), post]);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({ date, posts: values }));
}

export function movingAverage(values: number[], windowSize: number) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const sample = values.slice(start, index + 1);
    return round(sample.reduce((sum, value) => sum + value, 0) / sample.length);
  });
}

export function calculateTrend(values: number[]) {
  if (values.length < 2) {
    return { direction: "INSUFFICIENT_DATA" as const, percentageChange: null };
  }

  const midpoint = Math.ceil(values.length / 2);
  const earlier = average(values.slice(0, midpoint));
  const later = average(values.slice(midpoint));
  const percentageChange = earlier === 0 ? (later === 0 ? 0 : 100) : round(((later - earlier) / earlier) * 100);

  return {
    direction:
      Math.abs(percentageChange) < 3
        ? ("STABLE" as const)
        : percentageChange > 0
          ? ("UP" as const)
          : ("DOWN" as const),
    percentageChange,
  };
}

export function detectTrendAnomalies(series: EngagementTrendPoint[]) {
  if (series.length < 3) return [];

  return series.flatMap((point, index) => {
    if (index < 2) return [];

    const baseline = average(
      series.slice(Math.max(0, index - 7), index).map((item) => item.avgEngagementRate)
    );
    const deviation = baseline === 0 ? 0 : round(((point.avgEngagementRate - baseline) / baseline) * 100);

    return Math.abs(deviation) >= 50
      ? [{ date: point.date, value: point.avgEngagementRate, baseline: round(baseline), deviation }]
      : [];
  });
}

export function withinRollingDays(posts: AnalyticsPost[], days: number, end = new Date()) {
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  return posts.filter((post) => post.postedAt >= start && post.postedAt <= end);
}

export function round(value: number, decimals = 4) {
  return Number(value.toFixed(decimals));
}

function ratio(value: number, maximum: number) {
  return maximum > 0 ? value / maximum : 0;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
