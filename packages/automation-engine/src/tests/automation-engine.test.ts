import assert from "node:assert/strict";
import test from "node:test";

import type { AnalyticsSignal, Recommendation, RecommendationCreatedEvent } from "@vip/recommendation-engine";

import { AutomationExecutionService, AutomationExecutionStateMachine, AutomationTransitionError } from "../execution";
import { AutomationLifecycleEventSchema } from "../schemas";
import { DEFAULT_WORKFLOW_MAPPINGS, WorkflowTriggerMapper } from "../mappings";
import { PrismaAutomationRepository, type AutomationPrismaClient, type AutomationRepository } from "../repositories";
import { AutomationRuleEngine } from "../rules";
import { AutomationExecutionCoordinator, AutomationRetryCoordinator, AutomationTriggerService } from "../services";
import type { AutomationDeadLetterJob, AutomationQueueJob, AutomationRetryJob } from "../dto";
import type { AutomationQueue, AutomationQueueOptions } from "../queue";
import type {
  AutomationExecution,
  AutomationLifecycleEvent,
  AutomationLog,
  AutomationRule,
  AutomationTrigger,
  WorkflowMapping,
} from "../types";
import { AutomationOutboxDispatcher } from "../events";

test("evaluates all supported rule triggers against recommendation evidence", () => {
  const ruleEngine = new AutomationRuleEngine();
  const matches = [
    ["ENGAGEMENT_DROP", recommendation("ENGAGEMENT_RECOVERY", { metric: "ENGAGEMENT", direction: "DECREASED", changePercent: -35 }), { metric: "ENGAGEMENT", operator: "LTE", threshold: -20 }],
    ["VIRAL_SPIKE", recommendation("CONTENT_STRATEGY", { metric: "REACH", direction: "INCREASED", changePercent: 90 }), { metric: "REACH", operator: "GTE", threshold: 50 }],
    ["AUDIENCE_DECLINE", recommendation("ENGAGEMENT_RECOVERY", { metric: "AUDIENCE_GROWTH", direction: "DECREASED", changePercent: -12 }), { metric: "AUDIENCE_GROWTH", operator: "LT", threshold: -10 }],
    ["POSTING_INACTIVITY", recommendation("CONTENT_STRATEGY", { metric: "POSTING_CONSISTENCY", direction: "DECREASED", changePercent: -60 }), { metric: "POSTING_CONSISTENCY", operator: "LTE", threshold: -50 }],
    ["HIGH_CONFIDENCE_GROWTH_OPPORTUNITY", recommendation("GROWTH_ACCELERATION", { metric: "REACH", direction: "INCREASED", changePercent: 20 }, 0.93), { metric: "CONFIDENCE", operator: "GTE", threshold: 0.9 }],
    ["CRITICAL_RECOMMENDATION", recommendation("CAMPAIGN_OPTIMIZATION", { metric: "CONTENT_PERFORMANCE", direction: "DECREASED", changePercent: -30 }, 0.9, "CRITICAL"), { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 }],
  ] as const;

  for (const [trigger, candidate, condition] of matches) {
    const result = ruleEngine.evaluate(createdEvent(candidate), [rule(trigger, condition)]);
    assert.equal(result.length, 1, `${trigger} should match its qualifying recommendation.`);
  }
});

test("maps recommendation types to approval-gated executable workflows", () => {
  const mapper = new WorkflowTriggerMapper();
  const engagement = mapper.map(recommendation("ENGAGEMENT_RECOVERY"), "execution-1");
  const timing = mapper.map(recommendation("BEST_POSTING_TIME"), "execution-2");
  const hashtags = mapper.map(recommendation("HASHTAG_OPTIMIZATION"), "execution-3");

  assert.equal(engagement.workflowType, "engagement-recovery-workflow");
  assert.equal(timing.processor, "best-posting-time");
  assert.equal(hashtags.workflowType, "content-optimization-workflow");
  assert.equal(engagement.requiresApproval, true);
  assert.equal(engagement.idempotencyKey, "execution-1:workflow");
});

test("deduplicates triggered executions, respects cooldown, and emits durable lifecycle events", async () => {
  const repository = new MemoryAutomationRepository([
    rule("ENGAGEMENT_DROP", { metric: "ENGAGEMENT", operator: "LTE", threshold: -20 }),
  ]);
  let now = "2026-05-26T00:00:00.000Z";
  let sequence = 0;
  const dependencies = { now: () => now, id: () => `automation-${++sequence}` };
  const triggerService = new AutomationTriggerService(
    repository,
    new AutomationRuleEngine(),
    new WorkflowTriggerMapper(),
    dependencies
  );
  const event = createdEvent(recommendation("ENGAGEMENT_RECOVERY", {
    metric: "ENGAGEMENT", direction: "DECREASED", changePercent: -35,
  }));
  const first = await triggerService.consume(event);
  const retried = await triggerService.consume(event);
  now = "2026-05-26T00:05:00.000Z";
  const cooledDown = await triggerService.consume({ ...event, eventId: "second-source-event" });

  assert.equal(first.length, 1);
  assert.deepEqual(retried[0], first[0]);
  assert.equal(cooledDown.length, 0);
  assert.equal(repository.executions.size, 1);
  assert.equal(repository.events[0].eventType, "automation.triggered");
  assert.equal(AutomationLifecycleEventSchema.safeParse(repository.events[0]).success, true);
});

test("tracks retries, completion, dead-letter eligibility, and event dispatch idempotently", async () => {
  const repository = new MemoryAutomationRepository([
    rule("CRITICAL_RECOMMENDATION", { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 }),
  ]);
  let sequence = 0;
  const dependencies = { now: () => "2026-05-26T01:00:00.000Z", id: () => `state-${++sequence}` };
  const trigger = new AutomationTriggerService(repository, new AutomationRuleEngine(), new WorkflowTriggerMapper(), dependencies);
  const [queued] = await trigger.consume(createdEvent(recommendation("CAMPAIGN_OPTIMIZATION", undefined, 0.9, "CRITICAL")));
  const execution = new AutomationExecutionService(repository, dependencies);
  const running = await execution.start(queued.workspaceId, queued.id, "start-1");
  const retryQueued = await execution.fail(running.workspaceId, running.id, "Temporary provider error.", "failure-1");
  const restarted = await execution.start(retryQueued.workspaceId, retryQueued.id, "start-2");
  const failed = await execution.fail(restarted.workspaceId, restarted.id, "Provider refused request.", "failure-2");
  const retriedFailure = await execution.fail(restarted.workspaceId, restarted.id, "Provider refused request.", "failure-2");

  assert.equal(retryQueued.status, "RETRYING");
  assert.equal(retryQueued.nextRetryAt, "2026-05-26T01:00:01.000Z");
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.deadLetterEligible, true);
  assert.deepEqual(retriedFailure, failed);

  const completedRepository = new MemoryAutomationRepository([
    rule("CRITICAL_RECOMMENDATION", { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 }),
  ]);
  const completedTrigger = new AutomationTriggerService(completedRepository, new AutomationRuleEngine(), new WorkflowTriggerMapper(), dependencies);
  const [completionCandidate] = await completedTrigger.consume(createdEvent(recommendation("CAMPAIGN_OPTIMIZATION", undefined, 0.9, "CRITICAL")));
  await new AutomationExecutionService(completedRepository, dependencies).start(completionCandidate.workspaceId, completionCandidate.id, "run-start");
  const completed = await new AutomationExecutionService(completedRepository, dependencies).complete(
    completionCandidate.workspaceId, completionCandidate.id, { workflowId: "workflow-1" }, "run-complete"
  );
  assert.equal(completed.status, "COMPLETED");
  const rolledBack = await new AutomationExecutionService(completedRepository, dependencies).rollBack(
    completionCandidate.workspaceId, completionCandidate.id, "Downstream compensation applied.", "run-rollback"
  );
  assert.equal(rolledBack.status, "ROLLED_BACK");

  const published: string[] = [];
  const dispatch = await new AutomationOutboxDispatcher(repository, {
    publish: async (event) => { published.push(event.eventId); },
  }).dispatchPending();
  assert.equal(dispatch.published, repository.events.length);
  assert.equal(published.length, repository.events.length);
});

test("enforces rolling execution limits independently of cooldown windows", async () => {
  const constrained = {
    ...rule("ENGAGEMENT_DROP", { metric: "ENGAGEMENT", operator: "LTE", threshold: -20 }),
    cooldownMinutes: 0,
    executionLimit: { maxExecutions: 1, windowMinutes: 60 },
  };
  const repository = new MemoryAutomationRepository([constrained]);
  const service = new AutomationTriggerService(repository, new AutomationRuleEngine(), new WorkflowTriggerMapper(), {
    now: () => "2026-05-26T00:15:00.000Z",
    id: () => `limit-${repository.events.length + 1}`,
  });
  const event = createdEvent(recommendation("ENGAGEMENT_RECOVERY", {
    metric: "ENGAGEMENT", direction: "DECREASED", changePercent: -35,
  }));
  assert.equal((await service.consume(event)).length, 1);
  assert.equal((await service.consume({ ...event, eventId: "new-source-within-window" })).length, 0);
});

test("enforces lifecycle transitions and persists rollback as its own event", async () => {
  const machine = new AutomationExecutionStateMachine();
  assert.equal(machine.canTransition("QUEUED", "SCHEDULED"), true);
  assert.throws(() => machine.assertTransition("COMPLETED", "RUNNING"), AutomationTransitionError);

  const repository = new MemoryAutomationRepository([rule("CRITICAL_RECOMMENDATION", { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 })]);
  const dependencies = { now: () => "2026-05-26T03:00:00.000Z", id: sequence("rollback") };
  const [queued] = await new AutomationTriggerService(repository, undefined, undefined, dependencies)
    .consume(createdEvent(recommendation("CAMPAIGN_OPTIMIZATION", undefined, 0.9, "CRITICAL")));
  const executions = new AutomationExecutionService(repository, dependencies);
  await executions.start(queued.workspaceId, queued.id, "start");
  await executions.rollBack(queued.workspaceId, queued.id, "Compensation succeeded.", "rollback");
  assert.equal(repository.events[repository.events.length - 1].eventType, "automation.rolled_back");
});

test("transitions exhausted retries into a dead-letter event", async () => {
  const repository = new MemoryAutomationRepository([rule("CRITICAL_RECOMMENDATION", { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 })]);
  const dependencies = { now: () => "2026-05-26T04:00:00.000Z", id: sequence("dead") };
  const [queued] = await new AutomationTriggerService(repository, undefined, undefined, dependencies)
    .consume(createdEvent(recommendation("CAMPAIGN_OPTIMIZATION", undefined, 0.9, "CRITICAL")));
  const service = new AutomationExecutionService(repository, dependencies);
  const running = await service.start(queued.workspaceId, queued.id, "start-1");
  const retrying = await service.fail(running.workspaceId, running.id, "Temporary.", "fail-1");
  const restarted = await service.start(retrying.workspaceId, retrying.id, "start-2");
  const failed = await service.fail(restarted.workspaceId, restarted.id, "Terminal.", "fail-2");
  const dead = await service.deadLetter(failed.workspaceId, failed.id, "Attempts exhausted.", "dead-letter");
  assert.equal(dead.status, "DEAD_LETTERED");
  assert.equal(repository.events[repository.events.length - 1].eventType, "automation.dead_lettered");
});

test("uses stable queue operation keys for dispatch deduplication", async () => {
  const queue = new DedupeQueue();
  const coordinator = new AutomationExecutionCoordinator(
    new MemoryAutomationRepository([]), queue, { execute: async () => ({ ok: true }) }
  );
  await coordinator.dispatch("execution-1", "workspace_social", "2026-05-26T00:00:00.000Z");
  await coordinator.dispatch("execution-1", "workspace_social", "2026-05-26T00:00:01.000Z");
  assert.equal(queue.jobs.size, 1);
  assert.ok(queue.jobs.has("execution-1:dispatch"));
});

test("schedules delayed retry jobs with a stable operation key", async () => {
  const repository = new MemoryAutomationRepository([rule("CRITICAL_RECOMMENDATION", { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 })]);
  let now = "2026-05-26T06:00:00.000Z";
  const dependencies = { now: () => now, id: sequence("retry-job") };
  const [queued] = await new AutomationTriggerService(repository, undefined, undefined, dependencies)
    .consume(createdEvent(recommendation("CAMPAIGN_OPTIMIZATION", undefined, 0.9, "CRITICAL")));
  const service = new AutomationExecutionService(repository, dependencies);
  const running = await service.start(queued.workspaceId, queued.id, "start");
  const retrying = await service.fail(running.workspaceId, running.id, "Transient.", "fail");
  const queue = new DedupeQueue();
  now = "2026-05-26T06:00:01.000Z";
  assert.equal(await new AutomationRetryCoordinator(queue, service).schedule(retrying, "Transient.", now), true);
  assert.ok(queue.jobs.has(`${retrying.id}:retry:1`));
  assert.equal((await repository.findExecutionById(retrying.workspaceId, retrying.id))!.status, "SCHEDULED");
});

test("does not execute a terminal workflow when a queue job is redelivered", async () => {
  const repository = new MemoryAutomationRepository([rule("CRITICAL_RECOMMENDATION", { metric: "RECOMMENDATION_SCORE", operator: "GTE", threshold: 75 })]);
  const dependencies = { now: () => "2026-05-26T07:00:00.000Z", id: sequence("redelivery") };
  const [queued] = await new AutomationTriggerService(repository, undefined, undefined, dependencies)
    .consume(createdEvent(recommendation("CAMPAIGN_OPTIMIZATION", undefined, 0.9, "CRITICAL")));
  let calls = 0;
  const coordinator = new AutomationExecutionCoordinator(repository, new DedupeQueue(), {
    execute: async () => { calls += 1; return { ok: true }; },
  }, dependencies);
  const job = await coordinator.dispatch(queued.id, queued.workspaceId, dependencies.now());
  await coordinator.handle(job);
  await coordinator.handle(job);
  assert.equal(calls, 1);
  assert.equal((await repository.findExecutionById(queued.workspaceId, queued.id))!.status, "COMPLETED");
});

test("persists execution, log, and outbox event in one durable transaction", async () => {
  const memory = new MemoryAutomationRepository([rule("ENGAGEMENT_DROP", { metric: "ENGAGEMENT", operator: "LTE", threshold: -20 })]);
  const [queued] = await new AutomationTriggerService(memory, undefined, undefined, {
    now: () => "2026-05-26T05:00:00.000Z", id: sequence("transaction"),
  }).consume(createdEvent(recommendation("ENGAGEMENT_RECOVERY", { metric: "ENGAGEMENT", direction: "DECREASED", changePercent: -40 })));
  const database = new TransactionDatabase();
  const durable = new PrismaAutomationRepository(database);
  const saved = await durable.createExecution(queued, memory.events[0], memory.logs[0]);
  assert.equal(saved.id, queued.id);
  assert.equal(database.transactions, 1);
  assert.equal(database.executionRows.length, 1);
  assert.equal(database.logRows.length, 1);
  assert.equal(database.eventRows.length, 1);
});

class MemoryAutomationRepository implements AutomationRepository {
  readonly executions = new Map<string, AutomationExecution>();
  readonly events: AutomationLifecycleEvent[] = [];
  readonly logs: AutomationLog[] = [];
  readonly published = new Set<string>();
  private readonly mappings = new Map(DEFAULT_WORKFLOW_MAPPINGS.map((mapping) => [mapping.id, mapping]));

  constructor(private readonly rules: AutomationRule[]) {}

  async listEnabledRules(workspaceId: string) {
    return this.rules.filter((rule) => rule.workspaceId === workspaceId && rule.enabled);
  }

  async findWorkflowMapping(mappingId: string): Promise<WorkflowMapping | null> {
    return this.mappings.get(mappingId) ?? null;
  }

  async findExecutionById(workspaceId: string, executionId: string) {
    const execution = this.executions.get(executionId);
    return execution?.workspaceId === workspaceId ? execution : null;
  }

  async findExecutionByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return Array.from(this.executions.values())
      .find((execution) => execution.workspaceId === workspaceId && execution.idempotencyKey === idempotencyKey) ?? null;
  }

  async findEventByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return this.events.find((event) => event.workspaceId === workspaceId && event.idempotencyKey === idempotencyKey) ?? null;
  }

  async latestExecutionForRule(workspaceId: string, ruleId: string) {
    return Array.from(this.executions.values())
      .filter((execution) => execution.workspaceId === workspaceId && execution.ruleId === ruleId)
      .sort((left, right) => right.queuedAt.localeCompare(left.queuedAt))[0] ?? null;
  }

  async countRuleExecutionsSince(workspaceId: string, ruleId: string, since: string) {
    return Array.from(this.executions.values())
      .filter((execution) => execution.workspaceId === workspaceId && execution.ruleId === ruleId && execution.queuedAt >= since).length;
  }

  async createExecution(execution: AutomationExecution, event: AutomationLifecycleEvent, log: AutomationLog) {
    return this.persist(execution, event, log);
  }

  async updateExecution(execution: AutomationExecution, event: AutomationLifecycleEvent, log: AutomationLog) {
    return this.persist(execution, event, log);
  }

  async listPendingEvents(limit: number) {
    return this.events.filter((event) => !this.published.has(event.eventId)).slice(0, limit);
  }

  async markEventPublished(eventId: string) {
    this.published.add(eventId);
  }

  async markEventFailed() {}

  private async persist(execution: AutomationExecution, event: AutomationLifecycleEvent, log: AutomationLog) {
    this.executions.set(execution.id, execution);
    if (!this.events.some((saved) => saved.idempotencyKey === event.idempotencyKey)) {
      this.events.push(event);
      this.logs.push(log);
    }
    return execution;
  }
}

class DedupeQueue implements AutomationQueue {
  readonly jobs = new Map<string, AutomationQueueJob | AutomationRetryJob>();
  readonly deadLetters: AutomationDeadLetterJob[] = [];
  async enqueue(job: AutomationQueueJob, options: AutomationQueueOptions) {
    this.jobs.set(options.operationKey, job);
    return options.operationKey;
  }
  async schedule(job: AutomationQueueJob | AutomationRetryJob, _runAt: Date, options: AutomationQueueOptions) {
    this.jobs.set(options.operationKey, job);
    return options.operationKey;
  }
  async deadLetter(job: AutomationDeadLetterJob) { this.deadLetters.push(job); }
}

class TestDelegate {
  constructor(private readonly rows: Record<string, unknown>[]) {}
  async create(args: { data: Record<string, unknown> }) { this.rows.push(args.data); return args.data; }
  async update(args: { where: { id: string }, data: Record<string, unknown> }) {
    const row = this.rows.find((candidate) => candidate.id === args.where.id) ?? {};
    Object.assign(row, args.data);
    return row;
  }
  async upsert(args: { create: Record<string, unknown> }) { return this.create({ data: args.create }); }
  async findFirst(_args: unknown) { return null; }
  async findMany(_args: unknown) { return this.rows; }
  async count(_args: unknown) { return this.rows.length; }
}

class TransactionDatabase implements AutomationPrismaClient {
  transactions = 0;
  readonly executionRows: Record<string, unknown>[] = [];
  readonly logRows: Record<string, unknown>[] = [];
  readonly eventRows: Record<string, unknown>[] = [];
  automationExecution = new TestDelegate(this.executionRows) as unknown as AutomationPrismaClient["automationExecution"];
  automationExecutionLog = new TestDelegate(this.logRows) as unknown as AutomationPrismaClient["automationExecutionLog"];
  automationRule = new TestDelegate([]) as unknown as AutomationPrismaClient["automationRule"];
  automationWorkflowMapping = new TestDelegate([]) as unknown as AutomationPrismaClient["automationWorkflowMapping"];
  automationOutboxEvent = new TestDelegate(this.eventRows) as unknown as AutomationPrismaClient["automationOutboxEvent"];
  async $transaction<T>(operation: (database: AutomationPrismaClient) => Promise<T>): Promise<T> {
    this.transactions += 1;
    return operation(this);
  }
}

function rule(trigger: AutomationTrigger, condition: AutomationRule["conditions"][number]): AutomationRule {
  const workflowType = trigger === "ENGAGEMENT_DROP" ? "ENGAGEMENT_RECOVERY" : "CAMPAIGN_OPTIMIZATION";
  return {
    id: `rule:${trigger}`,
    workspaceId: "workspace_social",
    name: trigger,
    enabled: true,
    trigger,
    conditions: [condition],
    cooldownMinutes: 30,
    executionLimit: { maxExecutions: 2, windowMinutes: 60 },
    retryPolicy: { maxAttempts: 2, backoffMs: 1000, deadLetterAfterAttempts: 2 },
    workflowMappingId: `mapping:${workflowType}`,
    createdAt: "2026-05-26T00:00:00.000Z",
    updatedAt: "2026-05-26T00:00:00.000Z",
  };
}

function createdEvent(item: Recommendation): RecommendationCreatedEvent {
  return {
    eventId: `recommendation-event:${item.type}:${item.signals[0].metric}`,
    eventType: "recommendation.created",
    eventVersion: 1,
    aggregateType: "RECOMMENDATION",
    aggregateId: item.id,
    workspaceId: item.workspaceId,
    idempotencyKey: `recommendation:${item.id}`,
    occurredAt: "2026-05-26T00:00:00.000Z",
    payload: { recommendation: item },
  };
}

function recommendation(
  type: Recommendation["type"],
  signal: Pick<AnalyticsSignal, "metric" | "direction" | "changePercent"> = {
    metric: "ENGAGEMENT",
    direction: "STABLE",
    changePercent: 0,
  },
  confidence = 0.9,
  priority: Recommendation["score"]["priority"] = "HIGH"
): Recommendation {
  return {
    id: `recommendation:${type}`,
    workspaceId: "workspace_social",
    type,
    title: `${type} action`,
    status: "PENDING",
    version: 1,
    createdAt: "2026-05-26T00:00:00.000Z",
    updatedAt: "2026-05-26T00:00:00.000Z",
    idempotencyKey: `recommendation:${type}`,
    actions: [{
      name: "Approval action",
      processor: "action",
      idempotencyKey: `action:${type}`,
      requiresApproval: true,
      input: {},
    }],
    signals: [{
      id: `signal:${type}`,
      workspaceId: "workspace_social",
      metric: signal.metric,
      direction: signal.direction,
      currentValue: 10,
      previousValue: 10,
      changePercent: signal.changePercent,
      normalizedScore: Math.abs(signal.changePercent),
      confidence,
      summary: "Measured signal.",
      observedAt: "2026-05-26T00:00:00.000Z",
      source: "analytics",
    }],
    score: {
      total: priority === "CRITICAL" ? 90 : 60,
      priority,
      factors: { engagement: 50, reach: 50, consistency: 50, trendMomentum: 50, contentPerformance: 50 },
      weights: { engagement: 0.3, reach: 0.2, consistency: 0.15, trendMomentum: 0.2, contentPerformance: 0.15 },
    },
    explanation: {
      reason: "Reason.",
      confidence,
      supportingMetrics: [{
        metric: signal.metric,
        direction: signal.direction,
        currentValue: 10,
        previousValue: 10,
        changePercent: signal.changePercent,
      }],
      expectedImpact: "+10% performance",
      riskLevel: "MEDIUM",
      explanation: "Explanation.",
    },
  };
}

function sequence(prefix: string) {
  let value = 0;
  return () => `${prefix}-${++value}`;
}
