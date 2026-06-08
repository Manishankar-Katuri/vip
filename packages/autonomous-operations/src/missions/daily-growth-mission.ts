import { createHash, randomUUID } from "node:crypto";

import type { DailyGrowthMissionTransportEvent, EventBus } from "@vip/event-orchestrator";

export const DAILY_GROWTH_MISSION = "DAILY_GROWTH_MISSION";

export type MissionExecutionStatus = "QUEUED" | "RUNNING" | "WAITING_APPROVAL" | "COMPLETED" | "FAILED" | "CANCELLED";
export type SourceStatus = "COLLECTED" | "NO_DATA" | "NOT_CONFIGURED" | "FAILED";
export type DailyGrowthMissionPhase =
  | "SCHEDULER"
  | "STARTED"
  | "ACQUISITION"
  | "PERFORMANCE_ANALYSIS"
  | "STRATEGY_LEARNING"
  | "OPPORTUNITY_DISCOVERY"
  | "STRATEGY_PLANNING"
  | "CONTENT_PRODUCTION"
  | "REPORT_GENERATION"
  | "APPROVAL"
  | "TASK_CREATION"
  | "PUBLISHING_PREPARATION"
  | "OUTCOME_TRACKING"
  | "LEARNING_MEMORY"
  | "COMPLETED";

export type DailyGrowthMissionEventType = DailyGrowthMissionTransportEvent["eventType"];

export interface MissionExecutionRecord {
  id: string;
  workspaceId: string;
  missionType: typeof DAILY_GROWTH_MISSION;
  businessDate: string;
  status: MissionExecutionStatus;
  currentPhase: DailyGrowthMissionPhase;
  triggerType: "MANUAL" | "SCHEDULED" | "EVENT";
  traceId: string;
  idempotencyKey: string;
  startedEventId?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  replayCursor: number;
  phaseState: Record<string, unknown>;
  emittedEventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyGrowthMissionDataSource {
  socialPosts?: Array<Record<string, unknown>>;
  socialAccounts?: Array<Record<string, unknown>>;
  postMetrics?: Array<Record<string, unknown>>;
  reviews?: Array<Record<string, unknown>>;
  reviewAlerts?: Array<Record<string, unknown>>;
  competitorAccounts?: Array<Record<string, unknown>>;
  competitorPosts?: Array<Record<string, unknown>>;
  marketSignals?: Array<Record<string, unknown>>;
  marketContexts?: Array<Record<string, unknown>>;
  contentCalendar?: Array<Record<string, unknown>>;
  integrationHealth?: Array<Record<string, unknown>>;
  recommendationOutcomes?: Array<Record<string, unknown>>;
  existingMetrics?: Array<Record<string, unknown>>;
}

export interface ContentProductionPackageRecord {
  id: string;
  workspaceId: string;
  missionExecutionId: string;
  businessDate: string;
  contentBriefId?: string;
  topic: string;
  objective: string;
  hook: string;
  fullScript: string;
  sceneBreakdown: Array<Record<string, unknown>>;
  visualDirections: string[];
  cameraAngles: string[];
  doctorTalkingPoints: string[];
  bRollRequirements: string[];
  cta: string;
  caption: string;
  hashtags: string[];
  thumbnailConcept: string;
  thumbnailText: string;
  postingTime: string;
  platformRecommendation: string;
  targetKpi: Record<string, number | string>;
  publishingPayload: Record<string, unknown>;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  revisionMetadata: Record<string, unknown>;
  actionPlanInput: Record<string, unknown>;
  status: "PENDING_APPROVAL" | "PUBLISHING_READY";
  generatedAt: string;
}

export interface DailyGrowthMissionRepository {
  upsertExecutionStart(input: {
    workspaceId: string;
    businessDate: string;
    triggerType: MissionExecutionRecord["triggerType"];
    traceId: string;
    idempotencyKey: string;
    now: string;
  }): Promise<{ execution: MissionExecutionRecord; created: boolean }>;
  updateExecution(id: string, patch: Partial<MissionExecutionRecord>): Promise<MissionExecutionRecord>;
  appendEvent(executionId: string, eventId: string): Promise<MissionExecutionRecord>;
  saveSnapshot(record: Record<string, unknown>): Promise<Record<string, unknown>>;
  savePerformanceReport(record: Record<string, unknown>): Promise<Record<string, unknown>>;
  saveStrategyOutcome(record: Record<string, unknown>): Promise<Record<string, unknown>>;
  saveTrendOpportunities(records: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
  saveContentBriefs(records: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
  saveContentPackages(records: ContentProductionPackageRecord[]): Promise<ContentProductionPackageRecord[]>;
  saveDailyReport(record: Record<string, unknown>): Promise<Record<string, unknown>>;
  saveOperationalNotifications(records: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
  saveOperationalTasks(records: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
  saveContentOutcomes(records: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
  upsertLearningMemory(records: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
  listExecutions(workspaceId: string): Promise<MissionExecutionRecord[]>;
  getExecution(workspaceId: string, executionId: string): Promise<MissionExecutionRecord | null>;
  getReplay(workspaceId: string, executionId: string): Promise<Array<Record<string, unknown>>>;
}

export class DailyGrowthMissionEventBridge {
  constructor(
    private readonly bus?: Pick<EventBus, "publish">,
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async emit(input: {
    eventType: DailyGrowthMissionEventType;
    execution: MissionExecutionRecord;
    phase: DailyGrowthMissionPhase;
    summary: string;
    data: Record<string, unknown>;
  }) {
    const event: DailyGrowthMissionTransportEvent = {
      eventId: this.id(),
      eventType: input.eventType,
      eventVersion: 1,
      aggregateType: DAILY_GROWTH_MISSION,
      aggregateId: input.execution.id,
      workspaceId: input.execution.workspaceId,
      idempotencyKey: stableId(`${input.eventType}:${input.execution.workspaceId}:${input.execution.id}:${input.phase}`),
      occurredAt: this.now(),
      payload: {
        traceId: input.execution.traceId,
        missionExecutionId: input.execution.id,
        phase: input.phase,
        summary: input.summary,
        data: input.data,
      },
    };
    if (this.bus) {
      await this.bus.publish(event, {
        correlationId: input.execution.traceId,
        executionId: input.execution.id,
        producer: "autonomous-operations",
        actor: { type: "AGENT", id: "daily-growth-mission" },
        source: { module: "intelligence", component: "daily-growth-mission" },
        tags: ["daily-growth-mission", input.phase],
      });
    }
    return event;
  }
}

export class DailyGrowthMissionScheduler {
  constructor(
    private readonly repository: DailyGrowthMissionRepository,
    private readonly eventBridge = new DailyGrowthMissionEventBridge(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async triggerNow(workspaceId: string, triggerType: MissionExecutionRecord["triggerType"] = "MANUAL") {
    const now = this.now();
    const businessDate = businessDay(now).toISOString();
    const traceId = stableId(`${workspaceId}:${DAILY_GROWTH_MISSION}:${businessDate}`);
    const { execution, created } = await this.repository.upsertExecutionStart({
      workspaceId,
      businessDate,
      triggerType,
      traceId,
      idempotencyKey: stableId(`${workspaceId}:${DAILY_GROWTH_MISSION}:${businessDate}`),
      now: now.toISOString(),
    });
    const event = await this.eventBridge.emit({
      eventType: "operations.mission.daily_growth.started",
      execution,
      phase: "STARTED",
      summary: created ? "Daily Growth Mission queued." : "Daily Growth Mission already exists for business date.",
      data: { triggerType, businessDate },
    });
    await this.repository.appendEvent(execution.id, event.eventId);
    return { execution: await this.repository.updateExecution(execution.id, { startedEventId: event.eventId, currentPhase: "STARTED", status: "QUEUED" }), created, event };
  }

  nextRunAt(options: { hour?: number; minute?: number; from?: Date } = {}) {
    const hour = options.hour ?? 5;
    const minute = options.minute ?? 0;
    const from = options.from ?? this.now();
    const next = new Date(from);
    next.setUTCHours(hour, minute, 0, 0);
    if (next <= from) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  startDaily(options: { workspaceIds: string[]; hour?: number; minute?: number; timezone?: string }) {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (stopped) return;
      const delay = Math.max(0, this.nextRunAt(options).getTime() - this.now().getTime());
      timer = setTimeout(async () => {
        for (const workspaceId of options.workspaceIds) await this.triggerNow(workspaceId, "SCHEDULED");
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }
}

export class AnalyticsAcquisitionAgent {
  run(data: DailyGrowthMissionDataSource) {
    const posts = data.socialPosts ?? [];
    const metrics = data.postMetrics ?? [];
    const reach = sum(metrics, "reach");
    const engagement = sum(metrics, "likes") + sum(metrics, "comments") + sum(metrics, "shares") + sum(metrics, "saves");
    return { status: sourceStatus(posts.length || metrics.length, data.socialAccounts), data: { posts: posts.length, reach, engagement, metrics } };
  }
}

export class ReviewAcquisitionAgent {
  run(data: DailyGrowthMissionDataSource) {
    const reviews = data.reviews ?? [];
    return { status: sourceStatus(reviews.length, data.integrationHealth), data: { reviews: reviews.length, alerts: data.reviewAlerts?.length ?? 0 } };
  }
}

export class CompetitorAcquisitionAgent {
  run(data: DailyGrowthMissionDataSource) {
    const accounts = data.competitorAccounts ?? [];
    return { status: sourceStatus(accounts.length, accounts), data: { accounts: accounts.length, posts: data.competitorPosts?.length ?? 0 } };
  }
}

export class TrendAcquisitionAgent {
  run(data: DailyGrowthMissionDataSource) {
    const signals = data.marketSignals ?? [];
    return { status: sourceStatus(signals.length, data.marketContexts), data: { signals: signals.length, contexts: data.marketContexts?.length ?? 0, topSignals: signals.slice(0, 5) } };
  }
}

export class CalendarAcquisitionAgent {
  run(data: DailyGrowthMissionDataSource) {
    const calendar = data.contentCalendar ?? [];
    return { status: sourceStatus(calendar.length, calendar), data: { plannedItems: calendar.length, items: calendar.slice(0, 7) } };
  }
}

export class DailyGrowthMissionRunner {
  constructor(
    private readonly repository: DailyGrowthMissionRepository,
    private readonly eventBridge = new DailyGrowthMissionEventBridge(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async run(execution: MissionExecutionRecord, persistedData: DailyGrowthMissionDataSource = {}) {
    try {
      execution = await this.repository.updateExecution(execution.id, { status: "RUNNING", currentPhase: "ACQUISITION", startedAt: execution.startedAt ?? this.now() });
      const snapshot = await this.acquire(execution, persistedData);
      const performance = await this.performance(execution, snapshot);
      const strategyOutcome = await this.strategyLearning(execution, persistedData, performance);
      const opportunities = await this.opportunities(execution, snapshot, performance);
      const briefs = await this.plan(execution, opportunities);
      const packages = await this.production(execution, briefs);
      const report = await this.report(execution, snapshot, performance, opportunities, packages);
      await this.approval(execution, packages);
      await this.tasks(execution, packages);
      await this.publishing(execution, packages);
      const outcomes = await this.outcomes(execution, packages, persistedData);
      await this.learning(execution, strategyOutcome, opportunities, outcomes);
      return this.repository.updateExecution(execution.id, {
        status: "COMPLETED",
        currentPhase: "COMPLETED",
        completedAt: this.now(),
        phaseState: { snapshotId: snapshot.id, reportId: report.id, packageCount: packages.length },
      });
    } catch (error) {
      return this.repository.updateExecution(execution.id, {
        status: "FAILED",
        failedAt: this.now(),
        failureReason: error instanceof Error ? error.message : "Daily Growth Mission failed.",
      });
    }
  }

  private async acquire(execution: MissionExecutionRecord, data: DailyGrowthMissionDataSource) {
    const analytics = new AnalyticsAcquisitionAgent().run(data);
    const reviews = new ReviewAcquisitionAgent().run(data);
    const competitors = new CompetitorAcquisitionAgent().run(data);
    const trends = new TrendAcquisitionAgent().run(data);
    const calendar = new CalendarAcquisitionAgent().run(data);
    const snapshot = await this.repository.saveSnapshot({
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      businessDate: execution.businessDate,
      sourceStatuses: { analytics: analytics.status, reviews: reviews.status, competitors: competitors.status, trends: trends.status, calendar: calendar.status },
      analytics: analytics.data,
      reviews: reviews.data,
      competitors: competitors.data,
      trends: trends.data,
      calendar: calendar.data,
    });
    await this.emit(execution, "analytics.acquisition.completed", "ACQUISITION", "Persisted daily business snapshot.", { snapshot });
    return snapshot;
  }

  private async performance(execution: MissionExecutionRecord, snapshot: Record<string, unknown>) {
    const analytics = snapshot.analytics as Record<string, number>;
    const reach = Number(analytics.reach ?? 0);
    const engagement = Number(analytics.engagement ?? 0);
    const report = await this.repository.savePerformanceReport({
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      businessDate: execution.businessDate,
      metrics: { reach, engagement, engagementRate: reach ? engagement / reach : 0 },
      summary: { headline: reach > 0 ? "Audience activity available from persisted social metrics." : "No persisted social performance metrics were available." },
      recommendations: reach ? ["Create one high-clarity reel from strongest current signal."] : ["Connect or refresh persisted social metrics before KPI attribution."],
      confidenceScore: reach ? 0.78 : 0.42,
    });
    await this.emit(execution, "performance.analysis.completed", "PERFORMANCE_ANALYSIS", "Generated deterministic performance analysis.", { report });
    return report;
  }

  private async strategyLearning(execution: MissionExecutionRecord, data: DailyGrowthMissionDataSource, performance: Record<string, unknown>) {
    const outcomes = data.recommendationOutcomes ?? [];
    const result = await this.repository.saveStrategyOutcome({
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      businessDate: execution.businessDate,
      previousStrategies: outcomes,
      actualResults: performance.metrics ?? {},
      repeatActions: outcomes.length ? ["Repeat topics with positive persisted outcomes."] : [],
      stopActions: outcomes.length ? ["Stop formats with negative persisted outcomes."] : [],
      patterns: outcomes.slice(0, 5),
      confidenceScore: outcomes.length ? 0.72 : 0.45,
    });
    await this.emit(execution, "strategy.learning.generated", "STRATEGY_LEARNING", "Generated strategy learning from persisted outcomes.", { strategyOutcome: result });
    return result;
  }

  private async opportunities(execution: MissionExecutionRecord, snapshot: Record<string, unknown>, performance: Record<string, unknown>) {
    const metrics = performance.metrics as Record<string, number>;
    const trendData = snapshot.trends as Record<string, unknown>;
    const topSignals = Array.isArray(trendData.topSignals) ? trendData.topSignals : [];
    const priorityScore = Math.round(Math.min(100, 45 + Number(metrics.engagementRate ?? 0) * 100 + topSignals.length * 8));
    const opportunity = {
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      businessDate: execution.businessDate,
      kind: "CONTENT_OPPORTUNITY",
      title: topSignals.length ? "Turn current trend signals into a patient education reel" : "Create a trust-building patient education reel",
      description: topSignals.length ? "Persisted trend signals indicate a timely content window." : "No live trend feed is configured, so use persisted performance and evergreen growth logic.",
      priorityScore,
      growthScore: priorityScore,
      revenueScore: Math.round(priorityScore * 0.72),
      trendScore: topSignals.length ? 82 : 38,
      confidenceScore: topSignals.length ? 0.76 : 0.55,
      signals: topSignals,
      status: "OPEN",
    };
    const saved = await this.repository.saveTrendOpportunities([opportunity]);
    await this.emit(execution, "opportunity.discovery.completed", "OPPORTUNITY_DISCOVERY", "Discovered daily growth opportunity.", { opportunities: saved });
    return saved;
  }

  private async plan(execution: MissionExecutionRecord, opportunities: Array<Record<string, unknown>>) {
    const briefs = opportunities.map((opportunity) => ({
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      trendOpportunityId: opportunity.id,
      businessDate: execution.businessDate,
      title: String(opportunity.title),
      objective: "Generate qualified patient trust and improve daily engagement.",
      horizon: "DAILY",
      priorityScore: Number(opportunity.priorityScore ?? 0),
      growthScore: Number(opportunity.growthScore ?? 0),
      revenueScore: Number(opportunity.revenueScore ?? 0),
      trendScore: Number(opportunity.trendScore ?? 0),
      confidenceScore: Number(opportunity.confidenceScore ?? 0),
      inputs: { opportunity },
      status: "DRAFT",
    }));
    const saved = await this.repository.saveContentBriefs(briefs);
    await this.emit(execution, "strategy.plan.generated", "STRATEGY_PLANNING", "Generated daily content briefs.", { briefs: saved });
    return saved;
  }

  private async production(execution: MissionExecutionRecord, briefs: Array<Record<string, unknown>>) {
    const packages = briefs.map((brief) => contentPackageForBrief(this.id(), this.now(), execution, brief));
    const saved = await this.repository.saveContentPackages(packages);
    await this.emit(execution, "content.production.generated", "CONTENT_PRODUCTION", "Generated complete production package.", { packages: saved });
    return saved;
  }

  private async report(execution: MissionExecutionRecord, snapshot: Record<string, unknown>, performance: Record<string, unknown>, opportunities: Array<Record<string, unknown>>, packages: ContentProductionPackageRecord[]) {
    const report = await this.repository.saveDailyReport({
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      businessDate: execution.businessDate,
      title: "Daily Growth Mission Report",
      sections: [
        { title: "Acquisition", body: snapshot.sourceStatuses },
        { title: "Performance", body: performance.metrics },
        { title: "Opportunities", body: opportunities.map((item) => item.title) },
        { title: "Production", body: packages.map((item) => item.topic) },
      ],
      pdfPayload: { pageType: "daily-growth-mission", title: "Daily Growth Mission Report", sections: 4 },
      pdfFileName: `daily-growth-mission-${execution.workspaceId}-${execution.businessDate.slice(0, 10)}.pdf`,
      status: "GENERATED",
    });
    await this.emit(execution, "report.generated", "REPORT_GENERATION", "Generated report and PDF export payload.", { report });
    return report;
  }

  private async approval(execution: MissionExecutionRecord, packages: ContentProductionPackageRecord[]) {
    await this.repository.updateExecution(execution.id, { status: "WAITING_APPROVAL", currentPhase: "APPROVAL" });
    await this.emit(execution, "approval.completed", "APPROVAL", "Created approval-required action plan with doctor and production approval steps.", { packageIds: packages.map((item) => item.id), decision: "PENDING" });
  }

  private async tasks(execution: MissionExecutionRecord, packages: ContentProductionPackageRecord[]) {
    const tasks = ["Record reel", "Shoot B-roll", "Edit reel", "Create thumbnail", "Review content", "Schedule posting"].map((title, index) => ({
      id: this.id(),
      workspaceId: execution.workspaceId,
      title,
      due: execution.businessDate.slice(0, 10),
      status: "open",
      completed: false,
      assigneeRole: index < 2 ? "doctor" : index < 4 ? "production" : "staff",
      metadata: { missionExecutionId: execution.id, packageIds: packages.map((item) => item.id), dependsOn: index === 0 ? [] : [index - 1] },
    }));
    const notifications = ["doctor", "production", "admin"].map((role) => ({
      id: this.id(),
      workspaceId: execution.workspaceId,
      role,
      category: "daily-growth-mission",
      groupKey: execution.id,
      title: "Daily Growth Mission ready",
      detail: "A new daily growth package is waiting for review and production.",
      tone: "info",
      unread: true,
    }));
    await this.repository.saveOperationalTasks(tasks);
    await this.repository.saveOperationalNotifications(notifications);
    await this.emit(execution, "production.tasks.created", "TASK_CREATION", "Created operational production tasks and notifications.", { tasks, notifications });
  }

  private async publishing(execution: MissionExecutionRecord, packages: ContentProductionPackageRecord[]) {
    const prepared = packages.map((item) => ({ ...item, status: "PUBLISHING_READY" as const, publishingPayload: { ...item.publishingPayload, preparedAt: this.now(), publishExternally: false } }));
    await this.repository.saveContentPackages(prepared);
    await this.emit(execution, "publishing.prepared", "PUBLISHING_PREPARATION", "Prepared pending publishing payload without external publishing.", { packageIds: packages.map((item) => item.id) });
  }

  private async outcomes(execution: MissionExecutionRecord, packages: ContentProductionPackageRecord[], data: DailyGrowthMissionDataSource) {
    const actualReach = sum(data.existingMetrics ?? data.postMetrics ?? [], "reach");
    const outcomes = packages.map((item) => ({
      id: this.id(),
      workspaceId: execution.workspaceId,
      missionExecutionId: execution.id,
      contentProductionPackageId: item.id,
      businessDate: execution.businessDate,
      predictedKpi: item.targetKpi,
      actualKpi: { reach: actualReach, source: actualReach ? "persisted_metrics" : "no_persisted_metrics" },
      attribution: { comparedAt: this.now(), externalFeedsMocked: false },
      performanceScore: actualReach ? Math.min(100, actualReach / Math.max(1, Number(item.targetKpi.reach ?? 1)) * 100) : 0,
    }));
    const saved = await this.repository.saveContentOutcomes(outcomes);
    await this.emit(execution, "content.outcome.generated", "OUTCOME_TRACKING", "Generated predicted-vs-actual content outcome attribution.", { outcomes: saved });
    return saved;
  }

  private async learning(execution: MissionExecutionRecord, strategyOutcome: Record<string, unknown>, opportunities: Array<Record<string, unknown>>, outcomes: Array<Record<string, unknown>>) {
    const records = [
      { id: this.id(), workspaceId: execution.workspaceId, missionExecutionId: execution.id, scope: "growth_patterns", key: "daily-growth-opportunity", content: { opportunities }, confidenceScore: 0.7 },
      { id: this.id(), workspaceId: execution.workspaceId, missionExecutionId: execution.id, scope: "failure_patterns", key: "unavailable-sources", content: { strategyOutcome }, confidenceScore: 0.55 },
      { id: this.id(), workspaceId: execution.workspaceId, missionExecutionId: execution.id, scope: "winning_formats", key: "doctor-education-reel", content: { outcomes }, confidenceScore: 0.65 },
    ];
    const saved = await this.repository.upsertLearningMemory(records);
    await this.emit(execution, "learning.memory.updated", "LEARNING_MEMORY", "Updated agent learning memory.", { memories: saved });
  }

  private async emit(execution: MissionExecutionRecord, eventType: DailyGrowthMissionEventType, phase: DailyGrowthMissionPhase, summary: string, data: Record<string, unknown>) {
    const event = await this.eventBridge.emit({ eventType, execution, phase, summary, data });
    await this.repository.appendEvent(execution.id, event.eventId);
    await this.repository.updateExecution(execution.id, { currentPhase: phase, replayCursor: execution.replayCursor + 1 });
  }
}

export class InMemoryDailyGrowthMissionRepository implements DailyGrowthMissionRepository {
  readonly executions = new Map<string, MissionExecutionRecord>();
  readonly snapshots: Record<string, unknown>[] = [];
  readonly performanceReports: Record<string, unknown>[] = [];
  readonly strategyOutcomes: Record<string, unknown>[] = [];
  readonly opportunities: Record<string, unknown>[] = [];
  readonly briefs: Record<string, unknown>[] = [];
  readonly packages: ContentProductionPackageRecord[] = [];
  readonly reports: Record<string, unknown>[] = [];
  readonly notifications: Record<string, unknown>[] = [];
  readonly tasks: Record<string, unknown>[] = [];
  readonly outcomes: Record<string, unknown>[] = [];
  readonly learning: Record<string, unknown>[] = [];
  readonly replay: Record<string, unknown>[] = [];

  async upsertExecutionStart(input: { workspaceId: string; businessDate: string; triggerType: MissionExecutionRecord["triggerType"]; traceId: string; idempotencyKey: string; now: string }) {
    const existing = [...this.executions.values()].find((item) => item.workspaceId === input.workspaceId && item.missionType === DAILY_GROWTH_MISSION && item.businessDate === input.businessDate);
    if (existing) return { execution: existing, created: false };
    const execution: MissionExecutionRecord = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      missionType: DAILY_GROWTH_MISSION,
      businessDate: input.businessDate,
      status: "QUEUED",
      currentPhase: "SCHEDULER",
      triggerType: input.triggerType,
      traceId: input.traceId,
      idempotencyKey: input.idempotencyKey,
      replayCursor: 0,
      phaseState: {},
      emittedEventIds: [],
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.executions.set(execution.id, execution);
    return { execution, created: true };
  }

  async updateExecution(id: string, patch: Partial<MissionExecutionRecord>) {
    const execution = this.executions.get(id);
    if (!execution) throw new Error(`Unknown mission execution: ${id}`);
    const updated = { ...execution, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    this.executions.set(id, updated);
    return updated;
  }

  async appendEvent(executionId: string, eventId: string) {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error(`Unknown mission execution: ${executionId}`);
    this.replay.push({ executionId, eventId, sequence: this.replay.length + 1 });
    return this.updateExecution(executionId, { emittedEventIds: [...execution.emittedEventIds, eventId], replayCursor: execution.replayCursor + 1 });
  }

  async saveSnapshot(record: Record<string, unknown>) { return pushUnique(this.snapshots, record, "missionExecutionId"); }
  async savePerformanceReport(record: Record<string, unknown>) { return pushUnique(this.performanceReports, record, "missionExecutionId"); }
  async saveStrategyOutcome(record: Record<string, unknown>) { return pushUnique(this.strategyOutcomes, record, "missionExecutionId"); }
  async saveTrendOpportunities(records: Array<Record<string, unknown>>) { return pushMany(this.opportunities, records); }
  async saveContentBriefs(records: Array<Record<string, unknown>>) { return pushMany(this.briefs, records); }
  async saveContentPackages(records: ContentProductionPackageRecord[]) {
    for (const record of records) {
      const index = this.packages.findIndex((item) => item.id === record.id);
      if (index >= 0) this.packages[index] = record;
      else this.packages.push(record);
    }
    return records;
  }
  async saveDailyReport(record: Record<string, unknown>) { return pushUnique(this.reports, record, "missionExecutionId"); }
  async saveOperationalNotifications(records: Array<Record<string, unknown>>) { return pushMany(this.notifications, records); }
  async saveOperationalTasks(records: Array<Record<string, unknown>>) { return pushMany(this.tasks, records); }
  async saveContentOutcomes(records: Array<Record<string, unknown>>) { return pushMany(this.outcomes, records); }
  async upsertLearningMemory(records: Array<Record<string, unknown>>) { return pushMany(this.learning, records); }
  async listExecutions(workspaceId: string) { return [...this.executions.values()].filter((item) => item.workspaceId === workspaceId); }
  async getExecution(workspaceId: string, executionId: string) { return [...this.executions.values()].find((item) => item.workspaceId === workspaceId && item.id === executionId) ?? null; }
  async getReplay(_workspaceId: string, executionId: string) { return this.replay.filter((item) => item.executionId === executionId); }
}

function contentPackageForBrief(id: string, now: string, execution: MissionExecutionRecord, brief: Record<string, unknown>): ContentProductionPackageRecord {
  const topic = String(brief.title ?? "Daily patient education reel");
  const postingTime = new Date(execution.businessDate);
  postingTime.setHours(17, 30, 0, 0);
  const actionPlanInput = {
    type: "SOCIAL_PUBLISHING",
    requiresApproval: true,
    steps: [
      { name: "Doctor Approval", processor: "approval.doctor", requiresApproval: true, input: { decision: "PENDING" } },
      { name: "Production Approval", processor: "approval.production", requiresApproval: true, input: { decision: "PENDING" } },
    ],
  };
  return {
    id,
    workspaceId: execution.workspaceId,
    missionExecutionId: execution.id,
    contentBriefId: String(brief.id ?? ""),
    businessDate: execution.businessDate,
    topic,
    objective: String(brief.objective ?? "Improve patient trust and engagement."),
    hook: "Most patients miss this one simple signal before they book a consult.",
    fullScript: "Open with the common patient worry, explain the clinical signal in plain language, show what happens during evaluation, and close with a clear consult CTA.",
    sceneBreakdown: [
      { scene: 1, durationSeconds: 4, direction: "Doctor faces camera with the hook." },
      { scene: 2, durationSeconds: 12, direction: "Explain the patient concern using simple language." },
      { scene: 3, durationSeconds: 8, direction: "Show clinic B-roll and evaluation context." },
      { scene: 4, durationSeconds: 5, direction: "Close with CTA." },
    ],
    visualDirections: ["Clean clinic background", "Readable lower-third keywords", "Use patient-friendly diagrams only if already approved"],
    cameraAngles: ["Medium doctor shot", "Over-shoulder B-roll", "Close-up for CTA"],
    doctorTalkingPoints: ["Name the concern", "Explain why it matters", "Describe next safe step"],
    bRollRequirements: ["Clinic exterior", "Consultation room", "Hands preparing notes", "Approved equipment detail"],
    cta: "Book a consultation if this sounds familiar.",
    caption: `${topic}. Save this before your next consultation.`,
    hashtags: ["#PatientEducation", "#DoctorAdvice", "#ClinicGrowth", "#HealthAwareness"],
    thumbnailConcept: "Doctor beside a bold patient question.",
    thumbnailText: "Do not ignore this",
    postingTime: postingTime.toISOString(),
    platformRecommendation: "INSTAGRAM_REELS",
    targetKpi: { reach: 1200, engagementRate: 0.05, saves: 20 },
    publishingPayload: { platform: "INSTAGRAM_REELS", status: "PENDING", publishExternally: false },
    approvalStatus: "PENDING",
    revisionMetadata: { revisionRequiredDecision: "REJECTED_WITH_REVISION_METADATA" },
    actionPlanInput,
    status: "PENDING_APPROVAL",
    generatedAt: now,
  };
}

function businessDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function sourceStatus(count: number, configured?: unknown[]): SourceStatus {
  if (count > 0) return "COLLECTED";
  if (!configured || configured.length === 0) return "NOT_CONFIGURED";
  return "NO_DATA";
}

function sum(records: Array<Record<string, unknown>>, field: string) {
  return records.reduce((total, record) => total + Number(record[field] ?? 0), 0);
}

function pushMany<T extends Record<string, unknown>>(target: T[], records: T[]) {
  for (const record of records) {
    const index = target.findIndex((item) => item.id === record.id);
    if (index >= 0) target[index] = record;
    else target.push(record);
  }
  return records;
}

function pushUnique<T extends Record<string, unknown>>(target: T[], record: T, key: string) {
  const index = target.findIndex((item) => item[key] === record[key]);
  if (index >= 0) target[index] = record;
  else target.push(record);
  return record;
}

function stableId(value: string) {
  return createHash("sha1").update(value).digest("hex");
}
