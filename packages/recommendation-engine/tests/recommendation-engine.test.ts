import assert from "node:assert/strict";
import test from "node:test";

import { SignalAnalyzer } from "../analyzers";
import {
  RecommendationLifecycleService,
  RecommendationOutboxDispatcher,
  type RecommendationEventPublisher,
} from "../events";
import { RecommendationPriorityEngine } from "../priority";
import type { RecommendationRepository } from "../repositories";
import { RecommendationLifecycleEventSchema, RecommendationSchema } from "../schemas";
import type {
  Recommendation,
  RecommendationApprovedEvent,
  RecommendationCreatedEvent,
  RecommendationExecutedEvent,
  RecommendationLifecycleEvent,
  RecommendationRejectedEvent,
  RecommendationUpdatedEvent,
} from "../types";

const input = {
  workspaceId: "workspace_social",
  previous: {
    startsAt: "2026-05-01T00:00:00.000Z",
    endsAt: "2026-05-07T23:59:59.000Z",
    engagementRate: 8,
    reach: 10000,
    postsPublished: 7,
    targetPosts: 7,
    audienceSize: 5000,
    contentPerformance: 80,
  },
  current: {
    startsAt: "2026-05-08T00:00:00.000Z",
    endsAt: "2026-05-14T23:59:59.000Z",
    engagementRate: 3,
    reach: 5000,
    postsPublished: 1,
    targetPosts: 7,
    audienceSize: 4800,
    contentPerformance: 35,
  },
  observedAt: "2026-05-15T00:00:00.000Z",
  source: "instagram-analytics",
};

test("analyzes performance shifts and builds an explained prioritized recommendation", () => {
  const signals = new SignalAnalyzer().analyze(input);
  assert.equal(signals.length, 6);
  assert.equal(signals.find((signal) => signal.metric === "ENGAGEMENT")?.direction, "DECREASED");
  assert.equal(signals.find((signal) => signal.metric === "MOMENTUM")?.direction, "DECREASED");

  const draft = new RecommendationPriorityEngine().build({
    workspaceId: input.workspaceId,
    type: "ENGAGEMENT_RECOVERY",
    title: "Recover declining engagement",
    signals,
    idempotencyKey: "engagement-recovery-2026-05-15",
    actions: [{
      name: "Prepare engagement recovery workflow",
      processor: "engagement-recovery",
      idempotencyKey: "workflow-engagement-recovery-2026-05-15",
      requiresApproval: true,
      input: { channel: "instagram" },
    }],
  });
  assert.equal(draft.score.priority, "CRITICAL");
  assert.equal(draft.explanation.riskLevel, "HIGH");
  assert.ok(draft.explanation.supportingMetrics.some((metric) => metric.metric === "ENGAGEMENT"));
  assert.match(draft.explanation.explanation, /engagement recovery/);
});

test("persists typed lifecycle events and returns the persisted transition on retry", async () => {
  const repository = new MemoryRecommendationRepository();
  let nextId = 0;
  const lifecycle = new RecommendationLifecycleService(repository, {
    now: () => "2026-05-16T00:00:00.000Z",
    id: () => `generated-${++nextId}`,
  });
  const signals = new SignalAnalyzer().analyze(input);
  const draft = new RecommendationPriorityEngine().build({
    workspaceId: input.workspaceId,
    type: "ENGAGEMENT_RECOVERY",
    title: "Recover declining engagement",
    signals,
    idempotencyKey: "recovery-1",
    actions: [{
      name: "Prepare recovery",
      processor: "engagement-recovery",
      idempotencyKey: "workflow-recovery-1",
      requiresApproval: true,
      input: {},
    }],
  });
  const recommendation = await lifecycle.create(draft);
  const approved = await lifecycle.approve(
    recommendation.workspaceId,
    recommendation.id,
    { type: "USER", id: "owner" },
    "approve-1"
  );
  const retried = await lifecycle.approve(
    recommendation.workspaceId,
    recommendation.id,
    { type: "USER", id: "owner" },
    "approve-1"
  );
  const executed = await lifecycle.execute(
    recommendation.workspaceId,
    recommendation.id,
    { type: "SYSTEM" },
    "execution-1",
    "execute-1"
  );

  assert.equal(approved.status, "APPROVED");
  assert.deepEqual(retried, approved);
  assert.equal(executed.status, "EXECUTED");
  assert.deepEqual(repository.events.map((event) => event.eventType), [
    "recommendation.created",
    "recommendation.approved",
    "recommendation.executed",
  ]);
  repository.events.forEach((event) => assert.equal(RecommendationLifecycleEventSchema.safeParse(event).success, true));
});

test("dispatches durable events independently and strict schemas reject unknown fields", async () => {
  const repository = new MemoryRecommendationRepository();
  const recommendation = sampleRecommendation();
  const event: RecommendationCreatedEvent = {
    eventId: "created-event",
    eventType: "recommendation.created",
    eventVersion: 1,
    aggregateType: "RECOMMENDATION",
    aggregateId: recommendation.id,
    workspaceId: recommendation.workspaceId,
    idempotencyKey: "created-key",
    occurredAt: recommendation.createdAt,
    payload: { recommendation },
  };
  await repository.create(recommendation, event);
  const delivered: string[] = [];
  const publisher: RecommendationEventPublisher = {
    publish: async (item) => {
      delivered.push(item.eventId);
    },
  };
  const result = await new RecommendationOutboxDispatcher(repository, publisher).dispatchPending();
  assert.deepEqual(result, { attempted: 1, published: 1 });
  assert.deepEqual(delivered, ["created-event"]);
  assert.equal((await repository.listPendingEvents(10)).length, 0);
  assert.equal(RecommendationSchema.safeParse({ ...recommendation, unexpected: true }).success, false);
});

test("emits update and rejection events and prevents execution without approval", async () => {
  const repository = new MemoryRecommendationRepository();
  let nextId = 0;
  const lifecycle = new RecommendationLifecycleService(repository, {
    now: () => "2026-05-17T00:00:00.000Z",
    id: () => `mutation-${++nextId}`,
  });
  const candidate = sampleRecommendation();
  const created = await lifecycle.create({
    workspaceId: candidate.workspaceId,
    type: candidate.type,
    title: candidate.title,
    actions: candidate.actions,
    signals: candidate.signals,
    score: candidate.score,
    explanation: candidate.explanation,
    idempotencyKey: "mutation-draft",
  });
  const updated = await lifecycle.update(
    created.workspaceId,
    created.id,
    { title: "Recover engagement with refreshed creative" },
    { type: "AI_COPILOT" },
    "edit-1"
  );
  const rejected = await lifecycle.reject(
    updated.workspaceId,
    updated.id,
    { type: "USER", id: "owner" },
    "The campaign is paused.",
    "reject-1"
  );
  await assert.rejects(
    () => lifecycle.execute(rejected.workspaceId, rejected.id, { type: "SYSTEM" }, "run-2", "execute-2"),
    /must be approved/
  );
  const archived = await lifecycle.archive(rejected.workspaceId, rejected.id, { type: "USER", id: "owner" }, "archive-1");

  assert.equal(archived.status, "ARCHIVED");
  assert.deepEqual(repository.events.map((event) => event.eventType), [
    "recommendation.created",
    "recommendation.updated",
    "recommendation.rejected",
    "recommendation.updated",
  ]);
});

class MemoryRecommendationRepository implements RecommendationRepository {
  readonly recommendations = new Map<string, Recommendation>();
  readonly events: RecommendationLifecycleEvent[] = [];
  readonly published = new Set<string>();

  async findById(workspaceId: string, recommendationId: string) {
    const value = this.recommendations.get(recommendationId);
    return value?.workspaceId === workspaceId ? value : null;
  }

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return Array.from(this.recommendations.values())
      .find((item) => item.workspaceId === workspaceId && item.idempotencyKey === idempotencyKey) ?? null;
  }

  async findEventByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return this.events.find((event) => event.workspaceId === workspaceId && event.idempotencyKey === idempotencyKey) ?? null;
  }

  async create(recommendation: Recommendation, event: RecommendationCreatedEvent) {
    return this.persist(recommendation, event);
  }

  async update(recommendation: Recommendation, event: RecommendationUpdatedEvent) {
    return this.persist(recommendation, event);
  }

  async archive(recommendation: Recommendation, event: RecommendationUpdatedEvent) {
    return this.persist(recommendation, event);
  }

  async approve(recommendation: Recommendation, event: RecommendationApprovedEvent) {
    return this.persist(recommendation, event);
  }

  async reject(recommendation: Recommendation, event: RecommendationRejectedEvent) {
    return this.persist(recommendation, event);
  }

  async execute(recommendation: Recommendation, event: RecommendationExecutedEvent) {
    return this.persist(recommendation, event);
  }

  async listPendingEvents(limit: number) {
    return this.events.filter((event) => !this.published.has(event.eventId)).slice(0, limit);
  }

  async markEventPublished(eventId: string) {
    this.published.add(eventId);
  }

  async markEventFailed() {}

  private async persist(recommendation: Recommendation, event: RecommendationLifecycleEvent) {
    this.recommendations.set(recommendation.id, recommendation);
    if (!this.events.some((existing) => existing.idempotencyKey === event.idempotencyKey)) this.events.push(event);
    return recommendation;
  }
}

function sampleRecommendation(): Recommendation {
  const signals = new SignalAnalyzer().analyze(input);
  const draft = new RecommendationPriorityEngine().build({
    workspaceId: input.workspaceId,
    type: "CONTENT_STRATEGY",
    title: "Review content mix",
    signals,
    idempotencyKey: "sample-1",
    actions: [{
      name: "Review content",
      processor: "content-review",
      idempotencyKey: "workflow-sample-1",
      requiresApproval: true,
      input: {},
    }],
  });
  return {
    ...draft,
    id: "sample-recommendation",
    status: "PENDING",
    version: 1,
    createdAt: "2026-05-16T00:00:00.000Z",
    updatedAt: "2026-05-16T00:00:00.000Z",
  };
}
