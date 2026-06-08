export type ContentPillar =
  | "EDUCATIONAL"
  | "PROMOTIONAL"
  | "AWARENESS"
  | "TESTIMONIAL"
  | "SEASONAL"
  | "DOCTOR_BRANDING"
  | "ENGAGEMENT_COMMUNITY";

export interface AnalyticsQueryOptions {
  workspaceId: string;
  from?: Date;
  to?: Date;
  maxRecords?: number;
}

export interface PaginatedAnalyticsOptions extends AnalyticsQueryOptions {
  page?: number;
  pageSize?: number;
}

export interface AnalyticsMetricValues {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  reach: number;
  impressions: number;
  videoViews: number;
  engagementRate: number;
}

export interface AnalyticsPost {
  id: string;
  postId: string;
  platform: string;
  url: string | null;
  caption: string | null;
  mediaUrl: string | null;
  contentType: string;
  postedAt: Date;
  category: { name: string; type: string } | null;
  metrics: AnalyticsMetricValues | null;
  hashtags: string[];
}

export interface AggregatedEngagement {
  totalPosts: number;
  postsWithMetrics: number;
  avgEngagementRate: number;
  totalReach: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
}

export interface ScoredPost {
  id: string;
  postId: string;
  platform: string;
  url: string | null;
  caption: string | null;
  mediaUrl: string | null;
  contentType: string;
  contentPillar: ContentPillar;
  postedAt: string;
  engagementRate: number;
  reach: number;
  impressions: number;
  saves: number;
  comments: number;
  performanceScore: number;
}

export interface TopPostsOutput {
  posts: ScoredPost[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  bestByFormat: Array<{ contentType: string; post: ScoredPost }>;
}

export interface EngagementTrendPoint {
  date: string;
  postCount: number;
  avgEngagementRate: number;
  movingAverage7Day: number;
  reach: number;
  impressions: number;
  saves: number;
  comments: number;
}

export interface EngagementTrendOutput {
  series: EngagementTrendPoint[];
  direction: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  percentageChange: number | null;
  anomalies: Array<{ date: string; value: number; baseline: number; deviation: number }>;
}

export interface PostingTimeOutput {
  bestPostingTimes: Array<{
    dayOfWeek: number;
    dayLabel: string;
    hourOfDay: number;
    postCount: number;
    avgEngagementRate: number;
    avgPerformanceScore: number;
  }>;
  postingFrequency: Array<{ date: string; postCount: number }>;
}

export interface ContentTypeBreakdownOutput {
  pillars: Array<{
    pillar: ContentPillar;
    postCount: number;
    percentage: number;
    avgEngagementRate: number;
    avgPerformanceScore: number;
  }>;
  formats: Array<{
    contentType: string;
    postCount: number;
    percentage: number;
    avgEngagementRate: number;
  }>;
}

export type FollowerGrowthOutput =
  | {
      available: true;
      currentFollowers: number;
      change: number;
      percentageChange: number;
      series: Array<{ date: string; followers: number }>;
    }
  | {
      available: false;
      currentFollowers: null;
      change: null;
      percentageChange: null;
      series: [];
      reason: string;
    };

export interface GrowthSummaryOutput extends AggregatedEngagement {
  rolling7Day: AggregatedEngagement;
  rolling30Day: AggregatedEngagement;
  followerGrowth: FollowerGrowthOutput;
  hashtagPerformance: Array<{
    tag: string;
    postCount: number;
    avgEngagementRate: number;
  }>;
}

export interface SocialAnalyticsOverview {
  workspaceId: string;
  period: { from: string | null; to: string | null };
  avgEngagementRate: number;
  topPosts: ScoredPost[];
  engagementTrend: EngagementTrendOutput;
  bestPostingTimes: PostingTimeOutput["bestPostingTimes"];
  postingFrequency: PostingTimeOutput["postingFrequency"];
  contentTypeBreakdown: ContentTypeBreakdownOutput;
  followerGrowth: GrowthSummaryOutput["followerGrowth"];
  totalPosts: number;
  totalReach: number;
  totalImpressions: number;
  rolling7Day: AggregatedEngagement;
  rolling30Day: AggregatedEngagement;
  bestByFormat: TopPostsOutput["bestByFormat"];
  hashtagPerformance: GrowthSummaryOutput["hashtagPerformance"];
  meta: { sampledPosts: number; truncated: boolean };
}
