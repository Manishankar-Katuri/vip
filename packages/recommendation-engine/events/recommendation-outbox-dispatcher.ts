import type { RecommendationRepository } from "../repositories";
import type { RecommendationLifecycleEvent } from "../types";

export interface RecommendationEventPublisher {
  publish(event: RecommendationLifecycleEvent): Promise<void>;
}

export class RecommendationOutboxDispatcher {
  constructor(
    private readonly repository: RecommendationRepository,
    private readonly publisher: RecommendationEventPublisher
  ) {}

  async dispatchPending(limit = 100) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error("Dispatch limit must be a positive integer.");
    const events = await this.repository.listPendingEvents(limit);
    let published = 0;

    for (const event of events) {
      try {
        await this.publisher.publish(event);
        await this.repository.markEventPublished(event.eventId, new Date().toISOString());
        published += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown recommendation publication failure.";
        await this.repository.markEventFailed(event.eventId, message);
      }
    }
    return { attempted: events.length, published };
  }
}
