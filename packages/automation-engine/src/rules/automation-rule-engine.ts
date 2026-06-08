import { AutomationRuleSchema } from "../schemas";
import type {
  AutomationCondition,
  AutomationRule,
  AutomationRuleMatch,
  AutomationTrigger,
} from "../types";
import type { AnalyticsMetric, Recommendation, RecommendationLifecycleEvent } from "@vip/recommendation-engine";

export class AutomationRuleEngine {
  evaluate(event: RecommendationLifecycleEvent, rules: AutomationRule[]): AutomationRuleMatch[] {
    const recommendation = event.payload.recommendation;
    return rules
      .map((rule) => AutomationRuleSchema.parse(rule) as AutomationRule)
      .filter((rule) => rule.enabled && rule.workspaceId === event.workspaceId)
      .filter((rule) => !rule.recommendationTypes || rule.recommendationTypes.includes(recommendation.type))
      .filter((rule) => triggerMatches(rule.trigger, recommendation))
      .filter((rule) => rule.conditions.every((condition) => conditionMatches(condition, recommendation)))
      .map((rule) => ({ rule, recommendation, sourceEvent: event }));
  }
}

function triggerMatches(trigger: AutomationTrigger, recommendation: Recommendation) {
  switch (trigger) {
    case "ENGAGEMENT_DROP":
      return signalHasDirection(recommendation, "ENGAGEMENT", "DECREASED");
    case "VIRAL_SPIKE":
      return signalHasDirection(recommendation, "ENGAGEMENT", "INCREASED") ||
        signalHasDirection(recommendation, "REACH", "INCREASED");
    case "AUDIENCE_DECLINE":
      return signalHasDirection(recommendation, "AUDIENCE_GROWTH", "DECREASED");
    case "POSTING_INACTIVITY":
      return signalHasDirection(recommendation, "POSTING_CONSISTENCY", "DECREASED");
    case "HIGH_CONFIDENCE_GROWTH_OPPORTUNITY":
      return recommendation.type === "GROWTH_ACCELERATION" && recommendation.explanation.confidence >= 0.8;
    case "CRITICAL_RECOMMENDATION":
      return recommendation.score.priority === "CRITICAL";
  }
}

function conditionMatches(condition: AutomationCondition, recommendation: Recommendation) {
  const value = metricValue(condition.metric, recommendation);
  if (value === undefined) return false;
  switch (condition.operator) {
    case "GT": return value > condition.threshold;
    case "GTE": return value >= condition.threshold;
    case "LT": return value < condition.threshold;
    case "LTE": return value <= condition.threshold;
    case "EQ": return value === condition.threshold;
  }
}

function metricValue(metric: AutomationCondition["metric"], recommendation: Recommendation) {
  if (metric === "CONFIDENCE") return recommendation.explanation.confidence;
  if (metric === "RECOMMENDATION_SCORE") return recommendation.score.total;
  return recommendation.signals.find((signal) => signal.metric === metric)?.changePercent;
}

function signalHasDirection(
  recommendation: Recommendation,
  metric: AnalyticsMetric,
  direction: "INCREASED" | "DECREASED"
) {
  return recommendation.signals.some((signal) => signal.metric === metric && signal.direction === direction);
}
