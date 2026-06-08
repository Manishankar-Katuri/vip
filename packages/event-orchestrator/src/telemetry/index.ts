import type { DurableEventEnvelope } from "../dto";

export interface EventOrchestrationTelemetry {
  published(envelope: DurableEventEnvelope): void;
  delivered(envelope: DurableEventEnvelope, subscriberId: string, latencyMs: number): void;
  retried(envelope: DurableEventEnvelope, subscriberId: string, attempt: number): void;
  failed(envelope: DurableEventEnvelope, subscriberId: string): void;
  deadLettered(envelope: DurableEventEnvelope, subscriberId: string): void;
  queueLag(envelope: DurableEventEnvelope, lagMs: number): void;
}

export const NOOP_EVENT_ORCHESTRATION_TELEMETRY: EventOrchestrationTelemetry = {
  published: () => undefined,
  delivered: () => undefined,
  retried: () => undefined,
  failed: () => undefined,
  deadLettered: () => undefined,
  queueLag: () => undefined,
};

export interface EventTelemetrySnapshot {
  throughput: number;
  failures: number;
  retries: number;
  deadLetters: number;
  averageSubscriberLatencyMs: number;
  averageQueueLagMs: number;
}

export class InMemoryEventTelemetry implements EventOrchestrationTelemetry {
  private throughput = 0;
  private failures = 0;
  private retries = 0;
  private deadLetters = 0;
  private readonly latencies: number[] = [];
  private readonly lags: number[] = [];

  published() { this.throughput += 1; }
  delivered(_envelope: DurableEventEnvelope, _subscriberId: string, latencyMs: number) { this.latencies.push(latencyMs); }
  retried() { this.retries += 1; }
  failed() { this.failures += 1; }
  deadLettered() { this.deadLetters += 1; }
  queueLag(_envelope: DurableEventEnvelope, lagMs: number) { this.lags.push(lagMs); }

  snapshot(): EventTelemetrySnapshot {
    return {
      throughput: this.throughput,
      failures: this.failures,
      retries: this.retries,
      deadLetters: this.deadLetters,
      averageSubscriberLatencyMs: average(this.latencies),
      averageQueueLagMs: average(this.lags),
    };
  }
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}
