import prisma from "@vip/database";
import { resolveSocialWorkspace } from "../workspace";

import { extractHashtags } from "./ingest-posts";

export interface TrendAnalysis {
  workspaceId: string;
  hashtags: Array<{ tag: string; count: number; score: number }>;
  topics: Array<{ label: string; score: number }>;
  heatmap: Array<{ label: string; score: number; volume: number }>;
}

export async function analyzeTrends(workspaceId: string): Promise<TrendAnalysis> {
  await resolveSocialWorkspace(workspaceId);
  const posts = await prisma.socialPost.findMany({
    where: { workspaceId },
    select: { caption: true },
    take: 500,
    orderBy: { postedAt: "desc" },
  });

  const hashtagCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of extractHashtags(post.caption ?? "")) {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
    }

    for (const topic of extractTopics(post.caption ?? "")) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }

  const hashtags = [...hashtagCounts.entries()]
    .map(([tag, count]) => ({ tag, count, score: count / Math.max(posts.length, 1) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  const topics = [...topicCounts.entries()]
    .map(([label, count]) => ({
      label,
      score: Number((count / Math.max(posts.length, 1)).toFixed(4)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return {
    workspaceId,
    hashtags,
    topics,
    heatmap: [
      ...hashtags.map((item) => ({
        label: `#${item.tag}`,
        score: item.score,
        volume: item.count,
      })),
      ...topics.map((item) => ({
        label: item.label,
        score: item.score,
        volume: Math.round(item.score * posts.length),
      })),
    ],
  };
}

function extractTopics(text: string) {
  const hospitalTerms = [
    "cardiology",
    "orthopedics",
    "maternity",
    "surgery",
    "wellness",
    "screening",
    "doctor",
    "patient",
    "emergency",
    "community",
  ];
  const lower = text.toLowerCase();
  return hospitalTerms.filter((term) => lower.includes(term));
}
