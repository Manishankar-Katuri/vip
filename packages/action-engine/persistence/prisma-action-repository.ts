import type { ActionRepository } from "../interfaces";
import type {
  ActionActor, ActionEvent, ActionExecution, ActionJob, ActionPlan, ActionPlanInput,
  ApprovalRequest, ExecutionFailure, ExecutionLog, ExecutionMetrics, ExecutionStep,
} from "../types";

type Row = Record<string, unknown>;
interface Delegate {
  create(args: unknown): Promise<Row>;
  update(args: unknown): Promise<Row>;
  findFirst(args: unknown): Promise<Row | null>;
  findUnique(args: unknown): Promise<Row | null>;
  findMany(args: unknown): Promise<Row[]>;
}
export interface ActionPrismaClient {
  actionPlan: Delegate;
  actionExecution: Delegate;
  executionStep: Delegate;
  executionLog: Delegate;
  executionFailure: Delegate;
  approvalRequest: Delegate;
  actionOutboxEvent: Delegate;
  $transaction<T>(fn: (database: ActionPrismaClient) => Promise<T>): Promise<T>;
}

export class PrismaActionRepository implements ActionRepository {
  constructor(private readonly database: ActionPrismaClient) {}

  async createPlan(input: ActionPlanInput) {
    const row = await this.database.actionPlan.create({ data: {
      workspaceId: input.workspaceId, recommendationId: input.recommendationId, name: input.name,
      type: input.type, input: input.input, idempotencyKey: input.idempotencyKey,
      requiresApproval: input.requiresApproval ?? false, scheduledFor: date(input.scheduledFor),
      cronExpression: input.cronExpression, maxAttempts: input.maxAttempts ?? 3,
      createdByType: input.actor.type, createdById: input.actor.id,
      steps: { create: input.steps.map((step, position) => ({ ...step, position })) },
    }, include: { steps: true } });
    return planFrom(row);
  }
  async findPlan(workspaceId: string, planId: string) {
    const row = await this.database.actionPlan.findFirst({ where: { id: planId, workspaceId }, include: { steps: true } });
    return row ? planFrom(row) : null;
  }
  async findPlanByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    const row = await this.database.actionPlan.findFirst({ where: { workspaceId, idempotencyKey }, include: { steps: true } });
    return row ? planFrom(row) : null;
  }
  async updatePlan(plan: ActionPlan, event: ActionEvent) {
    return this.database.$transaction(async (db) => {
      const row = await db.actionPlan.update({ where: { id: plan.id }, data: { status: plan.status }, include: { steps: true } });
      await db.actionOutboxEvent.create({ data: eventData(event) });
      return planFrom(row);
    });
  }
  async createApproval(plan: ActionPlan, actor: ActionActor, reason: string) {
    const row = await this.database.approvalRequest.create({ data: {
      workspaceId: plan.workspaceId, actionPlanId: plan.id, requestedByType: actor.type,
      requestedById: actor.id, reason,
    } });
    return approvalFrom(row);
  }
  async decideApproval(requestId: string, approved: boolean, actor: ActionActor, note?: string) {
    const row = await this.database.approvalRequest.update({ where: { id: requestId }, data: {
      status: approved ? "APPROVED" : "REJECTED", decidedByType: actor.type,
      decidedById: actor.id, decisionNote: note, decidedAt: new Date(),
    } });
    return approvalFrom(row);
  }
  async findApproval(planId: string) {
    const row = await this.database.approvalRequest.findFirst({ where: { actionPlanId: planId }, orderBy: { requestedAt: "desc" } });
    return row ? approvalFrom(row) : null;
  }
  async startExecution(job: ActionJob, queueJobId?: string) {
    const row = await this.database.actionExecution.create({ data: {
      workspaceId: job.workspaceId, actionPlanId: job.actionPlanId,
      idempotencyKey: job.executionIdempotencyKey, queueJobId,
    } });
    return executionFrom(row);
  }
  async findExecution(workspaceId: string, idempotencyKey: string) {
    const row = await this.database.actionExecution.findFirst({ where: { workspaceId, idempotencyKey } });
    return row ? executionFrom(row) : null;
  }
  async updateExecution(execution: ActionExecution, log: ExecutionLog, event?: ActionEvent) {
    return this.database.$transaction(async (db) => {
      const row = await db.actionExecution.update({ where: { id: execution.id }, data: executionData(execution) });
      await db.executionLog.create({ data: logData(log) });
      if (event) await db.actionOutboxEvent.create({ data: eventData(event) });
      return executionFrom(row);
    });
  }
  async updateStep(_planId: string, step: ExecutionStep) {
    await this.database.executionStep.update({ where: { id: step.id }, data: {
      status: step.status, attempts: step.attempts, output: step.output,
    } });
  }
  async recordFailure(failure: ExecutionFailure, execution: ActionExecution, event: ActionEvent) {
    await this.database.$transaction(async (db) => {
      await db.actionExecution.update({ where: { id: execution.id }, data: executionData(execution) });
      await db.executionFailure.create({ data: { ...failure, occurredAt: new Date(failure.occurredAt) } });
      await db.executionLog.create({ data: logData({
        workspaceId: failure.workspaceId, actionExecutionId: failure.actionExecutionId, level: "ERROR",
        eventType: event.eventType, message: failure.message, createdAt: failure.occurredAt,
      }) });
      await db.actionOutboxEvent.create({ data: eventData(event) });
    });
  }
  async metrics(workspaceId: string): Promise<ExecutionMetrics> {
    const rows = (await this.database.actionExecution.findMany({ where: { workspaceId } })).map(executionFrom);
    const duration = rows.flatMap((row) => row.durationMs === undefined ? [] : [row.durationMs]);
    return {
      workspaceId, queued: count(rows, "QUEUED"), running: count(rows, "RUNNING"),
      completed: count(rows, "COMPLETED"), failed: rows.filter((r) => ["FAILED", "RETRY_SCHEDULED"].includes(r.status)).length,
      deadLettered: count(rows, "DEAD_LETTERED"), averageDurationMs: duration.length ? duration.reduce((a, b) => a + b, 0) / duration.length : 0,
    };
  }
}
function planFrom(row: Row): ActionPlan {
  return {
    id: String(row.id), workspaceId: String(row.workspaceId), recommendationId: str(row.recommendationId),
    name: String(row.name), type: row.type as ActionPlan["type"], status: row.status as ActionPlan["status"],
    input: row.input as Record<string, unknown> | undefined, idempotencyKey: String(row.idempotencyKey),
    requiresApproval: Boolean(row.requiresApproval), scheduledFor: iso(row.scheduledFor), cronExpression: str(row.cronExpression),
    maxAttempts: Number(row.maxAttempts), createdBy: { type: row.createdByType as ActionActor["type"], id: str(row.createdById) },
    steps: ((row.steps as Row[] | undefined) ?? []).map(stepFrom), createdAt: iso(row.createdAt)!, updatedAt: iso(row.updatedAt)!,
  };
}
function stepFrom(row: Row): ExecutionStep { return { id: String(row.id), name: String(row.name), processor: String(row.processor), position: Number(row.position), status: row.status as ExecutionStep["status"], attempts: Number(row.attempts), input: row.input as Record<string, unknown> | undefined, output: row.output as Record<string, unknown> | undefined, requiresApproval: Boolean(row.requiresApproval) }; }
function executionFrom(row: Row): ActionExecution { return { id: String(row.id), workspaceId: String(row.workspaceId), actionPlanId: String(row.actionPlanId), idempotencyKey: String(row.idempotencyKey), queueJobId: str(row.queueJobId), status: row.status as ActionExecution["status"], attempt: Number(row.attempt), startedAt: iso(row.startedAt), completedAt: iso(row.completedAt), failedAt: iso(row.failedAt), deadLetteredAt: iso(row.deadLetteredAt), nextRetryAt: iso(row.nextRetryAt), output: row.output as Record<string, unknown> | undefined, durationMs: row.durationMs == null ? undefined : Number(row.durationMs) }; }
function approvalFrom(row: Row): ApprovalRequest { return { id: String(row.id), workspaceId: String(row.workspaceId), actionPlanId: String(row.actionPlanId), status: row.status as ApprovalRequest["status"], requestedBy: { type: row.requestedByType as ActionActor["type"], id: str(row.requestedById) }, decidedBy: row.decidedByType ? { type: row.decidedByType as ActionActor["type"], id: str(row.decidedById) } : undefined, reason: String(row.reason), decisionNote: str(row.decisionNote), requestedAt: iso(row.requestedAt)!, decidedAt: iso(row.decidedAt) }; }
function executionData(value: ActionExecution) { return { status: value.status, attempt: value.attempt, startedAt: date(value.startedAt), completedAt: date(value.completedAt), failedAt: date(value.failedAt), deadLetteredAt: date(value.deadLetteredAt), nextRetryAt: date(value.nextRetryAt), output: value.output, durationMs: value.durationMs }; }
function logData(value: ExecutionLog) { return { ...value, createdAt: new Date(value.createdAt) }; }
function eventData(value: ActionEvent) { return { ...value, occurredAt: new Date(value.occurredAt) }; }
function count(rows: ActionExecution[], status: ActionExecution["status"]) { return rows.filter((r) => r.status === status).length; }
function str(value: unknown) { return value == null ? undefined : String(value); }
function iso(value: unknown) { return value == null ? undefined : (value instanceof Date ? value : new Date(String(value))).toISOString(); }
function date(value?: string) { return value ? new Date(value) : undefined; }
