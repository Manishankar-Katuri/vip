import test from "node:test";
import assert from "node:assert/strict";

import { InMemoryOutcomeRepository, OutcomeStore } from "../../../outcome-memory/src";
import { DefaultOutcomeMemoryBridge, ExecutiveBriefingGenerator, InMemoryLearningMemory, RecommendationOutcomeAnalyzer, StrategyLearningEngine } from "../index";

test("learns recommendation reliability and strategy effectiveness from outcomes", async () => {
  const repository = new InMemoryOutcomeRepository();
  let nextId = 0;
  const store = new OutcomeStore(repository, () => `outcome-${++nextId}`, () => "2026-05-29T00:00:00.000Z");
  await store.record({
    workspaceId: "workspace-1",
    kind: "RECOMMENDATION",
    status: "ACCEPTED",
    subject: { id: "rec-1", type: "RECOMMENDATION" },
    summary: "Accepted.",
    occurredAt: "2026-05-29T00:00:00.000Z",
    graphLinks: [{ id: "specialty-1", type: "SPECIALTY" }],
    recommendationId: "rec-1",
    kpiDeltas: [],
    evidence: [],
    lineage: { traceId: "trace-1", sourceEventIds: [], signalIds: [], priorityIds: [], recommendationIds: ["rec-1"], causalChainIds: [], parentOutcomeIds: [] },
    metadata: {},
  });
  await store.record({
    workspaceId: "workspace-1",
    kind: "KPI_CHANGE",
    status: "SUCCESSFUL",
    subject: { id: "specialty-1", type: "SPECIALTY" },
    summary: "Demand improved.",
    occurredAt: "2026-05-30T00:00:00.000Z",
    graphLinks: [{ id: "specialty-1", type: "SPECIALTY" }],
    recommendationId: "rec-1",
    kpiDeltas: [{ kpi: { id: "appointments", type: "KPI" }, baseline: 100, current: 118, observedAt: "2026-05-30T00:00:00.000Z" }],
    evidence: [],
    lineage: { traceId: "trace-1", sourceEventIds: [], signalIds: [], priorityIds: [], recommendationIds: ["rec-1"], causalChainIds: [], parentOutcomeIds: [] },
    metadata: {},
  });

  const memory = new InMemoryLearningMemory();
  const bridge = new DefaultOutcomeMemoryBridge(store);
  const recommendation = await new RecommendationOutcomeAnalyzer(bridge, memory).analyze("workspace-1", "rec-1");
  assert.equal(recommendation.accepted, true);
  assert.equal(recommendation.successful, true);
  assert.ok(recommendation.reliability > 0.6);

  const strategy = await new StrategyLearningEngine(bridge, memory).evaluate({ workspaceId: "workspace-1", specialty: { id: "specialty-1", type: "SPECIALTY" } });
  assert.ok(strategy.effectivenessScore > 50);

  const briefing = await new ExecutiveBriefingGenerator(memory, undefined, () => "briefing-1", () => "2026-05-29T00:00:00.000Z").generate({
    workspaceId: "workspace-1",
    outcomes: await store.query({ workspaceId: "workspace-1" }),
    priorities: [],
  });
  assert.equal(briefing.workspaceId, "workspace-1");
  assert.ok(briefing.confidenceSummaries.length > 0);
});
