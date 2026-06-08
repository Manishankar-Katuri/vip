import { z } from "zod";

const id = z.string().trim().min(1).max(256);
const dateTime = z.string().datetime({ offset: true });
const score = z.number().finite().min(0).max(100);

export const AnalyticsPointSchema = z.object({
  capturedAt: dateTime,
  engagementRate: z.number().finite().nonnegative(),
  reach: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  postsPublished: z.number().int().nonnegative(),
  contentPerformance: score,
  audienceSegments: z.record(z.number().finite().nonnegative()).default({}),
  categories: z.record(z.number().finite().nonnegative()).default({}),
}).strict();

export const AnalyticsSeriesSchema = z.object({
  workspaceId: id,
  source: id,
  points: z.array(AnalyticsPointSchema).min(3),
  observedAt: dateTime,
}).strict();

export const IntelligenceSignalKindSchema = z.enum([
  "VIRAL_SPIKE", "ENGAGEMENT_ANOMALY", "AUDIENCE_SHIFT", "DECLINING_PERFORMANCE",
  "MOMENTUM_ACCELERATION", "STAGNATION",
]);

export const IntelligenceSignalSchema = z.object({
  id,
  workspaceId: id,
  kind: IntelligenceSignalKindSchema,
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  confidence: z.number().finite().min(0).max(1),
  magnitude: z.number().finite(),
  summary: id,
  detectedAt: dateTime,
  evidence: z.record(z.unknown()),
}).strict();

export const PredictionMetricSchema = z.enum([
  "ENGAGEMENT_TRAJECTORY", "FOLLOWER_GROWTH", "CAMPAIGN_PERFORMANCE", "CONTENT_DECAY", "OPPORTUNITY_WINDOW",
]);

export const PredictionSchema = z.object({
  id,
  workspaceId: id,
  metric: PredictionMetricSchema,
  horizonDays: z.number().int().positive().max(365),
  currentValue: z.number().finite(),
  predictedValue: z.number().finite(),
  changePercent: z.number().finite(),
  confidence: z.number().finite().min(0).max(1),
  generatedAt: dateTime,
  rationale: id,
}).strict();

export const CompetitorDatasetSchema = z.object({
  workspaceId: id,
  competitorId: id,
  label: id,
  points: z.array(AnalyticsPointSchema).min(1),
  adoptedTrends: z.array(id),
  capturedAt: dateTime,
}).strict();

export const CompetitorComparisonSchema = z.object({
  workspaceId: id,
  competitorId: id,
  postingFrequencyDelta: z.number().finite(),
  engagementDelta: z.number().finite(),
  trendAdoptionGap: z.array(id),
  leadingCategories: z.array(id),
  generatedAt: dateTime,
}).strict();

export const IntelligenceScoresSchema = z.object({
  growth: score,
  contentHealth: score,
  opportunity: score,
  audienceMomentum: score,
  risk: score,
}).strict();

export const InsightSchema = z.object({
  id,
  workspaceId: id,
  type: z.enum(["DAILY_SUMMARY", "WEEKLY_SUMMARY", "EXECUTIVE_SUMMARY", "ACTION", "RISK_ALERT", "OPPORTUNITY_REPORT"]),
  title: id,
  narrative: id,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  generatedAt: dateTime,
  evidenceIds: z.array(id),
}).strict();

const eventBase = z.object({
  eventId: id,
  eventVersion: z.literal(1),
  workspaceId: id,
  aggregateType: z.literal("ANALYTICS_INTELLIGENCE"),
  aggregateId: id,
  idempotencyKey: id,
  occurredAt: dateTime,
});

export const AnalyticsIntelligenceEventSchema = z.discriminatedUnion("eventType", [
  eventBase.extend({ eventType: z.literal("analytics.anomaly.detected"), payload: IntelligenceSignalSchema }).strict(),
  eventBase.extend({ eventType: z.literal("analytics.trend.detected"), payload: IntelligenceSignalSchema }).strict(),
  eventBase.extend({ eventType: z.literal("analytics.prediction.generated"), payload: PredictionSchema }).strict(),
  eventBase.extend({ eventType: z.literal("analytics.risk.detected"), payload: InsightSchema }).strict(),
]);
