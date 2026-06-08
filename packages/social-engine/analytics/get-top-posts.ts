import { resolveContentPillar } from "./content-classification";
import { loadAnalyticsPosts } from "./queries";
import type {
  AnalyticsPost,
  PaginatedAnalyticsOptions,
  ScoredPost,
  TopPostsOutput,
} from "./types";
import { calculateBenchmarks, calculatePerformanceScore } from "./utils";

export async function getTopPosts(options: PaginatedAnalyticsOptions): Promise<TopPostsOutput> {
  const { posts } = await loadAnalyticsPosts(options);
  return buildTopPosts(posts, options);
}

export function buildTopPosts(
  posts: AnalyticsPost[],
  options: Pick<PaginatedAnalyticsOptions, "page" | "pageSize"> = {}
): TopPostsOutput {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const benchmarks = calculateBenchmarks(posts);
  const scored = posts
    .map((post): ScoredPost => {
      const metrics = post.metrics;

      return {
        id: post.id,
        postId: post.postId,
        platform: post.platform,
        url: post.url,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        contentType: post.contentType,
        contentPillar: resolveContentPillar(post.caption, post.category?.type),
        postedAt: post.postedAt.toISOString(),
        engagementRate: metrics?.engagementRate ?? 0,
        reach: metrics?.reach ?? 0,
        impressions: metrics?.impressions ?? 0,
        saves: metrics?.saves ?? 0,
        comments: metrics?.comments ?? 0,
        performanceScore: calculatePerformanceScore(metrics, benchmarks),
      };
    })
    .sort((left, right) => right.performanceScore - left.performanceScore);

  const byFormat = new Map<string, ScoredPost>();
  for (const post of scored) {
    if (!byFormat.has(post.contentType)) byFormat.set(post.contentType, post);
  }

  const start = (page - 1) * pageSize;

  return {
    posts: scored.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: scored.length,
      totalPages: Math.ceil(scored.length / pageSize),
    },
    bestByFormat: [...byFormat.entries()].map(([contentType, post]) => ({
      contentType,
      post,
    })),
  };
}
