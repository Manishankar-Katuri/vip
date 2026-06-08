import axios, { AxiosError, AxiosInstance } from "axios";

import {
  emptyMetrics,
  NormalizedContentType,
  NormalizedSocialPost,
  SocialCollector,
} from "./types";

const INSTAGRAM_GRAPH_API_BASE_URL = "https://graph.facebook.com/v20.0";

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;

export interface InstagramPost {
  id: string;
  caption?: string;
  media_url?: string;
  media_type?: InstagramMediaType;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramMediaResponse {
  data?: InstagramPost[];
  paging?: {
    next?: string;
  };
}

export interface InstagramCollectorConfig {
  accessToken: string;
  instagramBusinessId: string;
  limit?: number;
  httpClient?: AxiosInstance;
}

export class InstagramCollector implements SocialCollector {
  readonly platform = "INSTAGRAM" as const;
  private readonly httpClient: AxiosInstance;
  private readonly accessToken: string;
  private readonly instagramBusinessId: string;
  private readonly limit: number;

  constructor(config: InstagramCollectorConfig) {
    if (!config.accessToken) {
      throw new Error("INSTAGRAM_ACCESS_TOKEN is required.");
    }

    if (!config.instagramBusinessId) {
      throw new Error("INSTAGRAM_BUSINESS_ID is required.");
    }

    this.accessToken = config.accessToken;
    this.instagramBusinessId = config.instagramBusinessId;
    this.limit = config.limit ?? 100;
    this.httpClient =
      config.httpClient ??
      axios.create({
        baseURL: INSTAGRAM_GRAPH_API_BASE_URL,
        timeout: 15000,
      });
  }

  async fetchRawPosts(): Promise<InstagramPost[]> {
    try {
      const response = await this.httpClient.get<InstagramMediaResponse>(
        `/${this.instagramBusinessId}/media`,
        {
          params: {
            access_token: this.accessToken,
            fields:
              "id,caption,media_url,media_type,timestamp,like_count,comments_count",
            limit: this.limit,
          },
        }
      );

      return response.data.data ?? [];
    } catch (error) {
      throw new Error(
        `Failed to fetch Instagram media: ${formatInstagramApiError(error)}`
      );
    }
  }

  async fetchPosts(limit = this.limit): Promise<NormalizedSocialPost[]> {
    const previousLimit = this.limit;
    const posts = limit === previousLimit ? await this.fetchRawPosts() : await new InstagramCollector({
      accessToken: this.accessToken,
      instagramBusinessId: this.instagramBusinessId,
      limit,
      httpClient: this.httpClient,
    }).fetchRawPosts();

    return posts.map((post) => ({
      platform: this.platform,
      externalAccountId: this.instagramBusinessId,
      postId: post.id,
      caption: post.caption,
      mediaUrl: post.media_url,
      mediaType: post.media_type,
      contentType: mapInstagramContentType(post.media_type),
      postedAt: new Date(post.timestamp),
      metrics: {
        ...emptyMetrics,
        likes: post.like_count ?? 0,
        comments: post.comments_count ?? 0,
      },
      rawData: post,
    }));
  }
}

export function createInstagramCollector(config?: Partial<InstagramCollectorConfig>) {
  return new InstagramCollector({
    accessToken: config?.accessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? "",
    instagramBusinessId:
      config?.instagramBusinessId ?? process.env.INSTAGRAM_BUSINESS_ID ?? "",
    limit: config?.limit,
    httpClient: config?.httpClient,
  });
}

export function formatInstagramApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    return (
      axiosError.response?.data?.error?.message ??
      axiosError.response?.statusText ??
      axiosError.message
    );
  }

  return error instanceof Error ? error.message : "Unknown Instagram API error";
}

function mapInstagramContentType(mediaType?: string): NormalizedContentType {
  if (mediaType === "IMAGE") {
    return "IMAGE";
  }

  if (mediaType === "VIDEO") {
    return "VIDEO";
  }

  if (mediaType === "CAROUSEL_ALBUM") {
    return "CAROUSEL";
  }

  return "UNKNOWN";
}
