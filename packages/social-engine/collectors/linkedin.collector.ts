import axios, { AxiosInstance } from "axios";

import {
  emptyMetrics,
  NormalizedSocialPost,
  SocialCollector,
} from "./types";
import { formatInstagramApiError } from "./instagram.collector";

const LINKEDIN_API_BASE_URL = "https://api.linkedin.com/v2";

interface LinkedinUgcResponse {
  elements?: Array<{
    id: string;
    created?: { time?: number };
    specificContent?: {
      "com.linkedin.ugc.ShareContent"?: {
        shareCommentary?: { text?: string };
        media?: Array<{ media?: string; title?: { text?: string } }>;
      };
    };
  }>;
}

export interface LinkedinCollectorConfig {
  accessToken: string;
  organizationUrn: string;
  httpClient?: AxiosInstance;
}

export class LinkedinCollector implements SocialCollector {
  readonly platform = "LINKEDIN" as const;
  private readonly accessToken: string;
  private readonly organizationUrn: string;
  private readonly httpClient: AxiosInstance;

  constructor(config: LinkedinCollectorConfig) {
    this.accessToken = config.accessToken;
    this.organizationUrn = config.organizationUrn;
    this.httpClient =
      config.httpClient ??
      axios.create({ baseURL: LINKEDIN_API_BASE_URL, timeout: 15000 });
  }

  async fetchPosts(limit = 50): Promise<NormalizedSocialPost[]> {
    try {
      const response = await this.httpClient.get<LinkedinUgcResponse>("/ugcPosts", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        params: {
          q: "authors",
          authors: `List(${encodeURIComponent(this.organizationUrn)})`,
          count: limit,
        },
      });

      return (response.data.elements ?? []).map((post) => {
        const content =
          post.specificContent?.["com.linkedin.ugc.ShareContent"];
        const media = content?.media?.[0];

        return {
          platform: this.platform,
          externalAccountId: this.organizationUrn,
          postId: post.id,
          caption: content?.shareCommentary?.text,
          mediaUrl: media?.media,
          mediaType: media ? "MEDIA" : "TEXT",
          contentType: media ? "LINK" : "TEXT",
          postedAt: new Date(post.created?.time ?? Date.now()),
          metrics: emptyMetrics,
          rawData: post,
        };
      });
    } catch (error) {
      throw new Error(`Failed to fetch LinkedIn posts: ${formatInstagramApiError(error)}`);
    }
  }
}
