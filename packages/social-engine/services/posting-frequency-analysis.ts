import prisma from "@vip/database";
import { resolveSocialWorkspace } from "../workspace";

export interface PostingFrequencyAnalysis {
  workspaceId: string;
  consistencyScore: number;
  chart: Array<{
    dayOfWeek: number;
    hourOfDay: number;
    postCount: number;
    avgEngagement: number;
  }>;
  bestWindows: Array<{ dayOfWeek: number; hourOfDay: number; avgEngagement: number }>;
}

export async function analyzePostingFrequency(
  workspaceId: string
): Promise<PostingFrequencyAnalysis> {
  await resolveSocialWorkspace(workspaceId);
  const posts = await prisma.socialPost.findMany({
    where: { workspaceId },
    include: { metrics: true },
    take: 500,
  });

  const buckets = new Map<string, { count: number; engagement: number }>();

  for (const post of posts) {
    const dayOfWeek = post.postedAt.getUTCDay();
    const hourOfDay = post.postedAt.getUTCHours();
    const key = `${dayOfWeek}:${hourOfDay}`;
    const bucket = buckets.get(key) ?? { count: 0, engagement: 0 };
    bucket.count += 1;
    bucket.engagement += post.metrics?.engagementRate ?? 0;
    buckets.set(key, bucket);
  }

  const chart = [...buckets.entries()].map(([key, bucket]) => {
    const [dayOfWeek, hourOfDay] = key.split(":").map(Number);
    return {
      dayOfWeek,
      hourOfDay,
      postCount: bucket.count,
      avgEngagement: Number((bucket.engagement / bucket.count).toFixed(4)),
    };
  });

  const weeksCovered = Math.max(1, Math.ceil(posts.length / 7));
  const consistencyScore = Number(
    Math.min(100, (posts.length / weeksCovered / 4) * 100).toFixed(2)
  );

  return {
    workspaceId,
    consistencyScore,
    chart,
    bestWindows: chart
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5)
      .map(({ dayOfWeek, hourOfDay, avgEngagement }) => ({
        dayOfWeek,
        hourOfDay,
        avgEngagement,
      })),
  };
}
