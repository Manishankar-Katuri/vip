import { MetricsRegistry, ObservableAiApiTelemetry } from "@vip/observability";

export interface AiApiTelemetryEvent {
  endpoint: string;
  requestId: string;
  outcome: "success" | "failure";
  durationMs: number;
  code?: string;
}

export interface AiApiTelemetry {
  record(event: AiApiTelemetryEvent): void;
}

export const aiApiMetrics = new MetricsRegistry();
const observableAiApiTelemetry = new ObservableAiApiTelemetry(aiApiMetrics);

export const consoleAiApiTelemetry: AiApiTelemetry = {
  record(event) {
    observableAiApiTelemetry.record(event);
    const output = { source: "ai-api", ...event };
    if (event.outcome === "failure") {
      console.error(output);
      return;
    }
    console.info(output);
  },
};
