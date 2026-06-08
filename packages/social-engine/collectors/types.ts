export type SocialPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TWITTER"
  | "LINKEDIN"
  | "YOUTUBE"
  | "TIKTOK"
  | "OTHER";

export type NormalizedContentType =
  | "IMAGE"
  | "VIDEO"
  | "CAROUSEL"
  | "TEXT"
  | "LINK"
  | "SHORT_FORM_VIDEO"
  | "LIVE"
  | "UNKNOWN";

export interface CollectorAuth {
  accessToken: string;
  accountId: string;
}

export interface RawPostMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  reach: number;
  impressions: number;
  videoViews: number;
}

export interface NormalizedSocialPost {
  platform: SocialPlatform;
  externalAccountId: string;
  postId: string;
  url?: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: string;
  contentType: NormalizedContentType;
  postedAt: Date;
  metrics: RawPostMetrics;
  rawData: unknown;
}

export interface SocialCollector {
  readonly platform: SocialPlatform;
  fetchPosts(limit?: number): Promise<NormalizedSocialPost[]>;
}

export const emptyMetrics: RawPostMetrics = {
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  clicks: 0,
  reach: 0,
  impressions: 0,
  videoViews: 0,
};
