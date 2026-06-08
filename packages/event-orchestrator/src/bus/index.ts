import { randomUUID } from "node:crypto";

import type { DurableEventEnvelope, EventMetadata, EventPriority, OrchestratedEvent } from "../dto";
import { EventRegistry, createDefaultEventRegistry } from "../registry";
import { EventRoutingEngine, type EventSubscriber } from "../routing";
import type { EventStore } from "../services";
import { SubscriberRuntime, type DispatchContext } from "../subscribers";
import { NOOP_EVENT_ORCHESTRATION_TELEMETRY, type EventOrchestrationTelemetry } from "../telemetry";

export interface EventBus {
  publish(event: OrchestratedEvent, metadata?: Partial<EventMetadata>, options?: PublishOptions): Promise<DurableEventEnvelope>;
  subscribe(subscriber: EventSubscriber): () => boolean;
}

export interface PublishOptions {
  priority?: EventPriority;
}

export class OrchestrationEventBus implements EventBus {
  private readonly aggregateDispatches = new Map<string, Promise<void>>();
  private readonly runtime: SubscriberRuntime;

  constructor(
    private readonly store: EventStore,
    private readonly registry: EventRegistry = createDefaultEventRegistry(),
    private readonly routing = new EventRoutingEngine(),
    private readonly telemetry: EventOrchestrationTelemetry = NOOP_EVENT_ORCHESTRATION_TELEMETRY,
    private readonly id: () => string = () => randomUUID(),
    runtime?: SubscriberRuntime
  ) {
    this.runtime = runtime ?? new SubscriberRuntime(store, telemetry);
  }

  subscribe(subscriber: EventSubscriber) {
    return this.routing.subscribe(subscriber);
  }

  async publish(input: OrchestratedEvent, metadata: Partial<EventMetadata> = {}, options: PublishOptions = {}) {
    const event = this.registry.validate(input);
    const prior = await this.store.findByEventId(event.eventId);
    if (prior) return prior;
    const envelope: DurableEventEnvelope = {
      envelopeId: this.id(),
      event,
      topic: this.registry.topicFor(event),
      sequence: await this.store.nextSequence(),
      publishedAt: new Date().toISOString(),
      state: "PENDING",
      priority: options.priority ?? inferPriority(event),
      metadata: {
        correlationId: metadata.correlationId ?? event.eventId,
        producer: metadata.producer ?? "vip-platform",
        requestId: metadata.requestId,
        executionId: metadata.executionId,
        traceparent: metadata.traceparent,
        causationId: metadata.causationId,
        actor: metadata.actor,
        source: metadata.source,
        tags: metadata.tags,
        attributes: metadata.attributes,
      },
    };
    const persisted = await this.store.append(envelope);
    if (persisted.envelopeId !== envelope.envelopeId) return persisted;
    this.telemetry.published(persisted);
    await this.orderedDispatch(persisted);
    return (await this.store.findByEventId(event.eventId)) ?? persisted;
  }

  async dispatch(envelope: DurableEventEnvelope, context: DispatchContext = {}) {
    await this.store.updateState(envelope.envelopeId, "DISPATCHING");
    this.telemetry.queueLag(envelope, Math.max(0, Date.now() - new Date(envelope.publishedAt).getTime()));
    const subscribers = this.routing.route(envelope);
    const results = await Promise.all(subscribers.map((subscriber) => this.runtime.dispatch(subscriber, envelope, context)));
    const deadLettered = results.some((result) => result.status === "DEAD_LETTERED");
    await this.store.updateState(envelope.envelopeId, deadLettered ? "DEAD_LETTERED" : "DELIVERED");
    return results;
  }

  health() {
    return this.routing.health();
  }

  private async orderedDispatch(envelope: DurableEventEnvelope) {
    const key = `${envelope.event.workspaceId}:${envelope.event.aggregateType}:${envelope.event.aggregateId}`;
    const previous = this.aggregateDispatches.get(key) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(async () => { await this.dispatch(envelope); });
    this.aggregateDispatches.set(key, current);
    try {
      await current;
    } finally {
      if (this.aggregateDispatches.get(key) === current) this.aggregateDispatches.delete(key);
    }
  }
}

function inferPriority(event: OrchestratedEvent): EventPriority {
  if (
    event.eventType === "review.risk.detected" ||
    event.eventType === "automation.dead_lettered" ||
    event.eventType === "workflow.failed"
  ) return "CRITICAL";
  if (
    event.eventType === "intelligence.signal.raised" ||
    event.eventType === "intelligence.priority.created" ||
    event.eventType === "intelligence.recommendation.reasoned" ||
    event.eventType === "intelligence.causal_chain.detected" ||
    event.eventType === "agent.observation.recorded" ||
    event.eventType === "agent.plan.created" ||
    event.eventType === "agent.action.executed" ||
    event.eventType === "agent.outcome.recorded" ||
    event.eventType === "outcome.recorded" ||
    event.eventType === "learning.confidence.updated" ||
    event.eventType === "learning.pattern.discovered" ||
    event.eventType === "operations.mission.created" ||
    event.eventType === "operations.mission.progressed" ||
    event.eventType === "operations.workflow.synthesized" ||
    event.eventType === "operations.forecast.generated" ||
    event.eventType === "operations.control_plane.snapshot" ||
    event.eventType === "analytics.risk.detected" ||
    event.eventType === "competitor.signal.detected" ||
    event.eventType === "recommendation.approved"
  ) return "HIGH";
  return "NORMAL";
}
