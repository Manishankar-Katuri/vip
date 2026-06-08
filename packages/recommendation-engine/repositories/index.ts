import type {
  Recommendation,
  RecommendationApprovedEvent,
  RecommendationCreatedEvent,
  RecommendationExecutedEvent,
  RecommendationLifecycleEvent,
  RecommendationRejectedEvent,
  RecommendationUpdatedEvent,
} from "../types";

export interface RecommendationRepository {
  findById(workspaceId: string, recommendationId: string): Promise<Recommendation | null>;
  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<Recommendation | null>;
  findEventByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<RecommendationLifecycleEvent | null>;
  create(recommendation: Recommendation, event: RecommendationCreatedEvent): Promise<Recommendation>;
  update(recommendation: Recommendation, event: RecommendationUpdatedEvent): Promise<Recommendation>;
  archive(recommendation: Recommendation, event: RecommendationUpdatedEvent): Promise<Recommendation>;
  approve(recommendation: Recommendation, event: RecommendationApprovedEvent): Promise<Recommendation>;
  reject(recommendation: Recommendation, event: RecommendationRejectedEvent): Promise<Recommendation>;
  execute(recommendation: Recommendation, event: RecommendationExecutedEvent): Promise<Recommendation>;
  listPendingEvents(limit: number): Promise<RecommendationLifecycleEvent[]>;
  markEventPublished(eventId: string, publishedAt: string): Promise<void>;
  markEventFailed(eventId: string, failureMessage: string): Promise<void>;
}
