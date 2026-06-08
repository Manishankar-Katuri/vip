import { z } from "zod";

const text = z.string().trim().min(1).max(1024);
const dateTime = z.string().datetime({ offset: true });

export const TelemetryContextSchema = z.object({
  correlationId: text,
  requestId: text.optional(),
  eventId: text.optional(),
  executionId: text.optional(),
  traceId: text,
  spanId: text,
  traceparent: text,
}).strict();
export type TelemetryContext = z.infer<typeof TelemetryContextSchema>;

export const LogRecordSchema = z.object({
  timestamp: dateTime,
  severity: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
  service: text,
  message: text,
  context: TelemetryContextSchema,
  attributes: z.record(z.unknown()).default({}),
}).strict();
export type LogRecord = z.infer<typeof LogRecordSchema>;

export type MetricName =
  | "api_latency_ms"
  | "queue_latency_ms"
  | "retry_count"
  | "execution_throughput"
  | "workflow_failure_count"
  | "prediction_generation_ms"
  | "automation_success_rate"
  | "event_throughput"
  | "event_subscriber_latency_ms"
  | "event_queue_lag_ms";

export interface MetricPoint {
  name: MetricName;
  value: number;
  kind: "COUNTER" | "GAUGE" | "HISTOGRAM";
  labels: Record<string, string>;
  recordedAt: string;
}

export const OperationalErrorSchema = z.object({
  id: text,
  category: z.enum(["VALIDATION", "DEPENDENCY", "TIMEOUT", "QUEUE", "DATABASE", "BUSINESS", "UNKNOWN"]),
  severity: z.enum(["WARNING", "ERROR", "CRITICAL"]),
  retryable: z.boolean(),
  code: text,
  message: text,
  stack: z.string().optional(),
  occurredAt: dateTime,
  context: TelemetryContextSchema,
  attributes: z.record(z.unknown()).default({}),
}).strict();
export type OperationalError = z.infer<typeof OperationalErrorSchema>;

export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY";
export interface ComponentHealth {
  component: "queue" | "database" | "orchestration" | "subscriber" | "prediction-engine";
  status: HealthStatus;
  checkedAt: string;
  latencyMs: number;
  details: Record<string, unknown>;
}

export interface OperationalDashboardDto {
  generatedAt: string;
  queueMetrics: { latencyMs: number; retryCount: number; status: HealthStatus };
  orchestrationMetrics: { throughput: number; queueLagMs: number; failureCount: number };
  automationMetrics: { throughput: number; successRate: number; failureCount: number };
  analyticsMetrics: { predictionGenerationMs: number };
  failureMetrics: { retryCount: number; workflowFailureCount: number };
}

export const ComponentHealthSchema = z.object({
  component: z.enum(["queue", "database", "orchestration", "subscriber", "prediction-engine"]),
  status: z.enum(["HEALTHY", "DEGRADED", "UNHEALTHY"]),
  checkedAt: dateTime,
  latencyMs: z.number().finite().nonnegative(),
  details: z.record(z.unknown()),
}).strict();

export const OperationalDashboardSchema = z.object({
  generatedAt: dateTime,
  queueMetrics: z.object({
    latencyMs: z.number().finite().nonnegative(),
    retryCount: z.number().finite().nonnegative(),
    status: z.enum(["HEALTHY", "DEGRADED", "UNHEALTHY"]),
  }).strict(),
  orchestrationMetrics: z.object({
    throughput: z.number().finite().nonnegative(),
    queueLagMs: z.number().finite().nonnegative(),
    failureCount: z.number().finite().nonnegative(),
  }).strict(),
  automationMetrics: z.object({
    throughput: z.number().finite().nonnegative(),
    successRate: z.number().finite().min(0).max(1),
    failureCount: z.number().finite().nonnegative(),
  }).strict(),
  analyticsMetrics: z.object({ predictionGenerationMs: z.number().finite().nonnegative() }).strict(),
  failureMetrics: z.object({
    retryCount: z.number().finite().nonnegative(),
    workflowFailureCount: z.number().finite().nonnegative(),
  }).strict(),
}).strict();
