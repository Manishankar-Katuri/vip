import type { DurableEventEnvelope, IntelligenceEventTopic, OrchestratedEventType } from "../dto";

export interface SubscriberOptions {
  id: string;
  topics: IntelligenceEventTopic[];
  eventTypes?: OrchestratedEventType[];
  filter?: (envelope: DurableEventEnvelope) => boolean;
  maxAttempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  concurrency?: number;
}

export interface EventSubscriber extends SubscriberOptions {
  handle(envelope: DurableEventEnvelope): Promise<void>;
}

export class EventRoutingEngine {
  private readonly subscribers = new Map<string, EventSubscriber>();

  subscribe(subscriber: EventSubscriber) {
    if (this.subscribers.has(subscriber.id)) throw new Error(`Subscriber is already registered: ${subscriber.id}.`);
    if (!subscriber.topics.length) throw new Error("Subscriber must route at least one topic.");
    this.subscribers.set(subscriber.id, subscriber);
    return () => this.subscribers.delete(subscriber.id);
  }

  route(envelope: DurableEventEnvelope) {
    return [...this.subscribers.values()].filter((subscriber) =>
      subscriber.topics.includes(envelope.topic) &&
      (!subscriber.eventTypes || subscriber.eventTypes.includes(envelope.event.eventType)) &&
      (!subscriber.filter || subscriber.filter(envelope))
    );
  }

  health() {
    return { subscribers: this.subscribers.size, subscriberIds: [...this.subscribers.keys()] };
  }
}
