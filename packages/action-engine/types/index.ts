export type ActionPlanType =
  | "SOCIAL_PUBLISHING"
  | "MARKETING_PLAYBOOK"
  | "CAMPAIGN_EXECUTION"
  | "ALERT_PIPELINE"
  | "AI_ACTION_SEQUENCE";
export type ActionPlanStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "DEAD_LETTERED";
export type ActionExecutionStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "RETRY_SCHEDULED"
  | "COMPLETED"
  | "FAILED"
  | "DEAD_LETTERED";
export type ExecutionStepStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";
export type ApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type ActorType = "USER" | "SYSTEM" | "AI_COPILOT" | "AGENT" | "INTEGRATION";

export interface ActionActor {
  type: ActorType;
  id?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionStepInput {
  name: string;
  processor: string;
  input?: Record<string, unknown>;
  requiresApproval?: boolean;
}

export interface ExecutionStep extends ExecutionStepInput {
  id: string;
  position: number;
  status: ExecutionStepStatus;
  attempts: number;
  output?: Record<string, unknown>;
}

export interface ActionPlanInput {
  workspaceId: string;
  recommendationId?: string;
  name: string;
  type: ActionPlanType;
  input?: Record<string, unknown>;
  idempotencyKey: string;
  requiresApproval?: boolean;
  scheduledFor?: string;
  cronExpression?: string;
  maxAttempts?: number;
  steps: ExecutionStepInput[];
  actor: ActionActor;
}

export interface ActionPlan extends Omit<ActionPlanInput, "steps" | "actor"> {
  id: string;
  status: ActionPlanStatus;
  steps: ExecutionStep[];
  createdBy: ActionActor;
  createdAt: string;
  updatedAt: string;
}

export interface ActionExecution {
  id: string;
  workspaceId: string;
  actionPlanId: string;
  idempotencyKey: string;
  queueJobId?: string;
  status: ActionExecutionStatus;
  attempt: number;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  deadLetteredAt?: string;
  nextRetryAt?: string;
  output?: Record<string, unknown>;
  durationMs?: number;
}

export interface ExecutionLog {
  workspaceId: string;
  actionExecutionId: string;
  executionStepId?: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ExecutionFailure {
  workspaceId: string;
  actionExecutionId: string;
  executionStepId?: string;
  code: string;
  message: string;
  retryable: boolean;
  attempt: number;
  details?: Record<string, unknown>;
  occurredAt: string;
}

export interface ApprovalRequest {
  id: string;
  workspaceId: string;
  actionPlanId: string;
  status: ApprovalRequestStatus;
  requestedBy: ActionActor;
  decidedBy?: ActionActor;
  reason: string;
  decisionNote?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface ActionJob {
  workspaceId: string;
  actionPlanId: string;
  executionIdempotencyKey: string;
}

export interface ExecutionMetrics {
  workspaceId: string;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  deadLettered: number;
  averageDurationMs: number;
}

export interface ActionEvent {
  workspaceId: string;
  actionPlanId?: string;
  actionExecutionId?: string;
  eventType: string;
  aggregateType: "ACTION_PLAN" | "ACTION_EXECUTION" | "APPROVAL_REQUEST";
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}
