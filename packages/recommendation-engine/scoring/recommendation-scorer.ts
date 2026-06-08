import { RecommendationScoreFactorsSchema, RecommendationScoreSchema } from "../schemas";
import type {
  AnalyticsMetric,
  AnalyticsSignal,
  RecommendationPriority,
  RecommendationScore,
  RecommendationScoreFactors,
} from "../types";

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationScoreFactors = {
  engagement: 0.3,
  reach: 0.2,
  consistency: 0.15,
  trendMomentum: 0.2,
  contentPerformance: 0.15,
};

export class RecommendationScorer {
  constructor(private readonly weights: RecommendationScoreFactors = DEFAULT_RECOMMENDATION_WEIGHTS) {
    validateWeights(weights);
  }

  score(factors: RecommendationScoreFactors): RecommendationScore {
    const normalized = RecommendationScoreFactorsSchema.parse(factors) as RecommendationScoreFactors;
    const total = round(
      normalized.engagement * this.weights.engagement +
      normalized.reach * this.weights.reach +
      normalized.consistency * this.weights.consistency +
      normalized.trendMomentum * this.weights.trendMomentum +
      normalized.contentPerformance * this.weights.contentPerformance
    );
    return RecommendationScoreSchema.parse({
      total,
      priority: priorityForScore(total),
      factors: normalized,
      weights: this.weights,
    }) as RecommendationScore;
  }

  scoreSignals(signals: AnalyticsSignal[]) {
    return this.score({
      engagement: signalScore(signals, "ENGAGEMENT"),
      reach: signalScore(signals, "REACH"),
      consistency: signalScore(signals, "POSTING_CONSISTENCY"),
      trendMomentum: signalScore(signals, "MOMENTUM"),
      contentPerformance: signalScore(signals, "CONTENT_PERFORMANCE"),
    });
  }
}

export function priorityForScore(score: number): RecommendationPriority {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function signalScore(signals: AnalyticsSignal[], metric: AnalyticsMetric) {
  return signals.find((signal) => signal.metric === metric)?.normalizedScore ?? 0;
}

function validateWeights(weights: RecommendationScoreFactors) {
  const validated = RecommendationScoreFactorsSchema.parse(weights);
  const total = Object.values(validated).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - 1) > 0.00001) {
    throw new Error("Recommendation scoring weights must total 1.");
  }
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
