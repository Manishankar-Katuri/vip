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

type DatabaseRow = Record<string, unknown>;

interface DatabaseDelegate {
  create(args: unknown): Promise<DatabaseRow>;
  update(args: unknown): Promise<DatabaseRow>;
  upsert(args: unknown): Promise<DatabaseRow>;
  findUnique(args: unknown): Promise<DatabaseRow | null>;
  findFirst(args: unknown): Promise<DatabaseRow | null>;
  findMany(args: unknown): Promise<DatabaseRow[]>;
}

export interface StrategyPrismaClient {
  strategySnapshot: DatabaseDelegate;
  aIRecommendation: DatabaseDelegate;
  recommendationStatusTransition: DatabaseDelegate;
  recommendationOutcome: DatabaseDelegate;
  strategyAuditEvent: DatabaseDelegate;
  strategyOutboxEvent: DatabaseDelegate;
  $transaction<T>(operation: (transaction: StrategyPrismaClient) => Promise<T>): Promise<T>;
}

export class PrismaStrategyRepository implements StrategyRepository {
  constructor(private readonly database: StrategyPrismaClient) {}

  async saveWeeklyStrategy(strategy: WeeklyStrategy, options: SaveStrategyOptions) {
    return this.database.$transaction(async (database) => {
      const currentSnapshot = await database.strategySnapshot.findUnique({ where: { id: strategy.id } });
      await database.strategySnapshot.upsert({
        where: { id: strategy.id },
        create: snapshotData(strategy),
        update: snapshotData(strategy),
      });

      for (const recommendation of strategy.recommendations) {
        const current = await database.aIRecommendation.findUnique({ where: { id: recommendation.id } });
        await database.aIRecommendation.upsert({
          where: { id: recommendation.id },
          create: recommendationData(recommendation, strategy.id, options.expiresAt),
          update: recommendationUpdateData(recommendation, strategy.id, options.expiresAt),
        });

        if (!current) {
          await database.recommendationStatusTransition.create({
            data: transitionData({
              workspaceId: strategy.workspaceId,
              recommendationId: recommendation.id,
              toStatus: "GENERATED",
              actor: options.actor,
              progress: 0,
              occurredAt: recommendation.generatedAt,
            }),
          });
          await database.strategyAuditEvent.create({
            data: auditData({
              workspaceId: strategy.workspaceId,
              recommendationId: recommendation.id,
              strategySnapshotId: strategy.id,
              action: "RECOMMENDATION_GENERATED",
              actor: options.actor,
              createdAt: recommendation.generatedAt,
            }),
          });
          await database.strategyOutboxEvent.create({
            data: eventData({
              workspaceId: strategy.workspaceId,
              recommendationId: recommendation.id,
              strategySnapshotId: strategy.id,
              eventType: "recommendation.generated",
              aggregateType: "RECOMMENDATION",
              aggregateId: recommendation.id,
              payload: { category: recommendation.category, score: recommendation.score.total },
              occurredAt: recommendation.generatedAt,
            }),
          });
        }
      }

      if (!currentSnapshot) {
        await database.strategyAuditEvent.create({
          data: auditData({
            workspaceId: strategy.workspaceId,
            strategySnapshotId: strategy.id,
            action: "STRATEGY_SNAPSHOT_PERSISTED",
            actor: options.actor,
            createdAt: strategy.generatedAt,
          }),
        });
        await database.strategyOutboxEvent.create({
          data: eventData({
            workspaceId: strategy.workspaceId,
            strategySnapshotId: strategy.id,
            eventType: "strategy.snapshot.persisted",
            aggregateType: "STRATEGY_SNAPSHOT",
            aggregateId: strategy.id,
            payload: { recommendationCount: strategy.recommendations.length },
            occurredAt: strategy.generatedAt,
          }),
        });
      }
      return { ...strategy, version: "1.0", persistedAt: strategy.generatedAt };
    });
  }

  async findRecommendation(workspaceId: string, recommendationId: string) {
    const row = await this.database.aIRecommendation.findFirst({
      where: { id: recommendationId, workspaceId },
    });
    return row ? fromRecommendationRow(row) : null;
  }

  async listRecommendations(query: RecommendationQuery) {
    const rows = await this.database.aIRecommendation.findMany({
      where: {
        workspaceId: query.workspaceId,
        category: { not: null },
        ...(query.statuses ? { status: { in: query.statuses } } : {}),
      },
      orderBy: { score: "desc" },
      take: query.limit,
    });
    return rows.map(fromRecommendationRow);
  }

  async listOutcomes(workspaceId: string) {
    const rows = await this.database.recommendationOutcome.findMany({
      where: { workspaceId },
      orderBy: { observedAt: "desc" },
    });
    return rows.map(fromOutcomeRow);
  }

  async latestSnapshot(workspaceId: string) {
    const row = await this.database.strategySnapshot.findFirst({
      where: { workspaceId },
      orderBy: { generatedAt: "desc" },
      include: { recommendations: true },
    });
    return row ? fromSnapshotRow(row) : null;
  }

  async saveTransition(
    recommendation: OperationalRecommendation,
    transition: RecommendationTransition,
    audit: StrategyAuditEntry,
    event: StrategyDomainEvent
  ) {
    return this.database.$transaction(async (database) => {
      const updated = await database.aIRecommendation.update({
        where: { id: recommendation.id },
        data: lifecycleData(recommendation),
      });
      await database.recommendationStatusTransition.create({ data: transitionData(transition) });
      await database.strategyAuditEvent.create({ data: auditData(audit) });
      await database.strategyOutboxEvent.create({ data: eventData(event) });
      return fromRecommendationRow(updated);
    });
  }

  async saveOutcome(
    outcome: RecommendationOutcomeRecord,
    recommendation: OperationalRecommendation,
    audit: StrategyAuditEntry,
    event: StrategyDomainEvent
  ) {
    return this.database.$transaction(async (database) => {
      const saved = await database.recommendationOutcome.create({ data: outcomeData(outcome) });
      await database.aIRecommendation.update({
        where: { id: recommendation.id },
        data: { adaptiveConfidence: recommendation.adaptiveConfidence },
      });
      await database.strategyAuditEvent.create({ data: auditData(audit) });
      await database.strategyOutboxEvent.create({ data: eventData(event) });
      return fromOutcomeRow(saved);
    });
  }

  async listPendingEvents(limit = 100) {
    const rows = await this.database.strategyOutboxEvent.findMany({
      where: { status: "PENDING" },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });
    return rows.map(fromEventRow);
  }

  async markEventPublished(eventId: string, publishedAt: string) {
    await this.database.strategyOutboxEvent.update({
      where: { id: eventId },
      data: { status: "PUBLISHED", publishedAt: new Date(publishedAt), failureReason: null },
    });
  }

  async markEventFailed(eventId: string, failureReason: string) {
    await this.database.strategyOutboxEvent.update({
      where: { id: eventId },
      data: { status: "FAILED", failureReason },
    });
  }
}

function snapshotData(strategy: WeeklyStrategy) {
  return {
    id: strategy.id,
    workspaceId: strategy.workspaceId,
    periodStartsAt: new Date(strategy.period.startsAt),
    periodEndsAt: new Date(strategy.period.endsAt),
    executiveSummary: strategy.executiveSummary,
    signalCoverage: strategy.signalCoverage,
    watchlist: strategy.watchlist,
    dashboard: strategy.dashboard,
    generatedAt: new Date(strategy.generatedAt),
  };
}

function recommendationData(
  recommendation: WeeklyStrategy["recommendations"][number],
  strategySnapshotId: string,
  expiresAt?: string
) {
  return {
    id: recommendation.id,
    workspaceId: recommendation.workspaceId,
    strategySnapshotId,
    type: recommendation.category,
    category: recommendation.category,
    title: recommendation.title,
    summary: recommendation.summary,
    rationale: recommendation.rationale,
    priority: priorityValue(recommendation.score.priority),
    confidence: recommendation.score.factors.confidence / 100,
    adaptiveConfidence: recommendation.score.factors.confidence / 100,
    score: recommendation.score.total,
    actions: recommendation.actions,
    expectedOutcome: recommendation.expectedOutcome,
    explanation: recommendation.explanation,
    evidence: recommendation.evidence,
    dashboardData: recommendation.dashboardData,
    scoreFactors: recommendation.score,
    generatedAt: new Date(recommendation.generatedAt),
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  };
}

function recommendationUpdateData(
  recommendation: WeeklyStrategy["recommendations"][number],
  strategySnapshotId: string,
  expiresAt?: string
) {
  const { adaptiveConfidence: _adaptiveConfidence, ...data } = recommendationData(
    recommendation,
    strategySnapshotId,
    expiresAt
  );
  return data;
}

function lifecycleData(recommendation: OperationalRecommendation) {
  return {
    status: recommendation.status,
    adaptiveConfidence: recommendation.adaptiveConfidence,
    viewedAt: optionalDate(recommendation.lifecycle.viewedAt),
    acceptedAt: optionalDate(recommendation.lifecycle.acceptedAt),
    rejectedAt: optionalDate(recommendation.lifecycle.rejectedAt),
    implementedAt: optionalDate(recommendation.lifecycle.implementedAt),
    expiredAt: optionalDate(recommendation.lifecycle.expiredAt),
    implementationProgress: recommendation.implementation.percentage,
    implementationNotes: recommendation.implementation.notes,
  };
}

function transitionData(transition: RecommendationTransition) {
  return {
    workspaceId: transition.workspaceId,
    recommendationId: transition.recommendationId,
    fromStatus: transition.fromStatus,
    toStatus: transition.toStatus,
    actorType: transition.actor.type,
    actorId: transition.actor.id,
    actorMetadata: transition.actor.attributes,
    note: transition.note,
    progress: transition.progress,
    occurredAt: new Date(transition.occurredAt),
  };
}

function auditData(audit: StrategyAuditEntry) {
  return {
    workspaceId: audit.workspaceId,
    recommendationId: audit.recommendationId,
    strategySnapshotId: audit.strategySnapshotId,
    action: audit.action,
    actorType: audit.actor.type,
    actorId: audit.actor.id,
    actorMetadata: audit.actor.attributes,
    payload: audit.payload,
    createdAt: new Date(audit.createdAt),
  };
}

function eventData(event: StrategyDomainEvent) {
  return {
    workspaceId: event.workspaceId,
    recommendationId: event.recommendationId,
    strategySnapshotId: event.strategySnapshotId,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    payload: event.payload,
    occurredAt: new Date(event.occurredAt),
  };
}

function outcomeData(outcome: RecommendationOutcomeRecord) {
  return {
    workspaceId: outcome.workspaceId,
    recommendationId: outcome.recommendationId,
    outcome: outcome.outcome,
    engagementBaseline: outcome.engagementDelta?.baseline,
    engagementCurrent: outcome.engagementDelta?.current,
    engagementDelta: outcome.engagementDelta?.absolute,
    engagementDeltaPercent: outcome.engagementDelta?.percentage,
    effectivenessScore: outcome.effectivenessScore,
    confidenceBefore: outcome.confidenceBefore,
    confidenceAfter: outcome.confidenceAfter,
    metrics: outcome.metrics,
    observedAt: new Date(outcome.observedAt),
  };
}

function fromRecommendationRow(row: DatabaseRow): OperationalRecommendation {
  const score = row.scoreFactors as OperationalRecommendation["score"];
  const generatedAt = dateString(row.generatedAt ?? row.createdAt);
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    strategySnapshotId: optionalString(row.strategySnapshotId),
    category: (row.category ?? row.type) as OperationalRecommendation["category"],
    title: String(row.title),
    summary: String(row.summary),
    rationale: String(row.rationale),
    actions: (row.actions as string[] | undefined) ?? [],
    expectedOutcome: optionalString(row.expectedOutcome),
    score: score ?? {
      total: Number(row.score),
      priority: priorityFromValue(Number(row.priority)),
      factors: {
        impact: 0,
        urgency: 0,
        confidence: Number(row.confidence) * 100,
        strategicAlignment: 0,
        evidenceStrength: 0,
      },
      weights: { impact: 0.3, urgency: 0.22, confidence: 0.2, strategicAlignment: 0.16, evidenceStrength: 0.12 },
    },
    explanation: (row.explanation as OperationalRecommendation["explanation"] | undefined) ?? {
      generatedBy: "RULE_ENGINE",
      version: "legacy",
      matchedRuleIds: [],
      evidenceSignalIds: [],
      evidenceTypes: [],
      reasoningSummary: "Persisted recommendation without operational explanation metadata.",
      supportingFacts: [],
      assumptions: [],
    },
    evidence: (row.evidence as OperationalRecommendation["evidence"] | undefined) ?? [],
    dashboardData: (row.dashboardData as Record<string, unknown> | undefined) ?? {},
    generatedAt,
    status: row.status as OperationalRecommendation["status"],
    adaptiveConfidence: Number(row.adaptiveConfidence ?? row.confidence),
    lifecycle: {
      generatedAt,
      viewedAt: optionalDateString(row.viewedAt),
      acceptedAt: optionalDateString(row.acceptedAt),
      rejectedAt: optionalDateString(row.rejectedAt),
      implementedAt: optionalDateString(row.implementedAt),
      expiredAt: optionalDateString(row.expiredAt),
      expiresAt: optionalDateString(row.expiresAt),
    },
    implementation: {
      percentage: Number(row.implementationProgress ?? 0),
      notes: optionalString(row.implementationNotes),
      updatedAt: dateString(row.updatedAt ?? row.generatedAt ?? row.createdAt),
    },
    updatedAt: dateString(row.updatedAt ?? row.generatedAt ?? row.createdAt),
  };
}

function fromOutcomeRow(row: DatabaseRow): RecommendationOutcomeRecord {
  const baseline = numberOrUndefined(row.engagementBaseline);
  const current = numberOrUndefined(row.engagementCurrent);
  return {
    id: optionalString(row.id),
    workspaceId: String(row.workspaceId),
    recommendationId: String(row.recommendationId),
    outcome: row.outcome as RecommendationOutcomeRecord["outcome"],
    engagementDelta:
      baseline === undefined || current === undefined
        ? undefined
        : {
            baseline,
            current,
            absolute: Number(row.engagementDelta),
            percentage: numberOrUndefined(row.engagementDeltaPercent),
          },
    effectivenessScore: Number(row.effectivenessScore),
    confidenceBefore: Number(row.confidenceBefore),
    confidenceAfter: Number(row.confidenceAfter),
    metrics: row.metrics as Record<string, number> | undefined,
    observedAt: dateString(row.observedAt),
  };
}

function fromSnapshotRow(row: DatabaseRow): StrategySnapshotRecord {
  const recommendations = ((row.recommendations as DatabaseRow[] | undefined) ?? [])
    .map(fromRecommendationRow);
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    version: String(row.version),
    period: { startsAt: dateString(row.periodStartsAt), endsAt: dateString(row.periodEndsAt) },
    executiveSummary: String(row.executiveSummary),
    signalCoverage: row.signalCoverage as StrategySnapshotRecord["signalCoverage"],
    watchlist: row.watchlist as StrategySnapshotRecord["watchlist"],
    dashboard: row.dashboard as StrategySnapshotRecord["dashboard"],
    recommendations,
    generatedAt: dateString(row.generatedAt),
    persistedAt: dateString(row.createdAt),
  };
}

function fromEventRow(row: DatabaseRow): StrategyDomainEvent {
  return {
    id: optionalString(row.id),
    workspaceId: String(row.workspaceId),
    recommendationId: optionalString(row.recommendationId),
    strategySnapshotId: optionalString(row.strategySnapshotId),
    eventType: String(row.eventType),
    aggregateType: row.aggregateType as StrategyDomainEvent["aggregateType"],
    aggregateId: String(row.aggregateId),
    payload: row.payload as Record<string, unknown>,
    status: row.status as StrategyDomainEvent["status"],
    occurredAt: dateString(row.occurredAt),
  };
}

function priorityValue(priority: OperationalRecommendation["score"]["priority"]) {
  return { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 }[priority];
}

function priorityFromValue(priority: number): OperationalRecommendation["score"]["priority"] {
  return ({ 1: "CRITICAL", 2: "HIGH", 3: "MEDIUM", 4: "LOW" }[priority] ?? "LOW") as OperationalRecommendation["score"]["priority"];
}

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function optionalString(value: unknown) {
  return value === null || value === undefined ? undefined : String(value);
}

function numberOrUndefined(value: unknown) {
  return value === null || value === undefined ? undefined : Number(value);
}

function dateString(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function optionalDateString(value: unknown) {
  return value === null || value === undefined ? undefined : dateString(value);
}
