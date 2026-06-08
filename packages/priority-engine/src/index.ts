import { createHash, randomUUID } from "node:crypto";

import type { CausalChain, EvidenceRef, GraphRelationship, IntelligenceSignal, PriorityKind, PriorityObject } from "@vip/cognitive-core";

export interface PriorityInput {
  workspaceId: string;
  signals: IntelligenceSignal[];
  graphRelationships?: GraphRelationship[];
  causalFindings?: CausalChain[];
  historicalOutcomes?: EvidenceRef[];
}

export interface WorkspacePriorityQueue {
  workspaceId: string;
  generatedAt: string;
  priorities: PriorityObject[];
}

export class StrategicPriorityEngine {
  constructor(private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  rank(input: PriorityInput): WorkspacePriorityQueue {
    const groups = groupSignals(input.signals.filter((signal) => signal.workspaceId === input.workspaceId));
    const priorities = [...groups.entries()].map(([key, signals]) => {
      const causalFindings = (input.causalFindings ?? []).filter((chain) => signals.some((signal) => chain.rootCause.id === signal.id || signal.relatedEntities.some((entity) => entity.id === chain.rootCause.id)));
      const relationships = (input.graphRelationships ?? []).filter((edge) => signals.some((signal) => signal.relatedEntities.some((entity) => entity.id === edge.from.id || entity.id === edge.to.id)));
      const expectedImpact = weightedAverage(signals.map((signal) => signal.scores.impact), relationships.map((edge) => edge.strength));
      const urgency = weightedAverage(signals.map((signal) => signal.scores.urgency), causalFindings.map((chain) => chain.confidence * 100));
      const confidence = Math.min(1, weightedAverage(signals.map((signal) => signal.scores.confidence * 100), causalFindings.map((chain) => chain.confidence * 100)) / 100);
      const executionComplexity = estimateComplexity(signals, relationships);
      const strategicImportance = Math.round((expectedImpact * 0.45) + (urgency * 0.35) + ((100 - executionComplexity) * 0.2));
      const kind = priorityKind(signals);
      return {
        id: this.id(),
        workspaceId: input.workspaceId,
        kind,
        title: titleFor(kind, signals[0]),
        reason: reasonFor(signals, causalFindings),
        urgency,
        confidence,
        expectedImpact,
        executionComplexity,
        strategicImportance,
        relatedEntities: uniqueEntities(signals.flatMap((signal) => signal.relatedEntities)),
        supportingSignals: signals,
        causalFindings,
        evidence: [...signals.flatMap((signal) => signal.evidence), ...causalFindings.map(causalEvidence), ...(input.historicalOutcomes ?? [])],
        recommendedActions: actionsFor(kind, signals),
        createdAt: this.now(),
      } satisfies PriorityObject;
    });

    return {
      workspaceId: input.workspaceId,
      generatedAt: this.now(),
      priorities: priorities.sort((left, right) => score(right) - score(left)),
    };
  }
}

function groupSignals(signals: IntelligenceSignal[]) {
  const groups = new Map<string, IntelligenceSignal[]>();
  for (const signal of signals) {
    const key = createHash("sha1").update(`${signal.type}:${signal.relatedEntities.map((entity) => `${entity.type}:${entity.id}`).sort().join("|")}`).digest("hex");
    groups.set(key, [...(groups.get(key) ?? []), signal]);
  }
  return groups;
}

function priorityKind(signals: IntelligenceSignal[]): PriorityKind {
  if (signals.some((signal) => signal.type.includes("RISK") || signal.type.includes("DECLINE") || signal.type.includes("DROP"))) return "RISK";
  if (signals.some((signal) => signal.type.includes("OPPORTUNITY") || signal.type.includes("MOMENTUM"))) return "OPPORTUNITY";
  if (signals.some((signal) => signal.type.includes("WORKFLOW"))) return "EXECUTION";
  return "MONITORING";
}

function titleFor(kind: PriorityKind, signal: IntelligenceSignal) {
  const prefix = ({ RISK: "Mitigate", OPPORTUNITY: "Capture", EXECUTION: "Unblock", MONITORING: "Monitor" } as const)[kind];
  return `${prefix} ${signal.type.toLowerCase().replace(/_/g, " ")}`;
}

function reasonFor(signals: IntelligenceSignal[], chains: CausalChain[]) {
  const strongest = signals.sort((left, right) => right.scores.impact - left.scores.impact)[0];
  const causal = chains[0]?.summary;
  return causal ? `${strongest.summary} ${causal}` : strongest.summary;
}

function actionsFor(kind: PriorityKind, signals: IntelligenceSignal[]) {
  const entities = uniqueEntities(signals.flatMap((signal) => signal.relatedEntities));
  if (kind === "RISK") return ["Stabilize the affected entity.", "Inspect the highest-weight evidence.", "Launch corrective workflow and monitor KPI recovery."];
  if (kind === "OPPORTUNITY") return ["Increase execution velocity.", "Allocate content or campaign capacity.", "Measure lift against baseline KPIs."];
  if (kind === "EXECUTION") return ["Retry or reroute blocked workflow.", "Review failure evidence.", "Escalate if automation remains blocked."];
  return [`Track ${entities[0]?.label ?? entities[0]?.type ?? "affected entity"} for one measurement window.`];
}

function estimateComplexity(signals: IntelligenceSignal[], relationships: GraphRelationship[]) {
  const entityBreadth = uniqueEntities(signals.flatMap((signal) => signal.relatedEntities)).length;
  const graphBreadth = relationships.length;
  return Math.min(100, 20 + entityBreadth * 10 + graphBreadth * 6);
}

function weightedAverage(primary: number[], secondary: number[] = []) {
  const values = [...primary, ...secondary];
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

function uniqueEntities<T extends { id: string; type: string }>(entities: T[]) {
  return [...new Map(entities.map((entity) => [`${entity.type}:${entity.id}`, entity])).values()];
}

function causalEvidence(chain: CausalChain): EvidenceRef {
  return {
    id: chain.id,
    type: "CAUSAL_CHAIN",
    source: "causal-engine",
    observedAt: chain.generatedAt,
    summary: chain.summary,
    weight: chain.confidence,
  };
}

function score(priority: PriorityObject) {
  return priority.strategicImportance * 0.45 + priority.urgency * 0.3 + priority.expectedImpact * 0.25 - priority.executionComplexity * 0.1;
}
