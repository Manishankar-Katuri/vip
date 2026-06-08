import assert from "node:assert/strict";
import test from "node:test";

import { generateMockWeeklyStrategy, mockIntelligenceSignals, mockWorkspaceContext } from "../examples/mock-weekly-strategy";
import { WeeklyStrategyGenerator } from "./weekly-strategy-generator";

test("generates scored weekly recommendations with explanation metadata", () => {
  const strategy = generateMockWeeklyStrategy();

  assert.equal(strategy.workspaceId, mockWorkspaceContext.workspaceId);
  assert.equal(strategy.period.startsAt, "2026-05-25T00:00:00.000Z");
  assert.equal(strategy.recommendations.length, 3);
  assert.equal(strategy.recommendations[0].category, "RISK_MITIGATION");
  assert.ok(strategy.recommendations[0].score.total >= 70);
  assert.equal(strategy.recommendations[0].explanation.generatedBy, "RULE_ENGINE");
  assert.equal(strategy.dashboard.signalCount, mockIntelligenceSignals.length);
});

test("collects provider signals through the future integration boundary", async () => {
  const strategy = await new WeeklyStrategyGenerator().generateFromProviders({
    context: mockWorkspaceContext,
    providers: [{
      id: "mock-provider",
      collect: async () => mockIntelligenceSignals.slice(0, 1),
    }],
    asOf: new Date("2026-05-25T12:00:00.000Z"),
  });

  assert.equal(strategy.recommendations.length, 1);
  assert.equal(strategy.recommendations[0].category, "GROWTH_OPPORTUNITY");
  assert.equal(strategy.recommendations[0].explanation.llmContext?.eligible, true);
});
