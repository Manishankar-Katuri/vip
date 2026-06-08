import { z } from "zod";

const text = z.string().trim().min(1).max(512);
const dateTime = z.string().datetime({ offset: true });

const domainEventBase = z.object({
  eventId: text,
  eventVersion: z.literal(1),
  aggregateId: text,
  workspaceId: text,
  idempotencyKey: text,
  occurredAt: dateTime,
});

export const DashboardAlertEventSchema = z.object({
  eventId: text,
  eventType: z.literal("dashboard.alert.raised"),
  eventVersion: z.literal(1),
  aggregateType: z.literal("DASHBOARD_ALERT"),
  aggregateId: text,
  workspaceId: text,
  idempotencyKey: text,
  occurredAt: dateTime,
  payload: z.object({
    title: text,
    severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
    message: text,
    sourceEventId: text,
  }).strict(),
}).strict();

export const WorkflowEventSchema = domainEventBase.extend({
  eventType: z.enum(["workflow.started", "workflow.completed", "workflow.failed"]),
  aggregateType: z.literal("WORKFLOW"),
  payload: z.object({
    workflowId: text,
    workflowType: text,
    status: z.enum(["STARTED", "COMPLETED", "FAILED"]),
    owner: text.optional(),
    sourceEventId: text.optional(),
    summary: text,
    data: z.record(z.unknown()),
  }).strict(),
}).strict();

export const CompetitorIntelligenceEventSchema = domainEventBase.extend({
  eventType: z.enum(["competitor.signal.detected", "competitor.benchmark.updated"]),
  aggregateType: z.literal("COMPETITOR"),
  payload: z.object({
    competitorId: text,
    platform: text.optional(),
    signal: text,
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    confidence: z.number().finite().min(0).max(1),
    summary: text,
    evidence: z.record(z.unknown()),
  }).strict(),
}).strict();

export const ReviewIntelligenceEventSchema = domainEventBase.extend({
  eventType: z.enum(["review.received", "review.sentiment.changed", "review.risk.detected"]),
  aggregateType: z.literal("REVIEW"),
  payload: z.object({
    reviewId: text,
    source: text,
    rating: z.number().int().min(1).max(5).optional(),
    sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]).optional(),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    summary: text,
    evidence: z.record(z.unknown()),
  }).strict(),
}).strict();

const workspaceId = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const percentage = z.number().finite().min(-100000).max(100000);
const score = z.number().finite().min(0).max(100);
const confidence = z.number().finite().min(0).max(1);
const recommendationType = z.enum([
  "CONTENT_STRATEGY", "HASHTAG_OPTIMIZATION", "BEST_POSTING_TIME", "ENGAGEMENT_RECOVERY",
  "GROWTH_ACCELERATION", "CAMPAIGN_OPTIMIZATION", "COMPETITOR_RESPONSE",
]);
const analyticsMetric = z.enum([
  "ENGAGEMENT", "REACH", "POSTING_CONSISTENCY", "AUDIENCE_GROWTH", "MOMENTUM", "CONTENT_PERFORMANCE",
]);
const signalDirection = z.enum(["INCREASED", "DECREASED", "STABLE"]);
const supportingMetric = z.object({
  metric: analyticsMetric, direction: signalDirection, currentValue: z.number().finite().nonnegative(),
  previousValue: z.number().finite().nonnegative(), changePercent: percentage,
}).strict();
const recommendationSignal = z.object({
  id: text, workspaceId, metric: analyticsMetric, direction: signalDirection,
  currentValue: z.number().finite().nonnegative(), previousValue: z.number().finite().nonnegative(),
  changePercent: percentage, normalizedScore: score, confidence, summary: text, observedAt: dateTime, source: text,
}).strict();
const action = z.object({
  name: text, processor: text, idempotencyKey: text, requiresApproval: z.boolean(), input: z.record(z.unknown()),
}).strict();
const recommendation = z.object({
  id: text, workspaceId, type: recommendationType, title: text, actions: z.array(action).min(1),
  signals: z.array(recommendationSignal).min(1),
  score: z.object({
    total: score, priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    factors: z.object({
      engagement: score, reach: score, consistency: score, trendMomentum: score, contentPerformance: score,
    }).strict(),
    weights: z.object({
      engagement: confidence, reach: confidence, consistency: confidence, trendMomentum: confidence, contentPerformance: confidence,
    }).strict(),
  }).strict(),
  explanation: z.object({
    reason: text, confidence, supportingMetrics: z.array(supportingMetric).min(1),
    expectedImpact: text, riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]), explanation: text,
  }).strict(),
  idempotencyKey: text, status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXECUTED", "ARCHIVED"]),
  version: z.number().int().positive(), createdAt: dateTime, updatedAt: dateTime,
}).strict();
const actor = z.object({ type: z.enum(["USER", "SYSTEM", "AI_COPILOT", "AGENT", "INTEGRATION"]), id: text.optional() }).strict();
const recommendationBase = domainEventBase.extend({ aggregateType: z.literal("RECOMMENDATION"), workspaceId });

export const RecommendationTransportEventSchema = z.discriminatedUnion("eventType", [
  recommendationBase.extend({ eventType: z.literal("recommendation.created"), payload: z.object({ recommendation }).strict() }).strict(),
  recommendationBase.extend({
    eventType: z.literal("recommendation.updated"),
    payload: z.object({ recommendation, changedFields: z.array(text).min(1), actor }).strict(),
  }).strict(),
  recommendationBase.extend({
    eventType: z.literal("recommendation.approved"), payload: z.object({ recommendation, actor, note: text.optional() }).strict(),
  }).strict(),
  recommendationBase.extend({
    eventType: z.literal("recommendation.rejected"), payload: z.object({ recommendation, actor, reason: text }).strict(),
  }).strict(),
  recommendationBase.extend({
    eventType: z.literal("recommendation.executed"),
    payload: z.object({ recommendation, actor, workflowExecutionId: text }).strict(),
  }).strict(),
]);

const intelligenceSignal = z.object({
  id: text, workspaceId: text, kind: z.enum([
    "VIRAL_SPIKE", "ENGAGEMENT_ANOMALY", "AUDIENCE_SHIFT", "DECLINING_PERFORMANCE", "MOMENTUM_ACCELERATION", "STAGNATION",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), confidence, magnitude: z.number().finite(),
  summary: text, detectedAt: dateTime, evidence: z.record(z.unknown()),
}).strict();
const prediction = z.object({
  id: text, workspaceId: text,
  metric: z.enum(["ENGAGEMENT_TRAJECTORY", "FOLLOWER_GROWTH", "CAMPAIGN_PERFORMANCE", "CONTENT_DECAY", "OPPORTUNITY_WINDOW"]),
  horizonDays: z.number().int().positive().max(365), currentValue: z.number().finite(), predictedValue: z.number().finite(),
  changePercent: z.number().finite(), confidence, generatedAt: dateTime, rationale: text,
}).strict();
const insight = z.object({
  id: text, workspaceId: text,
  type: z.enum(["DAILY_SUMMARY", "WEEKLY_SUMMARY", "EXECUTIVE_SUMMARY", "ACTION", "RISK_ALERT", "OPPORTUNITY_REPORT"]),
  title: text, narrative: text, priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  generatedAt: dateTime, evidenceIds: z.array(text),
}).strict();
const analyticsBase = domainEventBase.extend({ aggregateType: z.literal("ANALYTICS_INTELLIGENCE") });
export const AnalyticsTransportEventSchema = z.discriminatedUnion("eventType", [
  analyticsBase.extend({ eventType: z.literal("analytics.anomaly.detected"), payload: intelligenceSignal }).strict(),
  analyticsBase.extend({ eventType: z.literal("analytics.trend.detected"), payload: intelligenceSignal }).strict(),
  analyticsBase.extend({ eventType: z.literal("analytics.prediction.generated"), payload: prediction }).strict(),
  analyticsBase.extend({ eventType: z.literal("analytics.risk.detected"), payload: insight }).strict(),
]);

const automationExecution = z.object({
  id: text, workspaceId, ruleId: text, recommendationId: text, sourceEventId: text, idempotencyKey: text,
  status: z.enum(["QUEUED", "SCHEDULED", "RUNNING", "RETRYING", "FAILED", "COMPLETED", "ROLLED_BACK", "DEAD_LETTERED"]),
  attempt: z.number().int().nonnegative(),
  workflow: z.object({
    workflowType: text, name: text, processor: text, idempotencyKey: text,
    requiresApproval: z.boolean(), input: z.record(z.unknown()),
  }).strict(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().positive(), backoffMs: z.number().int().nonnegative(),
    deadLetterAfterAttempts: z.number().int().positive(),
  }).strict(),
  queuedAt: dateTime, scheduledFor: dateTime.optional(), startedAt: dateTime.optional(), completedAt: dateTime.optional(),
  failedAt: dateTime.optional(), nextRetryAt: dateTime.optional(), rolledBackAt: dateTime.optional(),
  deadLetteredAt: dateTime.optional(), queueJobId: text.optional(), lastFailure: text.optional(), deadLetterEligible: z.boolean(),
}).strict();
const automationBase = domainEventBase.extend({ aggregateType: z.literal("AUTOMATION_EXECUTION"), workspaceId });
export const AutomationTransportEventSchema = z.discriminatedUnion("eventType", [
  automationBase.extend({
    eventType: z.literal("automation.triggered"),
    payload: z.object({ execution: automationExecution, ruleId: text, recommendationId: text, sourceEventId: text }).strict(),
  }).strict(),
  automationBase.extend({
    eventType: z.literal("automation.scheduled"), payload: z.object({ execution: automationExecution, runAt: dateTime }).strict(),
  }).strict(),
  automationBase.extend({ eventType: z.literal("automation.started"), payload: z.object({ execution: automationExecution }).strict() }).strict(),
  automationBase.extend({
    eventType: z.literal("automation.retrying"),
    payload: z.object({ execution: automationExecution, reason: text, runAt: dateTime }).strict(),
  }).strict(),
  automationBase.extend({
    eventType: z.literal("automation.failed"),
    payload: z.object({ execution: automationExecution, reason: text, retryScheduled: z.boolean(), deadLetterEligible: z.boolean() }).strict(),
  }).strict(),
  automationBase.extend({
    eventType: z.literal("automation.completed"),
    payload: z.object({ execution: automationExecution, result: z.record(z.unknown()) }).strict(),
  }).strict(),
  automationBase.extend({
    eventType: z.literal("automation.rolled_back"), payload: z.object({ execution: automationExecution, reason: text }).strict(),
  }).strict(),
  automationBase.extend({
    eventType: z.literal("automation.dead_lettered"), payload: z.object({ execution: automationExecution, reason: text }).strict(),
  }).strict(),
]);

const cognitiveBase = domainEventBase.extend({ aggregateType: z.literal("INTELLIGENCE") });
export const CognitiveIntelligenceTransportEventSchema = z.discriminatedUnion("eventType", [
  cognitiveBase.extend({
    eventType: z.literal("intelligence.signal.raised"),
    payload: z.object({ signal: z.record(z.unknown()), traceId: text }).strict(),
  }).strict(),
  cognitiveBase.extend({
    eventType: z.literal("intelligence.signal.correlated"),
    payload: z.object({ signalIds: z.array(text).min(1), correlationKey: text, traceId: text }).strict(),
  }).strict(),
  cognitiveBase.extend({
    eventType: z.literal("intelligence.priority.created"),
    payload: z.object({ priority: z.record(z.unknown()), traceId: text }).strict(),
  }).strict(),
  cognitiveBase.extend({
    eventType: z.literal("intelligence.recommendation.reasoned"),
    payload: z.object({ recommendation: z.record(z.unknown()), traceId: text }).strict(),
  }).strict(),
  cognitiveBase.extend({
    eventType: z.literal("intelligence.causal_chain.detected"),
    payload: z.object({ causalChain: z.record(z.unknown()), traceId: text }).strict(),
  }).strict(),
  cognitiveBase.extend({
    eventType: z.literal("intelligence.trace.recorded"),
    payload: z.object({ trace: z.record(z.unknown()) }).strict(),
  }).strict(),
]);

const agentBase = domainEventBase.extend({ aggregateType: z.literal("AGENT") });
export const AgentRuntimeTransportEventSchema = z.discriminatedUnion("eventType", [
  agentBase.extend({ eventType: z.literal("agent.observation.recorded"), payload: z.object({ kind: z.literal("OBSERVATION"), agentId: text, traceId: text, observation: z.record(z.unknown()) }).strict() }).strict(),
  agentBase.extend({ eventType: z.literal("agent.plan.created"), payload: z.object({ kind: z.literal("PLAN"), agentId: text, traceId: text, plan: z.record(z.unknown()) }).strict() }).strict(),
  agentBase.extend({ eventType: z.literal("agent.action.executed"), payload: z.object({ kind: z.literal("EXECUTION_ACTION"), agentId: text, traceId: text, action: z.record(z.unknown()) }).strict() }).strict(),
  agentBase.extend({ eventType: z.literal("agent.report.generated"), payload: z.object({ kind: z.literal("REPORT"), agentId: text, traceId: text, report: z.record(z.unknown()) }).strict() }).strict(),
  agentBase.extend({ eventType: z.literal("agent.outcome.recorded"), payload: z.object({ kind: z.literal("OUTCOME"), agentId: text, traceId: text, outcome: z.record(z.unknown()) }).strict() }).strict(),
]);

const outcomeBase = domainEventBase.extend({ aggregateType: z.literal("OUTCOME") });
export const OutcomeMemoryTransportEventSchema = z.discriminatedUnion("eventType", [
  outcomeBase.extend({ eventType: z.literal("outcome.recorded"), payload: z.object({ traceId: text, outcome: z.record(z.unknown()) }).strict() }).strict(),
  outcomeBase.extend({ eventType: z.literal("outcome.episode.recorded"), payload: z.object({ traceId: text, episode: z.record(z.unknown()) }).strict() }).strict(),
  outcomeBase.extend({ eventType: z.literal("outcome.correlation.updated"), payload: z.object({ traceId: text, correlation: z.record(z.unknown()) }).strict() }).strict(),
]);

const learningBase = domainEventBase.extend({ aggregateType: z.literal("LEARNING") });
export const LearningTransportEventSchema = z.discriminatedUnion("eventType", [
  learningBase.extend({ eventType: z.literal("learning.recommendation.analyzed"), payload: z.object({ traceId: text, summary: z.record(z.unknown()) }).strict() }).strict(),
  learningBase.extend({ eventType: z.literal("learning.strategy.scored"), payload: z.object({ traceId: text, summary: z.record(z.unknown()) }).strict() }).strict(),
  learningBase.extend({ eventType: z.literal("learning.confidence.updated"), payload: z.object({ traceId: text, summary: z.record(z.unknown()) }).strict() }).strict(),
  learningBase.extend({ eventType: z.literal("learning.pattern.discovered"), payload: z.object({ traceId: text, summary: z.record(z.unknown()) }).strict() }).strict(),
  learningBase.extend({ eventType: z.literal("learning.executive_briefing.generated"), payload: z.object({ traceId: text, summary: z.record(z.unknown()) }).strict() }).strict(),
]);

const operationsBase = domainEventBase.extend({ aggregateType: z.literal("OPERATIONS") });
export const OperationsTransportEventSchema = z.discriminatedUnion("eventType", [
  operationsBase.extend({ eventType: z.literal("operations.mission.created"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.mission.progressed"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.agent.message.sent"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.consensus.reached"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.workflow.synthesized"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.forecast.generated"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.benchmark.generated"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
  operationsBase.extend({ eventType: z.literal("operations.control_plane.snapshot"), payload: z.object({ traceId: text, kind: text, data: z.record(z.unknown()) }).strict() }).strict(),
]);

const dailyGrowthMissionBase = domainEventBase.extend({ aggregateType: z.literal("DAILY_GROWTH_MISSION") });
const dailyGrowthMissionPayload = z.object({
  traceId: text,
  missionExecutionId: text,
  phase: text,
  summary: text,
  data: z.record(z.unknown()),
}).strict();
export const DailyGrowthMissionTransportEventSchema = z.discriminatedUnion("eventType", [
  dailyGrowthMissionBase.extend({ eventType: z.literal("operations.mission.daily_growth.started"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("analytics.acquisition.completed"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("performance.analysis.completed"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("strategy.learning.generated"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("opportunity.discovery.completed"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("strategy.plan.generated"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("content.production.generated"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("report.generated"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("approval.completed"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("production.tasks.created"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("publishing.prepared"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("content.outcome.generated"), payload: dailyGrowthMissionPayload }).strict(),
  dailyGrowthMissionBase.extend({ eventType: z.literal("learning.memory.updated"), payload: dailyGrowthMissionPayload }).strict(),
]);

export const OrchestratedEventSchema = z.union([
  AnalyticsTransportEventSchema,
  CognitiveIntelligenceTransportEventSchema,
  AgentRuntimeTransportEventSchema,
  OutcomeMemoryTransportEventSchema,
  LearningTransportEventSchema,
  OperationsTransportEventSchema,
  DailyGrowthMissionTransportEventSchema,
  RecommendationTransportEventSchema,
  AutomationTransportEventSchema,
  DashboardAlertEventSchema,
  WorkflowEventSchema,
  CompetitorIntelligenceEventSchema,
  ReviewIntelligenceEventSchema,
]);

export const EventMetadataSchema = z.object({
  correlationId: text,
  requestId: text.optional(),
  executionId: text.optional(),
  traceparent: text.optional(),
  causationId: text.optional(),
  producer: text,
  actor: z.object({
    type: z.enum(["USER", "SYSTEM", "AI_COPILOT", "AGENT", "INTEGRATION"]),
    id: text.optional(),
  }).strict().optional(),
  source: z.object({
    module: z.enum(["recommendations", "workflows", "analytics", "competitors", "reviews", "automation", "dashboard", "intelligence", "agents", "outcomes", "learning"]),
    component: text.optional(),
  }).strict().optional(),
  tags: z.array(text).max(32).optional(),
  attributes: z.record(z.union([z.string(), z.number().finite(), z.boolean()])).optional(),
}).strict();

export const DurableEventEnvelopeSchema = z.object({
  envelopeId: text,
  topic: z.enum(["analytics", "recommendations", "automation", "dashboard", "workflows", "competitors", "reviews", "intelligence", "agents", "outcomes", "learning"]),
  event: OrchestratedEventSchema,
  metadata: EventMetadataSchema,
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
  publishedAt: dateTime,
  sequence: z.number().int().positive(),
  state: z.enum(["PENDING", "DISPATCHING", "DELIVERED", "DEAD_LETTERED"]),
}).strict();

export const ReplayQuerySchema = z.object({
  aggregateId: text.optional(),
  eventType: z.string().trim().min(1).optional(),
  from: dateTime.optional(),
  to: dateTime.optional(),
  workspaceId: text.optional(),
}).strict().refine((value) => !value.from || !value.to || new Date(value.from) <= new Date(value.to), {
  message: "Replay time range is invalid.",
});
