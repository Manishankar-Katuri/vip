import type { ActionRepository } from "../interfaces";
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

export class InMemoryActionRepository implements ActionRepository {
  readonly plans = new Map<string, ActionPlan>();
  readonly executions = new Map<string, ActionExecution>();
  readonly approvals = new Map<string, ApprovalRequest>();
  readonly logs: ExecutionLog[] = [];
  readonly failures: ExecutionFailure[] = [];
  readonly events: ActionEvent[] = [];

  async createPlan(input: ActionPlanInput) {
    const createdAt = new Date().toISOString();
    const plan: ActionPlan = {
      ...input,
      id: `plan-${this.plans.size + 1}`,
      status: "DRAFT",
      steps: input.steps.map((step, position) => ({
        ...step,
        id: `step-${this.plans.size + 1}-${position + 1}`,
        position,
        status: "PENDING",
        attempts: 0,
      })),
      createdBy: input.actor,
      createdAt,
      updatedAt: createdAt,
    };
    this.plans.set(plan.id, plan);
    return plan;
  }

  async findPlan(workspaceId: string, planId: string) {
    const plan = this.plans.get(planId);
    return plan?.workspaceId === workspaceId ? plan : null;
  }

  async findPlanByIdempotencyKey(workspaceId: string, key: string) {
    return Array.from(this.plans.values())
      .find((plan) => plan.workspaceId === workspaceId && plan.idempotencyKey === key) ?? null;
  }

  async updatePlan(plan: ActionPlan, event: ActionEvent) {
    this.plans.set(plan.id, plan);
    this.events.push(event);
    return plan;
  }

  async createApproval(plan: ActionPlan, actor: ActionActor, reason: string) {
    const request: ApprovalRequest = {
      id: `approval-${this.approvals.size + 1}`,
      workspaceId: plan.workspaceId,
      actionPlanId: plan.id,
      status: "PENDING",
      requestedBy: actor,
      reason,
      requestedAt: new Date().toISOString(),
    };
    this.approvals.set(request.id, request);
    return request;
  }

  async decideApproval(requestId: string, approved: boolean, actor: ActionActor, note?: string) {
    const request = this.approvals.get(requestId);
    if (!request) throw new Error("Approval request not found.");
    const updated: ApprovalRequest = {
      ...request,
      status: approved ? "APPROVED" : "REJECTED",
      decidedBy: actor,
      decisionNote: note,
      decidedAt: new Date().toISOString(),
    };
    this.approvals.set(requestId, updated);
    return updated;
  }

  async findApproval(planId: string) {
    return Array.from(this.approvals.values()).find((approval) => approval.actionPlanId === planId) ?? null;
  }

  async startExecution(job: ActionJob, queueJobId?: string) {
    const execution: ActionExecution = {
      id: `execution-${this.executions.size + 1}`,
      workspaceId: job.workspaceId,
      actionPlanId: job.actionPlanId,
      idempotencyKey: job.executionIdempotencyKey,
      queueJobId,
      status: "QUEUED",
      attempt: 0,
    };
    this.executions.set(execution.idempotencyKey, execution);
    return execution;
  }

  async findExecution(workspaceId: string, idempotencyKey: string) {
    const execution = this.executions.get(idempotencyKey);
    return execution?.workspaceId === workspaceId ? execution : null;
  }

  async updateExecution(execution: ActionExecution, log: ExecutionLog, event?: ActionEvent) {
    this.executions.set(execution.idempotencyKey, execution);
    this.logs.push(log);
    if (event) this.events.push(event);
    return execution;
  }

  async updateStep(planId: string, step: ExecutionStep) {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error("Action plan not found.");
    plan.steps = plan.steps.map((existing) => existing.id === step.id ? step : existing);
    this.plans.set(plan.id, plan);
  }

  async recordFailure(failure: ExecutionFailure, execution: ActionExecution, event: ActionEvent) {
    this.executions.set(execution.idempotencyKey, execution);
    this.failures.push(failure);
    this.events.push(event);
    this.logs.push({
      workspaceId: execution.workspaceId,
      actionExecutionId: execution.id,
      level: "ERROR",
      eventType: event.eventType,
      message: failure.message,
      createdAt: failure.occurredAt,
    });
  }

  async metrics(workspaceId: string): Promise<ExecutionMetrics> {
    const records = Array.from(this.executions.values()).filter((item) => item.workspaceId === workspaceId);
    const durations = records.flatMap((item) => item.durationMs === undefined ? [] : [item.durationMs]);
    return {
      workspaceId,
      queued: records.filter((item) => item.status === "QUEUED").length,
      running: records.filter((item) => item.status === "RUNNING").length,
      completed: records.filter((item) => item.status === "COMPLETED").length,
      failed: records.filter((item) => item.status === "FAILED" || item.status === "RETRY_SCHEDULED").length,
      deadLettered: records.filter((item) => item.status === "DEAD_LETTERED").length,
      averageDurationMs: durations.length === 0 ? 0 : durations.reduce((sum, item) => sum + item, 0) / durations.length,
    };
  }
}
