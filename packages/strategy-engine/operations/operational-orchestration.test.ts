import assert from "node:assert/strict";
import test from "node:test";

import { DashboardProjectionService } from "../dashboard";
import { generateMockWeeklyStrategy } from "../examples/mock-weekly-strategy";
import { FeedbackLearningService } from "../feedback";
import { CompositeStrategyEventPublisher, StrategyOutboxDispatcher } from "../events";
import {
  InvalidLifecycleTransitionError,
  RecommendationLifecycleEngine,
} from "../lifecycle";
import { InMemoryStrategyRepository, StrategyPersistenceService } from "../persistence";

test("persists a weekly snapshot and tracks lifecycle, feedback, audits, and events", async () => {
  const repository = new InMemoryStrategyRepository();
  const persistence = new StrategyPersistenceService(repository);
  const lifecycle = new RecommendationLifecycleEngine(repository);
  const feedback = new FeedbackLearningService(repository);
  const dashboard = new DashboardProjectionService(repository);
  const strategy = generateMockWeeklyStrategy();
  const recommendation = strategy.recommendations[0];

  await persistence.persistWeeklyStrategy(strategy, {
    actor: { type: "SYSTEM", id: "scheduler" },
    expiresAt: "2026-06-01T00:00:00.000Z",
  });
  await lifecycle.transition({
    workspaceId: strategy.workspaceId,
    recommendationId: recommendation.id,
    toStatus: "VIEWED",
    actor: { type: "USER", id: "admin" },
  });
  await lifecycle.transition({
    workspaceId: strategy.workspaceId,
    recommendationId: recommendation.id,
    toStatus: "ACCEPTED",
    implementationProgress: 35,
    actor: { type: "USER", id: "admin" },
  });
  const progressed = await lifecycle.updateImplementationProgress({
    workspaceId: strategy.workspaceId,
    recommendationId: recommendation.id,
    percentage: 65,
    note: "Rollout is active.",
    actor: { type: "USER", id: "admin" },
  });
  const outcome = await feedback.recordOutcome({
    workspaceId: strategy.workspaceId,
    recommendationId: recommendation.id,
    baselineEngagement: 100,
    currentEngagement: 118,
    actor: { type: "SYSTEM", id: "analytics" },
    observedAt: "2026-06-01T12:00:00.000Z",
  });
  const projection = await dashboard.project(strategy.workspaceId);
  const analytics = await feedback.historicalAnalytics(strategy.workspaceId);
  const published: string[] = [];
  const dispatch = await new StrategyOutboxDispatcher(
    repository,
    new CompositeStrategyEventPublisher([
      async (event) => { published.push(event.eventType); },
    ])
  ).dispatchPending();

  assert.equal(outcome.outcome, "POSITIVE");
  assert.equal(progressed.implementation.percentage, 65);
  assert.equal(outcome.engagementDelta?.percentage, 18);
  assert.ok(outcome.confidenceAfter > outcome.confidenceBefore);
  assert.equal(projection.riskAlerts[0].status, "ACCEPTED");
  assert.equal(projection.confidenceIndicators[0].direction, "UP");
  assert.equal(analytics.acceptedCount, 1);
  assert.ok(repository.auditEntries.length >= 4);
  assert.ok(repository.events.some((event) => event.eventType === "recommendation.outcome.recorded"));
  assert.ok(repository.events.some((event) => event.eventType === "recommendation.implementation.progressed"));
  assert.equal(
    repository.events.find((event) => event.eventType === "recommendation.implementation.progressed")?.payload.category,
    recommendation.category
  );
  assert.equal(dispatch.published, repository.events.length);
  assert.equal(published.length, repository.events.length);
  assert.ok(repository.events.every((event) => event.status === "PUBLISHED"));
});

test("guards invalid lifecycle transitions and avoids duplicate generation events", async () => {
  const repository = new InMemoryStrategyRepository();
  const persistence = new StrategyPersistenceService(repository);
  const lifecycle = new RecommendationLifecycleEngine(repository);
  const strategy = generateMockWeeklyStrategy();
  const recommendation = strategy.recommendations[0];

  await persistence.persistWeeklyStrategy(strategy, { actor: { type: "SYSTEM" } });
  await persistence.persistWeeklyStrategy(strategy, { actor: { type: "SYSTEM" } });
  await lifecycle.transition({
    workspaceId: strategy.workspaceId,
    recommendationId: recommendation.id,
    toStatus: "REJECTED",
    actor: { type: "USER", id: "owner" },
  });

  await assert.rejects(
    () => lifecycle.transition({
      workspaceId: strategy.workspaceId,
      recommendationId: recommendation.id,
      toStatus: "IMPLEMENTED",
      actor: { type: "USER", id: "owner" },
    }),
    InvalidLifecycleTransitionError
  );
  assert.equal(
    repository.events.filter((event) => event.eventType === "strategy.snapshot.persisted").length,
    1
  );
  assert.equal(
    repository.events.filter((event) => event.eventType === "recommendation.generated").length,
    strategy.recommendations.length
  );
});
