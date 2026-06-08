import type { LogRecord, TelemetryContext } from "../dto";
import { LogRecordSchema } from "../dto";

export interface LogSink {
  write(record: LogRecord): void;
}

export class StructuredLogger {
  constructor(private readonly service: string, private readonly sink: LogSink) {}

  debug(message: string, context: TelemetryContext, attributes: Record<string, unknown> = {}) {
    this.record("DEBUG", message, context, attributes);
  }
  info(message: string, context: TelemetryContext, attributes: Record<string, unknown> = {}) {
    this.record("INFO", message, context, attributes);
  }
  warn(message: string, context: TelemetryContext, attributes: Record<string, unknown> = {}) {
    this.record("WARN", message, context, attributes);
  }
  error(message: string, context: TelemetryContext, attributes: Record<string, unknown> = {}) {
    this.record("ERROR", message, context, attributes);
  }

  private record(severity: LogRecord["severity"], message: string, context: TelemetryContext, attributes: Record<string, unknown>) {
    this.sink.write(LogRecordSchema.parse({
      timestamp: new Date().toISOString(), severity, service: this.service, message, context, attributes,
    }) as LogRecord);
  }
}

export class MemoryLogSink implements LogSink {
  readonly records: LogRecord[] = [];
  write(record: LogRecord) { this.records.push(record); }
}

export const jsonConsoleLogSink: LogSink = {
  write(record) {
    const serialized = JSON.stringify(record);
    if (record.severity === "ERROR") console.error(serialized);
    else console.info(serialized);
  },
};
