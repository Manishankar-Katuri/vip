import { randomUUID } from "node:crypto";

import type { ReplayQuery, ReplayResult } from "../dto";
import { ReplayQuerySchema } from "../schemas";
import type { EventStore } from "../services";
import type { OrchestrationEventBus } from "../bus";

export class EventReplayService {
  constructor(
    private readonly store: EventStore,
    private readonly bus: Pick<OrchestrationEventBus, "dispatch">,
    private readonly id: () => string = () => randomUUID()
  ) {}

  async replay(input: ReplayQuery): Promise<ReplayResult> {
    const query = ReplayQuerySchema.parse(input) as ReplayQuery;
    const replayId = this.id();
    const events = await this.store.query(query);
    for (const envelope of events) {
      await this.bus.dispatch(envelope, { replayId });
    }
    return { replayId, matched: events.length, dispatched: events.length };
  }
}
