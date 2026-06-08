import { NextRequest, NextResponse } from "next/server";

import prisma from "@vip/database";
import { getAnalyticsOverview, getTopPosts } from "@vip/social-engine";

import {
  normalizeHospitalKey,
  resolveHarikaSocialWorkspaceId
} from "@/lib/harika-workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOCIAL_WORKSPACE_BY_HOSPITAL: Record<string, string> = {
  "harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "harika-ent-care-hospitals-name": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "dr-harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
};

const INDUSTRY_REFERENCE = {
  INSTAGRAM: {
    engagementRate: {
      label: "Industry reference",
      range: "0.40% to 0.60%",
      source: "Adobe Express social media engagement guide, 2025",
    },
  },
  FACEBOOK: {
    engagementRate: {
      label: "Industry reference",
      range: "0.06% to 0.20%",
      source: "Adobe Express social media engagement guide, 2025",
    },
  },
} as const;

export async function GET(req: NextRequest) {
  const hospitalId = req.nextUrl.searchParams.get("hospitalId") ?? "";
  const workspaceId = resolveSocialWorkspaceId(hospitalId);

  if (!workspaceId) {
    return NextResponse.json({
      success: true,
      workspaceId: null,
      platforms: [],
      posts: [],
      topPosts: [],
      hashtagPerformance: [],
      bestPostingTimes: [],
      contentTypeBreakdown: { pillars: [], formats: [] },
      engagementTrend: null,
      rolling7Day: null,
      rolling30Day: null,
      benchmarks: null,
      insightNotes: ["No social intelligence workspace is assigned to this hospital yet."],
    });
  }

  const [platformCounts, metricRows, posts, analytics, allTopPosts] = await Promise.all([
    prisma.socialPost.groupBy({
      by: ["platform"],
      where: { workspaceId },
      _count: { _all: true },
    }),
    prisma.socialPost.findMany({
      where: { workspaceId },
      select: {
        platform: true,
        metrics: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            saves: true,
            reach: true,
            impressions: true,
            engagementRate: true,
          },
        },
      },
    }),
    prisma.socialPost.findMany({
      where: { workspaceId },
      orderBy: { postedAt: "desc" },
      take: 36,
      select: {
        id: true,
        platform: true,
        caption: true,
        url: true,
        mediaUrl: true,
        contentType: true,
        postedAt: true,
        hashtags: { select: { hashtag: { select: { tag: true } } } },
        metrics: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            saves: true,
            reach: true,
            impressions: true,
            engagementRate: true,
          },
        },
      },
    }),
    getAnalyticsOverview({ workspaceId }),
    getTopPosts({ workspaceId, pageSize: 5000 }),
  ]);

  const metricsByPlatform = new Map<
    string,
    {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      reach: number;
      impressions: number;
      engagementRateTotal: number;
      metricRows: number;
    }
  >();

  for (const row of metricRows) {
    const current =
      metricsByPlatform.get(row.platform) ??
      {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        reach: 0,
        impressions: 0,
        engagementRateTotal: 0,
        metricRows: 0,
      };
    const metrics = row.metrics;

    if (metrics) {
      current.likes += metrics.likes;
      current.comments += metrics.comments;
      current.shares += metrics.shares;
      current.saves += metrics.saves;
      current.reach += metrics.reach;
      current.impressions += metrics.impressions;
      current.engagementRateTotal += metrics.engagementRate;
      current.metricRows += 1;
    }

    metricsByPlatform.set(row.platform, current);
  }

  return NextResponse.json({
    success: true,
    workspaceId,
    platforms: platformCounts.map((platform) => {
      const metrics = metricsByPlatform.get(platform.platform);
      const platformRows = metricRows.filter((row) => row.platform === platform.platform);
      const engagementValues = platformRows.map((row) => row.metrics?.engagementRate ?? 0);
      const reachValues = platformRows.map((row) => row.metrics?.reach ?? 0);
      const interactionValues = platformRows.map((row) => totalInteractions(row.metrics));
      const avgReach = average(reachValues);
      const avgInteractions = average(interactionValues);
      const avgEngagementRate =
        metrics && metrics.metricRows > 0
          ? Number((metrics.engagementRateTotal / metrics.metricRows).toFixed(2))
          : 0;
      const dataLimited =
        platform.platform === "FACEBOOK" &&
        platformRows.every((row) => !row.metrics?.reach && !row.metrics?.impressions);

      return {
        platform: platform.platform,
        posts: platform._count._all,
        likes: metrics?.likes ?? 0,
        comments: metrics?.comments ?? 0,
        shares: metrics?.shares ?? 0,
        saves: metrics?.saves ?? 0,
        reach: metrics?.reach ?? 0,
        impressions: metrics?.impressions ?? 0,
        avgEngagementRate,
        benchmarks: {
          engagementRate: createBenchmark(engagementValues, avgEngagementRate, {
            metric: "engagementRate",
            scope: `${platform.platform} client history`,
            dataLimited,
            industryReference: industryReference(platform.platform),
          }),
          reach: createBenchmark(reachValues, avgReach, {
            metric: "reach",
            scope: `${platform.platform} average post reach`,
            dataLimited,
          }),
          interactions: createBenchmark(interactionValues, avgInteractions, {
            metric: "interactions",
            scope: `${platform.platform} average post interactions`,
          }),
        },
      };
    }),
    posts: posts.map((post) => ({
      id: post.id,
      platform: post.platform,
      caption: post.caption,
      url: post.url,
      mediaUrl: post.mediaUrl,
      contentType: post.contentType,
      postedAt: post.postedAt.toISOString(),
      hashtags: post.hashtags.map((entry) => entry.hashtag.tag),
      metrics: post.metrics,
      benchmarks: {
        engagementRate: createBenchmark(
          metricRows
            .filter((row) => row.platform === post.platform)
            .map((row) => row.metrics?.engagementRate ?? 0),
          post.metrics?.engagementRate ?? 0,
          {
            metric: "engagementRate",
            scope: `${post.platform} client history`,
            dataLimited: post.platform === "FACEBOOK" && !post.metrics?.reach && !post.metrics?.impressions,
          }
        ),
        reach: createBenchmark(
          metricRows
            .filter((row) => row.platform === post.platform)
            .map((row) => row.metrics?.reach ?? 0),
          post.metrics?.reach ?? 0,
          {
            metric: "reach",
            scope: `${post.platform} client history`,
            dataLimited: post.platform === "FACEBOOK" && !post.metrics?.reach && !post.metrics?.impressions,
          }
        ),
      },
    })),
    topPosts: analytics.topPosts.map((post) => ({
      ...post,
      benchmarks: {
        performanceScore: createBenchmark(
          allTopPosts.posts.map((candidate) => candidate.performanceScore),
          post.performanceScore,
          { metric: "performanceScore", scope: "All client social posts" }
        ),
        engagementRate: createBenchmark(
          metricRows.map((row) => row.metrics?.engagementRate ?? 0),
          post.engagementRate,
          { metric: "engagementRate", scope: "All client social posts" }
        ),
        reach: createBenchmark(
          metricRows.map((row) => row.metrics?.reach ?? 0),
          post.reach,
          { metric: "reach", scope: "All client social posts" }
        ),
      },
    })),
    hashtagPerformance: analytics.hashtagPerformance.map((hashtag) => ({
      ...hashtag,
      benchmark: createBenchmark(
        analytics.hashtagPerformance.map((item) => item.avgEngagementRate),
        hashtag.avgEngagementRate,
        { metric: "hashtagEngagement", scope: "Client hashtag history" }
      ),
    })),
    bestPostingTimes: analytics.bestPostingTimes.map((slot) => ({
      ...slot,
      benchmark: createBenchmark(
        analytics.bestPostingTimes.map((item) => item.avgPerformanceScore),
        slot.avgPerformanceScore,
        { metric: "postingWindowScore", scope: "Client posting windows" }
      ),
    })),
    contentTypeBreakdown: {
      formats: analytics.contentTypeBreakdown.formats.map((format) => ({
        ...format,
        benchmark: createBenchmark(
          analytics.contentTypeBreakdown.formats.map((item) => item.avgEngagementRate),
          format.avgEngagementRate,
          { metric: "formatEngagement", scope: "Client content formats" }
        ),
      })),
      pillars: analytics.contentTypeBreakdown.pillars.map((pillar) => ({
        ...pillar,
        benchmark: createBenchmark(
          analytics.contentTypeBreakdown.pillars.map((item) => item.avgPerformanceScore),
          pillar.avgPerformanceScore,
          { metric: "pillarScore", scope: "Client content pillars" }
        ),
      })),
    },
    engagementTrend: analytics.engagementTrend,
    rolling7Day: analytics.rolling7Day,
    rolling30Day: analytics.rolling30Day,
    benchmarks: {
      formulas: {
        engagementRate: "(likes + comments + shares + saves + clicks) / reach or impressions * 100",
        performanceScore: "Weighted against best client posts: engagement 40%, saves 20%, comments 15%, reach 15%, impressions 10%",
        reach: "Recorded audience reach from connected platform insights. Facebook reach is unavailable until Meta Insights permissions return it.",
      },
      industryReferences: INDUSTRY_REFERENCE,
    },
    insightNotes: buildInsightNotes(analytics),
  });
}

function resolveSocialWorkspaceId(hospitalId: string) {
  const normalized = normalizeHospitalKey(hospitalId);
  const harikaWorkspaceId = resolveHarikaSocialWorkspaceId(normalized);

  if (harikaWorkspaceId) return harikaWorkspaceId;

  return SOCIAL_WORKSPACE_BY_HOSPITAL[normalized];
}

function buildInsightNotes(analytics: Awaited<ReturnType<typeof getAnalyticsOverview>>) {
  const notes = [
    `${analytics.totalPosts} stored social posts are available for intelligence review.`,
  ];

  if (analytics.totalReach === 0 || analytics.totalImpressions === 0) {
    notes.push(
      "Facebook reach and impressions are unavailable until Meta Insights permissions return those metrics."
    );
  }

  if (!analytics.followerGrowth.available) {
    notes.push(analytics.followerGrowth.reason);
  }

  return notes;
}

type BenchmarkOptions = {
  metric: string;
  scope: string;
  dataLimited?: boolean;
  industryReference?: {
    label: string;
    range: string;
    source: string;
  };
};

function createBenchmark(values: number[], current: number, options: BenchmarkOptions) {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  const sortedValues = [...cleanValues].sort((left, right) => left - right);

  if (options.dataLimited || sortedValues.length === 0) {
    return {
      metric: options.metric,
      scope: options.scope,
      sampleSize: sortedValues.length,
      current,
      average: null,
      median: null,
      top25Threshold: null,
      bestObserved: null,
      position: "DATA_LIMITED",
      label: "Data limited",
      industryReference: options.industryReference ?? null,
    };
  }

  const average =
    sortedValues.reduce((total, value) => total + value, 0) / sortedValues.length;
  const median = percentile(sortedValues, 0.5);
  const top25Threshold = percentile(sortedValues, 0.75);
  const bestObserved = sortedValues.at(-1) ?? 0;
  const position = resolvePosition(current, average, top25Threshold, bestObserved);

  return {
    metric: options.metric,
    scope: options.scope,
    sampleSize: sortedValues.length,
    current: round(current),
    average: round(average),
    median: round(median),
    top25Threshold: round(top25Threshold),
    bestObserved: round(bestObserved),
    position,
    label: labelForPosition(position),
    industryReference: options.industryReference ?? null,
  };
}

function percentile(sortedValues: number[], percentileValue: number) {
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (sortedValues.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function resolvePosition(
  current: number,
  average: number,
  top25Threshold: number,
  bestObserved: number
) {
  if (bestObserved > 0 && current >= bestObserved) return "BEST_OBSERVED";
  if (current >= top25Threshold) return "TOP_25";
  if (current >= average * 1.1) return "STRONG";
  if (current >= average * 0.9) return "AT_BENCHMARK";
  return "BELOW_BENCHMARK";
}

function labelForPosition(position: string) {
  const labels: Record<string, string> = {
    BELOW_BENCHMARK: "Below benchmark",
    AT_BENCHMARK: "At benchmark",
    STRONG: "Strong",
    TOP_25: "Top 25%",
    BEST_OBSERVED: "Best observed",
    DATA_LIMITED: "Data limited",
  };

  return labels[position] ?? "At benchmark";
}

function totalInteractions(
  metrics:
    | {
        likes?: number;
        comments?: number;
        shares?: number;
        saves?: number;
      }
    | null
    | undefined
) {
  if (!metrics) return 0;

  return (
    (metrics.likes ?? 0) +
    (metrics.comments ?? 0) +
    (metrics.shares ?? 0) +
    (metrics.saves ?? 0)
  );
}

function average(values: number[]) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

function industryReference(platform: string) {
  return platform === "INSTAGRAM" || platform === "FACEBOOK"
    ? INDUSTRY_REFERENCE[platform].engagementRate
    : undefined;
}

function round(value: number) {
  return Number(value.toFixed(2));
}
