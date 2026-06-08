import axios, { AxiosInstance } from "axios";

import {
  emptyMetrics,
  NormalizedSocialPost,
  SocialCollector,
} from "./types";
import { formatInstagramApiError } from "./instagram.collector";

const GRAPH_API_BASE_URL = "https://graph.facebook.com/v20.0";

interface FacebookPostResponse {
  data?: Array<{
    id: string;
    message?: string;
    full_picture?: string;
    permalink_url?: string;
    created_time: string;
    shares?: { count?: number };
    reactions?: { summary?: { total_count?: number } };
    comments?: { summary?: { total_count?: number } };
  }>;
}

export interface FacebookCollectorConfig {
  accessToken: string;
  pageId: string;
  httpClient?: AxiosInstance;
}

export class FacebookCollector implements SocialCollector {
  readonly platform = "FACEBOOK" as const;
  private readonly accessToken: string;
  private readonly pageId: string;
  private readonly httpClient: AxiosInstance;

  constructor(config: FacebookCollectorConfig) {
    this.accessToken = config.accessToken;
    this.pageId = config.pageId;
    this.httpClient =
      config.httpClient ??
      axios.create({ baseURL: GRAPH_API_BASE_URL, timeout: 15000 });
  }

  async fetchPosts(limit = 50): Promise<NormalizedSocialPost[]> {
    try {
      const response = await this.httpClient.get<FacebookPostResponse>(
        `/${this.pageId}/posts`,
        {
          params: {
            access_token: this.accessToken,
            fields:
              "id,message,full_picture,permalink_url,created_time,shares,reactions.summary(true),comments.summary(true)",
            limit,
          },
        }
      );

      return (response.data.data ?? []).map((post) => ({
        platform: this.platform,
        externalAccountId: this.pageId,
        postId: post.id,
        url: post.permalink_url,
        caption: post.message,
        mediaUrl: post.full_picture,
        mediaType: post.full_picture ? "IMAGE" : "TEXT",
        contentType: post.full_picture ? "IMAGE" : "TEXT",
        postedAt: new Date(post.created_time),
        metrics: {
          ...emptyMetrics,
          likes: post.reactions?.summary?.total_count ?? 0,
          comments: post.comments?.summary?.total_count ?? 0,
          shares: post.shares?.count ?? 0,
        },
        rawData: post,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Facebook posts: ${formatInstagramApiError(error)}`);
    }
  }
}
