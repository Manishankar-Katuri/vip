export type RecommendationType =
  | "CONTENT_STRATEGY"
  | "HASHTAG_OPTIMIZATION"
  | "BEST_POSTING_TIME"
  | "ENGAGEMENT_RECOVERY"
  | "GROWTH_ACCELERATION"
  | "CAMPAIGN_OPTIMIZATION"
  | "COMPETITOR_RESPONSE";

export type RecommendationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RecommendationStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "ARCHIVED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type SignalDirection = "INCREASED" | "DECREASED" | "STABLE";
export type AnalyticsMetric =
  | "ENGAGEMENT"
  | "REACH"
  | "POSTING_CONSISTENCY"
  | "AUDIENCE_GROWTH"
  | "MOMENTUM"
  | "CONTENT_PERFORMANCE";

export interface AnalyticsWindow {
  startsAt: string;
  endsAt: string;
  engagementRate: number;
  reach: number;
  postsPublished: number;
  targetPosts: number;
  audienceSize: number;
  contentPerformance: number;
}

export interface AnalyticsAnalysisInput {
  workspaceId: string;
  current: AnalyticsWindow;
  previous: AnalyticsWindow;
  observedAt: string;
  source: string;
}

export interface AnalyticsSignal {
  id: string;
  workspaceId: string;
  metric: AnalyticsMetric;
  direction: SignalDirection;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  normalizedScore: number;
  confidence: number;
  summary: string;
  observedAt: string;
  source: string;
}

export interface RecommendationScoreFactors {
  engagement: number;
  reach: number;
  consistency: number;
  trendMomentum: number;
  contentPerformance: number;
}

export interface RecommendationScore {
  total: number;
  priority: RecommendationPriority;
  factors: RecommendationScoreFactors;
  weights: RecommendationScoreFactors;
}

export interface SupportingMetric {
  metric: AnalyticsMetric;
  direction: SignalDirection;
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

export interface ExplanationPayload {
  reason: string;
  confidence: number;
  supportingMetrics: SupportingMetric[];
  expectedImpact: string;
  riskLevel: RiskLevel;
  explanation: string;
}

export interface WorkflowReadyAction {
  name: string;
  processor: string;
  idempotencyKey: string;
  requiresApproval: boolean;
  input: Record<string, unknown>;
}

export interface RecommendationDraft {
  workspaceId: string;
  type: RecommendationType;
  title: string;
  actions: WorkflowReadyAction[];
  signals: AnalyticsSignal[];
  score: RecommendationScore;
  explanation: ExplanationPayload;
  idempotencyKey: string;
}

export interface Recommendation extends RecommendationDraft {
  id: string;
  status: RecommendationStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationActor {
  type: "USER" | "SYSTEM" | "AI_COPILOT" | "AGENT" | "INTEGRATION";
  id?: string;
}

export type RecommendationEventType =
  | "recommendation.created"
  | "recommendation.updated"
  | "recommendation.approved"
  | "recommendation.rejected"
  | "recommendation.executed";

export interface RecommendationEventBase<TType extends RecommendationEventType, TPayload> {
  eventId: string;
  eventType: TType;
  eventVersion: 1;
  aggregateType: "RECOMMENDATION";
  aggregateId: string;
  workspaceId: string;
  idempotencyKey: string;
  occurredAt: string;
  payload: TPayload;
}

export type RecommendationCreatedEvent = RecommendationEventBase<
  "recommendation.created",
  { recommendation: Recommendation }
>;
export type RecommendationUpdatedEvent = RecommendationEventBase<
  "recommendation.updated",
  { recommendation: Recommendation; changedFields: string[]; actor: RecommendationActor }
>;
export type RecommendationApprovedEvent = RecommendationEventBase<
  "recommendation.approved",
  { recommendation: Recommendation; actor: RecommendationActor; note?: string }
>;
export type RecommendationRejectedEvent = RecommendationEventBase<
  "recommendation.rejected",
  { recommendation: Recommendation; actor: RecommendationActor; reason: string }
>;
export type RecommendationExecutedEvent = RecommendationEventBase<
  "recommendation.executed",
  { recommendation: Recommendation; actor: RecommendationActor; workflowExecutionId: string }
>;

export type RecommendationLifecycleEvent =
  | RecommendationCreatedEvent
  | RecommendationUpdatedEvent
  | RecommendationApprovedEvent
  | RecommendationRejectedEvent
  | RecommendationExecutedEvent;
