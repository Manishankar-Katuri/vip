import test from "node:test";
import assert from "node:assert/strict";

import {
  AgentContextManager,
  AgentEventBridge,
  AgentExecutionEngine,
  AgentRegistry,
  AgentRuntime,
  AgentScheduler,
  AgentStateStore,
  AgentTaskQueue,
  createDefaultAgentModules,
  createStrategyAgent,
} from "../index";

test("dispatches subscribed intelligence events through capability modules", async () => {
  const registry = new AgentRegistry();
  const agent = registry.register(createStrategyAgent(createDefaultAgentModules(), "workspace-1"));
  const stateStore = new AgentStateStore(undefined, () => "2026-05-29T00:00:00.000Z");
  const eventBridge = new AgentEventBridge(undefined, undefined, () => "event-1", () => "2026-05-29T00:00:00.000Z");
  const engine = new AgentExecutionEngine(new AgentContextManager(stateStore), stateStore, eventBridge, undefined, undefined, () => "execution-1", () => "2026-05-29T00:00:00.000Z");
  const queue = new AgentTaskQueue();
  const runtime = new AgentRuntime(registry, new AgentScheduler(queue), queue, engine, eventBridge, () => "task-1");

  const result = await runtime.dispatch({
    eventId: "source-1",
    eventType: "intelligence.signal.raised",
    workspaceId: "workspace-1",
    occurredAt: "2026-05-29T00:00:00.000Z",
    traceId: "trace-1",
    aggregateId: "signal-1",
    payload: {
      traceId: "trace-1",
      signal: {
        id: "signal-1",
        workspaceId: "workspace-1",
        type: "COMPETITOR_MOMENTUM",
        direction: "EMERGING",
        severity: "HIGH",
        summary: "Competitor demand is accelerating.",
        sourceEventIds: [],
        relatedEntities: [{ id: "competitor-1", type: "COMPETITOR" }],
        temporalWindow: { startsAt: "2026-05-29T00:00:00.000Z", endsAt: "2026-05-29T01:00:00.000Z", granularity: "HOUR" },
        scores: { impact: 80, urgency: 70, confidence: 0.8, strategicImportance: 75 },
        evidence: [],
        propagation: { depth: 0, parentSignalIds: [], childSignalIds: [] },
        graphLinks: [],
        correlationKey: "competitor-1",
        idempotencyKey: "signal-1",
        detectedAt: "2026-05-29T00:00:00.000Z",
        metadata: {},
      },
    },
  });

  assert.equal(result.processed, 1);
  assert.equal((await stateStore.getState(agent.id))?.lifecycle, "IDLE");
});
