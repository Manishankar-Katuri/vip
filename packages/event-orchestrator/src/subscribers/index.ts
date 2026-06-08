import type { DeadLetterRecord, DurableEventEnvelope, EventDelivery } from "../dto";
import type { EventSubscriber } from "../routing";
import type { EventStore } from "../services";
import { NOOP_EVENT_ORCHESTRATION_TELEMETRY, type EventOrchestrationTelemetry } from "../telemetry";

export interface DispatchContext {
  replayId?: string;
}

export interface SubscriberDispatchOutcome {
  subscriberId: string;
  status: "DELIVERED" | "DEAD_LETTERED" | "SKIPPED";
  attempts: number;
}

export class SubscriberRuntime {
  private readonly gates = new Map<string, ConcurrencyGate>();

  constructor(
    private readonly store: EventStore,
    private readonly telemetry: EventOrchestrationTelemetry = NOOP_EVENT_ORCHESTRATION_TELEMETRY
  ) {}

  async dispatch(subscriber: EventSubscriber, envelope: DurableEventEnvelope, context: DispatchContext = {}) {
    const deliveryKey = `${envelope.envelopeId}:${subscriber.id}:${context.replayId ?? "live"}`;
    if (await this.store.hasSucceeded(deliveryKey)) {
      return { subscriberId: subscriber.id, status: "SKIPPED", attempts: 0 } satisfies SubscriberDispatchOutcome;
    }
    const gate = this.gates.get(subscriber.id) ?? new ConcurrencyGate(subscriber.concurrency ?? 1);
    this.gates.set(subscriber.id, gate);
    return gate.run(() => this.attempt(subscriber, envelope, deliveryKey));
  }

  private async attempt(subscriber: EventSubscriber, envelope: DurableEventEnvelope, deliveryKey: string) {
    const maxAttempts = positive(subscriber.maxAttempts, 3);
    const timeoutMs = positive(subscriber.timeoutMs, 30_000);
    let failure = "Subscriber failed without an error message.";

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const started = Date.now();
      try {
        await withTimeout(subscriber.handle(envelope), timeoutMs);
        const latencyMs = Date.now() - started;
        await this.store.recordDelivery(delivery(deliveryKey, envelope, subscriber.id, attempt, "SUCCEEDED", latencyMs));
        this.telemetry.delivered(envelope, subscriber.id, latencyMs);
        return { subscriberId: subscriber.id, status: "DELIVERED", attempts: attempt } satisfies SubscriberDispatchOutcome;
      } catch (error) {
        failure = error instanceof Error ? error.message : "Subscriber failed with an unknown error.";
        const latencyMs = Date.now() - started;
        this.telemetry.failed(envelope, subscriber.id);
        await this.store.recordDelivery(delivery(deliveryKey, envelope, subscriber.id, attempt, "FAILED", latencyMs, failure));
        if (attempt < maxAttempts) {
          this.telemetry.retried(envelope, subscriber.id, attempt + 1);
          await delay(Math.max(0, subscriber.retryDelayMs ?? 0));
        }
      }
    }

    const record: DeadLetterRecord = {
      envelope, subscriberId: subscriber.id, attempts: maxAttempts, failure, deadLetteredAt: new Date().toISOString(),
    };
    await this.store.deadLetter(record);
    await this.store.recordDelivery(delivery(deliveryKey, envelope, subscriber.id, maxAttempts, "DEAD_LETTERED", 0, failure));
    this.telemetry.deadLettered(envelope, subscriber.id);
    return { subscriberId: subscriber.id, status: "DEAD_LETTERED", attempts: maxAttempts } satisfies SubscriberDispatchOutcome;
  }
}

function delivery(
  deliveryKey: string, envelope: DurableEventEnvelope, subscriberId: string, attempt: number,
  status: EventDelivery["status"], latencyMs: number, error?: string
): EventDelivery {
  const completedAt = new Date().toISOString();
  return { envelopeId: envelope.envelopeId, subscriberId, deliveryKey, attempt, status, startedAt: completedAt, completedAt, latencyMs, error };
}
function positive(value: number | undefined, fallback: number) {
  return value && Number.isInteger(value) && value > 0 ? value : fallback;
}
function delay(milliseconds: number) {
  return milliseconds ? new Promise<void>((resolve) => setTimeout(resolve, milliseconds)) : Promise.resolve();
}
async function withTimeout<T>(operation: Promise<T>, timeoutMs: number) {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Subscriber timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

class ConcurrencyGate {
  private active = 0;
  private readonly waiting: Array<() => void> = [];
  constructor(private readonly limit: number) {}

  async run<T>(operation: () => Promise<T>) {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active += 1;
    try {
      return await operation();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}
