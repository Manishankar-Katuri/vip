import { z } from "zod";

const isoDate = z.string().datetime({ offset: true });
const workspaceId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const nonEmptyText = z.string().trim().min(1);
const percentage = z.number().finite().min(-100000).max(100000);
const normalizedScore = z.number().finite().min(0).max(100);

export const RecommendationTypeSchema = z.enum([
  "CONTENT_STRATEGY",
  "HASHTAG_OPTIMIZATION",
  "BEST_POSTING_TIME",
  "ENGAGEMENT_RECOVERY",
  "GROWTH_ACCELERATION",
  "CAMPAIGN_OPTIMIZATION",
  "COMPETITOR_RESPONSE",
]);
export const RecommendationPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RecommendationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "EXECUTED", "ARCHIVED"]);
export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const AnalyticsMetricSchema = z.enum([
  "ENGAGEMENT",
  "REACH",
  "POSTING_CONSISTENCY",
  "AUDIENCE_GROWTH",
  "MOMENTUM",
  "CONTENT_PERFORMANCE",
]);
export const SignalDirectionSchema = z.enum(["INCREASED", "DECREASED", "STABLE"]);

export const AnalyticsWindowSchema = z.object({
  startsAt: isoDate,
  endsAt: isoDate,
  engagementRate: z.number().finite().nonnegative(),
  reach: z.number().finite().nonnegative(),
  postsPublished: z.number().int().nonnegative(),
  targetPosts: z.number().int().positive(),
  audienceSize: z.number().int().nonnegative(),
  contentPerformance: normalizedScore,
}).strict().refine((window) => new Date(window.endsAt) > new Date(window.startsAt), {
  message: "Analytics window end must follow its start.",
});

export const AnalyticsAnalysisInputSchema = z.object({
  workspaceId,
  current: AnalyticsWindowSchema,
  previous: AnalyticsWindowSchema,
  observedAt: isoDate,
  source: nonEmptyText,
}).strict();

export const AnalyticsSignalSchema = z.object({
  id: nonEmptyText,
  workspaceId,
  metric: AnalyticsMetricSchema,
  direction: SignalDirectionSchema,
  currentValue: z.number().finite().nonnegative(),
  previousValue: z.number().finite().nonnegative(),
  changePercent: percentage,
  normalizedScore,
  confidence: z.number().finite().min(0).max(1),
  summary: nonEmptyText,
  observedAt: isoDate,
  source: nonEmptyText,
}).strict();

export const RecommendationScoreFactorsSchema = z.object({
  engagement: normalizedScore,
  reach: normalizedScore,
  consistency: normalizedScore,
  trendMomentum: normalizedScore,
  contentPerformance: normalizedScore,
}).strict();

export const RecommendationScoreSchema = z.object({
  total: normalizedScore,
  priority: RecommendationPrioritySchema,
  factors: RecommendationScoreFactorsSchema,
  weights: z.object({
    engagement: z.number().finite().min(0).max(1),
    reach: z.number().finite().min(0).max(1),
    consistency: z.number().finite().min(0).max(1),
    trendMomentum: z.number().finite().min(0).max(1),
    contentPerformance: z.number().finite().min(0).max(1),
  }).strict(),
}).strict();

export const SupportingMetricSchema = z.object({
  metric: AnalyticsMetricSchema,
  direction: SignalDirectionSchema,
  currentValue: z.number().finite().nonnegative(),
  previousValue: z.number().finite().nonnegative(),
  changePercent: percentage,
}).strict();

export const ExplanationPayloadSchema = z.object({
  reason: nonEmptyText,
  confidence: z.number().finite().min(0).max(1),
  supportingMetrics: z.array(SupportingMetricSchema).min(1),
  expectedImpact: nonEmptyText,
  riskLevel: RiskLevelSchema,
  explanation: nonEmptyText,
}).strict();

export const WorkflowReadyActionSchema = z.object({
  name: nonEmptyText,
  processor: nonEmptyText,
  idempotencyKey: nonEmptyText,
  requiresApproval: z.boolean(),
  input: z.record(z.unknown()),
}).strict();

export const RecommendationDraftSchema = z.object({
  workspaceId,
  type: RecommendationTypeSchema,
  title: nonEmptyText,
  actions: z.array(WorkflowReadyActionSchema).min(1),
  signals: z.array(AnalyticsSignalSchema).min(1),
  score: RecommendationScoreSchema,
  explanation: ExplanationPayloadSchema,
  idempotencyKey: nonEmptyText,
}).strict();

export const RecommendationSchema = RecommendationDraftSchema.extend({
  id: nonEmptyText,
  status: RecommendationStatusSchema,
  version: z.number().int().positive(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict();

export const RecommendationActorSchema = z.object({
  type: z.enum(["USER", "SYSTEM", "AI_COPILOT", "AGENT", "INTEGRATION"]),
  id: nonEmptyText.optional(),
}).strict();

const eventBase = z.object({
  eventId: nonEmptyText,
  eventVersion: z.literal(1),
  aggregateType: z.literal("RECOMMENDATION"),
  aggregateId: nonEmptyText,
  workspaceId,
  idempotencyKey: nonEmptyText,
  occurredAt: isoDate,
});

export const RecommendationLifecycleEventSchema = z.discriminatedUnion("eventType", [
  eventBase.extend({
    eventType: z.literal("recommendation.created"),
    payload: z.object({ recommendation: RecommendationSchema }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("recommendation.updated"),
    payload: z.object({
      recommendation: RecommendationSchema,
      changedFields: z.array(nonEmptyText).min(1),
      actor: RecommendationActorSchema,
    }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("recommendation.approved"),
    payload: z.object({
      recommendation: RecommendationSchema,
      actor: RecommendationActorSchema,
      note: nonEmptyText.optional(),
    }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("recommendation.rejected"),
    payload: z.object({
      recommendation: RecommendationSchema,
      actor: RecommendationActorSchema,
      reason: nonEmptyText,
    }).strict(),
  }).strict(),
  eventBase.extend({
    eventType: z.literal("recommendation.executed"),
    payload: z.object({
      recommendation: RecommendationSchema,
      actor: RecommendationActorSchema,
      workflowExecutionId: nonEmptyText,
    }).strict(),
  }).strict(),
]);
