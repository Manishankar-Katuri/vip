import type { HealthStatus, OperationalDashboardDto } from "../dto";
import { OperationalDashboardSchema } from "../dto";
import type { MetricsRegistry } from "../metrics";

export class OperationalDashboardService {
  constructor(private readonly metrics: MetricsRegistry) {}

  snapshot(queueStatus: HealthStatus = "HEALTHY") {
    const attempts = this.metrics.sum("execution_throughput");
    const failures = this.metrics.sum("workflow_failure_count");
    const successes = Math.max(0, attempts - failures);
    return OperationalDashboardSchema.parse({
      generatedAt: new Date().toISOString(),
      queueMetrics: {
        latencyMs: this.metrics.average("queue_latency_ms"),
        retryCount: this.metrics.sum("retry_count"),
        status: queueStatus,
      },
      orchestrationMetrics: {
        throughput: this.metrics.sum("event_throughput"),
        queueLagMs: this.metrics.average("event_queue_lag_ms"),
        failureCount: failures,
      },
      automationMetrics: {
        throughput: attempts,
        successRate: attempts ? successes / attempts : 0,
        failureCount: failures,
      },
      analyticsMetrics: { predictionGenerationMs: this.metrics.average("prediction_generation_ms") },
      failureMetrics: { retryCount: this.metrics.sum("retry_count"), workflowFailureCount: failures },
    }) as OperationalDashboardDto;
  }
}
