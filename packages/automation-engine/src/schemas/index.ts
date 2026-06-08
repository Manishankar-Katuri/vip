import { z } from "zod";

const dateTime = z.string().datetime({ offset: true });
const text = z.string().trim().min(1);
const workspaceId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

export const AutomationTriggerSchema = z.enum([
  "ENGAGEMENT_DROP",
  "VIRAL_SPIKE",
  "AUDIENCE_DECLINE",
  "POSTING_INACTIVITY",
  "HIGH_CONFIDENCE_GROWTH_OPPORTUNITY",
  "CRITICAL_RECOMMENDATION",
]);
export const AutomationExecutionStatusSchema = z.enum([
  "QUEUED", "SCHEDULED", "RUNNING", "RETRYING", "FAILED", "COMPLETED", "ROLLED_BACK", "DEAD_LETTERED",
]);
export const AutomationMetricSchema = z.enum([
  "ENGAGEMENT",
  "REACH",
  "POSTING_CONSISTENCY",
  "AUDIENCE_GROWTH",
  "MOMENTUM",
  "CONTENT_PERFORMANCE",
  "CONFIDENCE",
  "RECOMMENDATION_SCORE",
]);
export const RecommendationTypeSchema = z.enum([
  "CONTENT_STRATEGY",
  "HASHTAG_OPTIMIZATION",
  "BEST_POSTING_TIME",
  "ENGAGEMENT_RECOVERY",
  "GROWTH_ACCELERATION",
  "CAMPAIGN_OPTIMIZATION",
  "COMPETITOR_RESPONSE",
]);

export const AutomationConditionSchema = z.object({
  metric: AutomationMetricSchema,
  operator: z.enum(["GT", "GTE", "LT", "LTE", "EQ"]),
  threshold: z.number().finite(),
}).strict();

export const AutomationRuleSchema = z.object({
  id: text,
  workspaceId,
  name: text,
  enabled: z.boolean(),
  trigger: AutomationTriggerSchema,
  recommendationTypes: z.array(RecommendationTypeSchema).min(1).optional(),
  conditions: z.array(AutomationConditionSchema).min(1),
  cooldownMinutes: z.number().int().nonnegative(),
  executionLimit: z.object({
    maxExecutions: z.number().int().positive(),
    windowMinutes: z.number().int().positive(),
  }).strict(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().positive(),
    backoffMs: z.number().int().nonnegative(),
    deadLetterAfterAttempts: z.number().int().positive(),
  }).strict(),
  workflowMappingId: text,
  createdAt: dateTime,
  updatedAt: dateTime,
}).strict();

export const WorkflowMappingSchema = z.object({
  id: text,
  recommendationType: RecommendationTypeSchema,
  workflowType: text,
  action: z.object({
    name: text,
    processor: text,
    requiresApproval: z.boolean(),
    input: z.record(z.unknown()),
  }).strict(),
}).strict();

export const AutomationExecutionSchema = z.object({
  id: text,
  workspaceId,
  ruleId: text,
  recommendationId: text,
  sourceEventId: text,
  idempotencyKey: text,
  status: AutomationExecutionStatusSchema,
  attempt: z.number().int().nonnegative(),
  workflow: z.object({
    workflowType: text,
    name: text,
    processor: text,
    idempotencyKey: text,
    requiresApproval: z.boolean(),
    input: z.record(z.unknown()),
  }).strict(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().positive(),
    backoffMs: z.number().int().nonnegative(),
    deadLetterAfterAttempts: z.number().int().positive(),
  }).strict(),
  queuedAt: dateTime,
  scheduledFor: dateTime.optional(),
  startedAt: dateTime.optional(),
  completedAt: dateTime.optional(),
  failedAt: dateTime.optional(),
  nextRetryAt: dateTime.optional(),
  rolledBackAt: dateTime.optional(),
  deadLetteredAt: dateTime.optional(),
  queueJobId: text.optional(),
  lastFailure: text.optional(),
  deadLetterEligible: z.boolean(),
}).strict();

const eventBase = z.object({
  eventId: text,
  eventVersion: z.literal(1),
  aggregateType: z.literal("AUTOMATION_EXECUTION"),
  aggregateId: text,
  workspaceId,
  idempotencyKey: text,
  occurredAt: dateTime,
});

export const AutomationLifecycleEventSchema = z.discriminatedUnion("eventType", [
  eventBase.extend({
    eventType: z.literal("automation.triggered"),
    payload: z.object({
      execution: AutomationExecutionSchema,
      ruleId: text,
      recommendationId: text,
      sourceEventId: text,
    }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.scheduled"),
    payload: z.object({ execution: AutomationExecutionSchema, runAt: dateTime }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.started"),
    payload: z.object({ execution: AutomationExecutionSchema }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.retrying"),
    payload: z.object({ execution: AutomationExecutionSchema, reason: text, runAt: dateTime }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.failed"),
    payload: z.object({
      execution: AutomationExecutionSchema,
      reason: text,
      retryScheduled: z.boolean(),
      deadLetterEligible: z.boolean(),
    }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.completed"),
    payload: z.object({
      execution: AutomationExecutionSchema,
      result: z.record(z.unknown()),
    }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.rolled_back"),
    payload: z.object({ execution: AutomationExecutionSchema, reason: text }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("automation.dead_lettered"),
    payload: z.object({ execution: AutomationExecutionSchema, reason: text }).strict(),
  }).strict(),
]);
