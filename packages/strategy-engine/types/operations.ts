import type { ActorMetadata, OperationalRecommendation, RecommendationCategory } from "./recommendations";
import type { SignalType } from "./signals";
import type { WeeklyStrategy } from "./strategy";

export type RecommendationOutcomeStatus = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "INCONCLUSIVE";

export interface EngagementDelta {
  baseline: number;
  current: number;
  absolute: number;
  percentage?: number;
}

export interface RecommendationOutcomeInput {
  workspaceId: string;
  recommendationId: string;
  outcome?: RecommendationOutcomeStatus;
  baselineEngagement?: number;
  currentEngagement?: number;
  metrics?: Record<string, number>;
  observedAt?: string;
  actor: ActorMetadata;
}

export interface RecommendationOutcomeRecord {
  id?: string;
  workspaceId: string;
  recommendationId: string;
  outcome: RecommendationOutcomeStatus;
  engagementDelta?: EngagementDelta;
  effectivenessScore: number;
  confidenceBefore: number;
  confidenceAfter: number;
  metrics?: Record<string, number>;
  observedAt: string;
}

export interface HistoricalRecommendationAnalytics {
  workspaceId: string;
  recommendationCount: number;
  implementedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  averageEffectiveness: number;
  averageConfidenceAdjustment: number;
  categoryEffectiveness: Partial<Record<RecommendationCategory, number>>;
}

export interface StrategySnapshotRecord extends WeeklyStrategy {
  version: string;
  persistedAt: string;
}

export interface StrategyAuditEntry {
  id?: string;
  workspaceId: string;
  recommendationId?: string;
  strategySnapshotId?: string;
  action: string;
  actor: ActorMetadata;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface StrategyDomainEvent {
  id?: string;
  workspaceId: string;
  recommendationId?: string;
  strategySnapshotId?: string;
  eventType: string;
  aggregateType: "STRATEGY_SNAPSHOT" | "RECOMMENDATION" | "RECOMMENDATION_OUTCOME";
  aggregateId: string;
  payload: Record<string, unknown>;
  status?: "PENDING" | "PUBLISHED" | "FAILED";
  occurredAt: string;
}

export interface StrategyDashboardProjection {
  workspaceId: string;
  generatedAt: string;
  priorityRecommendations: OperationalRecommendation[];
  growthOpportunities: OperationalRecommendation[];
  riskAlerts: OperationalRecommendation[];
  trendSummaries: Array<{ type: SignalType; count: number; averageRelevance: number }>;
  weeklyStrategySummary?: {
    snapshotId: string;
    period: WeeklyStrategy["period"];
    executiveSummary: string;
  };
  confidenceIndicators: Array<{
    recommendationId: string;
    title: string;
    originalConfidence: number;
    adaptiveConfidence: number;
    direction: "UP" | "UNCHANGED" | "DOWN";
  }>;
}
