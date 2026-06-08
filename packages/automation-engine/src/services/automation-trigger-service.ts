import { randomUUID } from "node:crypto";

import type { RecommendationLifecycleEvent } from "@vip/recommendation-engine";

import { AutomationEventFactory } from "../events";
import { WorkflowTriggerMapper } from "../mappings";
import type { AutomationRepository } from "../repositories";
import { AutomationExecutionSchema } from "../schemas";
import { AutomationRuleEngine } from "../rules";
import type { AutomationExecution, AutomationLog, AutomationRuleMatch } from "../types";
import { CooldownEnforcementService } from "./cooldown-enforcement-service";

export interface AutomationDependencies {
  now(): string;
  id(): string;
}

const DEFAULT_DEPENDENCIES: AutomationDependencies = {
  now: () => new Date().toISOString(),
  id: () => randomUUID(),
};

export class AutomationTriggerService {
  private readonly events = new AutomationEventFactory();
  private readonly cooldowns: CooldownEnforcementService;

  constructor(
    private readonly repository: AutomationRepository,
    private readonly ruleEngine = new AutomationRuleEngine(),
    private readonly mapper = new WorkflowTriggerMapper(),
    private readonly dependencies: AutomationDependencies = DEFAULT_DEPENDENCIES
  ) {
    this.cooldowns = new CooldownEnforcementService(repository);
  }

  async consume(event: RecommendationLifecycleEvent) {
    const rules = await this.repository.listEnabledRules(event.workspaceId);
    const matches = this.ruleEngine.evaluate(event, rules);
    const executions: AutomationExecution[] = [];
    for (const match of matches) {
      const execution = await this.trigger(match);
      if (execution) executions.push(execution);
    }
    return executions;
  }

  private async trigger(match: AutomationRuleMatch) {
    const key = `${match.sourceEvent.eventId}:${match.rule.id}`;
    const existing = await this.repository.findExecutionByIdempotencyKey(match.recommendation.workspaceId, key);
    if (existing) return existing;
    if (!(await this.cooldowns.allows(match, this.dependencies.now()))) return null;
    const mapping = await this.repository.findWorkflowMapping(match.rule.workflowMappingId);
    if (!mapping) throw new Error(`Workflow mapping ${match.rule.workflowMappingId} was not found.`);
    const now = this.dependencies.now();
    const execution = AutomationExecutionSchema.parse({
      id: this.dependencies.id(),
      workspaceId: match.recommendation.workspaceId,
      ruleId: match.rule.id,
      recommendationId: match.recommendation.id,
      sourceEventId: match.sourceEvent.eventId,
      idempotencyKey: key,
      status: "QUEUED",
      attempt: 0,
      workflow: this.mapper.mapUsing(mapping, match.recommendation, key),
      retryPolicy: match.rule.retryPolicy,
      queuedAt: now,
      deadLetterEligible: false,
    }) as AutomationExecution;
    const lifecycleEvent = this.events.triggered(execution, {
      eventId: this.dependencies.id(),
      idempotencyKey: `${key}:triggered`,
      occurredAt: now,
    });
    return this.repository.createExecution(execution, lifecycleEvent, logFor(execution, lifecycleEvent.eventType, "Automation execution queued.", now));
  }

}

function logFor(
  execution: AutomationExecution,
  eventType: "automation.triggered",
  message: string,
  occurredAt: string
): AutomationLog {
  return { executionId: execution.id, workspaceId: execution.workspaceId, level: "INFO", eventType, message, occurredAt };
}
