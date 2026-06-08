import type { StrategyEventPublisher, StrategyRepository } from "../interfaces";
import type {
  HistoricalRecommendationAnalytics,
  OperationalRecommendation,
  RecommendationOutcomeInput,
  RecommendationOutcomeRecord,
  RecommendationOutcomeStatus,
} from "../types";
import { average, clamp, round } from "../utils/numbers";
import { validateOutcomeInput } from "../validation";
import { RecommendationNotFoundError } from "../lifecycle";

export class EngagementDeltaAnalyzer {
  analyze(baseline?: number, current?: number) {
    if (baseline === undefined || current === undefined) return undefined;
    return {
      baseline,
      current,
      absolute: round(current - baseline),
      percentage: baseline === 0 ? undefined : round(((current - baseline) / baseline) * 100),
    };
  }
}

export class RecommendationEffectivenessScorer {
  score(outcome: RecommendationOutcomeStatus, deltaPercentage?: number, progress = 0) {
    const outcomeBase = { POSITIVE: 75, NEUTRAL: 50, NEGATIVE: 20, INCONCLUSIVE: 40 }[outcome];
    const impact = clamp((deltaPercentage ?? 0) + 50) - 50;
    return round(clamp(outcomeBase + impact * 0.35 + progress * 0.1));
  }
}

export class AdaptiveConfidenceScorer {
  adjust(confidence: number, effectivenessScore: number) {
    const movement = (effectivenessScore - 50) / 250;
    return round(clamp(confidence * 100 + movement * 100) / 100, 4);
  }
}

export class FeedbackLearningService {
  private readonly deltas = new EngagementDeltaAnalyzer();
  private readonly effectiveness = new RecommendationEffectivenessScorer();
  private readonly confidence = new AdaptiveConfidenceScorer();

  constructor(
    private readonly repository: StrategyRepository,
    private readonly publisher?: StrategyEventPublisher
  ) {}

  async recordOutcome(input: RecommendationOutcomeInput): Promise<RecommendationOutcomeRecord> {
    validateOutcomeInput(input);
    const recommendation = await this.repository.findRecommendation(input.workspaceId, input.recommendationId);
    if (!recommendation) throw new RecommendationNotFoundError(input.recommendationId);

    const delta = this.deltas.analyze(input.baselineEngagement, input.currentEngagement);
    const outcome = input.outcome ?? inferOutcome(delta?.percentage);
    const effectivenessScore = this.effectiveness.score(
      outcome,
      delta?.percentage,
      recommendation.implementation.percentage
    );
    const confidenceBefore = recommendation.adaptiveConfidence;
    const confidenceAfter = this.confidence.adjust(confidenceBefore, effectivenessScore);
    const observedAt = input.observedAt ?? new Date().toISOString();
    const record: RecommendationOutcomeRecord = {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      outcome,
      engagementDelta: delta,
      effectivenessScore,
      confidenceBefore,
      confidenceAfter,
      metrics: input.metrics,
      observedAt,
    };
    const updated: OperationalRecommendation = {
      ...recommendation,
      adaptiveConfidence: confidenceAfter,
      updatedAt: observedAt,
    };
    const event = {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      eventType: "recommendation.outcome.recorded",
      aggregateType: "RECOMMENDATION_OUTCOME" as const,
      aggregateId: input.recommendationId,
      payload: { outcome, effectivenessScore, confidenceBefore, confidenceAfter },
      occurredAt: observedAt,
    };

    const saved = await this.repository.saveOutcome(record, updated, {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      action: "RECOMMENDATION_OUTCOME_RECORDED",
      actor: input.actor,
      payload: event.payload,
      createdAt: observedAt,
    }, event);
    if (this.publisher) await this.publisher.publish(event);
    return saved;
  }

  async historicalAnalytics(workspaceId: string): Promise<HistoricalRecommendationAnalytics> {
    const [recommendations, outcomes] = await Promise.all([
      this.repository.listRecommendations({ workspaceId }),
      this.repository.listOutcomes(workspaceId),
    ]);
    const effectivenessByCategory: Partial<Record<OperationalRecommendation["category"], number>> = {};

    const categories = Array.from(new Set(recommendations.map((recommendation) => recommendation.category)));
    for (const category of categories) {
      const recommendationIds = new Set(
        recommendations.filter((item) => item.category === category).map((item) => item.id)
      );
      const scores = outcomes
        .filter((outcome) => recommendationIds.has(outcome.recommendationId))
        .map((outcome) => outcome.effectivenessScore);
      if (scores.length > 0) effectivenessByCategory[category] = round(average(scores));
    }

    return {
      workspaceId,
      recommendationCount: recommendations.length,
      implementedCount: recommendations.filter((item) => item.status === "IMPLEMENTED").length,
      acceptedCount: recommendations.filter((item) => ["ACCEPTED", "IMPLEMENTED"].includes(item.status)).length,
      rejectedCount: recommendations.filter((item) => item.status === "REJECTED").length,
      averageEffectiveness: round(average(outcomes.map((item) => item.effectivenessScore))),
      averageConfidenceAdjustment: round(
        average(outcomes.map((item) => item.confidenceAfter - item.confidenceBefore)),
        4
      ),
      categoryEffectiveness: effectivenessByCategory,
    };
  }
}

function inferOutcome(deltaPercentage?: number): RecommendationOutcomeStatus {
  if (deltaPercentage === undefined) return "INCONCLUSIVE";
  if (deltaPercentage >= 5) return "POSITIVE";
  if (deltaPercentage <= -5) return "NEGATIVE";
  return "NEUTRAL";
}
