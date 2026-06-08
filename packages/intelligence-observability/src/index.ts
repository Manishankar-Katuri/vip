import { randomUUID } from "node:crypto";

import type { EvidenceRef, IntelligenceTrace, ReasoningAuditLog } from "@vip/cognitive-core";

export interface IntelligenceTraceStore {
  upsertTrace(trace: IntelligenceTrace): Promise<IntelligenceTrace>;
  getTrace(traceId: string): Promise<IntelligenceTrace | null>;
  appendAudit(log: ReasoningAuditLog): Promise<void>;
  audits(traceId: string): Promise<ReasoningAuditLog[]>;
}

export class InMemoryIntelligenceTraceStore implements IntelligenceTraceStore {
  private readonly traces = new Map<string, IntelligenceTrace>();
  private readonly logs: ReasoningAuditLog[] = [];

  async upsertTrace(trace: IntelligenceTrace) {
    const prior = this.traces.get(trace.traceId);
    const merged = prior ? mergeTrace(prior, trace) : trace;
    this.traces.set(trace.traceId, merged);
    return merged;
  }

  async getTrace(traceId: string) {
    return this.traces.get(traceId) ?? null;
  }

  async appendAudit(log: ReasoningAuditLog) {
    this.logs.push(log);
  }

  async audits(traceId: string) {
    return this.logs.filter((log) => log.traceId === traceId).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}

export class IntelligenceObservability {
  constructor(
    private readonly store: IntelligenceTraceStore = new InMemoryIntelligenceTraceStore(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async start(workspaceId: string, rootEventId: string, traceId = this.id()) {
    return this.store.upsertTrace({
      traceId,
      workspaceId,
      rootEventId,
      signalIds: [],
      priorityIds: [],
      recommendationIds: [],
      causalChainIds: [],
      startedAt: this.now(),
      updatedAt: this.now(),
    });
  }

  async record(traceId: string, patch: Partial<Pick<IntelligenceTrace, "signalIds" | "priorityIds" | "recommendationIds" | "causalChainIds">>) {
    const prior = await this.store.getTrace(traceId);
    if (!prior) throw new Error(`Unknown intelligence trace: ${traceId}.`);
    return this.store.upsertTrace({ ...prior, ...patch, updatedAt: this.now() });
  }

  async audit(input: Omit<ReasoningAuditLog, "id" | "createdAt">) {
    await this.store.appendAudit({ ...input, id: this.id(), createdAt: this.now() });
  }

  async diagnostics(traceId: string) {
    const trace = await this.store.getTrace(traceId);
    const audits = await this.store.audits(traceId);
    return {
      trace,
      audits,
      lineage: audits.map((audit) => ({
        stage: audit.stage,
        decision: audit.decision,
        confidence: audit.confidence,
        inputs: audit.inputRefs.map(refLabel),
        outputs: audit.outputRefs.map(refLabel),
        at: audit.createdAt,
      })),
    };
  }
}

export function evidence(id: string, type: EvidenceRef["type"], source: string, summary: string, observedAt = new Date().toISOString(), weight = 0.75): EvidenceRef {
  return { id, type, source, summary, observedAt, weight };
}

function refLabel(ref: EvidenceRef) {
  return `${ref.type}:${ref.id}`;
}

function mergeTrace(left: IntelligenceTrace, right: IntelligenceTrace): IntelligenceTrace {
  return {
    ...left,
    ...right,
    signalIds: unique([...(left.signalIds ?? []), ...(right.signalIds ?? [])]),
    priorityIds: unique([...(left.priorityIds ?? []), ...(right.priorityIds ?? [])]),
    recommendationIds: unique([...(left.recommendationIds ?? []), ...(right.recommendationIds ?? [])]),
    causalChainIds: unique([...(left.causalChainIds ?? []), ...(right.causalChainIds ?? [])]),
  };
}

function unique(values: string[]) {
  return [...new Set(values)];
}
