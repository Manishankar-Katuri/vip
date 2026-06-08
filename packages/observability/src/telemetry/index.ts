import type { LogRecord, MetricPoint, OperationalDashboardDto, OperationalError } from "../dto";
import type { TraceSpan } from "../tracing";

export interface OpenTelemetryExporter {
  exportSpans(spans: TraceSpan[]): Promise<void>;
  exportMetrics(points: MetricPoint[]): Promise<void>;
  exportLogs(records: LogRecord[]): Promise<void>;
}

export class OpenTelemetryAdapter {
  constructor(private readonly exporter: OpenTelemetryExporter) {}
  spans(spans: TraceSpan[]) { return this.exporter.exportSpans(spans); }
  metrics(points: MetricPoint[]) { return this.exporter.exportMetrics(points); }
  logs(records: LogRecord[]) { return this.exporter.exportLogs(records); }
}

export class PrometheusAdapter {
  export(points: MetricPoint[]) {
    const aggregates = new Map<string, number>();
    points.forEach((point) => {
      const labels = Object.entries(point.labels).sort().map(([key, value]) => `${key}="${escape(value)}"`).join(",");
      const name = `vip_${point.name}${labels ? `{${labels}}` : ""}`;
      aggregates.set(name, (aggregates.get(name) ?? 0) + point.value);
    });
    return [...aggregates.entries()].map(([name, value]) => `${name} ${value}`).join("\n");
  }
}

export interface GrafanaDashboardSink {
  publish(dashboard: OperationalDashboardDto): Promise<void>;
}
export class GrafanaAdapter {
  constructor(private readonly sink: GrafanaDashboardSink) {}
  publish(dashboard: OperationalDashboardDto) { return this.sink.publish(dashboard); }
}

export interface SentryClient {
  captureException(error: Error, context: Record<string, unknown>): void;
}
export class SentryAdapter {
  constructor(private readonly client: SentryClient) {}
  report(error: OperationalError) {
    const exception = new Error(error.message);
    exception.name = error.code;
    if (error.stack) exception.stack = error.stack;
    this.client.captureException(exception, {
      category: error.category, retryable: error.retryable, severity: error.severity,
      telemetryContext: error.context, attributes: error.attributes,
    });
  }
}

function escape(value: string) { return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\""); }
