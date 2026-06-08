import { ExplanationPayloadSchema } from "../schemas";
import type { AnalyticsSignal, ExplanationPayload, RecommendationScore, RecommendationType, RiskLevel } from "../types";

export interface ExplanationRequest {
  type: RecommendationType;
  score: RecommendationScore;
  signals: AnalyticsSignal[];
}

export class AiExplanationGenerator {
  generate(request: ExplanationRequest): ExplanationPayload {
    if (request.signals.length === 0) {
      throw new Error("An explanation requires at least one analytics signal.");
    }
    const evidence = [...request.signals]
      .sort((left, right) => right.normalizedScore - left.normalizedScore)
      .slice(0, 3);
    const primary = evidence[0];
    const confidence = round(evidence.reduce((sum, signal) => sum + signal.confidence, 0) / evidence.length, 2);
    const impact = Math.max(1, Math.round(request.score.total * 0.18));
    const expectedImpact = `+${impact}% targeted performance improvement`;
    const riskLevel = riskFor(request.score, confidence);
    const payload: ExplanationPayload = {
      reason: sentence(primary.summary),
      confidence,
      supportingMetrics: evidence.map((signal) => ({
        metric: signal.metric,
        direction: signal.direction,
        currentValue: signal.currentValue,
        previousValue: signal.previousValue,
        changePercent: signal.changePercent,
      })),
      expectedImpact,
      riskLevel,
      explanation: `${labelFor(request.type)} is prioritized at ${request.score.priority.toLowerCase()} priority because ${primary.summary}. Evidence confidence is ${(confidence * 100).toFixed(0)}%; validate the estimated ${expectedImpact.toLowerCase()} through the approved workflow.`,
    };
    return ExplanationPayloadSchema.parse(payload) as ExplanationPayload;
  }
}

function riskFor(score: RecommendationScore, confidence: number): RiskLevel {
  if (confidence < 0.7 || score.priority === "CRITICAL") return "HIGH";
  if (score.priority === "HIGH" || confidence < 0.85) return "MEDIUM";
  return "LOW";
}

function labelFor(type: RecommendationType) {
  return type.toLowerCase().replace(/_/g, " ");
}

function sentence(text: string) {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
