import { AutomationLifecycleEventSchema } from "../schemas";
import type {
  AutomationCompletedEvent,
  AutomationDeadLetteredEvent,
  AutomationExecution,
  AutomationFailedEvent,
  AutomationRetryingEvent,
  AutomationRolledBackEvent,
  AutomationScheduledEvent,
  AutomationStartedEvent,
  AutomationTriggeredEvent,
} from "../types";

export interface AutomationEventContext {
  eventId: string;
  idempotencyKey: string;
  occurredAt: string;
}

export class AutomationEventFactory {
  triggered(execution: AutomationExecution, context: AutomationEventContext): AutomationTriggeredEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.triggered",
      payload: {
        execution,
        ruleId: execution.ruleId,
        recommendationId: execution.recommendationId,
        sourceEventId: execution.sourceEventId,
      },
    }) as AutomationTriggeredEvent;
  }

  started(execution: AutomationExecution, context: AutomationEventContext): AutomationStartedEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.started",
      payload: { execution },
    }) as AutomationStartedEvent;
  }

  scheduled(execution: AutomationExecution, runAt: string, context: AutomationEventContext): AutomationScheduledEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.scheduled",
      payload: { execution, runAt },
    }) as AutomationScheduledEvent;
  }

  retrying(execution: AutomationExecution, reason: string, runAt: string, context: AutomationEventContext): AutomationRetryingEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.retrying",
      payload: { execution, reason, runAt },
    }) as AutomationRetryingEvent;
  }

  failed(
    execution: AutomationExecution,
    reason: string,
    retryScheduled: boolean,
    context: AutomationEventContext
  ): AutomationFailedEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.failed",
      payload: { execution, reason, retryScheduled, deadLetterEligible: execution.deadLetterEligible },
    }) as AutomationFailedEvent;
  }

  completed(
    execution: AutomationExecution,
    result: Record<string, unknown>,
    context: AutomationEventContext
  ): AutomationCompletedEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.completed",
      payload: { execution, result },
    }) as AutomationCompletedEvent;
  }

  rolledBack(execution: AutomationExecution, reason: string, context: AutomationEventContext): AutomationRolledBackEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.rolled_back",
      payload: { execution, reason },
    }) as AutomationRolledBackEvent;
  }

  deadLettered(execution: AutomationExecution, reason: string, context: AutomationEventContext): AutomationDeadLetteredEvent {
    return validate({
      ...envelope(execution, context),
      eventType: "automation.dead_lettered",
      payload: { execution, reason },
    }) as AutomationDeadLetteredEvent;
  }
}

function envelope(execution: AutomationExecution, context: AutomationEventContext) {
  return {
    eventId: context.eventId,
    eventVersion: 1 as const,
    aggregateType: "AUTOMATION_EXECUTION" as const,
    aggregateId: execution.id,
    workspaceId: execution.workspaceId,
    idempotencyKey: context.idempotencyKey,
    occurredAt: context.occurredAt,
  };
}

function validate(event: unknown) {
  return AutomationLifecycleEventSchema.parse(event);
}
