import type { StrategyEventPublisher, StrategyRepository } from "../interfaces";
import type { StrategyDomainEvent } from "../types";

export type StrategyEventHandler = (event: StrategyDomainEvent) => Promise<void>;

export class CompositeStrategyEventPublisher implements StrategyEventPublisher {
  constructor(private readonly handlers: StrategyEventHandler[] = []) {}

  async publish(event: StrategyDomainEvent) {
    await Promise.all(this.handlers.map((handler) => handler(event)));
  }
}

export class StrategyOutboxDispatcher {
  constructor(
    private readonly repository: StrategyRepository,
    private readonly publisher: StrategyEventPublisher
  ) {}

  async dispatchPending(limit = 100) {
    const events = await this.repository.listPendingEvents(limit);
    let published = 0;

    for (const event of events) {
      if (!event.id) continue;
      try {
        await this.publisher.publish(event);
        await this.repository.markEventPublished(event.id, new Date().toISOString());
        published += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown event publication failure.";
        await this.repository.markEventFailed(event.id, message);
      }
    }

    return { attempted: events.length, published };
  }
}
