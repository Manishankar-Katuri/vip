import type { DurableEventEnvelope, EventPriority } from "../dto";

export interface EventTransport {
  enqueue(envelope: DurableEventEnvelope): Promise<void>;
  dequeue(options?: DequeueOptions): Promise<DurableEventEnvelope | null>;
  ack(envelope: DurableEventEnvelope): Promise<void>;
  fail(envelope: DurableEventEnvelope, reason: string): Promise<void>;
}

export interface DequeueOptions {
  topics?: DurableEventEnvelope["topic"][];
}

export interface RedisLikeClient {
  lpush(key: string, value: string): Promise<unknown>;
  rpop(key: string): Promise<string | null>;
}

export class PriorityEventTransport implements EventTransport {
  private readonly queues = new Map<EventPriority, DurableEventEnvelope[]>();

  async enqueue(envelope: DurableEventEnvelope) {
    const queue = this.queues.get(envelope.priority) ?? [];
    queue.push(envelope);
    this.queues.set(envelope.priority, queue);
  }

  async dequeue(options: DequeueOptions = {}) {
    for (const priority of ["CRITICAL", "HIGH", "NORMAL", "LOW"] satisfies EventPriority[]) {
      const queue = this.queues.get(priority) ?? [];
      const index = queue.findIndex((envelope) => !options.topics?.length || options.topics.includes(envelope.topic));
      if (index >= 0) return queue.splice(index, 1)[0];
    }
    return null;
  }

  async ack() { return undefined; }
  async fail(_envelope: DurableEventEnvelope, _reason: string) { return undefined; }
}

export class RedisEventTransport implements EventTransport {
  constructor(
    private readonly client: RedisLikeClient,
    private readonly keyPrefix = "vip:intelligence-events"
  ) {}

  async enqueue(envelope: DurableEventEnvelope) {
    await this.client.lpush(this.key(envelope.priority), JSON.stringify(envelope));
  }

  async dequeue() {
    for (const priority of ["CRITICAL", "HIGH", "NORMAL", "LOW"] satisfies EventPriority[]) {
      const value = await this.client.rpop(this.key(priority));
      if (value) return JSON.parse(value) as DurableEventEnvelope;
    }
    return null;
  }

  async ack() { return undefined; }
  async fail(envelope: DurableEventEnvelope, reason: string) {
    await this.client.lpush(`${this.keyPrefix}:failed`, JSON.stringify({ envelope, reason, failedAt: new Date().toISOString() }));
  }

  private key(priority: EventPriority) {
    return `${this.keyPrefix}:${priority.toLowerCase()}`;
  }
}
