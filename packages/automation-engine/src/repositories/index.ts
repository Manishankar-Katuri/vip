import type {
  AutomationExecution,
  AutomationLifecycleEvent,
  AutomationLog,
  AutomationRule,
  WorkflowMapping,
  AutomationExecutionMetrics,
} from "../types";

export interface AutomationRepository {
  listEnabledRules(workspaceId: string): Promise<AutomationRule[]>;
  findWorkflowMapping(mappingId: string): Promise<WorkflowMapping | null>;
  findExecutionById(workspaceId: string, executionId: string): Promise<AutomationExecution | null>;
  findExecutionByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<AutomationExecution | null>;
  findEventByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<AutomationLifecycleEvent | null>;
  latestExecutionForRule(workspaceId: string, ruleId: string): Promise<AutomationExecution | null>;
  countRuleExecutionsSince(workspaceId: string, ruleId: string, since: string): Promise<number>;
  createExecution(
    execution: AutomationExecution,
    event: AutomationLifecycleEvent,
    log: AutomationLog
  ): Promise<AutomationExecution>;
  updateExecution(
    execution: AutomationExecution,
    event: AutomationLifecycleEvent,
    log: AutomationLog
  ): Promise<AutomationExecution>;
  listPendingEvents(limit: number): Promise<AutomationLifecycleEvent[]>;
  markEventPublished(eventId: string, publishedAt: string): Promise<void>;
  markEventFailed(eventId: string, failureMessage: string): Promise<void>;
}

export interface AutomationConfigurationRepository {
  saveRule(rule: AutomationRule): Promise<AutomationRule>;
  saveWorkflowMapping(mapping: WorkflowMapping): Promise<WorkflowMapping>;
}

export interface DurableAutomationRepository extends AutomationRepository, AutomationConfigurationRepository {
  metrics(workspaceId: string): Promise<AutomationExecutionMetrics>;
}

export * from "./prisma-automation-repository";
