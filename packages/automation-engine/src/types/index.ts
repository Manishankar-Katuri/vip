import type {
  AnalyticsMetric,
  Recommendation,
  RecommendationLifecycleEvent,
  RecommendationType,
  WorkflowReadyAction,
} from "@vip/recommendation-engine";

export type AutomationTrigger =
  | "ENGAGEMENT_DROP"
  | "VIRAL_SPIKE"
  | "AUDIENCE_DECLINE"
  | "POSTING_INACTIVITY"
  | "HIGH_CONFIDENCE_GROWTH_OPPORTUNITY"
  | "CRITICAL_RECOMMENDATION";

export type AutomationComparison = "GT" | "GTE" | "LT" | "LTE" | "EQ";
export type AutomationMetric = AnalyticsMetric | "CONFIDENCE" | "RECOMMENDATION_SCORE";
export type AutomationExecutionStatus =
  | "QUEUED"
  | "SCHEDULED"
  | "RUNNING"
  | "RETRYING"
  | "FAILED"
  | "COMPLETED"
  | "ROLLED_BACK"
  | "DEAD_LETTERED";

export interface AutomationCondition {
  metric: AutomationMetric;
  operator: AutomationComparison;
  threshold: number;
}

export interface AutomationRetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  deadLetterAfterAttempts: number;
}

export interface AutomationExecutionLimit {
  maxExecutions: number;
  windowMinutes: number;
}

export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  recommendationTypes?: RecommendationType[];
  conditions: AutomationCondition[];
  cooldownMinutes: number;
  executionLimit: AutomationExecutionLimit;
  retryPolicy: AutomationRetryPolicy;
  workflowMappingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowMapping {
  id: string;
  recommendationType: RecommendationType;
  workflowType: string;
  action: Omit<WorkflowReadyAction, "idempotencyKey">;
}

export interface AutomationExecution {
  id: string;
  workspaceId: string;
  ruleId: string;
  recommendationId: string;
  sourceEventId: string;
  idempotencyKey: string;
  status: AutomationExecutionStatus;
  attempt: number;
  workflow: WorkflowReadyAction & { workflowType: string };
  retryPolicy: AutomationRetryPolicy;
  queuedAt: string;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  nextRetryAt?: string;
  rolledBackAt?: string;
  deadLetteredAt?: string;
  queueJobId?: string;
  lastFailure?: string;
  deadLetterEligible: boolean;
}

export interface AutomationLog {
  executionId: string;
  workspaceId: string;
  level: "INFO" | "WARN" | "ERROR";
  eventType: AutomationEventType;
  message: string;
  occurredAt: string;
}

export type AutomationEventType =
  | "automation.triggered"
  | "automation.scheduled"
  | "automation.started"
  | "automation.retrying"
  | "automation.failed"
  | "automation.completed"
  | "automation.rolled_back"
  | "automation.dead_lettered";

export interface AutomationEventBase<TType extends AutomationEventType, TPayload> {
  eventId: string;
  eventType: TType;
  eventVersion: 1;
  aggregateType: "AUTOMATION_EXECUTION";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: TPayload;
}

export type AutomationTriggeredEvent = AutomationEventBase<
  "automation.triggered",
  { execution: AutomationExecution; ruleId: string; recommendationId: string; sourceEventId: string }
>;
export type AutomationStartedEvent = AutomationEventBase<
  "automation.started",
  { execution: AutomationExecution }
>;
export type AutomationScheduledEvent = AutomationEventBase<
  "automation.scheduled",
  { execution: AutomationExecution; runAt: string }
>;
export type AutomationRetryingEvent = AutomationEventBase<
  "automation.retrying",
  { execution: AutomationExecution; reason: string; runAt: string }
>;
export type AutomationFailedEvent = AutomationEventBase<
  "automation.failed",
  { execution: AutomationExecution; reason: string; retryScheduled: boolean; deadLetterEligible: boolean }
>;
export type AutomationCompletedEvent = AutomationEventBase<
  "automation.completed",
  { execution: AutomationExecution; result: Record<string, unknown> }
>;
export type AutomationRolledBackEvent = AutomationEventBase<
  "automation.rolled_back",
  { execution: AutomationExecution; reason: string }
>;
export type AutomationDeadLetteredEvent = AutomationEventBase<
  "automation.dead_lettered",
  { execution: AutomationExecution; reason: string }
>;

export type AutomationLifecycleEvent =
  | AutomationTriggeredEvent
  | AutomationScheduledEvent
  | AutomationStartedEvent
  | AutomationRetryingEvent
  | AutomationFailedEvent
  | AutomationCompletedEvent
  | AutomationRolledBackEvent
  | AutomationDeadLetteredEvent;

export interface AutomationExecutionMetrics {
  workspaceId: string;
  queued: number;
  scheduled: number;
  running: number;
  retrying: number;
  failed: number;
  completed: number;
  rolledBack: number;
  deadLettered: number;
  averageDurationMs: number;
}

export interface AutomationRuleMatch {
  rule: AutomationRule;
  recommendation: Recommendation;
  sourceEvent: RecommendationLifecycleEvent;
}
