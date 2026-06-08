import assert from "node:assert/strict";
import test from "node:test";

import { StrategyEventActionAdapter } from "../integration/strategy-event-action-adapter";
import { ActionOrchestrator } from "../orchestration";
import { InMemoryActionRepository } from "../persistence";
import { InMemoryActionQueue } from "../queue";
import { ActionWorkerProcessor } from "../workers";
import { ActionValidationError } from "../validation";

test("gates approval and executes an approved action plan with durable logs", async () => {
  const repository = new InMemoryActionRepository();
  const queue = new InMemoryActionQueue();
  const orchestrator = new ActionOrchestrator(repository, queue);
  const plan = await orchestrator.createAndQueue({
    workspaceId: "workspace_demo",
    name: "Publish approved social campaign",
    type: "SOCIAL_PUBLISHING",
    idempotencyKey: "plan-1",
    requiresApproval: true,
    actor: { type: "AI_COPILOT" },
    steps: [{ name: "Publish", processor: "publish", requiresApproval: true }],
  });
  assert.equal(plan.status, "PENDING_APPROVAL");
  assert.equal(queue.jobs.length, 0);
  await orchestrator.approve(plan.workspaceId, plan.id, { type: "USER", id: "owner" });
  const processor = new ActionWorkerProcessor(repository, queue, [
    { name: "publish", execute: async () => ({ postId: "post-1" }) },
  ]);
  const result = await processor.process(queue.jobs[0].job);
  assert.equal(result.status, "COMPLETED");
  assert.equal((await repository.metrics(plan.workspaceId)).completed, 1);
  assert.ok(repository.logs.some((item) => item.eventType === "execution.completed"));
});

test("preserves idempotency and routes terminal failures to dead letter handling", async () => {
  const repository = new InMemoryActionRepository();
  const queue = new InMemoryActionQueue();
  const orchestrator = new ActionOrchestrator(repository, queue);
  const input = {
    workspaceId: "workspace_demo", name: "Alert pipeline", type: "ALERT_PIPELINE" as const,
    idempotencyKey: "alert-1", maxAttempts: 1, actor: { type: "SYSTEM" as const },
    steps: [{ name: "Notify", processor: "notify" }],
  };
  const first = await orchestrator.createAndQueue(input);
  const second = await orchestrator.createAndQueue(input);
  assert.equal(first.id, second.id);
  const worker = new ActionWorkerProcessor(repository, queue, [
    { name: "notify", execute: async () => { throw new Error("Provider unavailable."); } },
  ]);
  const result = await worker.process(queue.jobs[0].job);
  assert.equal(result.status, "DEAD_LETTERED");
  assert.equal(queue.deadLetters.length, 1);
  assert.equal(repository.failures.length, 1);
});

test("schedules recurring jobs and converts accepted strategy events to workflows", async () => {
  const repository = new InMemoryActionRepository();
  const queue = new InMemoryActionQueue();
  const orchestrator = new ActionOrchestrator(repository, queue);
  await orchestrator.createAndQueue({
    workspaceId: "workspace_demo", name: "Weekly campaign", type: "CAMPAIGN_EXECUTION",
    idempotencyKey: "weekly", cronExpression: "0 9 * * 1", actor: { type: "SYSTEM" },
    steps: [{ name: "Launch", processor: "launch" }],
  });
  const fromEvent = await new StrategyEventActionAdapter(orchestrator).consume({
    workspaceId: "workspace_demo",
    recommendationId: "rec-risk-1",
    eventType: "recommendation.lifecycle.transitioned",
    aggregateType: "RECOMMENDATION",
    aggregateId: "rec-risk-1",
    payload: { toStatus: "ACCEPTED", category: "RISK_MITIGATION" },
    occurredAt: "2026-05-25T00:00:00.000Z",
  });
  assert.equal(queue.jobs[0].cron, "0 9 * * 1");
  assert.equal(fromEvent?.type, "ALERT_PIPELINE");
  assert.equal(queue.jobs.length, 2);
});

test("validates unsafe plans before persistence or queueing", async () => {
  const orchestrator = new ActionOrchestrator(new InMemoryActionRepository(), new InMemoryActionQueue());
  await assert.rejects(
    () => orchestrator.createAndQueue({
      workspaceId: "../unsafe", name: "Bad", type: "ALERT_PIPELINE", idempotencyKey: "bad",
      actor: { type: "SYSTEM" }, steps: [],
    }),
    ActionValidationError
  );
});
