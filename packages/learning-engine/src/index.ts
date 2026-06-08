import { createHash, randomUUID } from "node:crypto";

import type { CausalChain, EntityRef, EvidenceRef, ExplainableRecommendation, IntelligenceSignal, PriorityObject, WorkspaceId } from "@vip/cognitive-core";
import type { OutcomeCorrelation, OutcomeRecord, OutcomeRepository, OutcomeStatus, OutcomeStore } from "@vip/outcome-memory";

export type RecommendationOutcomeState = "ACCEPTED" | "REJECTED" | "EXECUTED" | "SUCCESSFUL" | "FAILED";
export type PatternKind = "GROWTH" | "FAILURE" | "REPUTATION_RISK" | "MARKET_OPPORTUNITY";

export interface RecommendationLearningSummary {
  recommendationId: string;
  workspaceId: WorkspaceId;
  accepted: boolean;
  rejected: boolean;
  executed: boolean;
  successful: boolean;
  failed: boolean;
  effectiveness: number;
  reliability: number;
  confidenceEvolution: Array<{ at: string; confidence: number; reason: string }>;
  evidence: EvidenceRef[];
}

export interface StrategyPerformanceSummary {
  key: string;
  workspaceId: WorkspaceId;
  strategyEntity?: EntityRef;
  specialty?: EntityRef;
  campaign?: EntityRef;
  reputationRecovery?: boolean;
  outcomeCount: number;
  successRate: number;
  averageKpiLift: number;
  effectivenessScore: number;
  confidenceAdjustment: number;
  historicalSuccessPatterns: string[];
}

export interface ConfidenceInput {
  workspaceId: WorkspaceId;
  target: EntityRef;
  priorConfidence: number;
  outcomes: OutcomeRecord[];
  causalValidation?: CausalChain[];
  executionSuccess?: number;
  recommendationSuccess?: number;
}

export interface DiscoveredPattern {
  id: string;
  workspaceId: WorkspaceId;
  kind: PatternKind;
  signature: string;
  support: number;
  confidence: number;
  entities: EntityRef[];
  outcomeIds: string[];
  signalIds: string[];
  summary: string;
  discoveredAt: string;
}

export interface ExecutiveBriefing {
  id: string;
  workspaceId: WorkspaceId;
  generatedAt: string;
  topRisks: BriefingItem[];
  topOpportunities: BriefingItem[];
  priorityFocusAreas: BriefingItem[];
  confidenceSummaries: Array<{ target: EntityRef; confidence: number; direction: "IMPROVING" | "DECLINING" | "STABLE"; reason: string }>;
  emergingThreats: BriefingItem[];
  traceIds: string[];
}

export interface BriefingItem {
  title: string;
  score: number;
  confidence: number;
  entities: EntityRef[];
  evidence: EvidenceRef[];
}

export interface LearningMemory {
  recordRecommendation(summary: RecommendationLearningSummary): Promise<void>;
  recommendation(workspaceId: WorkspaceId, recommendationId: string): Promise<RecommendationLearningSummary | null>;
  recordStrategy(summary: StrategyPerformanceSummary): Promise<void>;
  strategies(workspaceId: WorkspaceId): Promise<StrategyPerformanceSummary[]>;
  recordPattern(pattern: DiscoveredPattern): Promise<void>;
  patterns(workspaceId: WorkspaceId): Promise<DiscoveredPattern[]>;
}

export class InMemoryLearningMemory implements LearningMemory {
  private readonly recommendations = new Map<string, RecommendationLearningSummary>();
  private readonly strategySummaries = new Map<string, StrategyPerformanceSummary>();
  private readonly discoveredPatterns = new Map<string, DiscoveredPattern>();

  async recordRecommendation(summary: RecommendationLearningSummary) {
    this.recommendations.set(key(summary.workspaceId, summary.recommendationId), summary);
  }

  async recommendation(workspaceId: WorkspaceId, recommendationId: string) {
    return this.recommendations.get(key(workspaceId, recommendationId)) ?? null;
  }

  async recordStrategy(summary: StrategyPerformanceSummary) {
    this.strategySummaries.set(key(summary.workspaceId, summary.key), summary);
  }

  async strategies(workspaceId: WorkspaceId) {
    return [...this.strategySummaries.values()].filter((summary) => summary.workspaceId === workspaceId);
  }

  async recordPattern(pattern: DiscoveredPattern) {
    this.discoveredPatterns.set(key(pattern.workspaceId, pattern.id), pattern);
  }

  async patterns(workspaceId: WorkspaceId) {
    return [...this.discoveredPatterns.values()].filter((pattern) => pattern.workspaceId === workspaceId);
  }
}

export interface OutcomeMemoryBridge {
  outcomes(query: { workspaceId: WorkspaceId; recommendationId?: string; entity?: EntityRef; from?: string; to?: string }): Promise<OutcomeRecord[]>;
  record?(outcome: Omit<OutcomeRecord, "id" | "createdAt" | "updatedAt">): Promise<OutcomeRecord>;
}

export class DefaultOutcomeMemoryBridge implements OutcomeMemoryBridge {
  constructor(private readonly store: Pick<OutcomeStore, "query" | "record">) {}

  outcomes(query: { workspaceId: WorkspaceId; recommendationId?: string; entity?: EntityRef; from?: string; to?: string }) {
    return this.store.query(query);
  }

  record(outcome: Omit<OutcomeRecord, "id" | "createdAt" | "updatedAt">) {
    return this.store.record(outcome);
  }
}

export interface GraphLearningBridge {
  related(workspaceId: WorkspaceId, entity: EntityRef): Promise<EntityRef[]>;
}

export interface SignalLearningBridge {
  history(query: { workspaceId: WorkspaceId; entity?: EntityRef; from?: string; to?: string }): Promise<IntelligenceSignal[]>;
}

export class NullGraphLearningBridge implements GraphLearningBridge {
  async related(_workspaceId: WorkspaceId, entity: EntityRef) {
    return [entity];
  }
}

export class NullSignalLearningBridge implements SignalLearningBridge {
  async history() {
    return [];
  }
}

export class RecommendationOutcomeAnalyzer {
  constructor(private readonly outcomeBridge: OutcomeMemoryBridge, private readonly memory: LearningMemory = new InMemoryLearningMemory()) {}

  async analyze(workspaceId: WorkspaceId, recommendationId: string): Promise<RecommendationLearningSummary> {
    const outcomes = await this.outcomeBridge.outcomes({ workspaceId, recommendationId });
    const statuses = new Set(outcomes.map((outcome) => mapStatus(outcome.status)));
    const successful = statuses.has("SUCCESSFUL");
    const failed = statuses.has("FAILED");
    const accepted = statuses.has("ACCEPTED");
    const rejected = statuses.has("REJECTED");
    const executed = statuses.has("EXECUTED") || outcomes.some((outcome) => outcome.kind === "ACTION" || outcome.kind === "WORKFLOW");
    const positive = Number(accepted) + Number(executed) + Number(successful) * 2;
    const negative = Number(rejected) + Number(failed) * 2;
    const effectiveness = clamp((positive - negative + 3) / 6, 0, 1);
    const reliability = clamp(effectiveness * 0.7 + Math.min(1, outcomes.length / 5) * 0.3, 0, 1);
    const confidenceEvolution = outcomes.map((outcome, index) => ({
      at: outcome.occurredAt,
      confidence: clamp(0.5 + effectiveness * 0.4 + index * 0.02 - (failed ? 0.15 : 0), 0, 1),
      reason: `${outcome.kind.toLowerCase()} ${outcome.status.toLowerCase()}`,
    }));
    const summary = {
      recommendationId,
      workspaceId,
      accepted,
      rejected,
      executed,
      successful,
      failed,
      effectiveness,
      reliability,
      confidenceEvolution,
      evidence: outcomes.flatMap((outcome) => outcome.evidence),
    };
    await this.memory.recordRecommendation(summary);
    return summary;
  }
}

export class StrategyLearningEngine {
  constructor(private readonly outcomeBridge: OutcomeMemoryBridge, private readonly memory: LearningMemory = new InMemoryLearningMemory()) {}

  async evaluate(input: { workspaceId: WorkspaceId; strategy?: EntityRef; specialty?: EntityRef; campaign?: EntityRef; from?: string; to?: string }) {
    const focus = input.strategy ?? input.specialty ?? input.campaign;
    const outcomes = await this.outcomeBridge.outcomes({ workspaceId: input.workspaceId, entity: focus, from: input.from, to: input.to });
    const successCount = outcomes.filter((outcome) => outcome.status === "SUCCESSFUL").length;
    const failureCount = outcomes.filter((outcome) => outcome.status === "FAILED" || outcome.status === "REJECTED").length;
    const kpiDeltas = outcomes.flatMap((outcome) => outcome.kpiDeltas);
    const averageKpiLift = average(kpiDeltas.map((delta) => delta.baseline === 0 ? 0 : ((delta.current - delta.baseline) / Math.abs(delta.baseline)) * 100));
    const successRate = successCount / Math.max(1, successCount + failureCount);
    const effectivenessScore = clamp(successRate * 70 + Math.max(0, averageKpiLift) * 0.3, 0, 100);
    const summary: StrategyPerformanceSummary = {
      key: stableId(`${input.workspaceId}:${focus?.type ?? "workspace"}:${focus?.id ?? "all"}:${input.from ?? ""}:${input.to ?? ""}`),
      workspaceId: input.workspaceId,
      strategyEntity: input.strategy,
      specialty: input.specialty,
      campaign: input.campaign,
      reputationRecovery: outcomes.some((outcome) => outcome.graphLinks.some((entity) => entity.type === "REVIEW")),
      outcomeCount: outcomes.length,
      successRate,
      averageKpiLift,
      effectivenessScore,
      confidenceAdjustment: clamp((effectivenessScore - 50) / 100, -0.4, 0.4),
      historicalSuccessPatterns: deriveSuccessPatterns(outcomes),
    };
    await this.memory.recordStrategy(summary);
    return summary;
  }
}

export class ConfidenceEngine {
  evolve(input: ConfidenceInput) {
    const outcomeScore = outcomeEffect(input.outcomes);
    const causalScore = average((input.causalValidation ?? []).map((chain) => chain.confidence));
    const executionScore = input.executionSuccess ?? outcomeScore;
    const recommendationScore = input.recommendationSuccess ?? outcomeScore;
    const evolved = clamp(
      input.priorConfidence * 0.45 +
      outcomeScore * 0.25 +
      causalScore * 0.15 +
      executionScore * 0.075 +
      recommendationScore * 0.075,
      0,
      1
    );
    return {
      target: input.target,
      priorConfidence: input.priorConfidence,
      confidence: evolved,
      delta: evolved - input.priorConfidence,
      reason: `Updated from ${input.outcomes.length} outcomes, ${(input.causalValidation ?? []).length} causal validations, execution success ${executionScore.toFixed(2)}.`,
    };
  }
}

export class PatternDiscoveryEngine {
  constructor(
    private readonly outcomeBridge: OutcomeMemoryBridge,
    private readonly graphBridge: GraphLearningBridge = new NullGraphLearningBridge(),
    private readonly signalBridge: SignalLearningBridge = new NullSignalLearningBridge(),
    private readonly memory: LearningMemory = new InMemoryLearningMemory(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async discover(query: { workspaceId: WorkspaceId; entity?: EntityRef; from?: string; to?: string }) {
    const outcomes = await this.outcomeBridge.outcomes(query);
    const signals = await this.signalBridge.history(query);
    const related = query.entity ? await this.graphBridge.related(query.workspaceId, query.entity) : uniqueEntities(outcomes.flatMap((outcome) => [outcome.subject, ...outcome.graphLinks]));
    const buckets = bucketPatterns(outcomes, signals);
    const patterns: DiscoveredPattern[] = [];
    for (const [signature, bucket] of buckets) {
      if (bucket.outcomes.length + bucket.signals.length < 2) continue;
      const kind = classifyPattern(bucket.outcomes, bucket.signals);
      const confidence = clamp((bucket.outcomes.length * 0.15) + (bucket.signals.length * 0.1) + outcomeEffect(bucket.outcomes) * 0.55, 0, 1);
      const pattern = {
        id: this.id(),
        workspaceId: query.workspaceId,
        kind,
        signature,
        support: bucket.outcomes.length + bucket.signals.length,
        confidence,
        entities: uniqueEntities([...related, ...bucket.outcomes.flatMap((outcome) => [outcome.subject, ...outcome.graphLinks]), ...bucket.signals.flatMap((signal) => signal.relatedEntities)]),
        outcomeIds: bucket.outcomes.map((outcome) => outcome.id),
        signalIds: bucket.signals.map((signal) => signal.id),
        summary: `${kind.toLowerCase().replace(/_/g, " ")} pattern detected for ${signature}`,
        discoveredAt: this.now(),
      };
      await this.memory.recordPattern(pattern);
      patterns.push(pattern);
    }
    return patterns.sort((left, right) => right.confidence - left.confidence);
  }
}

export class ExecutiveBriefingGenerator {
  constructor(private readonly memory: LearningMemory, private readonly confidenceEngine = new ConfidenceEngine(), private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  async generate(input: { workspaceId: WorkspaceId; priorities: PriorityObject[]; outcomes: OutcomeRecord[]; recommendations?: ExplainableRecommendation[]; patterns?: DiscoveredPattern[] }) {
    const patterns = input.patterns ?? await this.memory.patterns(input.workspaceId);
    const strategies = await this.memory.strategies(input.workspaceId);
    const riskPriorities = input.priorities.filter((priority) => priority.kind === "RISK").sort(prioritySort).slice(0, 5);
    const opportunityPriorities = input.priorities.filter((priority) => priority.kind === "OPPORTUNITY").sort(prioritySort).slice(0, 5);
    const focus = input.priorities.sort(prioritySort).slice(0, 5);
    const confidenceSummaries = uniqueEntities(input.outcomes.map((outcome) => outcome.subject)).slice(0, 8).map((target) => {
      const evolved = this.confidenceEngine.evolve({ workspaceId: input.workspaceId, target, priorConfidence: 0.6, outcomes: input.outcomes.filter((outcome) => sameEntity(outcome.subject, target)) });
      return { target, confidence: evolved.confidence, direction: evolved.delta > 0.03 ? "IMPROVING" as const : evolved.delta < -0.03 ? "DECLINING" as const : "STABLE" as const, reason: evolved.reason };
    });
    return {
      id: this.id(),
      workspaceId: input.workspaceId,
      generatedAt: this.now(),
      topRisks: riskPriorities.map(priorityItem),
      topOpportunities: opportunityPriorities.map(priorityItem),
      priorityFocusAreas: focus.map(priorityItem),
      confidenceSummaries,
      emergingThreats: patterns.filter((pattern) => pattern.kind === "REPUTATION_RISK" || pattern.kind === "FAILURE").slice(0, 5).map(patternItem),
      traceIds: [...new Set([...input.outcomes.map((outcome) => outcome.lineage.traceId), ...strategies.map((strategy) => strategy.key)])],
    } satisfies ExecutiveBriefing;
  }
}

function mapStatus(status: OutcomeStatus): RecommendationOutcomeState {
  if (status === "ACCEPTED") return "ACCEPTED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "EXECUTED") return "EXECUTED";
  if (status === "SUCCESSFUL") return "SUCCESSFUL";
  return "FAILED";
}

function outcomeEffect(outcomes: OutcomeRecord[]) {
  if (!outcomes.length) return 0.5;
  const scores = outcomes.map((outcome) => {
    if (outcome.status === "SUCCESSFUL") return 1;
    if (outcome.status === "EXECUTED" || outcome.status === "ACCEPTED") return 0.75;
    if (outcome.status === "FAILED" || outcome.status === "REJECTED") return 0.1;
    return 0.5;
  });
  return average(scores);
}

function bucketPatterns(outcomes: OutcomeRecord[], signals: IntelligenceSignal[]) {
  const buckets = new Map<string, { outcomes: OutcomeRecord[]; signals: IntelligenceSignal[] }>();
  for (const outcome of outcomes) {
    const signature = `${outcome.kind}:${outcome.subject.type}:${outcome.graphLinks.map((entity) => entity.type).sort().join("|")}`;
    const bucket = buckets.get(signature) ?? { outcomes: [], signals: [] };
    bucket.outcomes.push(outcome);
    buckets.set(signature, bucket);
  }
  for (const signal of signals) {
    const signature = `${signal.type}:${signal.relatedEntities.map((entity) => entity.type).sort().join("|")}`;
    const bucket = buckets.get(signature) ?? { outcomes: [], signals: [] };
    bucket.signals.push(signal);
    buckets.set(signature, bucket);
  }
  return buckets;
}

function classifyPattern(outcomes: OutcomeRecord[], signals: IntelligenceSignal[]): PatternKind {
  if (signals.some((signal) => signal.type.includes("REPUTATION") || signal.type.includes("DOCTOR_REPUTATION")) || outcomes.some((outcome) => outcome.graphLinks.some((entity) => entity.type === "REVIEW"))) return "REPUTATION_RISK";
  if (outcomes.some((outcome) => outcome.status === "FAILED" || outcome.status === "REJECTED")) return "FAILURE";
  if (signals.some((signal) => signal.type.includes("OPPORTUNITY") || signal.type.includes("MOMENTUM"))) return "MARKET_OPPORTUNITY";
  return "GROWTH";
}

function deriveSuccessPatterns(outcomes: OutcomeRecord[]) {
  return [...new Set(outcomes.filter((outcome) => outcome.status === "SUCCESSFUL").map((outcome) => `${outcome.kind}:${outcome.subject.type}`))];
}

function prioritySort(left: PriorityObject, right: PriorityObject) {
  return (right.urgency + right.expectedImpact + right.strategicImportance) - (left.urgency + left.expectedImpact + left.strategicImportance);
}

function priorityItem(priority: PriorityObject): BriefingItem {
  return {
    title: priority.title,
    score: Math.round((priority.urgency + priority.expectedImpact + priority.strategicImportance) / 3),
    confidence: priority.confidence,
    entities: priority.relatedEntities,
    evidence: priority.evidence,
  };
}

function patternItem(pattern: DiscoveredPattern): BriefingItem {
  return { title: pattern.summary, score: Math.round(pattern.support * pattern.confidence * 10), confidence: pattern.confidence, entities: pattern.entities, evidence: [] };
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function uniqueEntities<T extends EntityRef>(entities: T[]) {
  return [...new Map(entities.map((entity) => [`${entity.type}:${entity.id}`, entity])).values()];
}

function sameEntity(left: EntityRef, right: EntityRef) {
  return left.id === right.id && left.type === right.type;
}

function stableId(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function key(workspaceId: WorkspaceId, id: string) {
  return `${workspaceId}:${id}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
