import { createHash, randomUUID } from "node:crypto";

import type { ActionPlan, ActionPlanInput, ActionPlanType, ExecutionStepInput } from "@vip/action-engine";
import type { AgentDefinition, AgentKind, AgentPlan, AgentTaskQueue, RuntimeInputEvent } from "@vip/agent-runtime";
import type { CausalChain, EntityRef, EvidenceRef, ExplainableRecommendation, IntelligenceSignal, PriorityObject, TemporalWindow, WorkspaceId } from "@vip/cognitive-core";
import type { EventBus, OrchestratedEventType } from "@vip/event-orchestrator";
import type { DiscoveredPattern, ExecutiveBriefing, ExecutiveBriefingGenerator, LearningMemory } from "@vip/learning-engine";
import type { OutcomeRecord, OutcomeRepository, OutcomeStore } from "@vip/outcome-memory";

export type MissionStatus = "DRAFT" | "ACTIVE" | "BLOCKED" | "ESCALATED" | "COMPLETED" | "CANCELLED";
export type MissionHorizon = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type CollaborationStatus = "OPEN" | "CONSENSUS_REACHED" | "ESCALATED" | "CLOSED";
export type ForecastKind = "KPI" | "REPUTATION" | "MARKET" | "STRATEGY";
export type OperationsEventType =
  | "operations.mission.created"
  | "operations.mission.progressed"
  | "operations.agent.message.sent"
  | "operations.consensus.reached"
  | "operations.workflow.synthesized"
  | "operations.forecast.generated"
  | "operations.benchmark.generated"
  | "operations.control_plane.snapshot";

export interface OperationsEvent {
  eventId: string;
  eventType: OperationsEventType;
  eventVersion: 1;
  aggregateType: "OPERATIONS";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: {
    traceId: string;
    kind: string;
    data: Record<string, unknown>;
  };
}

export interface MissionContext {
  missionId: string;
  workspaceId: WorkspaceId;
  traceId: string;
  objective: string;
  horizon: MissionHorizon;
  entities: EntityRef[];
  priorities: PriorityObject[];
  recommendations: ExplainableRecommendation[];
  signals: IntelligenceSignal[];
  causalFindings: CausalChain[];
  outcomes: OutcomeRecord[];
  evidence: EvidenceRef[];
  constraints: Record<string, unknown>;
}

export interface MissionGoal {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  objective: string;
  horizon: MissionHorizon;
  status: MissionStatus;
  targetEntities: EntityRef[];
  successMetrics: Array<{ kpi: EntityRef; targetValue: number; currentValue?: number; unit?: string }>;
  decomposition: MissionTask[];
  assignedAgents: Array<{ agentId: string; kind: AgentKind; taskIds: string[] }>;
  progress: number;
  traceId: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface MissionTask {
  id: string;
  title: string;
  ownerAgentKind: AgentKind;
  status: "PENDING" | "ASSIGNED" | "RUNNING" | "DONE" | "BLOCKED";
  dependsOn: string[];
  evidence: EvidenceRef[];
  outputRefs: string[];
}

export interface CreateMissionInput {
  workspaceId: WorkspaceId;
  title: string;
  objective: string;
  horizon: MissionHorizon;
  targetEntities: EntityRef[];
  successMetrics: MissionGoal["successMetrics"];
  traceId: string;
  metadata: Record<string, unknown>;
  agents: AgentDefinition[];
  priorities?: PriorityObject[];
}

export interface AgentMessage {
  id: string;
  workspaceId: WorkspaceId;
  traceId: string;
  fromAgentId: string;
  toAgentId?: string;
  collaborationId?: string;
  missionId?: string;
  type: "REQUEST" | "PROPOSAL" | "VOTE" | "STATUS" | "ESCALATION";
  content: string;
  payload: Record<string, unknown>;
  sentAt: string;
}

export interface AgentCollaboration {
  id: string;
  workspaceId: WorkspaceId;
  traceId: string;
  missionId?: string;
  participants: string[];
  topic: string;
  status: CollaborationStatus;
  messages: AgentMessage[];
  consensus?: ConsensusDecision;
  escalation?: EscalationRecord;
  createdAt: string;
  updatedAt: string;
}

export interface ConsensusDecision {
  decision: string;
  confidence: number;
  votes: Array<{ agentId: string; position: "SUPPORT" | "OPPOSE" | "ABSTAIN"; confidence: number; rationale: string }>;
  decidedAt: string;
}

export interface EscalationRecord {
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  target: "EXECUTIVE_AGENT" | "HUMAN_OPERATOR" | "CONTROL_PLANE";
  escalatedAt: string;
}

export interface DynamicPlaybook {
  id: string;
  workspaceId: WorkspaceId;
  traceId: string;
  name: string;
  approvalRequired: boolean;
  planInput: ActionPlanInput;
  adaptivePlan: AgentPlan;
  sourceRecommendationIds: string[];
  graphLinks: EntityRef[];
  confidence: number;
  createdAt: string;
}

export interface TenantPatternContribution {
  tenantHash: string;
  specialty?: string;
  strategy?: string;
  pattern: DiscoveredPattern;
  sampleSize: number;
}

export interface CrossWorkspaceBenchmark {
  id: string;
  cohortKey: string;
  generatedAt: string;
  workspaceCount: number;
  specialty?: string;
  strategy?: string;
  anonymizedPatterns: Array<{ signature: string; kind: string; support: number; confidence: number }>;
  effectiveness: { median: number; p75: number; p90: number };
}

export interface ForecastInput {
  workspaceId: WorkspaceId;
  kind: ForecastKind;
  target: EntityRef;
  horizonDays: number;
  observations: Array<{ at: string; value: number; confidence?: number }>;
  outcomes?: OutcomeRecord[];
  signals?: IntelligenceSignal[];
  causalFindings?: CausalChain[];
  strategy?: ExplainableRecommendation;
}

export interface ForecastResult {
  id: string;
  workspaceId: WorkspaceId;
  kind: ForecastKind;
  target: EntityRef;
  horizonDays: number;
  baseline: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  bands: { low: number; expected: number; high: number };
  assumptions: string[];
  generatedAt: string;
}

export interface StrategySimulation {
  id: string;
  workspaceId: WorkspaceId;
  strategyId: string;
  target: EntityRef;
  scenarios: Array<{ name: string; forecast: ForecastResult; expectedOutcomes: string[]; riskScore: number }>;
  recommendation: "PROCEED" | "REVISE" | "ESCALATE";
  confidence: number;
  generatedAt: string;
}

export interface ControlPlaneSnapshot {
  id: string;
  workspaceId: WorkspaceId;
  generatedAt: string;
  agents: Array<{ id: string; kind: AgentKind; workspaceId?: string; state: string }>;
  missions: MissionGoal[];
  workflows: DynamicPlaybook[];
  forecasts: ForecastResult[];
  learning: { patterns: DiscoveredPattern[]; benchmarks: CrossWorkspaceBenchmark[] };
  replay: Array<{ traceId: string; eventType: string; aggregateId: string; occurredAt: string }>;
  health: { activeMissions: number; escalations: number; blockedTasks: number; forecastConfidence: number };
}

export class OperationsEventBridge {
  constructor(private readonly bus?: Pick<EventBus, "publish">, private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  async emit(eventType: OperationsEventType, workspaceId: WorkspaceId, aggregateId: string, traceId: string, kind: string, data: Record<string, unknown>) {
    if (!this.bus) return null;
    const event: OperationsEvent = {
      eventId: this.id(),
      eventType,
      eventVersion: 1,
      aggregateType: "OPERATIONS",
      aggregateId,
      workspaceId,
      idempotencyKey: stableId(`${eventType}:${workspaceId}:${aggregateId}:${traceId}`),
      occurredAt: this.now(),
      payload: { traceId, kind, data },
    };
    return this.bus.publish(event as never, {
      correlationId: traceId,
      producer: "autonomous-operations",
      actor: { type: "AGENT", id: "operations-control-plane" },
      source: { module: "intelligence", component: "autonomous-operations" },
      tags: ["operations", kind],
    });
  }
}

export class MultiAgentCoordinator {
  private readonly collaborations = new Map<string, AgentCollaboration>();

  constructor(private readonly eventBridge = new OperationsEventBridge(), private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  open(input: { workspaceId: WorkspaceId; traceId: string; missionId?: string; participants: string[]; topic: string }) {
    const timestamp = this.now();
    const collaboration: AgentCollaboration = {
      id: this.id(),
      workspaceId: input.workspaceId,
      traceId: input.traceId,
      missionId: input.missionId,
      participants: [...new Set(input.participants)],
      topic: input.topic,
      status: "OPEN",
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.collaborations.set(collaboration.id, collaboration);
    return collaboration;
  }

  async send(input: Omit<AgentMessage, "id" | "sentAt">) {
    const message = { ...input, id: this.id(), sentAt: this.now() };
    if (message.collaborationId) {
      const collaboration = this.required(message.collaborationId);
      collaboration.messages.push(message);
      collaboration.updatedAt = message.sentAt;
      this.collaborations.set(collaboration.id, collaboration);
    }
    await this.eventBridge.emit("operations.agent.message.sent", message.workspaceId, message.collaborationId ?? message.id, message.traceId, "agent-message", message as unknown as Record<string, unknown>);
    return message;
  }

  async consensus(collaborationId: string, decision: string, votes: ConsensusDecision["votes"]) {
    const collaboration = this.required(collaborationId);
    const support = votes.filter((vote) => vote.position === "SUPPORT");
    const oppose = votes.filter((vote) => vote.position === "OPPOSE");
    const confidence = weightedAverage(support.map((vote) => vote.confidence), oppose.map((vote) => -vote.confidence));
    const consensus = { decision, confidence: clamp((confidence + 1) / 2, 0, 1), votes, decidedAt: this.now() };
    collaboration.consensus = consensus;
    collaboration.status = consensus.confidence >= 0.62 && support.length >= oppose.length ? "CONSENSUS_REACHED" : "ESCALATED";
    collaboration.updatedAt = consensus.decidedAt;
    if (collaboration.status === "ESCALATED") collaboration.escalation = { reason: "Consensus confidence below operating threshold.", severity: "HIGH", target: "EXECUTIVE_AGENT", escalatedAt: this.now() };
    this.collaborations.set(collaboration.id, collaboration);
    await this.eventBridge.emit("operations.consensus.reached", collaboration.workspaceId, collaboration.id, collaboration.traceId, collaboration.status === "ESCALATED" ? "consensus-escalated" : "consensus", collaboration as unknown as Record<string, unknown>);
    return collaboration;
  }

  delegate(queue: Pick<AgentTaskQueue, "enqueue">, input: { workspaceId: WorkspaceId; traceId: string; agent: AgentDefinition; missionId: string; run: () => Promise<void> }) {
    return queue.enqueue({
      id: this.id(),
      workspaceId: input.workspaceId,
      agentId: input.agent.id,
      traceId: input.traceId,
      idempotencyKey: stableId(`${input.agent.id}:${input.missionId}:${input.traceId}`),
      retryPolicy: { maxAttempts: 3, backoffMs: 1_000 },
      escalationPolicy: { afterAttempts: 3, severity: "HIGH", target: "AUDIT_LOG" },
      run: input.run,
    });
  }

  list(workspaceId: WorkspaceId) {
    return [...this.collaborations.values()].filter((item) => item.workspaceId === workspaceId);
  }

  private required(id: string) {
    const collaboration = this.collaborations.get(id);
    if (!collaboration) throw new Error(`Unknown agent collaboration: ${id}.`);
    return collaboration;
  }
}

export class MissionGoalSystem {
  private readonly missions = new Map<string, MissionGoal>();

  constructor(private readonly eventBridge = new OperationsEventBridge(), private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  async create(input: CreateMissionInput) {
    const missionId = this.id();
    const decomposition = this.decompose(input.objective, input.priorities, input.agents);
    const mission: MissionGoal = {
      id: missionId,
      workspaceId: input.workspaceId,
      title: input.title,
      objective: input.objective,
      horizon: input.horizon,
      status: "ACTIVE",
      targetEntities: input.targetEntities,
      successMetrics: input.successMetrics,
      decomposition,
      assignedAgents: input.agents.map((agent) => ({ agentId: agent.id, kind: agent.kind, taskIds: decomposition.filter((task) => task.ownerAgentKind === agent.kind).map((task) => task.id) })),
      progress: 0,
      traceId: input.traceId,
      createdAt: this.now(),
      updatedAt: this.now(),
      metadata: input.metadata,
    };
    this.missions.set(mission.id, mission);
    await this.eventBridge.emit("operations.mission.created", mission.workspaceId, mission.id, mission.traceId, "mission", mission as unknown as Record<string, unknown>);
    return mission;
  }

  async progress(workspaceId: WorkspaceId, missionId: string, taskId: string, status: MissionTask["status"], outputRef?: string) {
    const mission = this.required(workspaceId, missionId);
    const decomposition = mission.decomposition.map((task) => task.id === taskId ? { ...task, status, outputRefs: outputRef ? [...task.outputRefs, outputRef] : task.outputRefs } : task);
    const blocked = decomposition.filter((task) => task.status === "BLOCKED").length;
    const done = decomposition.filter((task) => task.status === "DONE").length;
    const progress = Math.round((done / Math.max(1, decomposition.length)) * 100);
    const updated: MissionGoal = { ...mission, decomposition, progress, status: blocked ? "BLOCKED" : progress >= 100 ? "COMPLETED" : "ACTIVE", updatedAt: this.now() };
    this.missions.set(mission.id, updated);
    await this.eventBridge.emit("operations.mission.progressed", workspaceId, missionId, updated.traceId, "mission-progress", updated as unknown as Record<string, unknown>);
    return updated;
  }

  list(workspaceId: WorkspaceId) {
    return [...this.missions.values()].filter((mission) => mission.workspaceId === workspaceId);
  }

  private decompose(objective: string, priorities: PriorityObject[] | undefined, agents: AgentDefinition[]) {
    const kinds = agents.map((agent) => agent.kind);
    const focusKinds: AgentKind[] = kinds.length ? kinds : ["STRATEGY", "EXECUTIVE"];
    const baseTasks = (priorities?.length ? priorities.slice(0, 5) : [{ title: objective, evidence: [] as EvidenceRef[] }]).map((priority, index) => ({
      id: this.id(),
      title: "title" in priority ? priority.title : objective,
      ownerAgentKind: focusKinds[index % focusKinds.length],
      status: "PENDING" as const,
      dependsOn: index === 0 ? [] : [],
      evidence: "evidence" in priority ? priority.evidence : [],
      outputRefs: [],
    }));
    return baseTasks.length ? baseTasks : [{ id: this.id(), title: objective, ownerAgentKind: "EXECUTIVE" as const, status: "PENDING" as const, dependsOn: [], evidence: [], outputRefs: [] }];
  }

  private required(workspaceId: WorkspaceId, missionId: string) {
    const mission = this.missions.get(missionId);
    if (!mission || mission.workspaceId !== workspaceId) throw new Error(`Unknown mission: ${missionId}.`);
    return mission;
  }
}

export class AutonomousWorkflowGenerator {
  constructor(private readonly eventBridge = new OperationsEventBridge(), private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  async synthesize(input: { context: MissionContext; recommendation?: ExplainableRecommendation; approvalThreshold?: number; adaptivePlan: AgentPlan }) {
    const recommendation = input.recommendation ?? input.context.recommendations[0];
    const priorityConfidence = average(input.context.priorities.map((priority) => priority.confidence));
    const confidence = recommendation?.evidence.confidence ?? (priorityConfidence || 0.65);
    const approvalRequired = confidence < (input.approvalThreshold ?? 0.75) || input.context.priorities.some((priority) => priority.urgency >= 85);
    const steps = this.stepsFor(input.context, recommendation);
    const planInput: ActionPlanInput = {
      workspaceId: input.context.workspaceId,
      recommendationId: recommendation?.id,
      name: `Autonomous ${input.context.objective}`,
      type: this.planType(input.context, recommendation),
      input: { missionId: input.context.missionId, traceId: input.context.traceId, graphLinks: input.context.entities },
      idempotencyKey: stableId(`${input.context.workspaceId}:${input.context.missionId}:${recommendation?.id ?? input.context.objective}`),
      requiresApproval: approvalRequired,
      maxAttempts: 3,
      steps,
      actor: { type: "AGENT", id: "autonomous-operations", metadata: { missionId: input.context.missionId } },
    };
    const playbook: DynamicPlaybook = {
      id: this.id(),
      workspaceId: input.context.workspaceId,
      traceId: input.context.traceId,
      name: planInput.name,
      approvalRequired,
      planInput,
      adaptivePlan: input.adaptivePlan,
      sourceRecommendationIds: recommendation ? [recommendation.id] : [],
      graphLinks: input.context.entities,
      confidence,
      createdAt: this.now(),
    };
    await this.eventBridge.emit("operations.workflow.synthesized", playbook.workspaceId, playbook.id, playbook.traceId, "workflow", playbook as unknown as Record<string, unknown>);
    return playbook;
  }

  private stepsFor(context: MissionContext, recommendation?: ExplainableRecommendation): ExecutionStepInput[] {
    const recommendationSteps = recommendation?.executionSteps.map((step) => ({ name: step.action, processor: "vip.workflow.execution", requiresApproval: false, input: { order: step.order, owner: step.owner, missionId: context.missionId } })) ?? [];
    if (recommendationSteps.length) return recommendationSteps;
    return context.priorities.flatMap((priority, index) => priority.recommendedActions.map((action) => ({ name: action, processor: "vip.priority.action", requiresApproval: priority.urgency >= 85, input: { priorityId: priority.id, order: index + 1 } }))).slice(0, 8);
  }

  private planType(context: MissionContext, recommendation?: ExplainableRecommendation): ActionPlanType {
    if (context.entities.some((entity) => entity.type === "CAMPAIGN") || recommendation?.title.toLowerCase().includes("campaign")) return "CAMPAIGN_EXECUTION";
    if (context.entities.some((entity) => entity.type === "CONTENT")) return "SOCIAL_PUBLISHING";
    if (context.priorities.some((priority) => priority.kind === "RISK")) return "ALERT_PIPELINE";
    return "MARKETING_PLAYBOOK";
  }
}

export class ExecutiveIntelligenceEngine {
  constructor(private readonly briefingGenerator: Pick<ExecutiveBriefingGenerator, "generate">) {}

  daily(input: { workspaceId: WorkspaceId; priorities: PriorityObject[]; outcomes: OutcomeRecord[]; recommendations?: ExplainableRecommendation[]; patterns?: DiscoveredPattern[] }) {
    return this.briefingGenerator.generate(input);
  }

  async weeklyStrategic(input: { workspaceId: WorkspaceId; priorities: PriorityObject[]; outcomes: OutcomeRecord[]; recommendations?: ExplainableRecommendation[]; patterns?: DiscoveredPattern[]; forecasts?: ForecastResult[] }) {
    const briefing = await this.briefingGenerator.generate(input);
    return {
      ...briefing,
      opportunitySummaries: briefing.topOpportunities,
      threatSummaries: briefing.topRisks,
      growthForecasts: input.forecasts?.filter((forecast) => forecast.changePercent > 0) ?? [],
      recommendedFocusAreas: briefing.priorityFocusAreas,
    };
  }
}

export class CrossWorkspaceLearningLayer {
  private readonly contributions: TenantPatternContribution[] = [];
  private readonly benchmarks = new Map<string, CrossWorkspaceBenchmark>();

  constructor(private readonly memory?: LearningMemory, private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  ingest(input: { workspaceId: WorkspaceId; specialty?: string; strategy?: string; patterns: DiscoveredPattern[]; outcomeCount: number }) {
    const tenantHash = stableId(input.workspaceId);
    for (const pattern of input.patterns) this.contributions.push({ tenantHash, specialty: input.specialty, strategy: input.strategy, pattern: sanitizePattern(pattern), sampleSize: input.outcomeCount });
    return this.contributions.filter((contribution) => contribution.tenantHash === tenantHash).length;
  }

  generateBenchmark(input: { specialty?: string; strategy?: string; minTenants?: number }) {
    const cohort = this.contributions.filter((item) => (!input.specialty || item.specialty === input.specialty) && (!input.strategy || item.strategy === input.strategy));
    const tenants = [...new Set(cohort.map((item) => item.tenantHash))];
    if (tenants.length < (input.minTenants ?? 2)) throw new Error("Insufficient tenant diversity for safe benchmark generation.");
    const grouped = new Map<string, TenantPatternContribution[]>();
    for (const item of cohort) grouped.set(item.pattern.signature, [...(grouped.get(item.pattern.signature) ?? []), item]);
    const supports = cohort.map((item) => item.pattern.support * item.pattern.confidence).sort((left, right) => left - right);
    const benchmark: CrossWorkspaceBenchmark = {
      id: this.id(),
      cohortKey: stableId(`${input.specialty ?? "all"}:${input.strategy ?? "all"}`),
      generatedAt: this.now(),
      workspaceCount: tenants.length,
      specialty: input.specialty,
      strategy: input.strategy,
      anonymizedPatterns: [...grouped.entries()].map(([signature, items]) => ({ signature, kind: items[0].pattern.kind, support: items.reduce((sum, item) => sum + item.pattern.support, 0), confidence: average(items.map((item) => item.pattern.confidence)) })),
      effectiveness: { median: percentile(supports, 0.5), p75: percentile(supports, 0.75), p90: percentile(supports, 0.9) },
    };
    this.benchmarks.set(benchmark.id, benchmark);
    return benchmark;
  }

  listBenchmarks() {
    return [...this.benchmarks.values()];
  }
}

export class ForecastingSimulationEngine {
  constructor(private readonly eventBridge = new OperationsEventBridge(), private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  async forecast(input: ForecastInput) {
    const sorted = [...input.observations].sort((left, right) => left.at.localeCompare(right.at));
    const baseline = sorted.at(-1)?.value ?? 0;
    const slope = sorted.length > 1 ? (sorted.at(-1)!.value - sorted[0].value) / Math.max(1, daysBetween(sorted[0].at, sorted.at(-1)!.at)) : 0;
    const signalPressure = average((input.signals ?? []).map((signal) => (signal.scores.impact * signal.scores.confidence) / 100));
    const outcomePressure = outcomeEffect(input.outcomes ?? []);
    const causalConfidence = average((input.causalFindings ?? []).map((chain) => chain.confidence));
    const predictedValue = Math.max(0, baseline + slope * input.horizonDays + baseline * (signalPressure - 0.5) * 0.08 + baseline * (outcomePressure - 0.5) * 0.12);
    const confidence = clamp(average([average(sorted.map((item) => item.confidence ?? 0.65)), causalConfidence || 0.6, 1 - Math.min(0.4, Math.abs(slope) / Math.max(1, baseline))]), 0, 1);
    const forecast: ForecastResult = {
      id: this.id(),
      workspaceId: input.workspaceId,
      kind: input.kind,
      target: input.target,
      horizonDays: input.horizonDays,
      baseline,
      predictedValue,
      changePercent: baseline === 0 ? 0 : ((predictedValue - baseline) / Math.abs(baseline)) * 100,
      confidence,
      bands: { low: predictedValue * (1 - (1 - confidence) * 0.5), expected: predictedValue, high: predictedValue * (1 + (1 - confidence) * 0.5) },
      assumptions: [`${sorted.length} observations`, `${input.outcomes?.length ?? 0} outcomes`, `${input.signals?.length ?? 0} signals`, `${input.causalFindings?.length ?? 0} causal findings`],
      generatedAt: this.now(),
    };
    await this.eventBridge.emit("operations.forecast.generated", forecast.workspaceId, forecast.id, stableId(`${forecast.workspaceId}:${forecast.id}`), "forecast", forecast as unknown as Record<string, unknown>);
    return forecast;
  }

  async simulateStrategy(input: { workspaceId: WorkspaceId; strategy: ExplainableRecommendation; target: EntityRef; baseObservations: ForecastInput["observations"]; outcomes?: OutcomeRecord[]; signals?: IntelligenceSignal[] }) {
    const base: ForecastInput = { workspaceId: input.workspaceId, kind: "STRATEGY", target: input.target, horizonDays: 90, observations: input.baseObservations, outcomes: input.outcomes, signals: input.signals, strategy: input.strategy };
    const conservative = await this.forecast({ ...base, horizonDays: 45 });
    const expected = await this.forecast(base);
    const aggressive = await this.forecast({ ...base, horizonDays: 120 });
    const confidence = average([conservative.confidence, expected.confidence, aggressive.confidence]);
    return {
      id: this.id(),
      workspaceId: input.workspaceId,
      strategyId: input.strategy.id,
      target: input.target,
      scenarios: [
        { name: "conservative", forecast: conservative, expectedOutcomes: [input.strategy.evidence.expectedOutcome], riskScore: Math.max(0, 100 - conservative.confidence * 100) },
        { name: "expected", forecast: expected, expectedOutcomes: [input.strategy.evidence.expectedOutcome], riskScore: Math.max(0, 100 - expected.confidence * 100) },
        { name: "aggressive", forecast: aggressive, expectedOutcomes: [input.strategy.evidence.expectedOutcome], riskScore: Math.max(0, 100 - aggressive.confidence * 100) },
      ],
      recommendation: confidence >= 0.7 ? "PROCEED" as const : confidence >= 0.5 ? "REVISE" as const : "ESCALATE" as const,
      confidence,
      generatedAt: this.now(),
    } satisfies StrategySimulation;
  }
}

export class UnifiedIntelligenceControlPlane {
  private readonly playbooks: DynamicPlaybook[] = [];
  private readonly forecasts: ForecastResult[] = [];
  private readonly replayTrail: Array<{ traceId: string; eventType: string; aggregateId: string; occurredAt: string }> = [];

  constructor(private readonly eventBridge = new OperationsEventBridge(), private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  recordWorkflow(playbook: DynamicPlaybook) {
    this.playbooks.push(playbook);
  }

  recordForecast(forecast: ForecastResult) {
    this.forecasts.push(forecast);
  }

  observeEvent(event: RuntimeInputEvent | { traceId: string; eventType: OrchestratedEventType | OperationsEventType | string; aggregateId: string; occurredAt: string }) {
    this.replayTrail.push({ traceId: event.traceId, eventType: event.eventType, aggregateId: event.aggregateId, occurredAt: event.occurredAt });
  }

  async snapshot(input: { workspaceId: WorkspaceId; agents: AgentDefinition[]; missions: MissionGoal[]; patterns: DiscoveredPattern[]; benchmarks: CrossWorkspaceBenchmark[]; agentStates?: Record<string, string> }) {
    const workspaceForecasts = this.forecasts.filter((forecast) => forecast.workspaceId === input.workspaceId);
    const snapshot: ControlPlaneSnapshot = {
      id: this.id(),
      workspaceId: input.workspaceId,
      generatedAt: this.now(),
      agents: input.agents.map((agent) => ({ id: agent.id, kind: agent.kind, workspaceId: agent.workspaceId, state: input.agentStates?.[agent.id] ?? "REGISTERED" })),
      missions: input.missions,
      workflows: this.playbooks.filter((playbook) => playbook.workspaceId === input.workspaceId),
      forecasts: workspaceForecasts,
      learning: { patterns: input.patterns, benchmarks: input.benchmarks },
      replay: this.replayTrail.filter((item) => input.missions.some((mission) => mission.traceId === item.traceId)).slice(-100),
      health: {
        activeMissions: input.missions.filter((mission) => mission.status === "ACTIVE").length,
        escalations: input.missions.filter((mission) => mission.status === "ESCALATED").length,
        blockedTasks: input.missions.flatMap((mission) => mission.decomposition).filter((task) => task.status === "BLOCKED").length,
        forecastConfidence: average(workspaceForecasts.map((forecast) => forecast.confidence)),
      },
    };
    await this.eventBridge.emit("operations.control_plane.snapshot", input.workspaceId, snapshot.id, stableId(`${input.workspaceId}:${snapshot.id}`), "control-plane", snapshot as unknown as Record<string, unknown>);
    return snapshot;
  }
}

export class AutonomousOperationsRuntime {
  constructor(
    readonly coordinator: MultiAgentCoordinator,
    readonly missions: MissionGoalSystem,
    readonly workflows: AutonomousWorkflowGenerator,
    readonly executive: ExecutiveIntelligenceEngine,
    readonly crossWorkspaceLearning: CrossWorkspaceLearningLayer,
    readonly forecasting: ForecastingSimulationEngine,
    readonly controlPlane: UnifiedIntelligenceControlPlane
  ) {}

  async operate(input: { context: MissionContext; agents: AgentDefinition[]; adaptivePlan: AgentPlan; briefingInput: { priorities: PriorityObject[]; outcomes: OutcomeRecord[]; recommendations?: ExplainableRecommendation[]; patterns?: DiscoveredPattern[] } }) {
    const mission = await this.missions.create({
      workspaceId: input.context.workspaceId,
      title: input.context.objective,
      objective: input.context.objective,
      horizon: "WEEKLY",
      targetEntities: input.context.entities,
      successMetrics: [],
      traceId: input.context.traceId,
      metadata: { constraints: input.context.constraints },
      agents: input.agents,
      priorities: input.context.priorities,
    });
    const collaboration = this.coordinator.open({ workspaceId: input.context.workspaceId, traceId: input.context.traceId, missionId: mission.id, participants: input.agents.map((agent) => agent.id), topic: input.context.objective });
    const playbook = await this.workflows.synthesize({ context: { ...input.context, missionId: mission.id }, adaptivePlan: input.adaptivePlan });
    this.controlPlane.recordWorkflow(playbook);
    const briefing = await this.executive.daily({ workspaceId: input.context.workspaceId, ...input.briefingInput });
    return { mission, collaboration, playbook, briefing };
  }
}

function sanitizePattern(pattern: DiscoveredPattern): DiscoveredPattern {
  return { ...pattern, workspaceId: "ANONYMIZED", entities: [], outcomeIds: [], signalIds: [] };
}

function stableId(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function daysBetween(start: string, end: string) {
  return Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000);
}

function outcomeEffect(outcomes: OutcomeRecord[]) {
  if (!outcomes.length) return 0.5;
  return average(outcomes.map((outcome) => outcome.status === "SUCCESSFUL" ? 1 : outcome.status === "FAILED" || outcome.status === "REJECTED" ? 0.1 : 0.65));
}

function weightedAverage(positive: number[], negative: number[] = []) {
  const values = [...positive, ...negative];
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.max(0, Math.ceil(values.length * p) - 1));
  return values[index];
}

function average(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export * from "./missions/daily-growth-mission";
