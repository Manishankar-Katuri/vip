import axios, { AxiosInstance } from "axios";

import {
  emptyMetrics,
  NormalizedSocialPost,
  SocialCollector,
} from "./types";
import { formatInstagramApiError } from "./instagram.collector";

const TWITTER_API_BASE_URL = "https://api.twitter.com/2";

interface TwitterUserTweetsResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at: string;
    public_metrics?: {
      like_count?: number;
      reply_count?: number;
      retweet_count?: number;
      quote_count?: number;
      impression_count?: number;
    };
  }>;
}

export interface TwitterCollectorConfig {
  bearerToken: string;
  userId: string;
  httpClient?: AxiosInstance;
}

export class TwitterCollector implements SocialCollector {
  readonly platform = "TWITTER" as const;
  private readonly bearerToken: string;
  private readonly userId: string;
  private readonly httpClient: AxiosInstance;

  constructor(config: TwitterCollectorConfig) {
    this.bearerToken = config.bearerToken;
    this.userId = config.userId;
    this.httpClient =
      config.httpClient ??
      axios.create({ baseURL: TWITTER_API_BASE_URL, timeout: 15000 });
  }

  async fetchPosts(limit = 50): Promise<NormalizedSocialPost[]> {
    try {
      const response = await this.httpClient.get<TwitterUserTweetsResponse>(
        `/users/${this.userId}/tweets`,
        {
          headers: { Authorization: `Bearer ${this.bearerToken}` },
          params: {
            max_results: Math.min(Math.max(limit, 5), 100),
            "tweet.fields": "created_at,public_metrics",
          },
        }
      );

      return (response.data.data ?? []).map((tweet) => ({
        platform: this.platform,
        externalAccountId: this.userId,
        postId: tweet.id,
        caption: tweet.text,
        contentType: "TEXT",
        postedAt: new Date(tweet.created_at),
        metrics: {
          ...emptyMetrics,
          likes: tweet.public_metrics?.like_count ?? 0,
          comments: tweet.public_metrics?.reply_count ?? 0,
          shares:
            (tweet.public_metrics?.retweet_count ?? 0) +
            (tweet.public_metrics?.quote_count ?? 0),
          impressions: tweet.public_metrics?.impression_count ?? 0,
        },
        rawData: tweet,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Twitter/X posts: ${formatInstagramApiError(error)}`);
    }
  }
}
