import assert from "node:assert/strict";
import test from "node:test";

import type { AnalyticsIntelligenceEvent } from "@vip/analytics-intelligence";

import { OrchestrationEventBus } from "../bus";
import type { ReviewIntelligenceEvent, WorkflowEvent } from "../dto";
import { registerOrchestrationPipelines } from "../pipelines";
import { EventReplayService } from "../replay";
import { InMemoryEventStore } from "../services";
import { InMemoryEventTelemetry } from "../telemetry";
import { PriorityEventTransport } from "../transport";

test("fans events out while preserving aggregate delivery ordering", async () => {
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store);
  const left: string[] = [];
  const right: string[] = [];
  bus.subscribe({ id: "left", topics: ["analytics"], handle: async (envelope) => { left.push(envelope.event.eventId); } });
  bus.subscribe({ id: "right", topics: ["analytics"], handle: async (envelope) => { right.push(envelope.event.eventId); } });

  await bus.publish(analyticsEvent("evt-1", "agg-one"));
  await bus.publish(analyticsEvent("evt-2", "agg-one"));

  assert.deepEqual(left, ["evt-1", "evt-2"]);
  assert.deepEqual(right, ["evt-1", "evt-2"]);
});

test("retries transient subscriber failures and records telemetry", async () => {
  const telemetry = new InMemoryEventTelemetry();
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store, undefined, undefined, telemetry);
  let calls = 0;
  bus.subscribe({
    id: "retryable", topics: ["analytics"], maxAttempts: 3,
    handle: async () => { calls += 1; if (calls < 3) throw new Error("transient"); },
  });

  await bus.publish(analyticsEvent("retry-1", "retry-aggregate"));

  assert.equal(calls, 3);
  assert.equal(telemetry.snapshot().retries, 2);
  assert.equal((await store.listDeadLetters()).length, 0);
});

test("isolates failing subscribers and dead-letters poison events", async () => {
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store);
  let successful = false;
  bus.subscribe({ id: "poison", topics: ["analytics"], maxAttempts: 2, handle: async () => { throw new Error("invalid target"); } });
  bus.subscribe({ id: "healthy", topics: ["analytics"], handle: async () => { successful = true; } });

  const envelope = await bus.publish(analyticsEvent("poison-1", "poison-aggregate"));

  assert.equal(successful, true);
  assert.equal((await store.listDeadLetters()).length, 1);
  assert.equal((await store.findByEventId(envelope.event.eventId))?.state, "DEAD_LETTERED");
});

test("replays by aggregate, type, and time range with a new delivery scope", async () => {
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store);
  let delivered = 0;
  bus.subscribe({ id: "projection", topics: ["analytics"], handle: async () => { delivered += 1; } });
  await bus.publish(analyticsEvent("replay-1", "selected", "2026-05-25T10:00:00.000Z"));
  await bus.publish(analyticsEvent("replay-2", "ignored", "2026-05-25T11:00:00.000Z"));

  const result = await new EventReplayService(store, bus, () => "replay-run").replay({
    aggregateId: "selected",
    eventType: "analytics.anomaly.detected",
    from: "2026-05-25T09:00:00.000Z",
    to: "2026-05-25T10:30:00.000Z",
  });

  assert.deepEqual(result, { replayId: "replay-run", matched: 1, dispatched: 1 });
  assert.equal(delivered, 3);
});

test("idempotently ignores repeated publication of the same domain event", async () => {
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store);
  let delivered = 0;
  bus.subscribe({ id: "once", topics: ["analytics"], handle: async () => { delivered += 1; } });
  const event = analyticsEvent("duplicate-1", "aggregate");
  const first = await bus.publish(event);
  const second = await bus.publish(event);
  assert.equal(first.envelopeId, second.envelopeId);
  assert.equal(delivered, 1);
});

test("assigns enterprise priorities and structured metadata", async () => {
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store);
  const envelope = await bus.publish(reviewRiskEvent("risk-1"), {
    producer: "reviews-api",
    source: { module: "reviews", component: "risk-detector" },
    actor: { type: "AGENT", id: "review-agent" },
    tags: ["patient-experience", "risk"],
    attributes: { riskScore: 0.94, escalated: true },
  });

  assert.equal(envelope.priority, "CRITICAL");
  assert.deepEqual(envelope.metadata.source, { module: "reviews", component: "risk-detector" });
  assert.equal(envelope.topic, "reviews");
});

test("routes competitor, review, and workflow integrations through async pipelines", async () => {
  const store = new InMemoryEventStore();
  const bus = new OrchestrationEventBus(store);
  const seen: string[] = [];
  registerOrchestrationPipelines(bus, {
    analyticsToRecommendations: async () => { seen.push("analytics.recommendations"); },
    recommendationsToAutomation: async () => { seen.push("recommendations.automation"); },
    automationToInsights: async () => { seen.push("automation.insights"); },
    analyticsToAlerts: async () => { seen.push("analytics.alerts"); },
    competitorsToRecommendations: async () => { seen.push("competitors.recommendations"); },
    reviewsToRecommendations: async () => { seen.push("reviews.recommendations"); },
    workflowsToAnalytics: async () => { seen.push("workflows.analytics"); },
  });

  await bus.publish(competitorSignalEvent("competitor-1"));
  await bus.publish(reviewRiskEvent("review-1"));
  await bus.publish(workflowEvent("workflow-1"));

  assert.deepEqual(seen, ["competitors.recommendations", "reviews.recommendations", "workflows.analytics"]);
});

test("keeps Redis-ready transport priority aware", async () => {
  const transport = new PriorityEventTransport();
  const low = await new OrchestrationEventBus(new InMemoryEventStore()).publish(workflowEvent("low-1"), {}, { priority: "LOW" });
  const critical = await new OrchestrationEventBus(new InMemoryEventStore()).publish(reviewRiskEvent("critical-1"));
  await transport.enqueue(low);
  await transport.enqueue(critical);

  assert.equal((await transport.dequeue())?.event.eventId, "critical-1");
  assert.equal((await transport.dequeue())?.event.eventId, "low-1");
});

test("rejects transport events that violate registered payload schemas", async () => {
  const bus = new OrchestrationEventBus(new InMemoryEventStore());
  const invalid = { ...analyticsEvent("invalid-1", "aggregate"), payload: { unexpected: true } };
  await assert.rejects(() => bus.publish(invalid as unknown as AnalyticsIntelligenceEvent));
});

function analyticsEvent(eventId: string, aggregateId: string, occurredAt = "2026-05-25T10:00:00.000Z"): AnalyticsIntelligenceEvent {
  return {
    eventId,
    eventType: "analytics.anomaly.detected",
    eventVersion: 1,
    aggregateType: "ANALYTICS_INTELLIGENCE",
    aggregateId,
    workspaceId: "workspace_1",
    idempotencyKey: `analytics:${eventId}`,
    occurredAt,
    payload: {
      id: aggregateId,
      workspaceId: "workspace_1",
      kind: "ENGAGEMENT_ANOMALY",
      severity: "HIGH",
      confidence: 0.9,
      magnitude: 12,
      summary: "Engagement anomaly detected",
      detectedAt: occurredAt,
      evidence: { engagementRate: 12 },
    },
  };
}

function reviewRiskEvent(eventId: string): ReviewIntelligenceEvent {
  return {
    eventId,
    eventType: "review.risk.detected",
    eventVersion: 1,
    aggregateType: "REVIEW",
    aggregateId: "review_1",
    workspaceId: "workspace_1",
    idempotencyKey: `review:${eventId}`,
    occurredAt: "2026-05-25T10:00:00.000Z",
    payload: {
      reviewId: "review_1",
      source: "google-business-profile",
      rating: 1,
      sentiment: "NEGATIVE",
      riskLevel: "CRITICAL",
      summary: "Patient safety complaint requires immediate escalation",
      evidence: { category: "safety" },
    },
  };
}

function competitorSignalEvent(eventId: string) {
  return {
    eventId,
    eventType: "competitor.signal.detected" as const,
    eventVersion: 1 as const,
    aggregateType: "COMPETITOR" as const,
    aggregateId: "competitor_1",
    workspaceId: "workspace_1",
    idempotencyKey: `competitor:${eventId}`,
    occurredAt: "2026-05-25T10:00:00.000Z",
    payload: {
      competitorId: "competitor_1",
      platform: "instagram",
      signal: "service-line-campaign",
      severity: "HIGH" as const,
      confidence: 0.87,
      summary: "Competitor increased orthopedic campaign velocity",
      evidence: { posts: 7 },
    },
  };
}

function workflowEvent(eventId: string): WorkflowEvent {
  return {
    eventId,
    eventType: "workflow.completed",
    eventVersion: 1,
    aggregateType: "WORKFLOW",
    aggregateId: "workflow_1",
    workspaceId: "workspace_1",
    idempotencyKey: `workflow:${eventId}`,
    occurredAt: "2026-05-25T10:00:00.000Z",
    payload: {
      workflowId: "workflow_1",
      workflowType: "REVIEW_ESCALATION",
      status: "COMPLETED",
      owner: "ops",
      sourceEventId: eventId,
      summary: "Review escalation completed",
      data: { outcome: "notified" },
    },
  };
}
