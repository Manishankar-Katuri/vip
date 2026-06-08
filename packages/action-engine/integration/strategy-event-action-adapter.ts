import type { StrategyDomainEvent } from "@vip/strategy-engine";

import { ActionOrchestrator } from "../orchestration";
import type { ActionPlan, ActionPlanInput, ExecutionStepInput } from "../types";

export class StrategyEventActionAdapter {
  constructor(private readonly orchestrator: ActionOrchestrator) {}

  async consume(event: StrategyDomainEvent): Promise<ActionPlan | null> {
    if (
      event.eventType !== "recommendation.lifecycle.transitioned" ||
      event.payload.toStatus !== "ACCEPTED" ||
      !event.recommendationId
    ) return null;

    return this.orchestrator.createAndQueue({
      workspaceId: event.workspaceId,
      recommendationId: event.recommendationId,
      name: `Execute accepted recommendation ${event.recommendationId}`,
      type: typeFor(event.payload.category),
      idempotencyKey: `recommendation:${event.recommendationId}:accepted`,
      requiresApproval: typeFor(event.payload.category) === "SOCIAL_PUBLISHING",
      steps: stepsFor(event.payload.category),
      actor: { type: "INTEGRATION", id: "strategy-event-adapter" },
    });
  }
}

function typeFor(category: unknown): ActionPlanInput["type"] {
  if (category === "RISK_MITIGATION") return "ALERT_PIPELINE";
  if (category === "GROWTH_OPPORTUNITY") return "CAMPAIGN_EXECUTION";
  if (category === "CONTENT") return "SOCIAL_PUBLISHING";
  return "MARKETING_PLAYBOOK";
}

function stepsFor(category: unknown): ExecutionStepInput[] {
  if (category === "RISK_MITIGATION") {
    return [
      { name: "Create incident alert", processor: "create-alert" },
      { name: "Notify workspace owner", processor: "notify-owner" },
    ];
  }
  return [
    { name: "Prepare implementation brief", processor: "prepare-brief" },
    { name: "Launch measured action", processor: "launch-action" },
  ];
}
