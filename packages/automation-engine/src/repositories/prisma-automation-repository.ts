import type { DurableAutomationRepository } from "./index";
import { AutomationExecutionSchema, AutomationLifecycleEventSchema, AutomationRuleSchema, WorkflowMappingSchema } from "../schemas";
import type {
  AutomationExecution, AutomationExecutionMetrics, AutomationLifecycleEvent, AutomationLog, AutomationRule, WorkflowMapping,
} from "../types";

type Row = Record<string, unknown>;
interface Delegate {
  create(args: unknown): Promise<Row>;
  update(args: unknown): Promise<Row>;
  upsert(args: unknown): Promise<Row>;
  findFirst(args: unknown): Promise<Row | null>;
  findMany(args: unknown): Promise<Row[]>;
  count(args: unknown): Promise<number>;
}

export interface AutomationPrismaClient {
  automationExecution: Delegate;
  automationExecutionLog: Delegate;
  automationRule: Delegate;
  automationWorkflowMapping: Delegate;
  automationOutboxEvent: Delegate;
  $transaction<T>(fn: (database: AutomationPrismaClient) => Promise<T>): Promise<T>;
}

export class PrismaAutomationRepository implements DurableAutomationRepository {
  constructor(private readonly database: AutomationPrismaClient) {}

  async listEnabledRules(workspaceId: string) {
    const rows = await this.database.automationRule.findMany({ where: { workspaceId, enabled: true } });
    return rows.map(ruleFrom);
  }

  async saveRule(rule: AutomationRule) {
    const value = AutomationRuleSchema.parse(rule) as AutomationRule;
    const row = await this.database.automationRule.upsert({
      where: { id: value.id },
      create: ruleData(value),
      update: ruleData(value),
    });
    return ruleFrom(row);
  }

  async findWorkflowMapping(mappingId: string) {
    const row = await this.database.automationWorkflowMapping.findFirst({ where: { id: mappingId } });
    return row ? mappingFrom(row) : null;
  }

  async saveWorkflowMapping(mapping: WorkflowMapping) {
    const value = WorkflowMappingSchema.parse(mapping) as WorkflowMapping;
    const row = await this.database.automationWorkflowMapping.upsert({
      where: { id: value.id },
      create: mappingData(value),
      update: mappingData(value),
    });
    return mappingFrom(row);
  }

  async findExecutionById(workspaceId: string, executionId: string) {
    const row = await this.database.automationExecution.findFirst({ where: { id: executionId, workspaceId } });
    return row ? executionFrom(row) : null;
  }

  async findExecutionByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    const row = await this.database.automationExecution.findFirst({ where: { workspaceId, idempotencyKey } });
    return row ? executionFrom(row) : null;
  }

  async findEventByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    const row = await this.database.automationOutboxEvent.findFirst({ where: { workspaceId, idempotencyKey } });
    return row ? eventFrom(row) : null;
  }

  async latestExecutionForRule(workspaceId: string, ruleId: string) {
    const row = await this.database.automationExecution.findFirst({
      where: { workspaceId, ruleId }, orderBy: { queuedAt: "desc" },
    });
    return row ? executionFrom(row) : null;
  }

  async countRuleExecutionsSince(workspaceId: string, ruleId: string, since: string) {
    return this.database.automationExecution.count({
      where: { workspaceId, ruleId, queuedAt: { gte: new Date(since) } },
    });
  }

  async createExecution(execution: AutomationExecution, event: AutomationLifecycleEvent, log: AutomationLog) {
    const existing = await this.findExecutionByIdempotencyKey(execution.workspaceId, execution.idempotencyKey);
    if (existing) return existing;
    try {
      return await this.persistCreate(execution, event, log);
    } catch (error) {
      const concurrent = await this.findExecutionByIdempotencyKey(execution.workspaceId, execution.idempotencyKey);
      if (concurrent) return concurrent;
      throw error;
    }
  }

  private async persistCreate(execution: AutomationExecution, event: AutomationLifecycleEvent, log: AutomationLog) {
    return this.database.$transaction(async (db) => {
      const row = await db.automationExecution.create({ data: executionData(execution) });
      await db.automationExecutionLog.create({ data: logData(log) });
      await db.automationOutboxEvent.create({ data: eventData(event) });
      return executionFrom(row);
    });
  }

  async updateExecution(execution: AutomationExecution, event: AutomationLifecycleEvent, log: AutomationLog) {
    const priorEvent = await this.findEventByIdempotencyKey(event.workspaceId, event.idempotencyKey);
    if (priorEvent) return priorEvent.payload.execution;
    try {
      return await this.database.$transaction(async (db) => {
        const row = await db.automationExecution.update({ where: { id: execution.id }, data: executionData(execution) });
        await db.automationExecutionLog.create({ data: logData(log) });
        await db.automationOutboxEvent.create({ data: eventData(event) });
        return executionFrom(row);
      });
    } catch (error) {
      const concurrent = await this.findEventByIdempotencyKey(event.workspaceId, event.idempotencyKey);
      if (concurrent) return concurrent.payload.execution;
      throw error;
    }
  }

  async listPendingEvents(limit: number) {
    const rows = await this.database.automationOutboxEvent.findMany({
      where: { status: { in: ["PENDING", "FAILED"] } }, orderBy: { occurredAt: "asc" }, take: limit,
    });
    return rows.map(eventFrom);
  }

  async markEventPublished(eventId: string, publishedAt: string) {
    await this.database.automationOutboxEvent.update({
      where: { id: eventId }, data: { status: "PUBLISHED", publishedAt: new Date(publishedAt), failureReason: null },
    });
  }

  async markEventFailed(eventId: string, failureMessage: string) {
    await this.database.automationOutboxEvent.update({
      where: { id: eventId }, data: { status: "FAILED", failureReason: failureMessage },
    });
  }

  async metrics(workspaceId: string): Promise<AutomationExecutionMetrics> {
    const executions = (await this.database.automationExecution.findMany({ where: { workspaceId } })).map(executionFrom);
    const durations = executions.flatMap((execution) => execution.startedAt && execution.completedAt
      ? [new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()] : []);
    const count = (status: AutomationExecution["status"]) => executions.filter((execution) => execution.status === status).length;
    return {
      workspaceId, queued: count("QUEUED"), scheduled: count("SCHEDULED"), running: count("RUNNING"),
      retrying: count("RETRYING"), failed: count("FAILED"), completed: count("COMPLETED"),
      rolledBack: count("ROLLED_BACK"), deadLettered: count("DEAD_LETTERED"),
      averageDurationMs: durations.length ? durations.reduce((total, value) => total + value, 0) / durations.length : 0,
    };
  }
}

function executionFrom(row: Row) {
  return AutomationExecutionSchema.parse({
    id: String(row.id), workspaceId: String(row.workspaceId), ruleId: String(row.ruleId),
    recommendationId: String(row.recommendationId), sourceEventId: String(row.sourceEventId),
    idempotencyKey: String(row.idempotencyKey), status: row.status, attempt: Number(row.attempt),
    workflow: row.workflow, retryPolicy: row.retryPolicy, queuedAt: iso(row.queuedAt),
    scheduledFor: iso(row.scheduledFor), startedAt: iso(row.startedAt), completedAt: iso(row.completedAt),
    failedAt: iso(row.failedAt), nextRetryAt: iso(row.nextRetryAt), rolledBackAt: iso(row.rolledBackAt),
    deadLetteredAt: iso(row.deadLetteredAt), queueJobId: str(row.queueJobId),
    lastFailure: str(row.lastFailure), deadLetterEligible: Boolean(row.deadLetterEligible),
  }) as AutomationExecution;
}
function ruleFrom(row: Row) { return AutomationRuleSchema.parse(row.definition) as AutomationRule; }
function mappingFrom(row: Row) { return WorkflowMappingSchema.parse(row.definition) as WorkflowMapping; }
function eventFrom(row: Row) { return AutomationLifecycleEventSchema.parse(row.payload) as AutomationLifecycleEvent; }
function executionData(value: AutomationExecution) {
  return { ...value, queuedAt: date(value.queuedAt), scheduledFor: date(value.scheduledFor), startedAt: date(value.startedAt),
    completedAt: date(value.completedAt), failedAt: date(value.failedAt), nextRetryAt: date(value.nextRetryAt),
    rolledBackAt: date(value.rolledBackAt), deadLetteredAt: date(value.deadLetteredAt) };
}
function ruleData(value: AutomationRule) {
  return { id: value.id, workspaceId: value.workspaceId, enabled: value.enabled, trigger: value.trigger, definition: value,
    createdAt: date(value.createdAt), updatedAt: date(value.updatedAt) };
}
function mappingData(value: WorkflowMapping) { return { id: value.id, recommendationType: value.recommendationType, definition: value }; }
function logData(value: AutomationLog) { return { ...value, occurredAt: date(value.occurredAt) }; }
function eventData(value: AutomationLifecycleEvent) {
  return { id: value.eventId, workspaceId: value.workspaceId, executionId: value.aggregateId, idempotencyKey: value.idempotencyKey,
    eventType: value.eventType, aggregateType: value.aggregateType, aggregateId: value.aggregateId, payload: value,
    occurredAt: date(value.occurredAt) };
}
function date(value?: string) { return value ? new Date(value) : undefined; }
function iso(value: unknown) { return value == null ? undefined : (value instanceof Date ? value : new Date(String(value))).toISOString(); }
function str(value: unknown) { return value == null ? undefined : String(value); }
