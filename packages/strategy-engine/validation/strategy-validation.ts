import type {
  RecommendationLifecycleStatus,
  RecommendationOutcomeInput,
  RecommendationTransition,
  WeeklyStrategy,
} from "../types";

const WORKSPACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const VALID_STATUSES: RecommendationLifecycleStatus[] = [
  "GENERATED",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "IMPLEMENTED",
  "EXPIRED",
];

export class StrategyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategyValidationError";
  }
}

export function validateWeeklyStrategy(strategy: WeeklyStrategy) {
  validateWorkspaceId(strategy.workspaceId);
  if (!strategy.id || strategy.recommendations.some((item) => item.workspaceId !== strategy.workspaceId)) {
    throw new StrategyValidationError("Strategy recommendations must belong to the strategy workspace.");
  }
  if (new Date(strategy.period.endsAt).getTime() <= new Date(strategy.period.startsAt).getTime()) {
    throw new StrategyValidationError("Strategy period end must be after its start.");
  }
  return strategy;
}

export function validateTransition(transition: RecommendationTransition) {
  validateWorkspaceId(transition.workspaceId);
  if (!VALID_STATUSES.includes(transition.toStatus)) {
    throw new StrategyValidationError("Recommendation lifecycle status is invalid.");
  }
  if (transition.progress !== undefined && (transition.progress < 0 || transition.progress > 100)) {
    throw new StrategyValidationError("Implementation progress must be between 0 and 100.");
  }
  if (!transition.recommendationId || !transition.actor.type || !isIsoDate(transition.occurredAt)) {
    throw new StrategyValidationError("Transition requires recommendation, actor, and timestamp metadata.");
  }
  return transition;
}

export function validateOutcomeInput(input: RecommendationOutcomeInput) {
  validateWorkspaceId(input.workspaceId);
  if (!input.recommendationId || !input.actor.type) {
    throw new StrategyValidationError("Outcome requires recommendation and actor metadata.");
  }
  if (
    (input.baselineEngagement !== undefined && input.baselineEngagement < 0) ||
    (input.currentEngagement !== undefined && input.currentEngagement < 0)
  ) {
    throw new StrategyValidationError("Engagement measurements cannot be negative.");
  }
  return input;
}

export function validateWorkspaceId(workspaceId: string) {
  if (!WORKSPACE_ID_PATTERN.test(workspaceId)) {
    throw new StrategyValidationError("A safe workspaceId is required.");
  }
}

function isIsoDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}
