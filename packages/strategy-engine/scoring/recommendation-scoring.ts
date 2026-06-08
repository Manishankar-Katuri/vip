import type { RecommendationPriority, RecommendationScore, ScoreFactors } from "../types";
import { clamp, round } from "../utils/numbers";

export const DEFAULT_SCORE_WEIGHTS: ScoreFactors = {
  impact: 0.3,
  urgency: 0.22,
  confidence: 0.2,
  strategicAlignment: 0.16,
  evidenceStrength: 0.12,
};

export class RecommendationScorer {
  constructor(private readonly weights: ScoreFactors = DEFAULT_SCORE_WEIGHTS) {}

  score(factors: ScoreFactors): RecommendationScore {
    const normalized: ScoreFactors = {
      impact: clamp(factors.impact),
      urgency: clamp(factors.urgency),
      confidence: clamp(factors.confidence),
      strategicAlignment: clamp(factors.strategicAlignment),
      evidenceStrength: clamp(factors.evidenceStrength),
    };
    const total = round(
      normalized.impact * this.weights.impact +
        normalized.urgency * this.weights.urgency +
        normalized.confidence * this.weights.confidence +
        normalized.strategicAlignment * this.weights.strategicAlignment +
        normalized.evidenceStrength * this.weights.evidenceStrength
    );

    return { total, priority: priorityForScore(total), factors: normalized, weights: this.weights };
  }
}

export function priorityForScore(score: number): RecommendationPriority {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}
