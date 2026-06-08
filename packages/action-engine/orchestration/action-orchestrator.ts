import type { ActionQueue, ActionRepository } from "../interfaces";
import type { ActionActor, ActionJob, ActionPlan, ActionPlanInput } from "../types";
import { validateActionPlanInput } from "../validation";

export class ActionOrchestrator {
  constructor(
    private readonly repository: ActionRepository,
    private readonly queue: ActionQueue
  ) {}

  async createAndQueue(input: ActionPlanInput): Promise<ActionPlan> {
    validateActionPlanInput(input);
    const existing = await this.repository.findPlanByIdempotencyKey(input.workspaceId, input.idempotencyKey);
    if (existing) return existing;
    const plan = await this.repository.createPlan(input);

    if (plan.requiresApproval) {
      const pending = { ...plan, status: "PENDING_APPROVAL" as const, updatedAt: now() };
      await this.repository.createApproval(pending, input.actor, "Approval required before workflow execution.");
      return this.repository.updatePlan(pending, eventFor(pending, "action.approval.requested"));
    }

    return this.queuePlan(plan);
  }

  async approve(workspaceId: string, actionPlanId: string, actor: ActionActor, note?: string) {
    const plan = await this.requiredPlan(workspaceId, actionPlanId);
    const request = await this.repository.findApproval(plan.id);
    if (!request) throw new Error("Approval request not found.");
    await this.repository.decideApproval(request.id, true, actor, note);
    return this.queuePlan({ ...plan, status: "APPROVED", updatedAt: now() });
  }

  async queuePlan(plan: ActionPlan) {
    const job: ActionJob = {
      workspaceId: plan.workspaceId,
      actionPlanId: plan.id,
      executionIdempotencyKey: `${plan.idempotencyKey}:execution`,
    };
    const options = { attempts: plan.maxAttempts ?? 3, jobId: job.executionIdempotencyKey };
    if (plan.cronExpression) await this.queue.repeat(job, plan.cronExpression, options);
    else if (plan.scheduledFor && new Date(plan.scheduledFor).getTime() > Date.now()) {
      await this.queue.schedule(job, new Date(plan.scheduledFor), options);
    } else await this.queue.enqueue(job, options);
    const queued = { ...plan, status: "QUEUED" as const, updatedAt: now() };
    return this.repository.updatePlan(queued, eventFor(queued, "action.plan.queued"));
  }

  private async requiredPlan(workspaceId: string, planId: string) {
    const plan = await this.repository.findPlan(workspaceId, planId);
    if (!plan) throw new Error("Action plan not found.");
    return plan;
  }
}

function eventFor(plan: ActionPlan, eventType: string) {
  return {
    workspaceId: plan.workspaceId,
    actionPlanId: plan.id,
    eventType,
    aggregateType: "ACTION_PLAN" as const,
    aggregateId: plan.id,
    payload: { status: plan.status, type: plan.type },
    occurredAt: now(),
  };
}

function now() {
  return new Date().toISOString();
}
