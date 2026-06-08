import { randomUUID } from "node:crypto";

import { AutomationEventFactory } from "../events";
import type { AutomationRepository } from "../repositories";
import { AutomationExecutionSchema } from "../schemas";
import type { AutomationDependencies } from "../services";
import { NOOP_AUTOMATION_TELEMETRY, type AutomationTelemetry } from "../telemetry";
import type { AutomationExecution, AutomationEventType, AutomationLog } from "../types";
import { AutomationExecutionStateMachine } from "./automation-execution-state-machine";

const DEFAULT_DEPENDENCIES: AutomationDependencies = {
  now: () => new Date().toISOString(),
  id: () => randomUUID(),
};

export class AutomationExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutomationExecutionError";
  }
}

export class AutomationExecutionService {
  private readonly events = new AutomationEventFactory();
  private readonly stateMachine = new AutomationExecutionStateMachine();

  constructor(
    private readonly repository: AutomationRepository,
    private readonly dependencies: AutomationDependencies = DEFAULT_DEPENDENCIES,
    private readonly telemetry: AutomationTelemetry = NOOP_AUTOMATION_TELEMETRY
  ) {}

  async start(workspaceId: string, executionId: string, operationId: string) {
    const retry = await this.persistedOperation(workspaceId, executionId, operationId);
    if (retry) return retry;
    const current = await this.requireExecution(workspaceId, executionId);
    if (!["QUEUED", "SCHEDULED", "RETRYING"].includes(current.status)) {
      throw new AutomationExecutionError("Only queued, scheduled, or retrying executions can start.");
    }
    this.stateMachine.assertTransition(current.status, "RUNNING");
    const now = this.dependencies.now();
    const execution = validExecution({
      ...current,
      status: "RUNNING",
      attempt: current.attempt + 1,
      startedAt: now,
      nextRetryAt: undefined,
    });
    const event = this.events.started(execution, this.context(execution, operationId, now));
    this.telemetry.queueLatency(execution, new Date(now).getTime() - new Date(current.queuedAt).getTime());
    this.telemetry.executionTransition(execution, current.status);
    return this.repository.updateExecution(execution, event, logFor(execution, event.eventType, "Automation execution started.", now));
  }

  async schedule(workspaceId: string, executionId: string, runAt: string, operationId: string) {
    const retry = await this.persistedOperation(workspaceId, executionId, operationId);
    if (retry) return retry;
    const current = await this.requireExecution(workspaceId, executionId);
    if (current.status !== "QUEUED" && current.status !== "RETRYING") {
      throw new AutomationExecutionError("Only queued or retrying executions can be scheduled.");
    }
    this.stateMachine.assertTransition(current.status, "SCHEDULED");
    const now = this.dependencies.now();
    const execution = validExecution({
      ...current, status: "SCHEDULED", scheduledFor: runAt,
      nextRetryAt: current.status === "RETRYING" ? runAt : current.nextRetryAt,
    });
    const event = this.events.scheduled(execution, runAt, this.context(execution, operationId, now));
    this.telemetry.executionTransition(execution, current.status);
    return this.repository.updateExecution(execution, event, logFor(execution, event.eventType, "Automation execution scheduled.", now));
  }

  async fail(workspaceId: string, executionId: string, reason: string, operationId: string) {
    const retry = await this.persistedOperation(workspaceId, executionId, operationId);
    if (retry) return retry;
    if (!reason.trim()) throw new AutomationExecutionError("A failure reason is required.");
    const current = await this.requireStatus(workspaceId, executionId, "RUNNING");
    const now = this.dependencies.now();
    const retryScheduled = current.attempt < current.retryPolicy.maxAttempts &&
      current.attempt < current.retryPolicy.deadLetterAfterAttempts;
    const nextStatus = retryScheduled ? "RETRYING" : "FAILED";
    this.stateMachine.assertTransition(current.status, nextStatus);
    const execution = validExecution({
      ...current,
      status: nextStatus,
      failedAt: now,
      nextRetryAt: retryScheduled
        ? new Date(new Date(now).getTime() + current.retryPolicy.backoffMs).toISOString()
        : undefined,
      lastFailure: reason,
      deadLetterEligible: !retryScheduled,
    });
    const event = retryScheduled && execution.nextRetryAt
      ? this.events.retrying(execution, reason, execution.nextRetryAt, this.context(execution, operationId, now))
      : this.events.failed(execution, reason, false, this.context(execution, operationId, now));
    if (retryScheduled && execution.nextRetryAt) {
      this.telemetry.retryScheduled(execution, new Date(execution.nextRetryAt).getTime() - new Date(now).getTime());
    }
    this.telemetry.workflowFailure(execution, reason);
    this.telemetry.executionTransition(execution, current.status);
    return this.repository.updateExecution(execution, event, logFor(execution, event.eventType, reason, now, "ERROR"));
  }

  async complete(
    workspaceId: string,
    executionId: string,
    result: Record<string, unknown>,
    operationId: string
  ) {
    const retry = await this.persistedOperation(workspaceId, executionId, operationId);
    if (retry) return retry;
    const current = await this.requireStatus(workspaceId, executionId, "RUNNING");
    this.stateMachine.assertTransition(current.status, "COMPLETED");
    const now = this.dependencies.now();
    const execution = validExecution({ ...current, status: "COMPLETED", completedAt: now, nextRetryAt: undefined });
    const event = this.events.completed(execution, result, this.context(execution, operationId, now));
    this.telemetry.executionTiming(execution, duration(execution, now));
    this.telemetry.throughput(execution.workspaceId, execution.status);
    return this.repository.updateExecution(execution, event, logFor(execution, event.eventType, "Automation execution completed.", now));
  }

  async rollBack(workspaceId: string, executionId: string, reason: string, operationId: string) {
    const retry = await this.persistedOperation(workspaceId, executionId, operationId);
    if (retry) return retry;
    if (!reason.trim()) throw new AutomationExecutionError("A rollback reason is required.");
    const current = await this.requireExecution(workspaceId, executionId);
    if (current.status !== "RUNNING" && current.status !== "COMPLETED") {
      throw new AutomationExecutionError("Only running or completed executions can be rolled back.");
    }
    const now = this.dependencies.now();
    this.stateMachine.assertTransition(current.status, "ROLLED_BACK");
    const execution = validExecution({ ...current, status: "ROLLED_BACK", rolledBackAt: now, lastFailure: reason });
    const event = this.events.rolledBack(execution, reason, this.context(execution, operationId, now));
    this.telemetry.executionTransition(execution, current.status);
    return this.repository.updateExecution(execution, event, logFor(execution, event.eventType, reason, now, "WARN"));
  }

  async deadLetter(workspaceId: string, executionId: string, reason: string, operationId: string) {
    const retry = await this.persistedOperation(workspaceId, executionId, operationId);
    if (retry) return retry;
    if (!reason.trim()) throw new AutomationExecutionError("A dead-letter reason is required.");
    const current = await this.requireExecution(workspaceId, executionId);
    this.stateMachine.assertTransition(current.status, "DEAD_LETTERED");
    const now = this.dependencies.now();
    const execution = validExecution({
      ...current, status: "DEAD_LETTERED", deadLetteredAt: now, lastFailure: reason, deadLetterEligible: true,
    });
    const event = this.events.deadLettered(execution, reason, this.context(execution, operationId, now));
    this.telemetry.executionTransition(execution, current.status);
    this.telemetry.throughput(execution.workspaceId, execution.status);
    return this.repository.updateExecution(execution, event, logFor(execution, event.eventType, reason, now, "ERROR"));
  }

  private async requireExecution(workspaceId: string, executionId: string) {
    const execution = await this.repository.findExecutionById(workspaceId, executionId);
    if (!execution) throw new AutomationExecutionError("Automation execution was not found.");
    return execution;
  }

  private async requireStatus(workspaceId: string, executionId: string, status: AutomationExecution["status"]) {
    const execution = await this.requireExecution(workspaceId, executionId);
    if (execution.status !== status) {
      throw new AutomationExecutionError(`Automation execution must be ${status.toLowerCase()} for this transition.`);
    }
    return execution;
  }

  private async persistedOperation(workspaceId: string, executionId: string, operationId: string) {
    if (!operationId.trim()) throw new AutomationExecutionError("Execution operations require an idempotency key.");
    const event = await this.repository.findEventByIdempotencyKey(workspaceId, `${executionId}:${operationId}`);
    return event?.payload.execution ?? null;
  }

  private context(execution: AutomationExecution, operationId: string, occurredAt: string) {
    return {
      eventId: this.dependencies.id(),
      idempotencyKey: `${execution.id}:${operationId}`,
      occurredAt,
    };
  }
}

function duration(execution: AutomationExecution, completedAt: string) {
  return execution.startedAt ? new Date(completedAt).getTime() - new Date(execution.startedAt).getTime() : 0;
}

function validExecution(value: unknown) {
  return AutomationExecutionSchema.parse(value) as AutomationExecution;
}

function logFor(
  execution: AutomationExecution,
  eventType: AutomationEventType,
  message: string,
  occurredAt: string,
  level: AutomationLog["level"] = "INFO"
): AutomationLog {
  return { executionId: execution.id, workspaceId: execution.workspaceId, eventType, message, occurredAt, level };
}
