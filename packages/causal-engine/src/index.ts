import { randomUUID } from "node:crypto";

import type { CausalChain, CausalLink, EntityRef, GraphRelationship, IntelligenceSignal, TemporalWindow } from "@vip/cognitive-core";
import type { IntelligenceGraphService } from "@vip/intelligence-graph";

export interface CausalAnalysisInput {
  workspaceId: string;
  outcome: EntityRef;
  signals: IntelligenceSignal[];
  temporalWindow: TemporalWindow;
  graph?: IntelligenceGraphService;
}

export class CausalIntelligenceEngine {
  constructor(private readonly id: () => string = () => randomUUID(), private readonly now: () => string = () => new Date().toISOString()) {}

  async explain(input: CausalAnalysisInput): Promise<CausalChain[]> {
    const signalCandidates = input.signals
      .filter((signal) => signal.workspaceId === input.workspaceId)
      .filter((signal) => overlaps(signal.temporalWindow, input.temporalWindow))
      .sort((left, right) => right.scores.impact * right.scores.confidence - left.scores.impact * left.scores.confidence);

    const chains: CausalChain[] = [];
    for (const signal of signalCandidates.slice(0, 5)) {
      const root = signal.relatedEntities[0] ?? { id: signal.id, type: "SIGNAL", workspaceId: input.workspaceId, label: signal.type };
      const links: CausalLink[] = [{
        cause: root,
        effect: input.outcome,
        relationshipType: inferRelationship(signal),
        lagMs: Math.max(0, new Date(input.temporalWindow.endsAt).getTime() - new Date(signal.temporalWindow.endsAt).getTime()),
        confidence: signal.scores.confidence,
        evidence: signal.evidence,
      }];

      if (input.graph) {
        const paths = await input.graph.traverse({ workspaceId: input.workspaceId, entity: root, maxDepth: 3, minStrength: 15 });
        const strongest = paths.find((path) => path.entities.some((entity) => entity.id === input.outcome.id && entity.type === input.outcome.type));
        if (strongest) links.splice(0, links.length, ...strongest.relationships.map((edge) => linkFromRelationship(edge)));
      }

      chains.push({
        id: this.id(),
        workspaceId: input.workspaceId,
        rootCause: root,
        outcome: input.outcome,
        links,
        summary: `${label(root)} is the most likely upstream driver for ${label(input.outcome)}.`,
        confidence: boundedAverage(links.map((link) => link.confidence)),
        temporalWindow: input.temporalWindow,
        generatedAt: this.now(),
      });
    }
    return chains.sort((left, right) => right.confidence - left.confidence);
  }

  tracePropagation(signal: IntelligenceSignal, downstream: EntityRef[]): CausalChain {
    const links = downstream.map((entity) => ({
      cause: { id: signal.id, type: "SIGNAL" as const, workspaceId: signal.workspaceId, label: signal.type },
      effect: entity,
      relationshipType: "IMPACTS" as const,
      confidence: signal.scores.confidence,
      evidence: signal.evidence,
    }));
    return {
      id: this.id(),
      workspaceId: signal.workspaceId,
      rootCause: { id: signal.id, type: "SIGNAL", workspaceId: signal.workspaceId, label: signal.type },
      outcome: downstream[downstream.length - 1] ?? { id: signal.id, type: "SIGNAL", workspaceId: signal.workspaceId },
      links,
      summary: signal.summary,
      confidence: boundedAverage(links.map((link) => link.confidence)),
      temporalWindow: signal.temporalWindow,
      generatedAt: this.now(),
    };
  }
}

function linkFromRelationship(edge: GraphRelationship): CausalLink {
  return {
    cause: edge.from,
    effect: edge.to,
    relationshipType: edge.type,
    confidence: edge.confidence * (edge.strength / 100),
    evidence: edge.evidence,
  };
}

function inferRelationship(signal: IntelligenceSignal) {
  if (signal.type.includes("RISK") || signal.type.includes("DECLINE") || signal.type.includes("DROP")) return "REDUCES" as const;
  if (signal.type.includes("OPPORTUNITY")) return "IMPROVES" as const;
  return "IMPACTS" as const;
}

function overlaps(left: TemporalWindow, right: TemporalWindow) {
  return new Date(left.startsAt) <= new Date(right.endsAt) && new Date(right.startsAt) <= new Date(left.endsAt);
}

function boundedAverage(values: number[]) {
  return Math.max(0, Math.min(1, values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)));
}

function label(entity: EntityRef) {
  return entity.label ?? `${entity.type.toLowerCase()} ${entity.id}`;
}
