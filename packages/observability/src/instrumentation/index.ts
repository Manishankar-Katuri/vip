import type { AutomationExecution, AutomationExecutionStatus, AutomationTelemetry } from "@vip/automation-engine";
import type { DurableEventEnvelope, EventOrchestrationTelemetry } from "@vip/event-orchestrator";

import type { MetricName, TelemetryContext } from "../dto";
import type { CentralErrorService } from "../errors";
import type { StructuredLogger } from "../logging";
import type { MetricsRegistry } from "../metrics";
import type { Tracer } from "../tracing";

export class RuntimeInstrumentation {
  constructor(
    private readonly tracer: Tracer,
    private readonly metrics: MetricsRegistry,
    private readonly logger?: StructuredLogger,
    private readonly errors?: CentralErrorService
  ) {}

  async api<T>(name: string, context: Partial<TelemetryContext>, operation: () => Promise<T>) {
    return this.measure(`api.${name}`, "api_latency_ms", context, operation);
  }
  async recommendation<T>(context: Partial<TelemetryContext>, operation: () => Promise<T>) {
    return this.trace("recommendation.generate", context, operation);
  }
  async analyticsPrediction<T>(context: Partial<TelemetryContext>, operation: () => Promise<T>) {
    return this.measure("analytics.predict", "prediction_generation_ms", context, operation);
  }
  async queue<T>(context: Partial<TelemetryContext>, operation: () => Promise<T>) {
    return this.measure("queue.process", "queue_latency_ms", context, operation);
  }
  async orchestration<T>(context: Partial<TelemetryContext>, operation: () => Promise<T>) {
    return this.measure("event.orchestrate", "event_subscriber_latency_ms", context, operation);
  }

  private async measure<T>(
    name: string, metric: MetricName, parent: Partial<TelemetryContext>, operation: () => Promise<T>
  ) {
    const span = this.tracer.startSpan(name, parent);
    const started = Date.now();
    try {
      const result = await operation();
      this.metrics.histogram(metric, Date.now() - started, { operation: name, outcome: "success" });
      this.tracer.endSpan(span, "OK");
      this.logger?.info(`${name} completed.`, span.context);
      return result;
    } catch (error) {
      this.metrics.histogram(metric, Date.now() - started, { operation: name, outcome: "failure" });
      this.tracer.endSpan(span, "ERROR");
      this.logger?.error(`${name} failed.`, span.context);
      await this.errors?.capture(error, span.context, { operation: name });
      throw error;
    }
  }

  private async trace<T>(name: string, parent: Partial<TelemetryContext>, operation: () => Promise<T>) {
    const span = this.tracer.startSpan(name, parent);
    try {
      const result = await operation();
      this.tracer.endSpan(span, "OK");
      this.logger?.info(`${name} completed.`, span.context);
      return result;
    } catch (error) {
      this.tracer.endSpan(span, "ERROR");
      this.logger?.error(`${name} failed.`, span.context);
      await this.errors?.capture(error, span.context, { operation: name });
      throw error;
    }
  }
}

export class ObservableAutomationTelemetry implements AutomationTelemetry {
  constructor(private readonly metrics: MetricsRegistry) {}
  executionTransition(_execution: AutomationExecution, _from: AutomationExecutionStatus) {}
  executionTiming(execution: AutomationExecution, durationMs: number) {
    this.metrics.histogram("queue_latency_ms", durationMs, { workspaceId: execution.workspaceId });
  }
  retryScheduled(execution: AutomationExecution) {
    this.metrics.counter("retry_count", 1, { workspaceId: execution.workspaceId, system: "automation" });
  }
  workflowFailure(execution: AutomationExecution) {
    this.metrics.counter("workflow_failure_count", 1, { workspaceId: execution.workspaceId });
  }
  queueLatency(execution: AutomationExecution, latencyMs: number) {
    this.metrics.histogram("queue_latency_ms", latencyMs, { workspaceId: execution.workspaceId });
  }
  throughput(workspaceId: string, outcome: AutomationExecutionStatus) {
    this.metrics.counter("execution_throughput", 1, { workspaceId, outcome });
    this.metrics.gauge("automation_success_rate", outcome === "COMPLETED" ? 1 : 0, { workspaceId });
  }
}

export class ObservableEventTelemetry implements EventOrchestrationTelemetry {
  constructor(private readonly metrics: MetricsRegistry) {}
  published(envelope: DurableEventEnvelope) { this.metrics.counter("event_throughput", 1, { topic: envelope.topic }); }
  delivered(_envelope: DurableEventEnvelope, subscriberId: string, latencyMs: number) {
    this.metrics.histogram("event_subscriber_latency_ms", latencyMs, { subscriberId });
  }
  retried(envelope: DurableEventEnvelope) { this.metrics.counter("retry_count", 1, { system: "orchestration", topic: envelope.topic }); }
  failed() { this.metrics.counter("workflow_failure_count"); }
  deadLettered() { this.metrics.counter("workflow_failure_count", 1, { outcome: "dead_letter" }); }
  queueLag(envelope: DurableEventEnvelope, lagMs: number) {
    this.metrics.histogram("event_queue_lag_ms", lagMs, { topic: envelope.topic });
  }
}

export interface CompatibleAiApiTelemetryEvent {
  endpoint: string;
  requestId: string;
  outcome: "success" | "failure";
  durationMs: number;
  code?: string;
}
export class ObservableAiApiTelemetry {
  constructor(private readonly metrics: MetricsRegistry) {}
  record(event: CompatibleAiApiTelemetryEvent) {
    this.metrics.histogram("api_latency_ms", event.durationMs, { endpoint: event.endpoint, outcome: event.outcome });
    if (event.outcome === "failure") this.metrics.counter("workflow_failure_count", 1, { endpoint: event.endpoint });
  }
}
