import type { StrategyDomainEvent } from "@vip/strategy-engine";

import { CopilotRuntime } from "../runtime";

export class CopilotEventReactionService {
  constructor(private readonly runtime: CopilotRuntime) {}

  async reactToStrategyEvent(event: StrategyDomainEvent) {
    if (event.eventType !== "recommendation.lifecycle.transitioned") return null;
    const agentType = event.payload.category === "RISK_MITIGATION"
      ? "RISK_MONITOR" as const
      : "STRATEGY_ANALYST" as const;
    return this.runtime.run({
      workspaceId: event.workspaceId,
      recommendationId: event.recommendationId,
      agentType,
      operation: "EVENT_REACTION",
      input: { eventType: event.eventType, payload: event.payload },
      trigger: { type: "STRATEGY_EVENT", id: event.id ?? event.aggregateId },
    });
  }
}
