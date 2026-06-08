import { randomUUID } from "node:crypto";

import { RecommendationDraftSchema, RecommendationSchema } from "../schemas";
import type { Recommendation, RecommendationActor, RecommendationDraft } from "../types";
import type { RecommendationRepository } from "../repositories";
import { RecommendationEventFactory } from "./recommendation-event-factory";

export type RecommendationUpdate = Partial<
  Pick<RecommendationDraft, "title" | "actions" | "signals" | "score" | "explanation">
>;

export interface LifecycleDependencies {
  now(): string;
  id(): string;
}

const DEFAULT_DEPENDENCIES: LifecycleDependencies = {
  now: () => new Date().toISOString(),
  id: () => randomUUID(),
};

export class RecommendationLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecommendationLifecycleError";
  }
}

export class RecommendationLifecycleService {
  private readonly factory = new RecommendationEventFactory();

  constructor(
    private readonly repository: RecommendationRepository,
    private readonly dependencies: LifecycleDependencies = DEFAULT_DEPENDENCIES
  ) {}

  async create(draft: RecommendationDraft) {
    const validated = RecommendationDraftSchema.parse(draft) as RecommendationDraft;
    const existing = await this.repository.findByIdempotencyKey(validated.workspaceId, validated.idempotencyKey);
    if (existing) return existing;
    const now = this.dependencies.now();
    const recommendation = validateRecommendation({
      ...validated,
      id: this.dependencies.id(),
      status: "PENDING",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    const event = this.factory.created(recommendation, this.context(recommendation, "created", now));
    return this.repository.create(recommendation, event);
  }

  async update(
    workspaceId: string,
    recommendationId: string,
    patch: RecommendationUpdate,
    actor: RecommendationActor,
    operationId: string
  ) {
    const retry = await this.findPersistedMutation(workspaceId, recommendationId, operationId);
    if (retry) return retry;
    const current = await this.requireRecommendation(workspaceId, recommendationId);
    this.ensureOpen(current);
    const changedFields = Object.keys(patch);
    if (changedFields.length === 0) throw new RecommendationLifecycleError("An update requires changed fields.");
    const recommendation = this.next(current, patch);
    const event = this.factory.updated(recommendation, changedFields, actor, this.context(recommendation, operationId));
    return this.repository.update(recommendation, event);
  }

  async approve(
    workspaceId: string,
    recommendationId: string,
    actor: RecommendationActor,
    operationId: string,
    note?: string
  ) {
    const retry = await this.findPersistedMutation(workspaceId, recommendationId, operationId);
    if (retry) return retry;
    const current = await this.requireStatus(workspaceId, recommendationId, "PENDING");
    const recommendation = this.next(current, { status: "APPROVED" });
    const event = this.factory.approved(recommendation, actor, this.context(recommendation, operationId), note);
    return this.repository.approve(recommendation, event);
  }

  async reject(
    workspaceId: string,
    recommendationId: string,
    actor: RecommendationActor,
    reason: string,
    operationId: string
  ) {
    const retry = await this.findPersistedMutation(workspaceId, recommendationId, operationId);
    if (retry) return retry;
    const current = await this.requireStatus(workspaceId, recommendationId, "PENDING");
    const recommendation = this.next(current, { status: "REJECTED" });
    const event = this.factory.rejected(recommendation, actor, reason, this.context(recommendation, operationId));
    return this.repository.reject(recommendation, event);
  }

  async execute(
    workspaceId: string,
    recommendationId: string,
    actor: RecommendationActor,
    workflowExecutionId: string,
    operationId: string
  ) {
    const retry = await this.findPersistedMutation(workspaceId, recommendationId, operationId);
    if (retry) return retry;
    const current = await this.requireStatus(workspaceId, recommendationId, "APPROVED");
    const recommendation = this.next(current, { status: "EXECUTED" });
    const event = this.factory.executed(
      recommendation,
      actor,
      workflowExecutionId,
      this.context(recommendation, operationId)
    );
    return this.repository.execute(recommendation, event);
  }

  async archive(workspaceId: string, recommendationId: string, actor: RecommendationActor, operationId: string) {
    const retry = await this.findPersistedMutation(workspaceId, recommendationId, operationId);
    if (retry) return retry;
    const current = await this.requireRecommendation(workspaceId, recommendationId);
    if (current.status === "ARCHIVED") throw new RecommendationLifecycleError("Recommendation is already archived.");
    const recommendation = this.next(current, { status: "ARCHIVED" });
    const event = this.factory.updated(
      recommendation,
      ["status"],
      actor,
      this.context(recommendation, operationId)
    );
    return this.repository.archive(recommendation, event);
  }

  private async requireRecommendation(workspaceId: string, recommendationId: string) {
    const recommendation = await this.repository.findById(workspaceId, recommendationId);
    if (!recommendation) throw new RecommendationLifecycleError("Recommendation was not found.");
    return recommendation;
  }

  private async requireStatus(workspaceId: string, recommendationId: string, requiredStatus: Recommendation["status"]) {
    const recommendation = await this.requireRecommendation(workspaceId, recommendationId);
    if (recommendation.status !== requiredStatus) {
      throw new RecommendationLifecycleError(`Recommendation must be ${requiredStatus.toLowerCase()} for this transition.`);
    }
    return recommendation;
  }

  private ensureOpen(recommendation: Recommendation) {
    if (recommendation.status === "EXECUTED" || recommendation.status === "ARCHIVED") {
      throw new RecommendationLifecycleError("Completed or archived recommendations cannot be updated.");
    }
  }

  private next(current: Recommendation, patch: Partial<Recommendation>) {
    return validateRecommendation({
      ...current,
      ...patch,
      version: current.version + 1,
      updatedAt: this.dependencies.now(),
    });
  }

  private context(recommendation: Recommendation, operationId: string, occurredAt = this.dependencies.now()) {
    if (!operationId.trim()) throw new RecommendationLifecycleError("Lifecycle operations require an idempotency key.");
    return {
      eventId: this.dependencies.id(),
      idempotencyKey: `${recommendation.id}:${operationId}`,
      occurredAt,
    };
  }

  private async findPersistedMutation(workspaceId: string, recommendationId: string, operationId: string) {
    if (!operationId.trim()) throw new RecommendationLifecycleError("Lifecycle operations require an idempotency key.");
    const event = await this.repository.findEventByIdempotencyKey(workspaceId, `${recommendationId}:${operationId}`);
    return event?.payload.recommendation ?? null;
  }
}

function validateRecommendation(recommendation: unknown) {
  return RecommendationSchema.parse(recommendation) as Recommendation;
}
