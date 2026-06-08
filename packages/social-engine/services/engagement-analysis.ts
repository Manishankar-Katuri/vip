import prisma from "@vip/database";
import { resolveSocialWorkspace } from "../workspace";

export interface EngagementAnalytics {
  workspaceId: string;
  totalPosts: number;
  averageEngagementRate: number;
  totalReach: number;
  totalImpressions: number;
  topPosts: Array<{
    id: string;
    platform: string;
    caption: string | null;
    postedAt: Date;
    engagementRate: number;
    normalizedScore: number;
  }>;
  chartSeries: Array<{
    date: string;
    engagementRate: number;
    reach: number;
    impressions: number;
  }>;
}

export async function analyzeEngagement(workspaceId: string): Promise<EngagementAnalytics> {
  await resolveSocialWorkspace(workspaceId);
  const posts = await prisma.socialPost.findMany({
    where: { workspaceId },
    include: { metrics: true },
    orderBy: { postedAt: "desc" },
    take: 250,
  });

  const postsWithMetrics = posts.filter((post) => post.metrics);
  const totals = postsWithMetrics.reduce(
    (acc, post) => {
      acc.engagementRate += post.metrics?.engagementRate ?? 0;
      acc.reach += post.metrics?.reach ?? 0;
      acc.impressions += post.metrics?.impressions ?? 0;
      return acc;
    },
    { engagementRate: 0, reach: 0, impressions: 0 }
  );

  return {
    workspaceId,
    totalPosts: posts.length,
    averageEngagementRate:
      postsWithMetrics.length === 0
        ? 0
        : Number((totals.engagementRate / postsWithMetrics.length).toFixed(4)),
    totalReach: totals.reach,
    totalImpressions: totals.impressions,
    topPosts: postsWithMetrics
      .sort(
        (a, b) =>
          (b.metrics?.normalizedScore ?? 0) - (a.metrics?.normalizedScore ?? 0)
      )
      .slice(0, 10)
      .map((post) => ({
        id: post.id,
        platform: post.platform,
        caption: post.caption,
        postedAt: post.postedAt,
        engagementRate: post.metrics?.engagementRate ?? 0,
        normalizedScore: post.metrics?.normalizedScore ?? 0,
      })),
    chartSeries: postsWithMetrics
      .map((post) => ({
        date: post.postedAt.toISOString().slice(0, 10),
        engagementRate: post.metrics?.engagementRate ?? 0,
        reach: post.metrics?.reach ?? 0,
        impressions: post.metrics?.impressions ?? 0,
      }))
      .reverse(),
  };
}
