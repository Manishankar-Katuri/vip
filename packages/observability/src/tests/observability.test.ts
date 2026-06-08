import assert from "node:assert/strict";
import test from "node:test";

import { OperationalDashboardService } from "../dashboards";
import { CentralErrorService, MemoryErrorStore } from "../errors";
import { createHealthProbe, HealthMonitoringService } from "../health";
import { ObservableAiApiTelemetry } from "../instrumentation";
import { MemoryLogSink, StructuredLogger } from "../logging";
import { MetricsRegistry } from "../metrics";
import { PrometheusAdapter } from "../telemetry";
import { InMemoryTracer, TracePropagation } from "../tracing";

test("propagates correlation and trace identifiers through spans and structured logs", () => {
  const tracer = new InMemoryTracer();
  const parent = tracer.startSpan("api.request", { correlationId: "corr-1", requestId: "req-1" });
  const headers = new TracePropagation().inject(parent.context);
  const extracted = new TracePropagation().extract(headers);
  const child = tracer.startSpan("event.orchestration", extracted);
  const sink = new MemoryLogSink();
  new StructuredLogger("orchestrator", sink).info("event delivered", child.context, { subscriber: "dashboard" });
  tracer.endSpan(child);

  assert.equal(child.context.correlationId, "corr-1");
  assert.equal(child.context.traceId, parent.context.traceId);
  assert.equal(sink.records[0].context.requestId, "req-1");
  assert.match(headers.traceparent, /^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
});

test("aggregates operational metrics into dashboard and Prometheus formats", () => {
  const metrics = new MetricsRegistry();
  metrics.histogram("queue_latency_ms", 20);
  metrics.histogram("queue_latency_ms", 40);
  metrics.counter("retry_count", 2);
  metrics.counter("execution_throughput", 4);
  metrics.counter("workflow_failure_count", 1);
  metrics.counter("event_throughput", 3, { topic: "analytics" });
  metrics.histogram("event_queue_lag_ms", 8);
  metrics.histogram("prediction_generation_ms", 12);
  new ObservableAiApiTelemetry(metrics).record({ endpoint: "insights", requestId: "req", outcome: "success", durationMs: 7 });

  const dashboard = new OperationalDashboardService(metrics).snapshot();
  const prometheus = new PrometheusAdapter().export(metrics.list());
  assert.equal(dashboard.queueMetrics.latencyMs, 30);
  assert.equal(dashboard.automationMetrics.successRate, 0.75);
  assert.equal(dashboard.analyticsMetrics.predictionGenerationMs, 12);
  assert.match(prometheus, /vip_event_throughput\{topic="analytics"\} 3/);
});

test("reports component health including unhealthy dependencies", async () => {
  const health = new HealthMonitoringService([
    createHealthProbe("queue", async () => ({ waiting: 0 })),
    createHealthProbe("database", async () => { throw new Error("database unavailable"); }),
    createHealthProbe("orchestration", async () => ({ subscribers: 3 })),
    createHealthProbe("subscriber", async () => ({ active: 2 })),
    createHealthProbe("prediction-engine", async () => ({ ready: true })),
  ]);
  const report = await health.check();
  assert.equal(report.status, "UNHEALTHY");
  assert.equal(report.components.find((component) => component.component === "database")?.status, "UNHEALTHY");
});

test("classifies and persists retryable versus terminal errors", async () => {
  const store = new MemoryErrorStore();
  const service = new CentralErrorService(store, () => "err-1");
  const context = new InMemoryTracer().startSpan("queue", { correlationId: "corr" }).context;
  const timeout = await service.capture(new Error("Queue timed out"), context);
  const validation = await service.capture(new Error("Schema validation failed"), context);

  assert.equal(timeout.retryable, true);
  assert.equal(timeout.category, "TIMEOUT");
  assert.equal(validation.retryable, false);
  assert.equal(validation.category, "VALIDATION");
  assert.equal((await store.list()).length, 2);
});
