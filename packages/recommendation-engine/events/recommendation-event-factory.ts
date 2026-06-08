import { RecommendationLifecycleEventSchema } from "../schemas";
import type {
  Recommendation,
  RecommendationActor,
  RecommendationApprovedEvent,
  RecommendationCreatedEvent,
  RecommendationExecutedEvent,
  RecommendationRejectedEvent,
  RecommendationUpdatedEvent,
} from "../types";

interface EventContext {
  eventId: string;
  idempotencyKey: string;
  occurredAt: string;
}

export class RecommendationEventFactory {
  created(recommendation: Recommendation, context: EventContext): RecommendationCreatedEvent {
    return validate({
      ...envelope(recommendation, context),
      eventType: "recommendation.created",
      payload: { recommendation },
    }) as RecommendationCreatedEvent;
  }

  updated(
    recommendation: Recommendation,
    changedFields: string[],
    actor: RecommendationActor,
    context: EventContext
  ): RecommendationUpdatedEvent {
    return validate({
      ...envelope(recommendation, context),
      eventType: "recommendation.updated",
      payload: { recommendation, changedFields, actor },
    }) as RecommendationUpdatedEvent;
  }

  approved(
    recommendation: Recommendation,
    actor: RecommendationActor,
    context: EventContext,
    note?: string
  ): RecommendationApprovedEvent {
    return validate({
      ...envelope(recommendation, context),
      eventType: "recommendation.approved",
      payload: { recommendation, actor, ...(note === undefined ? {} : { note }) },
    }) as RecommendationApprovedEvent;
  }

  rejected(
    recommendation: Recommendation,
    actor: RecommendationActor,
    reason: string,
    context: EventContext
  ): RecommendationRejectedEvent {
    return validate({
      ...envelope(recommendation, context),
      eventType: "recommendation.rejected",
      payload: { recommendation, actor, reason },
    }) as RecommendationRejectedEvent;
  }

  executed(
    recommendation: Recommendation,
    actor: RecommendationActor,
    workflowExecutionId: string,
    context: EventContext
  ): RecommendationExecutedEvent {
    return validate({
      ...envelope(recommendation, context),
      eventType: "recommendation.executed",
      payload: { recommendation, actor, workflowExecutionId },
    }) as RecommendationExecutedEvent;
  }
}

function envelope(recommendation: Recommendation, context: EventContext) {
  return {
    eventId: context.eventId,
    eventVersion: 1 as const,
    aggregateType: "RECOMMENDATION" as const,
    aggregateId: recommendation.id,
    workspaceId: recommendation.workspaceId,
    idempotencyKey: context.idempotencyKey,
    occurredAt: context.occurredAt,
  };
}

function validate(event: unknown) {
  return RecommendationLifecycleEventSchema.parse(event);
}
