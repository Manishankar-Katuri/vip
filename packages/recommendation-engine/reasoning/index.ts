import { randomUUID } from "node:crypto";

import type {
  CausalChain,
  EvidenceRef,
  ExplainableRecommendation,
  GraphRelationship,
  IntelligenceSignal,
  OutcomeTrackingContract,
  PriorityObject,
  RecommendationEvidence,
  TemporalWindow,
} from "@vip/cognitive-core";

export interface RecommendationReasoningInput {
  workspaceId: string;
  priorities: PriorityObject[];
  signals: IntelligenceSignal[];
  graphEvidence: GraphRelationship[];
  causalEvidence: CausalChain[];
  historicalComparisons?: EvidenceRef[];
  measurementWindow?: TemporalWindow;
}

export class RecommendationReasoningEngine {
  constructor(private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  reason(input: RecommendationReasoningInput): ExplainableRecommendation[] {
    return input.priorities.map((priority) => {
      const supportingSignals = intersectSignals(priority, input.signals);
      const graphEvidence = intersectGraph(priority, input.graphEvidence);
      const causalEvidence = input.causalEvidence.filter((chain) => priority.causalFindings.some((finding) => finding.id === chain.id));
      const evidence: RecommendationEvidence = {
        supportingSignals,
        graphEvidence,
        causalEvidence,
        historicalComparisons: input.historicalComparisons ?? [],
        expectedOutcome: expectedOutcome(priority),
        confidence: confidence(priority, supportingSignals, graphEvidence, causalEvidence),
      };
      const recommendationId = this.id();
      return {
        id: recommendationId,
        workspaceId: input.workspaceId,
        title: actionTitle(priority),
        rationale: rationale(priority, evidence),
        evidence,
        executionSteps: priority.recommendedActions.map((action, index) => ({ order: index + 1, action, expectedDurationDays: index === 0 ? 1 : 7 })),
        relatedPriorityIds: [priority.id],
        downstreamRisks: priority.kind === "RISK" ? [priority] : [],
        downstreamOpportunities: priority.kind === "OPPORTUNITY" ? [priority] : [],
        outcomeMemory: outcomeContract(recommendationId, priority, input.measurementWindow ?? priority.supportingSignals[0]?.temporalWindow),
        createdAt: this.now(),
      };
    });
  }
}

function intersectSignals(priority: PriorityObject, signals: IntelligenceSignal[]) {
  const ids = new Set(priority.supportingSignals.map((signal) => signal.id));
  return signals.filter((signal) => ids.has(signal.id));
}

function intersectGraph(priority: PriorityObject, graph: GraphRelationship[]) {
  const entityKeys = new Set(priority.relatedEntities.map((entity) => `${entity.type}:${entity.id}`));
  return graph.filter((edge) => entityKeys.has(`${edge.from.type}:${edge.from.id}`) || entityKeys.has(`${edge.to.type}:${edge.to.id}`));
}

function confidence(priority: PriorityObject, signals: IntelligenceSignal[], graph: GraphRelationship[], chains: CausalChain[]) {
  const values = [priority.confidence, ...signals.map((signal) => signal.scores.confidence), ...graph.map((edge) => edge.confidence), ...chains.map((chain) => chain.confidence)];
  return Math.max(0, Math.min(1, values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)));
}

function expectedOutcome(priority: PriorityObject) {
  if (priority.kind === "RISK") return `Reduce risk exposure by addressing ${priority.title.toLowerCase()} and monitoring affected KPIs.`;
  if (priority.kind === "OPPORTUNITY") return `Increase measurable growth by executing the top actions for ${priority.title.toLowerCase()}.`;
  if (priority.kind === "EXECUTION") return "Restore execution continuity and protect downstream recommendation delivery.";
  return "Improve observability and preserve decision quality for the next planning window.";
}

function actionTitle(priority: PriorityObject) {
  return `${priority.title} with evidence-backed execution`;
}

function rationale(priority: PriorityObject, evidence: RecommendationEvidence) {
  return `${priority.reason} Confidence is ${Math.round(evidence.confidence * 100)}% across ${evidence.supportingSignals.length} signal(s), ${evidence.graphEvidence.length} graph relationship(s), and ${evidence.causalEvidence.length} causal chain(s).`;
}

function outcomeContract(recommendationId: string, priority: PriorityObject, window?: TemporalWindow): OutcomeTrackingContract {
  const now = new Date().toISOString();
  return {
    recommendationId,
    workspaceId: priority.workspaceId,
    targetKpis: priority.relatedEntities.filter((entity) => entity.type === "KPI"),
    baseline: priority.evidence,
    expectedOutcome: expectedOutcome(priority),
    measurementWindow: window ?? { startsAt: now, endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), granularity: "DAY" },
    effectivenessHooks: ["kpi_delta", "workflow_completion", "recommendation_status", "confidence_recalibration"],
    confidenceEvolution: [{ at: now, confidence: priority.confidence, reason: "Initial recommendation confidence from priority evidence." }],
  };
}
