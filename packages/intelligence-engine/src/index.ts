import { createHash, randomUUID } from "node:crypto";

import type {
  EntityRef,
  EvidenceRef,
  IntelligenceSignal,
  IntelligenceSignalCorrelatedEvent,
  IntelligenceSignalRaisedEvent,
  IntelligenceSeverity,
  SignalDirection,
  SignalType,
} from "@vip/cognitive-core";
import type { DurableEventEnvelope, EventBus, OrchestratedEvent } from "@vip/event-orchestrator";

export interface SignalRepository {
  upsert(signal: IntelligenceSignal): Promise<{ signal: IntelligenceSignal; created: boolean }>;
  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<IntelligenceSignal | null>;
  findRecent(workspaceId: string, correlationKey: string, since: string): Promise<IntelligenceSignal[]>;
}

export class InMemorySignalRepository implements SignalRepository {
  private readonly signals = new Map<string, IntelligenceSignal>();

  async upsert(signal: IntelligenceSignal) {
    const existing = await this.findByIdempotencyKey(signal.workspaceId, signal.idempotencyKey);
    if (existing) return { signal: existing, created: false };
    this.signals.set(signal.id, signal);
    return { signal, created: true };
  }

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return [...this.signals.values()].find((signal) => signal.workspaceId === workspaceId && signal.idempotencyKey === idempotencyKey) ?? null;
  }

  async findRecent(workspaceId: string, correlationKey: string, since: string) {
    return [...this.signals.values()]
      .filter((signal) => signal.workspaceId === workspaceId && signal.correlationKey === correlationKey && signal.detectedAt >= since)
      .sort((left, right) => left.detectedAt.localeCompare(right.detectedAt));
  }
}

interface PrismaSignalDelegate {
  upsert(args: unknown): Promise<Record<string, unknown>>;
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  findMany(args: unknown): Promise<Record<string, unknown>[]>;
}

export interface IntelligenceSignalPrismaClient {
  intelligenceSignal: PrismaSignalDelegate;
}

export class PrismaSignalRepository implements SignalRepository {
  constructor(private readonly database: IntelligenceSignalPrismaClient) {}

  async upsert(signal: IntelligenceSignal) {
    const prior = await this.findByIdempotencyKey(signal.workspaceId, signal.idempotencyKey);
    if (prior) return { signal: prior, created: false };
    const row = await this.database.intelligenceSignal.upsert({
      where: { id: signal.id },
      create: signalData(signal),
      update: signalData(signal),
    });
    return { signal: signalFromRow(row), created: true };
  }

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    const row = await this.database.intelligenceSignal.findFirst({ where: { workspaceId, idempotencyKey } });
    return row ? signalFromRow(row) : null;
  }

  async findRecent(workspaceId: string, correlationKey: string, since: string) {
    const rows = await this.database.intelligenceSignal.findMany({
      where: { workspaceId, correlationKey, detectedAt: { gte: new Date(since) } },
      orderBy: { detectedAt: "asc" },
    });
    return rows.map(signalFromRow);
  }
}

export interface SignalRule {
  id: string;
  eventTypes: string[];
  map(event: OrchestratedEvent, envelope: DurableEventEnvelope): Omit<IntelligenceSignal, "id" | "detectedAt" | "idempotencyKey" | "sourceEventIds"> | null;
}

export interface SignalEngineOptions {
  repository?: SignalRepository;
  bus?: EventBus;
  id?: () => string;
  now?: () => string;
  correlationWindowMs?: number;
  rules?: SignalRule[];
}

export class SignalIntelligenceEngine {
  private readonly repository: SignalRepository;
  private readonly id: () => string;
  private readonly now: () => string;
  private readonly correlationWindowMs: number;
  private readonly rules: SignalRule[];

  constructor(private readonly options: SignalEngineOptions = {}) {
    this.repository = options.repository ?? new InMemorySignalRepository();
    this.id = options.id ?? (() => randomUUID());
    this.now = options.now ?? (() => new Date().toISOString());
    this.correlationWindowMs = options.correlationWindowMs ?? 7 * 24 * 60 * 60 * 1000;
    this.rules = options.rules ?? defaultSignalRules;
  }

  createSubscriber(id = "vip-cognitive-signal-engine") {
    return {
      id,
      topics: ["analytics", "automation", "workflows", "competitors", "reviews", "recommendations"] as const,
      handle: (envelope: DurableEventEnvelope) => this.processEnvelope(envelope),
    };
  }

  async processEnvelope(envelope: DurableEventEnvelope) {
    const rule = this.rules.find((candidate) => candidate.eventTypes.includes(envelope.event.eventType));
    if (!rule) return [];
    const draft = rule.map(envelope.event, envelope);
    if (!draft) return [];
    const detectedAt = this.now();
    const signal: IntelligenceSignal = {
      ...draft,
      id: this.id(),
      sourceEventIds: [envelope.event.eventId],
      detectedAt,
      idempotencyKey: stableKey(envelope.event.workspaceId, rule.id, envelope.event.idempotencyKey),
    };
    const persisted = await this.repository.upsert(signal);
    if (!persisted.created) return [persisted.signal];

    const traceId = String(envelope.metadata.attributes?.intelligenceTraceId ?? envelope.metadata.correlationId ?? envelope.event.eventId);
    await this.options.bus?.publish(signalRaisedEvent(persisted.signal, traceId, this.id()), {
      correlationId: traceId,
      causationId: envelope.event.eventId,
      producer: "vip-intelligence-engine",
      source: { module: "analytics", component: "signal-intelligence-engine" },
      attributes: { intelligenceTraceId: traceId },
    }, { priority: signal.severity === "CRITICAL" ? "CRITICAL" : signal.severity === "HIGH" ? "HIGH" : "NORMAL" });

    const since = new Date(new Date(detectedAt).getTime() - this.correlationWindowMs).toISOString();
    const correlated = await this.repository.findRecent(signal.workspaceId, signal.correlationKey, since);
    if (correlated.length > 1) {
      await this.options.bus?.publish(signalCorrelatedEvent(signal.workspaceId, correlated.map((item) => item.id), signal.correlationKey, traceId, this.id()), {
        correlationId: traceId,
        causationId: signal.id,
        producer: "vip-intelligence-engine",
        source: { module: "analytics", component: "signal-correlation" },
        attributes: { intelligenceTraceId: traceId },
      }, { priority: "HIGH" });
    }
    return correlated.length ? correlated : [signal];
  }
}

function signalRaisedEvent(signal: IntelligenceSignal, traceId: string, id: string): IntelligenceSignalRaisedEvent {
  return {
    eventId: id,
    eventType: "intelligence.signal.raised",
    eventVersion: 1,
    aggregateType: "INTELLIGENCE",
    aggregateId: signal.id,
    workspaceId: signal.workspaceId,
    idempotencyKey: `signal-raised:${signal.idempotencyKey}`,
    occurredAt: signal.detectedAt,
    payload: { signal, traceId },
  };
}

function signalCorrelatedEvent(workspaceId: string, signalIds: string[], correlationKey: string, traceId: string, id: string): IntelligenceSignalCorrelatedEvent {
  return {
    eventId: id,
    eventType: "intelligence.signal.correlated",
    eventVersion: 1,
    aggregateType: "INTELLIGENCE",
    aggregateId: correlationKey,
    workspaceId,
    idempotencyKey: `signal-correlated:${stableHash(`${workspaceId}:${correlationKey}:${signalIds.sort().join(":")}`)}`,
    occurredAt: new Date().toISOString(),
    payload: { signalIds, correlationKey, traceId },
  };
}

function defaultWindow(occurredAt: string) {
  return { startsAt: occurredAt, endsAt: occurredAt, granularity: "EVENT" as const };
}

function eventEvidence(event: OrchestratedEvent, source: string, summary: string, weight = 0.8): EvidenceRef {
  return { id: event.eventId, type: "EVENT", source, observedAt: event.occurredAt, summary, weight, data: event.payload as Record<string, unknown> };
}

function entity(id: string, type: EntityRef["type"], workspaceId: string, label?: string): EntityRef {
  return { id, type, workspaceId, label };
}

function signalDraft(
  event: OrchestratedEvent,
  type: SignalType,
  direction: SignalDirection,
  severity: IntelligenceSeverity,
  summary: string,
  relatedEntities: EntityRef[],
  impact: number,
  urgency: number,
  confidence: number,
  metadata: Record<string, unknown> = {}
): Omit<IntelligenceSignal, "id" | "detectedAt" | "idempotencyKey" | "sourceEventIds"> {
  return {
    workspaceId: event.workspaceId,
    type,
    direction,
    severity,
    summary,
    relatedEntities,
    temporalWindow: defaultWindow(event.occurredAt),
    scores: { impact, urgency, confidence, strategicImportance: Math.round((impact * 0.6) + (urgency * 0.4)) },
    evidence: [eventEvidence(event, event.eventType, summary)],
    propagation: { depth: 0, parentSignalIds: [], childSignalIds: [] },
    graphLinks: relatedEntities,
    correlationKey: `${event.workspaceId}:${type}:${relatedEntities.map((item) => `${item.type}:${item.id}`).sort().join("|") || event.aggregateId}`,
    metadata,
  };
}

export const defaultSignalRules: SignalRule[] = [
  {
    id: "review-risk-to-reputation",
    eventTypes: ["review.risk.detected", "review.sentiment.changed"],
    map: (event) => {
      if (event.eventType !== "review.risk.detected" && event.eventType !== "review.sentiment.changed") return null;
      const payload = event.payload as { reviewId: string; riskLevel?: IntelligenceSeverity; sentiment?: string; summary: string };
      const severity = payload.riskLevel ?? (payload.sentiment === "NEGATIVE" ? "HIGH" : "MEDIUM");
      return signalDraft(event, "REPUTATION_RISK", severity === "LOW" ? "STABLE" : "INCREASED", severity, payload.summary, [entity(payload.reviewId, "REVIEW", event.workspaceId)], severityScore(severity), severityScore(severity), 0.82);
    },
  },
  {
    id: "competitor-signal-to-momentum",
    eventTypes: ["competitor.signal.detected", "competitor.benchmark.updated"],
    map: (event) => {
      if (event.eventType !== "competitor.signal.detected" && event.eventType !== "competitor.benchmark.updated") return null;
      const payload = event.payload as { competitorId: string; severity: IntelligenceSeverity; confidence: number; summary: string; signal: string };
      return signalDraft(event, "COMPETITOR_MOMENTUM", "INCREASED", payload.severity, payload.summary, [entity(payload.competitorId, "COMPETITOR", event.workspaceId)], severityScore(payload.severity), Math.min(100, severityScore(payload.severity) + 8), payload.confidence, { competitorSignal: payload.signal });
    },
  },
  {
    id: "analytics-risk-to-kpi",
    eventTypes: ["analytics.risk.detected", "analytics.anomaly.detected", "analytics.trend.detected"],
    map: (event) => {
      if (!event.eventType.startsWith("analytics.")) return null;
      const payload = event.payload as { id: string; priority?: IntelligenceSeverity; severity?: IntelligenceSeverity; narrative?: string; summary?: string; confidence?: number };
      const severity = payload.priority ?? payload.severity ?? "MEDIUM";
      return signalDraft(event, event.eventType === "analytics.risk.detected" ? "KPI_ANOMALY" : "LOCAL_VISIBILITY_DECLINE", "DECREASED", severity, payload.narrative ?? payload.summary ?? "Analytics pattern requires attention.", [entity(payload.id, "KPI", event.workspaceId)], severityScore(severity), severityScore(severity), payload.confidence ?? 0.7);
    },
  },
  {
    id: "workflow-failure-to-friction",
    eventTypes: ["workflow.failed", "automation.failed", "automation.dead_lettered"],
    map: (event) => {
      const payload = event.payload as { summary?: string; reason?: string; execution?: { id: string } };
      return signalDraft(event, "WORKFLOW_FRICTION", "INCREASED", event.eventType === "automation.dead_lettered" ? "CRITICAL" : "HIGH", payload.summary ?? payload.reason ?? "Execution failure may block recommended action.", [entity(payload.execution?.id ?? event.aggregateId, "WORKFLOW", event.workspaceId)], 74, 88, 0.86);
    },
  },
  {
    id: "recommendation-executed-to-outcome-watch",
    eventTypes: ["recommendation.executed"],
    map: (event) => signalDraft(event, "SPECIALTY_GROWTH_OPPORTUNITY", "EMERGING", "MEDIUM", "Recommendation execution created an outcome measurement window.", [entity(event.aggregateId, "RECOMMENDATION", event.workspaceId)], 52, 45, 0.66),
  },
];

function severityScore(severity: IntelligenceSeverity) {
  return ({ LOW: 30, MEDIUM: 55, HIGH: 78, CRITICAL: 94 } as const)[severity];
}

function stableKey(...parts: string[]) {
  return stableHash(parts.join(":"));
}

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function signalData(signal: IntelligenceSignal) {
  return {
    id: signal.id,
    workspaceId: signal.workspaceId,
    signalType: signal.type,
    direction: signal.direction,
    severity: signal.severity,
    summary: signal.summary,
    sourceEventIds: signal.sourceEventIds,
    relatedEntities: signal.relatedEntities,
    temporalWindow: signal.temporalWindow,
    scores: signal.scores,
    evidence: signal.evidence,
    propagation: signal.propagation,
    graphLinks: signal.graphLinks,
    correlationKey: signal.correlationKey,
    idempotencyKey: signal.idempotencyKey,
    detectedAt: new Date(signal.detectedAt),
    metadata: signal.metadata,
  };
}

function signalFromRow(row: Record<string, unknown>): IntelligenceSignal {
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    type: String(row.signalType) as SignalType,
    direction: String(row.direction) as SignalDirection,
    severity: String(row.severity) as IntelligenceSeverity,
    summary: String(row.summary),
    sourceEventIds: (row.sourceEventIds ?? []) as string[],
    relatedEntities: (row.relatedEntities ?? []) as EntityRef[],
    temporalWindow: row.temporalWindow as IntelligenceSignal["temporalWindow"],
    scores: row.scores as IntelligenceSignal["scores"],
    evidence: (row.evidence ?? []) as EvidenceRef[],
    propagation: row.propagation as IntelligenceSignal["propagation"],
    graphLinks: (row.graphLinks ?? []) as EntityRef[],
    correlationKey: String(row.correlationKey),
    idempotencyKey: String(row.idempotencyKey),
    detectedAt: row.detectedAt instanceof Date ? row.detectedAt.toISOString() : new Date(String(row.detectedAt)).toISOString(),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  };
}
