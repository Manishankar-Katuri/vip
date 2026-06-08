import type {
  AggregatedSignalSet,
  ExplanationMetadata,
  IntelligenceSignal,
  RecommendationCandidate,
  RecommendationOutcomeRecord,
  RecommendationTransition,
  OperationalRecommendation,
  StrategyAuditEntry,
  StrategyDomainEvent,
  StrategySnapshotRecord,
  StrategicRecommendation,
  WeeklyStrategy,
  WorkspaceStrategyContext,
} from "../types";

export interface SignalCollectionRequest {
  context: WorkspaceStrategyContext;
  asOf: Date;
}

export interface SignalProvider {
  id: string;
  collect(request: SignalCollectionRequest): Promise<IntelligenceSignal[]>;
}

export interface SignalAggregator {
  aggregate(
    context: WorkspaceStrategyContext,
    signals: IntelligenceSignal[],
    asOf?: Date
  ): AggregatedSignalSet;
}

export interface RuleExecutionContext {
  workspace: WorkspaceStrategyContext;
  signalSet: AggregatedSignalSet;
  asOf: Date;
}

export interface RuleExecutor {
  id: string;
  description: string;
  execute(context: RuleExecutionContext): RecommendationCandidate[];
}

export interface RecommendationGenerator {
  generate(context: RuleExecutionContext): StrategicRecommendation[];
}

export interface ExplanationBuilder {
  build(candidate: RecommendationCandidate, context: RuleExecutionContext): ExplanationMetadata;
}

export interface RecommendationFeedback {
  recommendationId: string;
  workspaceId: string;
  outcome: "ACCEPTED" | "DISMISSED" | "COMPLETED" | "UNDERPERFORMED";
  score?: number;
  receivedAt: string;
}

export interface FeedbackLearner {
  record(feedback: RecommendationFeedback): Promise<void>;
}

export interface LlmExplanationAugmenter {
  augment(
    recommendation: StrategicRecommendation,
    context: RuleExecutionContext
  ): Promise<ExplanationMetadata>;
}

export interface SaveStrategyOptions {
  actor: import("../types").ActorMetadata;
  expiresAt?: string;
}

export interface RecommendationQuery {
  workspaceId: string;
  statuses?: OperationalRecommendation["status"][];
  limit?: number;
}

export interface StrategyRepository {
  saveWeeklyStrategy(
    strategy: WeeklyStrategy,
    options: SaveStrategyOptions
  ): Promise<StrategySnapshotRecord>;
  findRecommendation(
    workspaceId: string,
    recommendationId: string
  ): Promise<OperationalRecommendation | null>;
  listRecommendations(query: RecommendationQuery): Promise<OperationalRecommendation[]>;
  listOutcomes(workspaceId: string): Promise<RecommendationOutcomeRecord[]>;
  latestSnapshot(workspaceId: string): Promise<StrategySnapshotRecord | null>;
  saveTransition(
    recommendation: OperationalRecommendation,
    transition: RecommendationTransition,
    audit: StrategyAuditEntry,
    event: StrategyDomainEvent
  ): Promise<OperationalRecommendation>;
  saveOutcome(
    outcome: RecommendationOutcomeRecord,
    recommendation: OperationalRecommendation,
    audit: StrategyAuditEntry,
    event: StrategyDomainEvent
  ): Promise<RecommendationOutcomeRecord>;
  listPendingEvents(limit?: number): Promise<StrategyDomainEvent[]>;
  markEventPublished(eventId: string, publishedAt: string): Promise<void>;
  markEventFailed(eventId: string, failureReason: string): Promise<void>;
}

export interface StrategyEventPublisher {
  publish(event: StrategyDomainEvent): Promise<void>;
}
