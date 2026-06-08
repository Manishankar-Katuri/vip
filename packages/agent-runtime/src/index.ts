import { createHash, randomUUID } from "node:crypto";

import type { CausalChain, EntityRef, EvidenceRef, ExplainableRecommendation, IntelligenceSignal, PriorityObject, WorkspaceId } from "@vip/cognitive-core";
import type { DurableEventEnvelope, EventBus, EventSubscriber, OrchestratedEventType } from "@vip/event-orchestrator";
import type { OutcomeRecord, OutcomeStore } from "@vip/outcome-memory";

export type AgentKind = "STRATEGY" | "COMPETITOR" | "REPUTATION" | "CONTENT" | "MARKET" | "DOCTOR_GROWTH" | "EXECUTIVE";
export type AgentCapability = "perception" | "planning" | "execution" | "reflection" | "reporting";
export type AgentLifecycleState = "REGISTERED" | "IDLE" | "RUNNING" | "PAUSED" | "FAILED" | "STOPPED";
export type AgentEventKind = "OBSERVATION" | "PLAN" | "EXECUTION_ACTION" | "REPORT" | "OUTCOME";
export type PlanStatus = "PARTIAL" | "READY" | "RUNNING" | "INTERRUPTED" | "COMPLETED" | "FAILED" | "CANCELLED";
export type PlanStepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED" | "INTERRUPTED";
export type TaskStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "RETRYING" | "ESCALATED" | "CANCELLED";

export const AGENT_EVENT_TYPES = [
  "intelligence.signal.raised",
  "intelligence.priority.created",
  "intelligence.recommendation.reasoned",
  "intelligence.causal_chain.detected",
  "recommendation.created",
  "recommendation.updated",
  "recommendation.approved",
  "recommendation.rejected",
  "recommendation.executed",
  "competitor.signal.detected",
  "competitor.benchmark.updated",
  "review.received",
  "review.sentiment.changed",
  "review.risk.detected",
] as const satisfies readonly OrchestratedEventType[];

export interface AgentSubscription {
  eventTypes: OrchestratedEventType[];
  entityTypes?: EntityRef["type"][];
  minSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  predicate?: (event: RuntimeInputEvent) => boolean;
}

export interface AgentDefinition {
  id: string;
  kind: AgentKind;
  workspaceId?: WorkspaceId;
  description: string;
  subscriptions: AgentSubscription[];
  capabilities: AgentCapability[];
  modules: AgentModules;
  maxConcurrentExecutions?: number;
}

export interface AgentModules {
  perception: PerceptionModule;
  planning: PlanningModule;
  execution: ExecutionModule;
  reflection: ReflectionModule;
  reporting: ReportingModule;
}

export interface RuntimeInputEvent {
  eventId: string;
  eventType: OrchestratedEventType;
  workspaceId: WorkspaceId;
  occurredAt: string;
  traceId: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  envelope?: DurableEventEnvelope;
}

export interface AgentObservation {
  id: string;
  workspaceId: WorkspaceId;
  agentId: string;
  traceId: string;
  sourceEventId: string;
  summary: string;
  entities: EntityRef[];
  signals: IntelligenceSignal[];
  priorities: PriorityObject[];
  recommendations: ExplainableRecommendation[];
  causalFindings: CausalChain[];
  evidence: EvidenceRef[];
  confidence: number;
  observedAt: string;
  metadata: Record<string, unknown>;
}

export interface AgentPlan {
  id: string;
  workspaceId: WorkspaceId;
  agentId: string;
  traceId: string;
  goal: string;
  status: PlanStatus;
  adaptive: boolean;
  interruptionPolicy: "CONTINUE" | "PAUSE_AND_REVISE" | "CANCEL";
  steps: PlanStep[];
  dependencies: Array<{ stepId: string; dependsOnStepId: string }>;
  observations: string[];
  revision: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface PlanStep {
  id: string;
  capability: AgentCapability;
  action: string;
  status: PlanStepStatus;
  idempotencyKey: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  failure?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentExecutionAction {
  id: string;
  workspaceId: WorkspaceId;
  agentId: string;
  planId: string;
  stepId: string;
  traceId: string;
  idempotencyKey: string;
  status: TaskStatus;
  startedAt: string;
  completedAt?: string;
  output: Record<string, unknown>;
  failure?: string;
}

export interface AgentReport {
  id: string;
  workspaceId: WorkspaceId;
  agentId: string;
  planId: string;
  traceId: string;
  summary: string;
  observations: string[];
  actions: string[];
  outcomes: string[];
  confidence: number;
  reasoning: string[];
  generatedAt: string;
}

export interface AgentRuntimeEventPayload {
  kind: AgentEventKind;
  agentId: string;
  traceId: string;
  observation?: AgentObservation;
  plan?: AgentPlan;
  action?: AgentExecutionAction;
  report?: AgentReport;
  outcome?: OutcomeRecord;
}

export interface AgentRuntimeEvent {
  eventId: string;
  eventType: "agent.observation.recorded" | "agent.plan.created" | "agent.action.executed" | "agent.report.generated" | "agent.outcome.recorded";
  eventVersion: 1;
  aggregateType: "AGENT";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: AgentRuntimeEventPayload;
}

export interface PerceptionModule {
  observe(context: AgentContext, event: RuntimeInputEvent): Promise<AgentObservation | null>;
}

export interface PlanningModule {
  generate(context: AgentContext, observation: AgentObservation): Promise<AgentPlan>;
  revise(context: AgentContext, plan: AgentPlan, observation: AgentObservation): Promise<AgentPlan>;
}

export interface ExecutionModule {
  execute(context: AgentContext, step: PlanStep): Promise<Record<string, unknown>>;
}

export interface ReflectionModule {
  reflect(context: AgentContext, plan: AgentPlan, actions: AgentExecutionAction[]): Promise<AgentReflection>;
}

export interface ReportingModule {
  report(context: AgentContext, plan: AgentPlan, reflection: AgentReflection): Promise<AgentReport>;
}

export interface AgentReflection {
  summary: string;
  confidence: number;
  reasoning: string[];
  outcome?: Omit<OutcomeRecord, "id" | "createdAt" | "updatedAt">;
}

export interface AgentState {
  agentId: string;
  workspaceId?: WorkspaceId;
  lifecycle: AgentLifecycleState;
  activePlanIds: string[];
  lastEventId?: string;
  lastTraceId?: string;
  version: number;
  updatedAt: string;
}

export interface AgentExecutionRecord {
  id: string;
  workspaceId: WorkspaceId;
  agentId: string;
  traceId: string;
  sourceEventId: string;
  planId?: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "INTERRUPTED";
  startedAt: string;
  completedAt?: string;
  failure?: string;
}

export interface AgentStateRepository {
  upsertState(state: AgentState): Promise<AgentState>;
  getState(agentId: string): Promise<AgentState | null>;
  upsertPlan(plan: AgentPlan): Promise<AgentPlan>;
  getPlan(workspaceId: WorkspaceId, planId: string): Promise<AgentPlan | null>;
  activePlans(agentId: string, workspaceId: WorkspaceId): Promise<AgentPlan[]>;
  upsertExecution(record: AgentExecutionRecord): Promise<AgentExecutionRecord>;
}

export class InMemoryAgentStateRepository implements AgentStateRepository {
  private readonly states = new Map<string, AgentState>();
  private readonly plans = new Map<string, AgentPlan>();
  private readonly executions = new Map<string, AgentExecutionRecord>();

  async upsertState(state: AgentState) {
    const prior = this.states.get(state.agentId);
    const merged = prior ? { ...prior, ...state, version: prior.version + 1 } : state;
    this.states.set(state.agentId, merged);
    return merged;
  }

  async getState(agentId: string) {
    return this.states.get(agentId) ?? null;
  }

  async upsertPlan(plan: AgentPlan) {
    this.plans.set(key(plan.workspaceId, plan.id), plan);
    return plan;
  }

  async getPlan(workspaceId: WorkspaceId, planId: string) {
    return this.plans.get(key(workspaceId, planId)) ?? null;
  }

  async activePlans(agentId: string, workspaceId: WorkspaceId) {
    return [...this.plans.values()].filter((plan) => plan.agentId === agentId && plan.workspaceId === workspaceId && ["PARTIAL", "READY", "RUNNING", "INTERRUPTED"].includes(plan.status));
  }

  async upsertExecution(record: AgentExecutionRecord) {
    this.executions.set(record.id, record);
    return record;
  }
}

export class AgentStateStore {
  constructor(
    private readonly repository: AgentStateRepository = new InMemoryAgentStateRepository(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async mark(agent: AgentDefinition, lifecycle: AgentLifecycleState, patch: Partial<AgentState> = {}) {
    const prior = await this.repository.getState(agent.id);
    return this.repository.upsertState({
      agentId: agent.id,
      workspaceId: agent.workspaceId,
      lifecycle,
      activePlanIds: prior?.activePlanIds ?? [],
      version: prior?.version ?? 1,
      updatedAt: this.now(),
      ...patch,
    });
  }

  getState(agentId: string) {
    return this.repository.getState(agentId);
  }

  upsertPlan(plan: AgentPlan) {
    return this.repository.upsertPlan(plan);
  }

  activePlans(agentId: string, workspaceId: WorkspaceId) {
    return this.repository.activePlans(agentId, workspaceId);
  }

  upsertExecution(record: AgentExecutionRecord) {
    return this.repository.upsertExecution(record);
  }
}

export interface AgentContext {
  agent: AgentDefinition;
  workspaceId: WorkspaceId;
  traceId: string;
  sourceEvent: RuntimeInputEvent;
  activePlans: AgentPlan[];
  memory: AgentMemorySnapshot;
}

export interface AgentMemorySnapshot {
  outcomes: OutcomeRecord[];
  episodes: Array<{ id: string; title: string; sequenceKey: string }>;
  graphContext: EntityRef[];
  workspaceFacts: Record<string, unknown>;
}

export interface AgentMemoryBridge {
  load(context: { agent: AgentDefinition; event: RuntimeInputEvent; activePlans: AgentPlan[] }): Promise<AgentMemorySnapshot>;
  rememberOutcome?(outcome: OutcomeRecord): Promise<void>;
}

export class NullAgentMemoryBridge implements AgentMemoryBridge {
  async load(): Promise<AgentMemorySnapshot> {
    return { outcomes: [], episodes: [], graphContext: [], workspaceFacts: {} };
  }
}

export class OutcomeAgentMemoryBridge implements AgentMemoryBridge {
  constructor(private readonly outcomeStore: Pick<OutcomeStore, "query" | "record">) {}

  async load(input: { agent: AgentDefinition; event: RuntimeInputEvent }): Promise<AgentMemorySnapshot> {
    const outcomes = await this.outcomeStore.query({ workspaceId: input.event.workspaceId, traceId: input.event.traceId });
    return {
      outcomes,
      episodes: [],
      graphContext: uniqueEntities(outcomes.flatMap((outcome) => [outcome.subject, ...outcome.graphLinks])),
      workspaceFacts: { outcomeCount: outcomes.length },
    };
  }

  async rememberOutcome(outcome: OutcomeRecord) {
    await this.outcomeStore.record(outcome);
  }
}

export class AgentContextManager {
  constructor(private readonly stateStore: AgentStateStore, private readonly memoryBridge: AgentMemoryBridge = new NullAgentMemoryBridge()) {}

  async build(agent: AgentDefinition, event: RuntimeInputEvent): Promise<AgentContext> {
    const activePlans = await this.stateStore.activePlans(agent.id, event.workspaceId);
    const memory = await this.memoryBridge.load({ agent, event, activePlans });
    return { agent, workspaceId: event.workspaceId, traceId: event.traceId, sourceEvent: event, activePlans, memory };
  }
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();

  register(agent: AgentDefinition) {
    if (this.agents.has(agent.id)) throw new Error(`Agent is already registered: ${agent.id}.`);
    for (const capability of ["perception", "planning", "execution", "reflection", "reporting"] as const) {
      if (!agent.capabilities.includes(capability)) throw new Error(`Agent ${agent.id} is missing required capability: ${capability}.`);
    }
    this.agents.set(agent.id, agent);
    return agent;
  }

  list() {
    return [...this.agents.values()];
  }

  match(event: RuntimeInputEvent) {
    return this.list().filter((agent) =>
      (!agent.workspaceId || agent.workspaceId === event.workspaceId) &&
      agent.subscriptions.some((subscription) => matchesSubscription(subscription, event))
    );
  }
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  idempotencyWindowMs?: number;
}

export interface EscalationPolicy {
  afterAttempts: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  target: "EXECUTIVE" | "OPERATOR" | "AUDIT_LOG";
}

export interface AgentTask {
  id: string;
  workspaceId: WorkspaceId;
  agentId: string;
  traceId: string;
  idempotencyKey: string;
  run: () => Promise<void>;
  retryPolicy: RetryPolicy;
  escalationPolicy?: EscalationPolicy;
  attempt: number;
  status: TaskStatus;
  queuedAt: string;
  runAfter?: string;
  lastFailure?: string;
}

export class AgentTaskQueue {
  private readonly tasks = new Map<string, AgentTask>();
  private readonly completedIdempotencyKeys = new Set<string>();

  enqueue(task: Omit<AgentTask, "attempt" | "status" | "queuedAt">, now = new Date().toISOString()) {
    if (this.completedIdempotencyKeys.has(task.idempotencyKey)) return null;
    const existing = [...this.tasks.values()].find((item) => item.idempotencyKey === task.idempotencyKey && !["FAILED", "CANCELLED"].includes(item.status));
    if (existing) return existing;
    const queued: AgentTask = { ...task, attempt: 0, status: "QUEUED", queuedAt: now };
    this.tasks.set(queued.id, queued);
    return queued;
  }

  due(now = new Date().toISOString()) {
    return [...this.tasks.values()].filter((task) => ["QUEUED", "RETRYING"].includes(task.status) && (!task.runAfter || task.runAfter <= now));
  }

  complete(task: AgentTask) {
    task.status = "SUCCEEDED";
    this.completedIdempotencyKeys.add(task.idempotencyKey);
    this.tasks.set(task.id, task);
  }

  fail(task: AgentTask, failure: string, now = new Date().toISOString()) {
    task.lastFailure = failure;
    if (task.attempt >= task.retryPolicy.maxAttempts) task.status = task.escalationPolicy ? "ESCALATED" : "FAILED";
    else {
      task.status = "RETRYING";
      task.runAfter = new Date(new Date(now).getTime() + task.retryPolicy.backoffMs).toISOString();
    }
    this.tasks.set(task.id, task);
  }
}

export class TaskExecutionTracking {
  private readonly statuses = new Map<string, AgentTask>();

  record(task: AgentTask) {
    this.statuses.set(task.id, { ...task });
  }

  get(taskId: string) {
    return this.statuses.get(taskId) ?? null;
  }
}

export class TaskDelegation {
  constructor(private readonly registry: AgentRegistry, private readonly queue: AgentTaskQueue, private readonly id: () => string = () => randomUUID()) {}

  delegate(input: { fromAgentId: string; toKind: AgentKind; workspaceId: WorkspaceId; traceId: string; idempotencyKey: string; run: () => Promise<void>; retryPolicy?: RetryPolicy }) {
    const target = this.registry.list().find((agent) => agent.kind === input.toKind && (!agent.workspaceId || agent.workspaceId === input.workspaceId));
    if (!target) throw new Error(`No agent registered for delegated kind: ${input.toKind}.`);
    return this.queue.enqueue({
      id: this.id(),
      workspaceId: input.workspaceId,
      agentId: target.id,
      traceId: input.traceId,
      idempotencyKey: input.idempotencyKey,
      run: input.run,
      retryPolicy: input.retryPolicy ?? { maxAttempts: 3, backoffMs: 1_000 },
    });
  }
}

export class AgentScheduler {
  constructor(private readonly queue: AgentTaskQueue, private readonly tracking = new TaskExecutionTracking()) {}

  async drain(now = new Date().toISOString()) {
    const due = this.queue.due(now);
    for (const task of due) {
      task.status = "RUNNING";
      task.attempt += 1;
      this.tracking.record(task);
      try {
        await task.run();
        this.queue.complete(task);
      } catch (error) {
        this.queue.fail(task, error instanceof Error ? error.message : String(error), now);
      }
      this.tracking.record(task);
    }
    return { processed: due.length };
  }
}

export class PlanGenerator {
  constructor(private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  generate(context: AgentContext, observation: AgentObservation): AgentPlan {
    const timestamp = this.now();
    const steps = context.agent.capabilities
      .filter((capability) => capability !== "perception")
      .map((capability, index) => ({
        id: this.id(),
        capability,
        action: `${capability}:${observation.id}`,
        status: "PENDING" as const,
        idempotencyKey: stableId(`${context.agent.id}:${observation.id}:${capability}:${index}`),
        input: { observationId: observation.id, traceId: observation.traceId, entities: observation.entities },
      }));
    return {
      id: this.id(),
      workspaceId: context.workspaceId,
      agentId: context.agent.id,
      traceId: context.traceId,
      goal: observation.summary,
      status: steps.length ? "READY" : "PARTIAL",
      adaptive: true,
      interruptionPolicy: "PAUSE_AND_REVISE",
      steps,
      dependencies: steps.slice(1).map((step, index) => ({ stepId: step.id, dependsOnStepId: steps[index].id })),
      observations: [observation.id],
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { generatedBy: "capability-plan-generator" },
    };
  }
}

export class PlanRevisionEngine {
  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  revise(plan: AgentPlan, observation: AgentObservation): AgentPlan {
    const interrupted = plan.status === "RUNNING" || plan.status === "READY";
    const extraStep: PlanStep = {
      id: stableId(`${plan.id}:${observation.id}:revision`),
      capability: "planning",
      action: `revise:${observation.id}`,
      status: "PENDING",
      idempotencyKey: stableId(`${plan.id}:${observation.id}:revision:idempotency`),
      input: { observationId: observation.id, priorRevision: plan.revision },
    };
    return {
      ...plan,
      status: interrupted ? "INTERRUPTED" : plan.status,
      steps: [...plan.steps, extraStep],
      observations: [...new Set([...plan.observations, observation.id])],
      revision: plan.revision + 1,
      updatedAt: this.now(),
      metadata: { ...plan.metadata, revisedBecause: observation.summary },
    };
  }
}

export class PlanExecutor {
  constructor(private readonly now: () => string = () => new Date().toISOString(), private readonly id: () => string = () => randomUUID()) {}

  async execute(context: AgentContext, plan: AgentPlan): Promise<{ plan: AgentPlan; actions: AgentExecutionAction[] }> {
    const actions: AgentExecutionAction[] = [];
    const steps: PlanStep[] = [];
    for (const step of plan.steps) {
      if (step.status !== "PENDING") {
        steps.push(step);
        continue;
      }
      const unmet = plan.dependencies.some((dependency) => dependency.stepId === step.id && !steps.some((prior) => prior.id === dependency.dependsOnStepId && prior.status === "COMPLETED"));
      if (unmet) {
        steps.push(step);
        continue;
      }
      const startedAt = this.now();
      try {
        const output = await context.agent.modules.execution.execute(context, { ...step, status: "RUNNING", startedAt });
        const completedAt = this.now();
        steps.push({ ...step, status: "COMPLETED", startedAt, completedAt, output });
        actions.push({ id: this.id(), workspaceId: context.workspaceId, agentId: context.agent.id, planId: plan.id, stepId: step.id, traceId: context.traceId, idempotencyKey: step.idempotencyKey, status: "SUCCEEDED", startedAt, completedAt, output });
      } catch (error) {
        const failure = error instanceof Error ? error.message : String(error);
        steps.push({ ...step, status: "FAILED", startedAt, completedAt: this.now(), failure });
        actions.push({ id: this.id(), workspaceId: context.workspaceId, agentId: context.agent.id, planId: plan.id, stepId: step.id, traceId: context.traceId, idempotencyKey: step.idempotencyKey, status: "FAILED", startedAt, completedAt: this.now(), output: {}, failure });
        break;
      }
    }
    const status = steps.some((step) => step.status === "FAILED") ? "FAILED" : steps.every((step) => step.status === "COMPLETED" || step.status === "SKIPPED") ? "COMPLETED" : "RUNNING";
    return { plan: { ...plan, steps, status, updatedAt: this.now() }, actions };
  }
}

export class AgentExecutionEngine {
  constructor(
    private readonly contextManager: AgentContextManager,
    private readonly stateStore: AgentStateStore,
    private readonly eventBridge: AgentEventBridge,
    private readonly planRevisionEngine = new PlanRevisionEngine(),
    private readonly planExecutor = new PlanExecutor(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async execute(agent: AgentDefinition, event: RuntimeInputEvent) {
    const executionId = this.id();
    await this.stateStore.mark(agent, "RUNNING", { lastEventId: event.eventId, lastTraceId: event.traceId });
    await this.stateStore.upsertExecution({ id: executionId, workspaceId: event.workspaceId, agentId: agent.id, traceId: event.traceId, sourceEventId: event.eventId, status: "RUNNING", startedAt: this.now() });
    try {
      const context = await this.contextManager.build(agent, event);
      const observation = await agent.modules.perception.observe(context, event);
      if (!observation) {
        await this.stateStore.mark(agent, "IDLE");
        return null;
      }
      await this.eventBridge.emitObservation(observation);
      const active = context.activePlans[0];
      const plan = active ? await agent.modules.planning.revise(context, active, observation) : await agent.modules.planning.generate(context, observation);
      const revised = active ? this.planRevisionEngine.revise(plan, observation) : plan;
      await this.stateStore.upsertPlan(revised);
      await this.eventBridge.emitPlan(revised);
      const execution = await this.planExecutor.execute(context, revised);
      await this.stateStore.upsertPlan(execution.plan);
      for (const action of execution.actions) await this.eventBridge.emitAction(action);
      const reflection = await agent.modules.reflection.reflect(context, execution.plan, execution.actions);
      if (reflection.outcome) await this.eventBridge.emitOutcome(await this.eventBridge.recordOutcome(reflection.outcome));
      const report = await agent.modules.reporting.report(context, execution.plan, reflection);
      await this.eventBridge.emitReport(report);
      await this.stateStore.upsertExecution({ id: executionId, workspaceId: event.workspaceId, agentId: agent.id, traceId: event.traceId, sourceEventId: event.eventId, planId: execution.plan.id, status: execution.plan.status === "COMPLETED" ? "COMPLETED" : "INTERRUPTED", startedAt: this.now(), completedAt: this.now() });
      await this.stateStore.mark(agent, "IDLE");
      return { observation, plan: execution.plan, actions: execution.actions, report };
    } catch (error) {
      await this.stateStore.upsertExecution({ id: executionId, workspaceId: event.workspaceId, agentId: agent.id, traceId: event.traceId, sourceEventId: event.eventId, status: "FAILED", startedAt: this.now(), completedAt: this.now(), failure: error instanceof Error ? error.message : String(error) });
      await this.stateStore.mark(agent, "FAILED");
      throw error;
    }
  }
}

export class AgentEventBridge {
  constructor(
    private readonly bus?: Pick<EventBus, "publish" | "subscribe">,
    private readonly outcomeStore?: Pick<OutcomeStore, "record">,
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  subscribe(subscriber: EventSubscriber) {
    if (!this.bus) return () => false;
    return this.bus.subscribe(subscriber);
  }

  toRuntimeEvent(envelope: DurableEventEnvelope): RuntimeInputEvent {
    const payload = envelope.event.payload as Record<string, unknown>;
    const traceId = typeof payload.traceId === "string" ? payload.traceId : envelope.metadata.correlationId;
    return {
      eventId: envelope.event.eventId,
      eventType: envelope.event.eventType,
      workspaceId: envelope.event.workspaceId,
      occurredAt: envelope.event.occurredAt,
      traceId,
      aggregateId: envelope.event.aggregateId,
      payload,
      envelope,
    };
  }

  async recordOutcome(input: Omit<OutcomeRecord, "id" | "createdAt" | "updatedAt">) {
    if (!this.outcomeStore) return { ...input, id: this.id(), createdAt: this.now(), updatedAt: this.now() };
    return this.outcomeStore.record(input);
  }

  emitObservation(observation: AgentObservation) {
    return this.publish("agent.observation.recorded", observation.workspaceId, observation.agentId, observation.traceId, { kind: "OBSERVATION", agentId: observation.agentId, traceId: observation.traceId, observation }, observation.id);
  }

  emitPlan(plan: AgentPlan) {
    return this.publish("agent.plan.created", plan.workspaceId, plan.agentId, plan.traceId, { kind: "PLAN", agentId: plan.agentId, traceId: plan.traceId, plan }, plan.id);
  }

  emitAction(action: AgentExecutionAction) {
    return this.publish("agent.action.executed", action.workspaceId, action.agentId, action.traceId, { kind: "EXECUTION_ACTION", agentId: action.agentId, traceId: action.traceId, action }, action.id);
  }

  emitReport(report: AgentReport) {
    return this.publish("agent.report.generated", report.workspaceId, report.agentId, report.traceId, { kind: "REPORT", agentId: report.agentId, traceId: report.traceId, report }, report.id);
  }

  emitOutcome(outcome: OutcomeRecord) {
    return this.publish("agent.outcome.recorded", outcome.workspaceId, outcome.subject.id, outcome.lineage.traceId, { kind: "OUTCOME", agentId: String(outcome.metadata.agentId ?? "agent"), traceId: outcome.lineage.traceId, outcome }, outcome.id);
  }

  private async publish(eventType: AgentRuntimeEvent["eventType"], workspaceId: WorkspaceId, aggregateId: string, traceId: string, payload: AgentRuntimeEventPayload, sourceId: string) {
    if (!this.bus) return null;
    const event: AgentRuntimeEvent = {
      eventId: this.id(),
      eventType,
      eventVersion: 1,
      aggregateType: "AGENT",
      aggregateId,
      workspaceId,
      idempotencyKey: stableId(`${eventType}:${workspaceId}:${sourceId}`),
      occurredAt: this.now(),
      payload,
    };
    return this.bus.publish(event as never, {
      correlationId: traceId,
      producer: "agent-runtime",
      actor: { type: "AGENT", id: payload.agentId },
      source: { module: "intelligence", component: "agent-runtime" },
      tags: ["agent", payload.kind.toLowerCase()],
    });
  }
}

export class AgentRuntime {
  private unsubscribe?: () => boolean;

  constructor(
    private readonly registry: AgentRegistry,
    private readonly scheduler: AgentScheduler,
    private readonly queue: AgentTaskQueue,
    private readonly executionEngine: AgentExecutionEngine,
    private readonly eventBridge: AgentEventBridge,
    private readonly id: () => string = () => randomUUID()
  ) {}

  start() {
    this.unsubscribe = this.eventBridge.subscribe({
      id: "agent-runtime-dispatcher",
      topics: ["intelligence", "recommendations", "competitors", "reviews"],
      eventTypes: [...AGENT_EVENT_TYPES],
      maxAttempts: 3,
      handle: async (envelope) => {
        const event = this.eventBridge.toRuntimeEvent(envelope);
        for (const agent of this.registry.match(event)) {
          this.queue.enqueue({
            id: this.id(),
            workspaceId: event.workspaceId,
            agentId: agent.id,
            traceId: event.traceId,
            idempotencyKey: stableId(`${agent.id}:${event.eventId}:${event.traceId}`),
            retryPolicy: { maxAttempts: 3, backoffMs: 1_000 },
            escalationPolicy: { afterAttempts: 3, severity: "HIGH", target: "AUDIT_LOG" },
            run: async () => { await this.executionEngine.execute(agent, event); },
          });
        }
        await this.scheduler.drain();
      },
    });
    return this.unsubscribe;
  }

  stop() {
    return this.unsubscribe ? this.unsubscribe() : false;
  }

  async dispatch(event: RuntimeInputEvent) {
    for (const agent of this.registry.match(event)) {
      this.queue.enqueue({
        id: this.id(),
        workspaceId: event.workspaceId,
        agentId: agent.id,
        traceId: event.traceId,
        idempotencyKey: stableId(`${agent.id}:${event.eventId}:${event.traceId}`),
        retryPolicy: { maxAttempts: 3, backoffMs: 1_000 },
        escalationPolicy: { afterAttempts: 3, severity: "HIGH", target: "AUDIT_LOG" },
        run: async () => { await this.executionEngine.execute(agent, event); },
      });
    }
    return this.scheduler.drain();
  }
}

export function createCapabilityAgent(input: Omit<AgentDefinition, "capabilities"> & { capabilities?: AgentCapability[] }): AgentDefinition {
  return { ...input, capabilities: input.capabilities ?? ["perception", "planning", "execution", "reflection", "reporting"] };
}

export function createStrategyAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("strategy", workspaceId), kind: "STRATEGY", workspaceId, description: "Strategy intelligence worker.", subscriptions: [{ eventTypes: [...AGENT_EVENT_TYPES] }], modules });
}

export function createCompetitorAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("competitor", workspaceId), kind: "COMPETITOR", workspaceId, description: "Competitor intelligence worker.", subscriptions: [{ eventTypes: ["competitor.signal.detected", "competitor.benchmark.updated", "intelligence.signal.raised"], entityTypes: ["COMPETITOR"] }], modules });
}

export function createReputationAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("reputation", workspaceId), kind: "REPUTATION", workspaceId, description: "Reputation intelligence worker.", subscriptions: [{ eventTypes: ["review.received", "review.sentiment.changed", "review.risk.detected", "intelligence.signal.raised"], entityTypes: ["REVIEW", "DOCTOR"] }], modules });
}

export function createContentAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("content", workspaceId), kind: "CONTENT", workspaceId, description: "Content intelligence worker.", subscriptions: [{ eventTypes: ["intelligence.signal.raised", "intelligence.priority.created", "intelligence.recommendation.reasoned"], entityTypes: ["CONTENT", "CAMPAIGN"] }], modules });
}

export function createMarketAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("market", workspaceId), kind: "MARKET", workspaceId, description: "Market intelligence worker.", subscriptions: [{ eventTypes: ["intelligence.signal.raised", "intelligence.causal_chain.detected", "competitor.benchmark.updated"], entityTypes: ["LOCATION", "SPECIALTY", "COMPETITOR"] }], modules });
}

export function createDoctorGrowthAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("doctor-growth", workspaceId), kind: "DOCTOR_GROWTH", workspaceId, description: "Doctor growth intelligence worker.", subscriptions: [{ eventTypes: ["intelligence.signal.raised", "intelligence.priority.created", "intelligence.recommendation.reasoned"], entityTypes: ["DOCTOR", "SPECIALTY"] }], modules });
}

export function createExecutiveAgent(modules: AgentModules, workspaceId?: WorkspaceId) {
  return createCapabilityAgent({ id: scopedId("executive", workspaceId), kind: "EXECUTIVE", workspaceId, description: "Executive intelligence worker.", subscriptions: [{ eventTypes: ["intelligence.priority.created", "intelligence.recommendation.reasoned", "intelligence.causal_chain.detected"], minSeverity: "HIGH" }], modules });
}

export function createDefaultAgentModules(generator = new PlanGenerator()): AgentModules {
  return {
    perception: {
      async observe(context, event) {
        const extracted = extractIntelligencePayload(event.payload);
        return {
          id: randomUUID(),
          workspaceId: event.workspaceId,
          agentId: context.agent.id,
          traceId: event.traceId,
          sourceEventId: event.eventId,
          summary: extracted.summary ?? `${event.eventType} observed`,
          entities: extracted.entities,
          signals: extracted.signals,
          priorities: extracted.priorities,
          recommendations: extracted.recommendations,
          causalFindings: extracted.causalFindings,
          evidence: extracted.evidence,
          confidence: extracted.confidence,
          observedAt: new Date().toISOString(),
          metadata: { eventType: event.eventType },
        };
      },
    },
    planning: {
      async generate(context, observation) {
        return generator.generate(context, observation);
      },
      async revise(context, plan, observation) {
        return new PlanRevisionEngine().revise(plan, observation);
      },
    },
    execution: {
      async execute(_context, step) {
        return { accepted: true, action: step.action, input: step.input };
      },
    },
    reflection: {
      async reflect(context, plan, actions) {
        return {
          summary: `${plan.status.toLowerCase()} plan ${plan.id}`,
          confidence: actions.some((action) => action.status === "FAILED") ? 0.35 : 0.8,
          reasoning: actions.map((action) => `${action.stepId}:${action.status}`),
          outcome: {
            workspaceId: context.workspaceId,
            kind: "ACTION",
            status: actions.some((action) => action.status === "FAILED") ? "FAILED" : "EXECUTED",
            subject: { id: plan.id, type: "WORKFLOW" },
            summary: `Agent ${context.agent.id} executed ${actions.length} actions.`,
            occurredAt: new Date().toISOString(),
            graphLinks: context.memory.graphContext,
            kpiDeltas: [],
            evidence: [],
            lineage: { traceId: context.traceId, sourceEventIds: [context.sourceEvent.eventId], signalIds: [], priorityIds: [], recommendationIds: [], causalChainIds: [], parentOutcomeIds: [] },
            metadata: { agentId: context.agent.id, planId: plan.id },
          },
        };
      },
    },
    reporting: {
      async report(context, plan, reflection) {
        return {
          id: randomUUID(),
          workspaceId: context.workspaceId,
          agentId: context.agent.id,
          planId: plan.id,
          traceId: context.traceId,
          summary: reflection.summary,
          observations: plan.observations,
          actions: plan.steps.map((step) => step.id),
          outcomes: reflection.outcome ? [reflection.outcome.summary] : [],
          confidence: reflection.confidence,
          reasoning: reflection.reasoning,
          generatedAt: new Date().toISOString(),
        };
      },
    },
  };
}

function matchesSubscription(subscription: AgentSubscription, event: RuntimeInputEvent) {
  if (!subscription.eventTypes.includes(event.eventType)) return false;
  if (subscription.predicate && !subscription.predicate(event)) return false;
  if (subscription.entityTypes?.length) {
    const entities = extractIntelligencePayload(event.payload).entities;
    if (!entities.some((entity) => subscription.entityTypes!.includes(entity.type))) return false;
  }
  if (subscription.minSeverity) {
    const severity = severityRank(extractSeverity(event.payload));
    if (severity < severityRank(subscription.minSeverity)) return false;
  }
  return true;
}

function extractIntelligencePayload(payload: Record<string, unknown>) {
  const signal = payload.signal as IntelligenceSignal | undefined;
  const priority = payload.priority as PriorityObject | undefined;
  const recommendation = payload.recommendation as ExplainableRecommendation | undefined;
  const causalChain = payload.causalChain as CausalChain | undefined;
  const entities = uniqueEntities([
    ...(signal?.relatedEntities ?? []),
    ...(priority?.relatedEntities ?? []),
    ...(recommendation?.evidence?.supportingSignals?.flatMap((item) => item.relatedEntities) ?? []),
    ...(causalChain ? [causalChain.rootCause, causalChain.outcome] : []),
  ]);
  return {
    summary: signal?.summary ?? priority?.title ?? recommendation?.title ?? causalChain?.summary,
    entities,
    signals: signal ? [signal] : priority?.supportingSignals ?? [],
    priorities: priority ? [priority] : [],
    recommendations: recommendation ? [recommendation] : [],
    causalFindings: causalChain ? [causalChain] : priority?.causalFindings ?? [],
    evidence: [...(signal?.evidence ?? []), ...(priority?.evidence ?? []), ...(causalChain?.links.flatMap((link) => link.evidence) ?? [])],
    confidence: signal?.scores.confidence ?? priority?.confidence ?? recommendation?.evidence.confidence ?? causalChain?.confidence ?? 0.65,
  };
}

function extractSeverity(payload: Record<string, unknown>) {
  const signal = payload.signal as IntelligenceSignal | undefined;
  const priority = payload.priority as PriorityObject | undefined;
  return signal?.severity ?? (priority && priority.urgency >= 85 ? "CRITICAL" : priority && priority.urgency >= 70 ? "HIGH" : priority && priority.urgency >= 40 ? "MEDIUM" : "LOW");
}

function severityRank(severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") {
  return ({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const)[severity];
}

function uniqueEntities<T extends EntityRef>(entities: T[]) {
  return [...new Map(entities.map((entity) => [`${entity.type}:${entity.id}`, entity])).values()];
}

function key(workspaceId: WorkspaceId, id: string) {
  return `${workspaceId}:${id}`;
}

function stableId(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function scopedId(kind: string, workspaceId?: WorkspaceId) {
  return workspaceId ? `${kind}-agent:${workspaceId}` : `${kind}-agent`;
}
