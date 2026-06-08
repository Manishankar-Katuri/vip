import type { DeadLetterRecord, DurableEventEnvelope, EventDelivery, ReplayQuery } from "../dto";
import { DurableEventEnvelopeSchema } from "../schemas";

export interface EventStore {
  append(envelope: DurableEventEnvelope): Promise<DurableEventEnvelope>;
  updateState(envelopeId: string, state: DurableEventEnvelope["state"]): Promise<void>;
  findByEventId(eventId: string): Promise<DurableEventEnvelope | null>;
  query(query: ReplayQuery): Promise<DurableEventEnvelope[]>;
  nextSequence(): Promise<number>;
  recordDelivery(delivery: EventDelivery): Promise<void>;
  hasSucceeded(deliveryKey: string): Promise<boolean>;
  deadLetter(record: DeadLetterRecord): Promise<void>;
  listDeadLetters(): Promise<DeadLetterRecord[]>;
}

export class InMemoryEventStore implements EventStore {
  private readonly envelopes: DurableEventEnvelope[] = [];
  private readonly deliveries = new Map<string, EventDelivery>();
  private readonly deadLetterRecords: DeadLetterRecord[] = [];

  async append(envelope: DurableEventEnvelope) {
    const existing = this.envelopes.find((value) =>
      value.event.eventId === envelope.event.eventId ||
      (value.event.workspaceId === envelope.event.workspaceId && value.event.idempotencyKey === envelope.event.idempotencyKey)
    );
    if (existing) return existing;
    const valid = DurableEventEnvelopeSchema.parse(envelope) as DurableEventEnvelope;
    this.envelopes.push(valid);
    return valid;
  }

  async findByEventId(eventId: string) {
    return this.envelopes.find((value) => value.event.eventId === eventId) ?? null;
  }
  async updateState(envelopeId: string, state: DurableEventEnvelope["state"]) {
    const index = this.envelopes.findIndex((value) => value.envelopeId === envelopeId);
    if (index >= 0) this.envelopes[index] = { ...this.envelopes[index], state };
  }

  async query(query: ReplayQuery) {
    return this.envelopes.filter((value) =>
      (!query.workspaceId || value.event.workspaceId === query.workspaceId) &&
      (!query.aggregateId || value.event.aggregateId === query.aggregateId) &&
      (!query.eventType || value.event.eventType === query.eventType) &&
      (!query.from || value.event.occurredAt >= query.from) &&
      (!query.to || value.event.occurredAt <= query.to)
    ).sort((left, right) => left.sequence - right.sequence);
  }

  async nextSequence() { return this.envelopes.length + 1; }
  async recordDelivery(delivery: EventDelivery) { this.deliveries.set(delivery.deliveryKey, delivery); }
  async hasSucceeded(deliveryKey: string) { return this.deliveries.get(deliveryKey)?.status === "SUCCEEDED"; }
  async deadLetter(record: DeadLetterRecord) { this.deadLetterRecords.push(record); }
  async listDeadLetters() { return [...this.deadLetterRecords]; }
}

interface PrismaDelegate {
  create(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<Record<string, unknown>>;
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  findMany(args: unknown): Promise<Record<string, unknown>[]>;
  upsert(args: unknown): Promise<Record<string, unknown>>;
  count(args?: unknown): Promise<number>;
}

export interface EventOrchestratorPrismaClient {
  eventEnvelope: PrismaDelegate;
  eventDelivery: PrismaDelegate;
  eventDeadLetter: PrismaDelegate;
}

export class PrismaEventStore implements EventStore {
  constructor(private readonly database: EventOrchestratorPrismaClient) {}

  async append(envelope: DurableEventEnvelope) {
    const value = DurableEventEnvelopeSchema.parse(envelope) as DurableEventEnvelope;
    const prior = await this.database.eventEnvelope.findFirst({
      where: { OR: [{ eventId: value.event.eventId }, { workspaceId: value.event.workspaceId, idempotencyKey: value.event.idempotencyKey }] },
    });
    if (prior) return envelopeFrom(prior);
    const row = await this.database.eventEnvelope.create({ data: envelopeData(value) });
    return envelopeFrom(row);
  }

  async findByEventId(eventId: string) {
    const row = await this.database.eventEnvelope.findFirst({ where: { eventId } });
    return row ? envelopeFrom(row) : null;
  }
  async updateState(envelopeId: string, state: DurableEventEnvelope["state"]) {
    await this.database.eventEnvelope.update({ where: { id: envelopeId }, data: { state } });
  }

  async query(query: ReplayQuery) {
    const rows = await this.database.eventEnvelope.findMany({
      where: {
        workspaceId: query.workspaceId,
        aggregateId: query.aggregateId,
        eventType: query.eventType,
        occurredAt: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
      },
      orderBy: { sequence: "asc" },
    });
    return rows.map(envelopeFrom);
  }

  async nextSequence() { return (await this.database.eventEnvelope.count()) + 1; }

  async recordDelivery(delivery: EventDelivery) {
    await this.database.eventDelivery.upsert({
      where: { deliveryKey: delivery.deliveryKey },
      create: { ...delivery, startedAt: new Date(delivery.startedAt), completedAt: new Date(delivery.completedAt) },
      update: { ...delivery, startedAt: new Date(delivery.startedAt), completedAt: new Date(delivery.completedAt) },
    });
  }

  async hasSucceeded(deliveryKey: string) {
    return Boolean(await this.database.eventDelivery.findFirst({ where: { deliveryKey, status: "SUCCEEDED" } }));
  }

  async deadLetter(record: DeadLetterRecord) {
    await this.database.eventDeadLetter.create({ data: {
      envelopeId: record.envelope.envelopeId, subscriberId: record.subscriberId, attempts: record.attempts,
      workspaceId: record.envelope.event.workspaceId, failure: record.failure,
      deadLetteredAt: new Date(record.deadLetteredAt), snapshot: record.envelope,
    } });
  }

  async listDeadLetters() {
    const rows = await this.database.eventDeadLetter.findMany({ orderBy: { deadLetteredAt: "asc" } });
    return rows.map((row) => ({
      envelope: DurableEventEnvelopeSchema.parse(row.snapshot) as DurableEventEnvelope,
      subscriberId: String(row.subscriberId), attempts: Number(row.attempts), failure: String(row.failure),
      deadLetteredAt: dateIso(row.deadLetteredAt),
    }));
  }
}

function envelopeData(value: DurableEventEnvelope) {
  return {
    id: value.envelopeId, eventId: value.event.eventId, workspaceId: value.event.workspaceId,
    idempotencyKey: value.event.idempotencyKey, topic: value.topic, eventType: value.event.eventType,
    eventVersion: value.event.eventVersion, aggregateType: value.event.aggregateType, aggregateId: value.event.aggregateId,
    event: value.event, metadata: value.metadata, priority: value.priority, publishedAt: new Date(value.publishedAt),
    occurredAt: new Date(value.event.occurredAt), state: value.state,
  };
}
function envelopeFrom(row: Record<string, unknown>) {
  return DurableEventEnvelopeSchema.parse({
    envelopeId: String(row.id), topic: row.topic, event: row.event, metadata: row.metadata,
    priority: row.priority ?? "NORMAL",
    publishedAt: dateIso(row.publishedAt), sequence: Number(row.sequence), state: row.state,
  }) as DurableEventEnvelope;
}
function dateIso(value: unknown) { return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString(); }
