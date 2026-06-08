import {
  emptyMetrics,
  InstagramCollector,
  InstagramPost,
  NormalizedSocialPost,
  SocialCollector,
} from "../collectors";
import {
  createInstagramMetricsCollector,
  InstagramPostInsights,
} from "../collectors/instagram.metrics";
import { ingestPosts, IngestPostsResult } from "./ingest-posts";

export interface IngestInstagramPostsOptions {
  accessToken?: string;
  instagramBusinessId?: string;
  workspaceName?: string;
  workspaceSlug?: string;
  limit?: number;
}

export type IngestInstagramPostsResult = IngestPostsResult;

export async function ingestInstagramPosts(
  options: IngestInstagramPostsOptions = {}
): Promise<IngestInstagramPostsResult> {
  const accessToken = options.accessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramBusinessId =
    options.instagramBusinessId ?? process.env.INSTAGRAM_BUSINESS_ID;

  if (!accessToken) {
    throw new Error("INSTAGRAM_ACCESS_TOKEN is not configured.");
  }

  if (!instagramBusinessId) {
    throw new Error("INSTAGRAM_BUSINESS_ID is not configured.");
  }

  const rawCollector = new InstagramCollector({
    accessToken,
    instagramBusinessId,
    limit: options.limit,
  });
  const metricsCollector = createInstagramMetricsCollector({ accessToken });

  const collector: SocialCollector = {
    platform: "INSTAGRAM",
    async fetchPosts(limit?: number) {
      const posts = await rawCollector.fetchRawPosts();
      const selectedPosts = limit ? posts.slice(0, limit) : posts;

      return Promise.all(
        selectedPosts.map(async (post) =>
          normalizeInstagramPost(
            instagramBusinessId,
            post,
            await metricsCollector.fetchPostInsights(post.id)
          )
        )
      );
    },
  };

  return ingestPosts([collector], {
    workspaceName: options.workspaceName ?? "Instagram Historical Workspace",
    workspaceSlug:
      options.workspaceSlug ??
      `instagram-${instagramBusinessId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    limit: options.limit,
  });
}

function normalizeInstagramPost(
  instagramBusinessId: string,
  post: InstagramPost,
  insights: InstagramPostInsights
): NormalizedSocialPost {
  return {
    platform: "INSTAGRAM",
    externalAccountId: instagramBusinessId,
    postId: post.id,
    caption: post.caption,
    mediaUrl: post.media_url,
    mediaType: post.media_type,
    contentType:
      post.media_type === "CAROUSEL_ALBUM"
        ? "CAROUSEL"
        : post.media_type === "VIDEO"
          ? "VIDEO"
          : post.media_type === "IMAGE"
            ? "IMAGE"
            : "UNKNOWN",
    postedAt: new Date(post.timestamp),
    metrics: {
      ...emptyMetrics,
      likes: post.like_count ?? 0,
      comments: post.comments_count ?? 0,
      saves: insights.saved,
      reach: insights.reach,
      impressions: insights.impressions,
    },
    rawData: {
      post,
      insights: insights.raw,
      collectedAt: new Date().toISOString(),
    },
  };
}
