import { randomBytes, randomUUID } from "node:crypto";

import type { TelemetryContext } from "../dto";
import { TelemetryContextSchema } from "../dto";

export interface TraceSpan {
  name: string;
  context: TelemetryContext;
  startedAt: string;
  completedAt?: string;
  status?: "OK" | "ERROR";
  attributes: Record<string, string | number | boolean>;
}

export interface Tracer {
  startSpan(name: string, parent?: Partial<TelemetryContext>, attributes?: TraceSpan["attributes"]): TraceSpan;
  endSpan(span: TraceSpan, status?: "OK" | "ERROR"): void;
}

export class InMemoryTracer implements Tracer {
  readonly spans: TraceSpan[] = [];

  startSpan(name: string, parent: Partial<TelemetryContext> = {}, attributes: TraceSpan["attributes"] = {}) {
    const traceId = parent.traceId ?? hex(16);
    const spanId = hex(8);
    const context = TelemetryContextSchema.parse({
      correlationId: parent.correlationId ?? randomUUID(),
      requestId: parent.requestId,
      eventId: parent.eventId,
      executionId: parent.executionId,
      traceId,
      spanId,
      traceparent: `00-${traceId}-${spanId}-01`,
    }) as TelemetryContext;
    const span = { name, context, attributes, startedAt: new Date().toISOString() };
    this.spans.push(span);
    return span;
  }

  endSpan(span: TraceSpan, status: "OK" | "ERROR" = "OK") {
    span.completedAt = new Date().toISOString();
    span.status = status;
  }
}

export class TracePropagation {
  inject(context: TelemetryContext) {
    return {
      "x-correlation-id": context.correlationId,
      "x-request-id": context.requestId ?? "",
      traceparent: context.traceparent,
    };
  }

  extract(headers: Record<string, string | undefined>) {
    const traceparent = headers.traceparent;
    const parts = traceparent?.split("-");
    return {
      correlationId: headers["x-correlation-id"],
      requestId: headers["x-request-id"] || undefined,
      traceId: parts?.length === 4 ? parts[1] : undefined,
      traceparent,
    };
  }
}

function hex(bytes: number) { return randomBytes(bytes).toString("hex"); }
