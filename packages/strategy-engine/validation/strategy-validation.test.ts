import assert from "node:assert/strict";
import test from "node:test";

import { generateMockWeeklyStrategy } from "../examples/mock-weekly-strategy";
import {
  StrategyValidationError,
  validateOutcomeInput,
  validateTransition,
  validateWeeklyStrategy,
} from "./strategy-validation";

test("validates generated weekly strategies and rejects mixed workspace recommendations", () => {
  const valid = generateMockWeeklyStrategy();
  assert.equal(validateWeeklyStrategy(valid), valid);

  assert.throws(
    () => validateWeeklyStrategy({
      ...valid,
      recommendations: [{ ...valid.recommendations[0], workspaceId: "unrelated_workspace" }],
    }),
    StrategyValidationError
  );
});

test("validates lifecycle progress and feedback measurement inputs", () => {
  assert.throws(
    () => validateTransition({
      workspaceId: "workspace_demo_health",
      recommendationId: "rec-1",
      fromStatus: "GENERATED",
      toStatus: "ACCEPTED",
      progress: 101,
      actor: { type: "USER" },
      occurredAt: "2026-05-25T12:00:00.000Z",
    }),
    StrategyValidationError
  );
  assert.throws(
    () => validateOutcomeInput({
      workspaceId: "workspace_demo_health",
      recommendationId: "rec-1",
      baselineEngagement: -1,
      actor: { type: "SYSTEM" },
    }),
    StrategyValidationError
  );
});
