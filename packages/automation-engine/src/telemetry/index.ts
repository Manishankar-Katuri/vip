import type { AutomationExecution, AutomationExecutionStatus } from "../types";

export interface AutomationTelemetry {
  executionTransition(execution: AutomationExecution, from: AutomationExecutionStatus, durationMs?: number): void;
  executionTiming(execution: AutomationExecution, durationMs: number): void;
  retryScheduled(execution: AutomationExecution, delayMs: number): void;
  workflowFailure(execution: AutomationExecution, reason: string): void;
  queueLatency(execution: AutomationExecution, latencyMs: number): void;
  throughput(workspaceId: string, outcome: AutomationExecutionStatus): void;
}

export const NOOP_AUTOMATION_TELEMETRY: AutomationTelemetry = {
  executionTransition: () => undefined,
  executionTiming: () => undefined,
  retryScheduled: () => undefined,
  workflowFailure: () => undefined,
  queueLatency: () => undefined,
  throughput: () => undefined,
};
