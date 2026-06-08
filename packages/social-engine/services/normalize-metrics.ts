import {
  NormalizedSocialPost,
  RawPostMetrics,
  SocialPlatform,
} from "../collectors";

export interface NormalizedMetrics extends RawPostMetrics {
  engagementRate: number;
  viralityScore: number;
  normalizedScore: number;
}

export function normalizeMetrics(
  post: Pick<NormalizedSocialPost, "platform" | "metrics">
): NormalizedMetrics {
  const metrics = post.metrics;
  const engagementRate = calculateEngagementRate(metrics);
  const viralityScore = calculateViralityScore(post.platform, metrics);
  const normalizedScore = Number(
    Math.min(100, engagementRate * 8 + viralityScore * 20).toFixed(2)
  );

  return {
    ...metrics,
    engagementRate,
    viralityScore,
    normalizedScore,
  };
}

export function calculateEngagementRate(metrics: RawPostMetrics) {
  const denominator = metrics.reach > 0 ? metrics.reach : metrics.impressions;

  if (denominator <= 0) {
    return 0;
  }

  const engagements =
    metrics.likes +
    metrics.comments +
    metrics.shares +
    metrics.saves +
    metrics.clicks;

  return Number(((engagements / denominator) * 100).toFixed(4));
}

function calculateViralityScore(platform: SocialPlatform, metrics: RawPostMetrics) {
  const amplification = metrics.shares + metrics.saves;
  const baseAudience = metrics.reach > 0 ? metrics.reach : metrics.impressions;

  if (baseAudience <= 0) {
    return 0;
  }

  const platformMultiplier = platform === "LINKEDIN" ? 1.2 : 1;
  return Number(((amplification / baseAudience) * 100 * platformMultiplier).toFixed(4));
}
