import type { HealthStatus } from "../dto";
import type { ErrorStore } from "../errors";
import { CentralErrorService } from "../errors";
import type { HealthProbe } from "../health";
import { HealthMonitoringService } from "../health";
import type { LogSink } from "../logging";
import { StructuredLogger } from "../logging";
import { MetricsRegistry } from "../metrics";
import { OperationalDashboardService } from "../dashboards";
import { RuntimeInstrumentation } from "../instrumentation";
import { InMemoryTracer } from "../tracing";

export interface ObservabilityDependencies {
  serviceName: string;
  logSink: LogSink;
  errorStore: ErrorStore;
  healthProbes?: HealthProbe[];
}

export class ObservabilityService {
  readonly metrics = new MetricsRegistry();
  readonly tracer = new InMemoryTracer();
  readonly logger: StructuredLogger;
  readonly errors: CentralErrorService;
  readonly health: HealthMonitoringService;
  readonly dashboards: OperationalDashboardService;
  readonly instrumentation: RuntimeInstrumentation;

  constructor(dependencies: ObservabilityDependencies) {
    this.logger = new StructuredLogger(dependencies.serviceName, dependencies.logSink);
    this.errors = new CentralErrorService(dependencies.errorStore);
    this.health = new HealthMonitoringService(dependencies.healthProbes ?? []);
    this.dashboards = new OperationalDashboardService(this.metrics);
    this.instrumentation = new RuntimeInstrumentation(this.tracer, this.metrics, this.logger, this.errors);
  }

  dashboard(queueStatus: HealthStatus = "HEALTHY") {
    return this.dashboards.snapshot(queueStatus);
  }
}
