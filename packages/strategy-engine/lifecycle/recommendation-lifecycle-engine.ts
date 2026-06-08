import type { StrategyEventPublisher, StrategyRepository } from "../interfaces";
import type {
  ActorMetadata,
  OperationalRecommendation,
  RecommendationLifecycleStatus,
  RecommendationTransition,
} from "../types";
import { StrategyValidationError, validateTransition } from "../validation";

const ALLOWED_TRANSITIONS: Record<RecommendationLifecycleStatus, RecommendationLifecycleStatus[]> = {
  GENERATED: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: ["IMPLEMENTED", "EXPIRED"],
  REJECTED: [],
  IMPLEMENTED: [],
  EXPIRED: [],
};

export interface TransitionRecommendationInput {
  workspaceId: string;
  recommendationId: string;
  toStatus: RecommendationLifecycleStatus;
  actor: ActorMetadata;
  occurredAt?: Date;
  note?: string;
  implementationProgress?: number;
}

export interface UpdateImplementationProgressInput {
  workspaceId: string;
  recommendationId: string;
  percentage: number;
  actor: ActorMetadata;
  occurredAt?: Date;
  note?: string;
}

export class InvalidLifecycleTransitionError extends Error {
  constructor(fromStatus: RecommendationLifecycleStatus, toStatus: RecommendationLifecycleStatus) {
    super(`Recommendation cannot transition from ${fromStatus} to ${toStatus}.`);
    this.name = "InvalidLifecycleTransitionError";
  }
}

export class RecommendationNotFoundError extends Error {
  constructor(recommendationId: string) {
    super(`Recommendation ${recommendationId} was not found.`);
    this.name = "RecommendationNotFoundError";
  }
}

export class RecommendationLifecycleEngine {
  constructor(
    private readonly repository: StrategyRepository,
    private readonly publisher?: StrategyEventPublisher
  ) {}

  async transition(input: TransitionRecommendationInput): Promise<OperationalRecommendation> {
    const existing = await this.repository.findRecommendation(input.workspaceId, input.recommendationId);
    if (!existing) throw new RecommendationNotFoundError(input.recommendationId);
    if (!ALLOWED_TRANSITIONS[existing.status].includes(input.toStatus)) {
      throw new InvalidLifecycleTransitionError(existing.status, input.toStatus);
    }

    const occurredAt = (input.occurredAt ?? new Date()).toISOString();
    const transition: RecommendationTransition = validateTransition({
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      fromStatus: existing.status,
      toStatus: input.toStatus,
      actor: input.actor,
      note: input.note,
      progress: progressFor(input, existing),
      occurredAt,
    });
    const updated = applyTransition(existing, transition);
    const event = {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      eventType: "recommendation.lifecycle.transitioned",
      aggregateType: "RECOMMENDATION" as const,
      aggregateId: input.recommendationId,
      payload: {
        fromStatus: existing.status,
        toStatus: input.toStatus,
        progress: updated.implementation.percentage,
        category: existing.category,
        recommendationTitle: existing.title,
      },
      occurredAt,
    };

    const saved = await this.repository.saveTransition(updated, transition, {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      action: "RECOMMENDATION_STATUS_CHANGED",
      actor: input.actor,
      payload: event.payload,
      createdAt: occurredAt,
    }, event);

    if (this.publisher) await this.publisher.publish(event);
    return saved;
  }

  async updateImplementationProgress(
    input: UpdateImplementationProgressInput
  ): Promise<OperationalRecommendation> {
    const existing = await this.repository.findRecommendation(input.workspaceId, input.recommendationId);
    if (!existing) throw new RecommendationNotFoundError(input.recommendationId);
    if (existing.status !== "ACCEPTED") {
      throw new InvalidLifecycleTransitionError(existing.status, "ACCEPTED");
    }
    if (input.percentage < existing.implementation.percentage) {
      throw new StrategyValidationError("Implementation progress cannot decrease.");
    }
    if (input.percentage === 100) {
      return this.transition({
        workspaceId: input.workspaceId,
        recommendationId: input.recommendationId,
        toStatus: "IMPLEMENTED",
        actor: input.actor,
        occurredAt: input.occurredAt,
        note: input.note,
      });
    }

    const occurredAt = (input.occurredAt ?? new Date()).toISOString();
    const transition: RecommendationTransition = validateTransition({
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      fromStatus: "ACCEPTED",
      toStatus: "ACCEPTED",
      actor: input.actor,
      note: input.note,
      progress: input.percentage,
      occurredAt,
    });
    const updated = {
      ...existing,
      implementation: {
        percentage: input.percentage,
        notes: input.note ?? existing.implementation.notes,
        updatedAt: occurredAt,
      },
      updatedAt: occurredAt,
    };
    const event = {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      eventType: "recommendation.implementation.progressed",
      aggregateType: "RECOMMENDATION" as const,
      aggregateId: input.recommendationId,
      payload: {
        status: existing.status,
        progress: input.percentage,
        category: existing.category,
        recommendationTitle: existing.title,
      },
      occurredAt,
    };
    const saved = await this.repository.saveTransition(updated, transition, {
      workspaceId: input.workspaceId,
      recommendationId: input.recommendationId,
      action: "RECOMMENDATION_IMPLEMENTATION_PROGRESS_UPDATED",
      actor: input.actor,
      payload: event.payload,
      createdAt: occurredAt,
    }, event);

    if (this.publisher) await this.publisher.publish(event);
    return saved;
  }
}

function progressFor(input: TransitionRecommendationInput, current: OperationalRecommendation) {
  if (input.toStatus === "IMPLEMENTED") return 100;
  return input.implementationProgress ?? current.implementation.percentage;
}

function applyTransition(
  recommendation: OperationalRecommendation,
  transition: RecommendationTransition
): OperationalRecommendation {
  const lifecycle = { ...recommendation.lifecycle };
  if (transition.toStatus === "VIEWED") lifecycle.viewedAt = transition.occurredAt;
  if (transition.toStatus === "ACCEPTED") lifecycle.acceptedAt = transition.occurredAt;
  if (transition.toStatus === "REJECTED") lifecycle.rejectedAt = transition.occurredAt;
  if (transition.toStatus === "IMPLEMENTED") lifecycle.implementedAt = transition.occurredAt;
  if (transition.toStatus === "EXPIRED") lifecycle.expiredAt = transition.occurredAt;

  return {
    ...recommendation,
    status: transition.toStatus,
    lifecycle,
    implementation: {
      percentage: transition.progress ?? recommendation.implementation.percentage,
      notes: transition.note ?? recommendation.implementation.notes,
      updatedAt: transition.occurredAt,
    },
    updatedAt: transition.occurredAt,
  };
}
