import type {
  RecommendationQuery,
  SaveStrategyOptions,
  StrategyRepository,
} from "../interfaces";
import type {
  OperationalRecommendation,
  RecommendationOutcomeRecord,
  RecommendationTransition,
  StrategyAuditEntry,
  StrategyDomainEvent,
  StrategySnapshotRecord,
  WeeklyStrategy,
} from "../types";

export class InMemoryStrategyRepository implements StrategyRepository {
  private readonly snapshots = new Map<string, StrategySnapshotRecord>();
  private readonly recommendations = new Map<string, OperationalRecommendation>();
  readonly transitions: RecommendationTransition[] = [];
  readonly outcomes: RecommendationOutcomeRecord[] = [];
  readonly auditEntries: StrategyAuditEntry[] = [];
  readonly events: StrategyDomainEvent[] = [];

  async saveWeeklyStrategy(strategy: WeeklyStrategy, options: SaveStrategyOptions) {
    const isNewSnapshot = !this.snapshots.has(strategy.id);
    const record: StrategySnapshotRecord = {
      ...strategy,
      version: "1.0",
      persistedAt: strategy.generatedAt,
    };
    this.snapshots.set(strategy.id, record);

    for (const recommendation of strategy.recommendations) {
      if (this.recommendations.has(recommendation.id)) continue;
      const persisted = operationalRecommendation(recommendation, strategy.id, options.expiresAt);
      this.recommendations.set(persisted.id, persisted);
      const occurredAt = recommendation.generatedAt;
      this.transitions.push({
        workspaceId: strategy.workspaceId,
        recommendationId: persisted.id,
        toStatus: "GENERATED",
        actor: options.actor,
        progress: 0,
        occurredAt,
      });
      this.auditEntries.push({
        workspaceId: strategy.workspaceId,
        recommendationId: persisted.id,
        strategySnapshotId: strategy.id,
        action: "RECOMMENDATION_GENERATED",
        actor: options.actor,
        createdAt: occurredAt,
      });
      this.storeEvent({
        workspaceId: strategy.workspaceId,
        recommendationId: persisted.id,
        strategySnapshotId: strategy.id,
        eventType: "recommendation.generated",
        aggregateType: "RECOMMENDATION",
        aggregateId: persisted.id,
        payload: { category: persisted.category, score: persisted.score.total },
        status: "PENDING",
        occurredAt,
      });
    }

    if (isNewSnapshot) {
      this.auditEntries.push({
        workspaceId: strategy.workspaceId,
        strategySnapshotId: strategy.id,
        action: "STRATEGY_SNAPSHOT_PERSISTED",
        actor: options.actor,
        createdAt: strategy.generatedAt,
      });
      this.storeEvent({
        workspaceId: strategy.workspaceId,
        strategySnapshotId: strategy.id,
        eventType: "strategy.snapshot.persisted",
        aggregateType: "STRATEGY_SNAPSHOT",
        aggregateId: strategy.id,
        payload: { recommendationCount: strategy.recommendations.length },
        status: "PENDING",
        occurredAt: strategy.generatedAt,
      });
    }
    return record;
  }

  async findRecommendation(workspaceId: string, recommendationId: string) {
    const record = this.recommendations.get(recommendationId);
    return record?.workspaceId === workspaceId ? record : null;
  }

  async listRecommendations(query: RecommendationQuery) {
    return Array.from(this.recommendations.values())
      .filter((item) => item.workspaceId === query.workspaceId)
      .filter((item) => !query.statuses || query.statuses.includes(item.status))
      .sort((left, right) => right.score.total - left.score.total)
      .slice(0, query.limit);
  }

  async listOutcomes(workspaceId: string) {
    return this.outcomes.filter((item) => item.workspaceId === workspaceId);
  }

  async latestSnapshot(workspaceId: string) {
    return Array.from(this.snapshots.values())
      .filter((item) => item.workspaceId === workspaceId)
      .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))[0] ?? null;
  }

  async saveTransition(
    recommendation: OperationalRecommendation,
    transition: RecommendationTransition,
    audit: StrategyAuditEntry,
    event: StrategyDomainEvent
  ) {
    this.recommendations.set(recommendation.id, recommendation);
    this.transitions.push(transition);
    this.auditEntries.push(audit);
    this.storeEvent(event);
    return recommendation;
  }

  async saveOutcome(
    outcome: RecommendationOutcomeRecord,
    recommendation: OperationalRecommendation,
    audit: StrategyAuditEntry,
    event: StrategyDomainEvent
  ) {
    this.recommendations.set(recommendation.id, recommendation);
    this.outcomes.push(outcome);
    this.auditEntries.push(audit);
    this.storeEvent(event);
    return outcome;
  }

  async listPendingEvents(limit = 100) {
    return this.events.filter((event) => event.status === "PENDING").slice(0, limit);
  }

  async markEventPublished(eventId: string, publishedAt: string) {
    const event = this.events.find((item) => item.id === eventId);
    if (event) {
      event.status = "PUBLISHED";
      event.payload = { ...event.payload, publishedAt };
    }
  }

  async markEventFailed(eventId: string, failureReason: string) {
    const event = this.events.find((item) => item.id === eventId);
    if (event) {
      event.status = "FAILED";
      event.payload = { ...event.payload, failureReason };
    }
  }

  private storeEvent(event: StrategyDomainEvent) {
    this.events.push({
      ...event,
      id: event.id ?? `event-${this.events.length + 1}`,
      status: "PENDING",
    });
  }
}

function operationalRecommendation(
  recommendation: WeeklyStrategy["recommendations"][number],
  strategySnapshotId: string,
  expiresAt?: string
): OperationalRecommendation {
  return {
    ...recommendation,
    strategySnapshotId,
    status: "GENERATED",
    adaptiveConfidence: recommendation.score.factors.confidence / 100,
    lifecycle: { generatedAt: recommendation.generatedAt, expiresAt },
    implementation: { percentage: 0, updatedAt: recommendation.generatedAt },
    updatedAt: recommendation.generatedAt,
  };
}
