import type {
  ActionActor,
  ActionEvent,
  ActionExecution,
  ActionJob,
  ActionPlan,
  ActionPlanInput,
  ApprovalRequest,
  ExecutionFailure,
  ExecutionLog,
  ExecutionMetrics,
  ExecutionStep,
} from "../types";

export interface ActionRepository {
  createPlan(input: ActionPlanInput): Promise<ActionPlan>;
  findPlan(workspaceId: string, planId: string): Promise<ActionPlan | null>;
  findPlanByIdempotencyKey(workspaceId: string, key: string): Promise<ActionPlan | null>;
  updatePlan(plan: ActionPlan, event: ActionEvent): Promise<ActionPlan>;
  createApproval(plan: ActionPlan, actor: ActionActor, reason: string): Promise<ApprovalRequest>;
  decideApproval(requestId: string, approved: boolean, actor: ActionActor, note?: string): Promise<ApprovalRequest>;
  findApproval(planId: string): Promise<ApprovalRequest | null>;
  startExecution(job: ActionJob, queueJobId?: string): Promise<ActionExecution>;
  findExecution(workspaceId: string, idempotencyKey: string): Promise<ActionExecution | null>;
  updateExecution(execution: ActionExecution, log: ExecutionLog, event?: ActionEvent): Promise<ActionExecution>;
  updateStep(planId: string, step: ExecutionStep): Promise<void>;
  recordFailure(failure: ExecutionFailure, execution: ActionExecution, event: ActionEvent): Promise<void>;
  metrics(workspaceId: string): Promise<ExecutionMetrics>;
}

export interface ActionQueue {
  enqueue(job: ActionJob, options?: QueueOptions): Promise<string>;
  schedule(job: ActionJob, runAt: Date, options?: QueueOptions): Promise<string>;
  repeat(job: ActionJob, cronExpression: string, options?: QueueOptions): Promise<string>;
  deadLetter(job: ActionJob, reason: string): Promise<void>;
}

export interface QueueOptions {
  attempts?: number;
  backoffMs?: number;
  jobId?: string;
}

export interface StepExecutionContext {
  plan: ActionPlan;
  execution: ActionExecution;
  step: ExecutionStep;
}

export interface StepProcessor {
  readonly name: string;
  execute(context: StepExecutionContext): Promise<Record<string, unknown> | void>;
}

export interface RetryPolicy {
  nextDelayMs(attempt: number): number;
  shouldRetry(attempt: number, maxAttempts: number, failure: unknown): boolean;
}
