import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@vip/database";
import OpenAI from "openai";
import { executeTrackedAI } from "@/lib/ai-audit";

export const DAILY_GROWTH_MISSION = "DAILY_GROWTH_MISSION";

const eventTopics: Record<string, string> = {
  "operations.mission.daily_growth.started": "intelligence",
  "analytics.acquisition.completed": "analytics",
  "performance.analysis.completed": "intelligence",
  "strategy.learning.generated": "learning",
  "opportunity.discovery.completed": "intelligence",
  "strategy.plan.generated": "intelligence",
  "content.production.generated": "workflows",
  "report.generated": "dashboard",
  "approval.completed": "workflows",
  "production.tasks.created": "workflows",
  "publishing.prepared": "workflows",
  "content.outcome.generated": "outcomes",
  "learning.memory.updated": "learning",
};

type Db = typeof prisma & Record<string, any>;
type LearningContext = {
  recent: any[];
  winningTopics: any[];
  winningHooks: any[];
  winningFormats: any[];
  winningPostingTimes: any[];
  failurePatterns: any[];
  growthPatterns: any[];
};
type IntelligenceContext = {
  analytics: ReturnType<typeof summarizeAnalytics>;
  opportunity: any;
  learningContext: LearningContext;
  calendarIntelligence: ReturnType<typeof buildCalendarIntelligence>;
  trendIntelligence: ReturnType<typeof buildTrendIntelligence>;
  competitorIntelligence: ReturnType<typeof buildCompetitorIntelligence>;
  brandMemory: any;
  vectorMemory: any[];
  contentHistory: any[];
};

export async function runDailyGrowthMission(workspaceId: string) {
  const db = prisma as Db;
  const now = new Date();
  const businessDate = startOfUtcDay(now);
  const traceId = stableId(`${workspaceId}:${DAILY_GROWTH_MISSION}:${businessDate.toISOString()}`);
  const idempotencyKey = stableId(`${workspaceId}:${DAILY_GROWTH_MISSION}:${businessDate.toISOString()}`);
  let execution = await db.missionExecution.findUnique({ where: { workspaceId_missionType_businessDate: { workspaceId, missionType: DAILY_GROWTH_MISSION, businessDate } } });
  if (!execution) {
    execution = await db.missionExecution.create({
      data: {
        workspaceId,
        missionType: DAILY_GROWTH_MISSION,
        businessDate,
        status: "QUEUED",
        currentPhase: "SCHEDULER",
        triggerType: "MANUAL",
        traceId,
        idempotencyKey,
        startedAt: now,
      },
    });
  }
  if (execution.status === "COMPLETED") return getDailyGrowthMissionDetail(workspaceId, execution.id);
  if (execution.status === "WAITING_APPROVAL") return resumeAfterApproval(db, workspaceId, execution);

  await appendMissionEvent(db, execution, "operations.mission.daily_growth.started", "STARTED", "Daily Growth Mission manually triggered.", { businessDate });
  execution = await db.missionExecution.update({ where: { id: execution.id }, data: { status: "RUNNING", currentPhase: "ACQUISITION", startedAt: execution.startedAt ?? now } });

  const persisted = await readPersistedSources(db, workspaceId);
  const learningContext = await retrieveLearningMemory(db, workspaceId);
  const calendarIntelligence = buildCalendarIntelligence(persisted.contentCalendar, businessDate);
  const trendIntelligence = buildTrendIntelligence(persisted.marketSignals, persisted.marketContexts, learningContext);
  const competitorIntelligence = buildCompetitorIntelligence(persisted.competitorAccounts, learningContext);
  const sourceStatuses = {
    analytics: sourceStatus(persisted.socialPosts.length || persisted.socialAccounts.length, persisted.socialAccounts),
    reviews: sourceStatus(persisted.reviews.length || persisted.reviewAlerts.length, persisted.integrationHealth),
    competitors: sourceStatus(persisted.competitorAccounts.length, persisted.competitorAccounts),
    trends: sourceStatus(trendIntelligence.signals.length, persisted.marketContexts),
    calendar: sourceStatus(calendarIntelligence.total, persisted.contentCalendar),
  };
  const analytics = summarizeAnalytics(persisted.socialPosts);
  const snapshot = await db.dailyBusinessSnapshot.upsert({
    where: { workspaceId_missionExecutionId: { workspaceId, missionExecutionId: execution.id } },
    create: {
      workspaceId,
      missionExecutionId: execution.id,
      businessDate,
      sourceStatuses,
      analytics,
      reviews: { count: persisted.reviews.length, alerts: persisted.reviewAlerts.length },
      competitors: competitorIntelligence,
      trends: trendIntelligence,
      calendar: calendarIntelligence,
    },
    update: { sourceStatuses, analytics, competitors: competitorIntelligence, trends: trendIntelligence, calendar: calendarIntelligence },
  });
  await appendMissionEvent(db, execution, "analytics.acquisition.completed", "ACQUISITION", "Persisted daily business snapshot.", { snapshotId: snapshot.id, sourceStatuses });

  const performance = await db.dailyPerformanceReport.upsert({
    where: { workspaceId_missionExecutionId: { workspaceId, missionExecutionId: execution.id } },
    create: {
      workspaceId,
      missionExecutionId: execution.id,
      businessDate,
      metrics: analytics,
      summary: { headline: analytics.reach ? "Persisted social metrics are available for today's mission." : "No persisted social metrics are available for today's mission." },
      recommendations: analytics.reach ? ["Produce one education reel from the strongest persisted signal."] : ["Connect or refresh social metric ingestion before KPI attribution."],
      confidenceScore: analytics.reach ? 0.78 : 0.42,
    },
    update: { metrics: analytics },
  });
  await appendMissionEvent(db, execution, "performance.analysis.completed", "PERFORMANCE_ANALYSIS", "Generated deterministic performance analysis.", { reportId: performance.id });

  const strategyOutcome = await db.strategyOutcome.upsert({
    where: { workspaceId_missionExecutionId: { workspaceId, missionExecutionId: execution.id } },
    create: {
      workspaceId,
      missionExecutionId: execution.id,
      businessDate,
      previousStrategies: persisted.recommendationOutcomes,
      actualResults: analytics,
      repeatActions: learningContext.winningTopics.map((item) => `Repeat ${labelFromMemory(item)} when supported by current signals.`),
      stopActions: learningContext.failurePatterns.map((item) => `Avoid ${labelFromMemory(item)} until evidence improves.`),
      patterns: [...learningContext.growthPatterns, ...persisted.recommendationOutcomes].slice(0, 8),
      confidenceScore: Math.min(0.9, 0.45 + learningContext.recent.length * 0.04 + persisted.recommendationOutcomes.length * 0.02),
    },
    update: { actualResults: analytics },
  });
  await appendMissionEvent(db, execution, "strategy.learning.generated", "STRATEGY_LEARNING", "Generated strategy learning from persisted outcomes.", { strategyOutcomeId: strategyOutcome.id });

  await db.trendOpportunity.deleteMany({ where: { workspaceId, missionExecutionId: execution.id } });
  const opportunity = await db.trendOpportunity.create({
    data: {
      workspaceId,
      missionExecutionId: execution.id,
      businessDate,
      kind: "CONTENT_OPPORTUNITY",
      title: bestOpportunityTitle(trendIntelligence, calendarIntelligence, competitorIntelligence, learningContext),
      description: "Opportunity is scored from persisted performance, retrieved learning memory, calendar windows, market signals, and competitor gaps.",
      priorityScore: Math.min(100, 48 + trendIntelligence.signals.length * 7 + calendarIntelligence.opportunities.length * 5 + competitorIntelligence.gaps.length * 5 + analytics.engagementRate * 100),
      growthScore: Math.min(100, 55 + trendIntelligence.growthScore + analytics.engagementRate * 100),
      revenueScore: Math.min(100, 44 + analytics.saves),
      trendScore: trendIntelligence.trendScore,
      confidenceScore: Math.min(0.92, 0.5 + trendIntelligence.signals.length * 0.04 + learningContext.recent.length * 0.02),
      signals: { trends: trendIntelligence.signals, calendar: calendarIntelligence.opportunities, competitors: competitorIntelligence.gaps, learning: learningContext },
      status: "OPEN",
    },
  });
  await appendMissionEvent(db, execution, "opportunity.discovery.completed", "OPPORTUNITY_DISCOVERY", "Discovered daily growth opportunity.", { opportunityId: opportunity.id });

  await db.contentBrief.deleteMany({ where: { workspaceId, missionExecutionId: execution.id } });
  const brief = await db.contentBrief.create({
    data: {
      workspaceId,
      missionExecutionId: execution.id,
      trendOpportunityId: opportunity.id,
      businessDate,
      title: opportunity.title,
      objective: "Generate qualified patient trust and improve daily engagement.",
      priorityScore: opportunity.priorityScore,
      growthScore: opportunity.growthScore,
      revenueScore: opportunity.revenueScore,
      trendScore: opportunity.trendScore,
      confidenceScore: opportunity.confidenceScore,
      inputs: { opportunity, performance: analytics, learningContext, calendarIntelligence, trendIntelligence, competitorIntelligence },
      status: "DRAFT",
    },
  });
  await appendMissionEvent(db, execution, "strategy.plan.generated", "STRATEGY_PLANNING", "Generated daily content brief.", { briefId: brief.id });

  await db.contentProductionPackage.deleteMany({ where: { workspaceId, missionExecutionId: execution.id } });
  const packagePayload = await buildProductionPackage(db, workspaceId, execution.id, businessDate, brief, {
    analytics,
    opportunity,
    learningContext,
    calendarIntelligence,
    trendIntelligence,
    competitorIntelligence,
    brandMemory: persisted.brandMemory,
    vectorMemory: persisted.vectorMemory,
    contentHistory: persisted.socialPosts.slice(0, 10),
  });
  const actionPlan = await upsertActionPlan(db, workspaceId, execution.id, packagePayload.actionPlanInput);
  const productionPackage = await db.contentProductionPackage.create({ data: { ...packagePayload.record, actionPlanId: actionPlan.id } });
  await appendMissionEvent(db, execution, "content.production.generated", "CONTENT_PRODUCTION", "Generated complete content production package.", { packageId: productionPackage.id, actionPlanId: actionPlan.id });

  const pdfPayload = buildPdfPayload({ sourceStatuses, analytics, opportunity, productionPackage, calendarIntelligence, trendIntelligence, competitorIntelligence, learningContext });
  const pdfFile = await generateDailyGrowthPdf(workspaceId, execution.id, businessDate, pdfPayload);
  const pdfExport = await db.pdfExportRun.create({
    data: {
      workspaceId,
      pageType: "daily-growth-mission",
      title: "Daily Growth Mission Report",
      status: "COMPLETED",
      requestedBy: "daily-growth-mission",
      payload: pdfPayload,
      fileName: pdfFile.fileName,
      fileSizeBytes: pdfFile.fileSizeBytes,
      completedAt: new Date(),
    },
  });
  const report = await db.dailyGrowthReport.upsert({
    where: { workspaceId_missionExecutionId: { workspaceId, missionExecutionId: execution.id } },
    create: {
      workspaceId,
      missionExecutionId: execution.id,
      businessDate,
      title: "Daily Growth Mission Report",
      sections: [
        { title: "Source status", body: sourceStatuses },
        { title: "Performance", body: analytics },
        { title: "Opportunity", body: opportunity.title },
        { title: "Production", body: productionPackage.topic },
      ],
      pdfPayload,
      pdfFileName: pdfExport.fileName,
      pdfExportRunId: pdfExport.id,
      status: "GENERATED",
    },
    update: { sections: [{ title: "Source status", body: sourceStatuses }, { title: "Performance", body: analytics }, { title: "Opportunity", body: opportunity.title }, { title: "Production", body: productionPackage.topic }], pdfExportRunId: pdfExport.id },
  });
  await appendMissionEvent(db, execution, "report.generated", "REPORT_GENERATION", "Generated report and PDF export payload.", { reportId: report.id, pdfExportRunId: pdfExport.id });

  await appendMissionEvent(db, execution, "approval.completed", "APPROVAL", "Created approval-required action plan with Doctor Approval and Production Approval steps.", { actionPlanId: actionPlan.id, approvalStatus: "PENDING" });
  execution = await db.missionExecution.update({ where: { id: execution.id }, data: { status: "WAITING_APPROVAL", currentPhase: "APPROVAL", phaseState: { reportId: report.id, packageId: productionPackage.id, actionPlanId: actionPlan.id, approvalGate: "PENDING" } } });
  return getDailyGrowthMissionDetail(workspaceId, execution.id);
}

async function resumeAfterApproval(db: Db, workspaceId: string, execution: any) {
  const actionPlanId = execution.phaseState?.actionPlanId;
  const productionPackageId = execution.phaseState?.packageId;
  if (!actionPlanId || !productionPackageId) return getDailyGrowthMissionDetail(workspaceId, execution.id);
  const actionPlan = await db.actionPlan.findUnique({ where: { id: actionPlanId }, include: { approvals: true } });
  const rejected = actionPlan?.approvals?.some((approval: any) => approval.status === "REJECTED");
  const approved = actionPlan?.approvals?.length && actionPlan.approvals.every((approval: any) => approval.status === "APPROVED");
  if (rejected) {
    await db.missionExecution.update({ where: { id: execution.id }, data: { status: "FAILED", currentPhase: "APPROVAL", failureReason: "Approval rejected. Revision metadata is stored on the content package." } });
    return getDailyGrowthMissionDetail(workspaceId, execution.id);
  }
  if (!approved) return getDailyGrowthMissionDetail(workspaceId, execution.id);
  await db.contentProductionPackage.update({ where: { id: productionPackageId }, data: { approvalStatus: "APPROVED" } });
  await appendMissionEvent(db, execution, "approval.completed", "APPROVAL", "Approval gate passed; mission resumed.", { actionPlanId, approvalStatus: "APPROVED" });
  await continuePostApproval(db, workspaceId, execution, productionPackageId);
  return getDailyGrowthMissionDetail(workspaceId, execution.id);
}

async function continuePostApproval(db: Db, workspaceId: string, execution: any, productionPackageId: string) {
  const productionPackage = await db.contentProductionPackage.findUnique({ where: { id: productionPackageId } });
  if (!productionPackage) return;
  await createTasksAndNotifications(db, workspaceId, execution.id, productionPackage.id);
  await appendMissionEvent(db, execution, "production.tasks.created", "TASK_CREATION", "Created production tasks and role notifications.", { packageId: productionPackage.id });

  const existingPublishingPayload = productionPackage.publishingPayload && typeof productionPackage.publishingPayload === "object" && !Array.isArray(productionPackage.publishingPayload) ? productionPackage.publishingPayload : {};
  const publishingPayload = { ...existingPublishingPayload, preparedAt: new Date().toISOString(), status: "PENDING", publishExternally: false };
  await db.contentProductionPackage.update({ where: { id: productionPackage.id }, data: { publishingPayload, status: "PUBLISHING_READY" } });
  await appendMissionEvent(db, execution, "publishing.prepared", "PUBLISHING_PREPARATION", "Prepared pending publishing payload without external publishing.", { packageId: productionPackage.id });

  await db.contentOutcome.deleteMany({ where: { workspaceId, missionExecutionId: execution.id } });
  const contentOutcome = await db.contentOutcome.create({
    data: {
      workspaceId,
      missionExecutionId: execution.id,
      contentProductionPackageId: productionPackage.id,
      businessDate: execution.businessDate,
      predictedKpi: productionPackage.targetKpi as any,
      actualKpi: { reach: 0, source: "awaiting_published_content_metrics" },
      attribution: { comparedAt: new Date().toISOString(), externalFeedsMocked: false },
      performanceScore: 0,
    },
  });
  await appendMissionEvent(db, execution, "content.outcome.generated", "OUTCOME_TRACKING", "Generated predicted-vs-actual attribution from persisted metrics.", { contentOutcomeId: contentOutcome.id });

  await upsertLearningMemory(db, workspaceId, execution.id, { title: productionPackage.topic }, contentOutcome);
  await appendMissionEvent(db, execution, "learning.memory.updated", "LEARNING_MEMORY", "Updated agent learning memory.", { scopes: ["growth_patterns", "winning_formats", "unavailable_sources"] });

  execution = await db.missionExecution.update({
    where: { id: execution.id },
    data: { status: "COMPLETED", currentPhase: "COMPLETED", completedAt: new Date(), phaseState: { ...execution.phaseState, packageId: productionPackage.id, approvalGate: "APPROVED" } },
  });
}

export async function listDailyGrowthMissions(workspaceId: string) {
  const db = prisma as Db;
  return db.missionExecution.findMany({
    where: { workspaceId, missionType: DAILY_GROWTH_MISSION },
    orderBy: { businessDate: "desc" },
    take: 25,
    include: { dailyGrowthReports: true, contentProductionPackages: true },
  });
}

export async function getDailyGrowthMissionDetail(workspaceId: string, executionId: string) {
  const db = prisma as Db;
  return db.missionExecution.findFirst({
    where: { workspaceId, id: executionId },
    include: {
      businessSnapshots: true,
      performanceReports: true,
      strategyOutcomes: true,
      trendOpportunities: true,
      contentBriefs: true,
      contentProductionPackages: true,
      dailyGrowthReports: true,
      contentOutcomes: true,
    },
  });
}

export async function getDailyGrowthMissionReplay(workspaceId: string, executionId: string) {
  const db = prisma as Db;
  return db.eventEnvelope.findMany({
    where: { workspaceId, aggregateType: DAILY_GROWTH_MISSION, aggregateId: executionId },
    orderBy: { sequence: "asc" },
  });
}

async function readPersistedSources(db: Db, workspaceId: string) {
  const sourceDb = db as Record<string, any>;
  const safe = async <T>(read: () => Promise<T>, fallback: T) => {
    try {
      return await read();
    } catch {
      return fallback;
    }
  };
  const workspace = await safe<any | null>(() => db.workspace.findUnique({ where: { id: workspaceId } }), null);
  const hospital = await safe<any | null>(() => sourceDb.hospitalWorkspace?.findFirst?.({
    where: { OR: [{ slug: workspace?.slug }, { hospitalName: workspace?.name }, { name: workspace?.name }] },
  }) ?? Promise.resolve(null), null);
  const hospitalId = hospital?.id;
  return {
    workspace,
    hospital,
    socialAccounts: await safe(() => db.socialAccount.findMany({ where: { workspaceId }, take: 20 }), []),
    socialPosts: await safe(() => db.socialPost.findMany({ where: { workspaceId }, include: { metrics: true, snapshots: true }, orderBy: { postedAt: "desc" }, take: 50 }), []),
    reviews: await safe(() => sourceDb.review?.findMany?.({ where: { workspaceId }, take: 50 }) ?? Promise.resolve([]), []),
    reviewAlerts: await safe(() => sourceDb.reviewAlert?.findMany?.({ where: { workspaceId }, take: 50 }) ?? Promise.resolve([]), []),
    competitorAccounts: await safe(() => db.competitorAccount.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 20 }), []),
    marketSignals: await safe(() => db.marketSignalObservation.findMany({ where: { workspaceId }, orderBy: { observedAt: "desc" }, take: 20 }), []),
    marketContexts: await safe(() => db.marketContextSnapshot.findMany({ where: { workspaceId }, orderBy: { generatedAt: "desc" }, take: 5 }), []),
    contentCalendar: hospitalId ? await safe(() => sourceDb.contentCalendarItem?.findMany?.({ where: { hospitalId, deletedAt: null }, orderBy: { scheduledDate: "asc" }, take: 50 }) ?? Promise.resolve([]), []) : [],
    integrationHealth: hospitalId ? await safe(() => sourceDb.hospitalIntegrationConfig.findMany({ where: { hospitalId }, take: 20 }), []) : [],
    recommendationOutcomes: await safe(() => db.recommendationOutcome.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 20 }), []),
    brandMemory: await safe(() => db.brandMemory.findFirst({ where: { workspaceId }, orderBy: { updatedAt: "desc" } }), null),
    vectorMemory: await safe(() => sourceDb.vectorMemory?.findMany?.({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 12 }) ?? Promise.resolve([]), []),
  };
}

async function appendMissionEvent(db: Db, execution: any, eventType: string, phase: string, summary: string, data: Record<string, unknown>) {
  const eventId = randomUUID();
  const occurredAt = new Date();
  const event = {
    eventId,
    eventType,
    eventVersion: 1,
    aggregateType: DAILY_GROWTH_MISSION,
    aggregateId: execution.id,
    workspaceId: execution.workspaceId,
    idempotencyKey: stableId(`${eventType}:${execution.workspaceId}:${execution.id}:${phase}`),
    occurredAt: occurredAt.toISOString(),
    payload: { traceId: execution.traceId, missionExecutionId: execution.id, phase, summary, data },
  };
  await db.eventEnvelope.upsert({
    where: { workspaceId_idempotencyKey: { workspaceId: execution.workspaceId, idempotencyKey: event.idempotencyKey } },
    create: {
      id: randomUUID(),
      eventId,
      workspaceId: execution.workspaceId,
      idempotencyKey: event.idempotencyKey,
      topic: eventTopics[eventType] ?? "intelligence",
      eventType,
      eventVersion: 1,
      aggregateType: DAILY_GROWTH_MISSION,
      aggregateId: execution.id,
      event: event as any,
      metadata: { correlationId: execution.traceId, producer: "daily-growth-mission", source: { module: "intelligence", component: "daily-growth-mission" } },
      priority: "NORMAL",
      publishedAt: occurredAt,
      occurredAt,
      state: "PENDING",
    },
    update: { event: event as any, occurredAt },
  });
  const latest = await db.missionExecution.findUnique({ where: { id: execution.id } });
  await db.missionExecution.update({
    where: { id: execution.id },
    data: { currentPhase: phase, replayCursor: { increment: 1 }, emittedEventIds: [...((latest?.emittedEventIds as string[] | undefined) ?? []), eventId] },
  });
}

async function upsertActionPlan(db: Db, workspaceId: string, executionId: string, input: Record<string, unknown>) {
  const idempotencyKey = stableId(`${workspaceId}:${executionId}:daily-growth-action-plan`);
  const existing = await db.actionPlan.findUnique({ where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey } } });
  if (existing) return existing;
  return db.actionPlan.create({
    data: {
      workspaceId,
      name: "Daily Growth Mission content approval",
      type: "SOCIAL_PUBLISHING",
      status: "PENDING_APPROVAL",
      input: input as any,
      idempotencyKey,
      requiresApproval: true,
      maxAttempts: 3,
      createdByType: "AGENT",
      createdById: "daily-growth-mission",
      steps: {
        create: [
          { workspaceId, position: 1, name: "Doctor Approval", processor: "approval.doctor", input: { missionExecutionId: executionId }, requiresApproval: true },
          { workspaceId, position: 2, name: "Production Approval", processor: "approval.production", input: { missionExecutionId: executionId }, requiresApproval: true },
        ],
      },
      approvals: {
        create: [
          { workspaceId, status: "PENDING", requestedByType: "AGENT", requestedById: "daily-growth-mission", reason: "Doctor Approval required before publishing preparation." },
          { workspaceId, status: "PENDING", requestedByType: "AGENT", requestedById: "daily-growth-mission", reason: "Production Approval required before publishing preparation." },
        ],
      },
    },
  });
}

async function createTasksAndNotifications(db: Db, workspaceId: string, executionId: string, packageId: string) {
  await db.operationalTask.createMany({
    data: ["Record reel", "Shoot B-roll", "Edit reel", "Create thumbnail", "Review content", "Schedule posting"].map((title, index) => ({
      id: randomUUID(),
      workspaceId,
      title,
      due: "Today",
      status: "open",
      completed: false,
      assigneeRole: index < 2 ? "doctor" : index < 4 ? "production" : "staff",
    })),
    skipDuplicates: true,
  });
  await db.operationalNotification.createMany({
    data: ["doctor", "production", "admin"].map((role) => ({
      id: randomUUID(),
      workspaceId,
      role,
      category: "daily-growth-mission",
      groupKey: executionId,
      title: "Daily Growth Mission ready",
      detail: `Content package ${packageId} is ready for approval and production.`,
      tone: "info",
      unread: true,
    })),
    skipDuplicates: true,
  });
}

async function upsertLearningMemory(db: Db, workspaceId: string, executionId: string, opportunity: any, outcome: any) {
  const records = [
    { scope: "growth_patterns", key: "daily-growth-opportunity", content: { opportunity }, confidenceScore: 0.7 },
    { scope: "winning_formats", key: "doctor-education-reel", content: { outcome }, confidenceScore: 0.65 },
    { scope: "unavailable_sources", key: "source-status-gap", content: { missionExecutionId: executionId }, confidenceScore: 0.55 },
  ];
  for (const record of records) {
    await db.agentLearningMemory.upsert({
      where: { workspaceId_scope_key: { workspaceId, scope: record.scope, key: record.key } },
      create: { workspaceId, missionExecutionId: executionId, ...record },
      update: { missionExecutionId: executionId, content: record.content, confidenceScore: record.confidenceScore },
    });
  }
}

async function buildProductionPackage(db: Db, workspaceId: string, missionExecutionId: string, businessDate: Date, brief: any, context: IntelligenceContext) {
  const postingTime = new Date(businessDate);
  postingTime.setUTCHours(17, 30, 0, 0);
  const actionPlanInput = {
    requiresApproval: true,
    approvalSteps: [
      { name: "Doctor Approval", status: "PENDING" },
      { name: "Production Approval", status: "PENDING" },
    ],
    revisionRequiredMapping: { approvalDecision: "REJECTED", revisionMetadata: { reason: "REVISION_REQUIRED" } },
  };
  const aiContent = await generateAIContentPackage(db, workspaceId, missionExecutionId, brief, context, postingTime);
  return {
    actionPlanInput,
    record: {
      workspaceId,
      missionExecutionId,
      contentBriefId: brief.id,
      businessDate,
      topic: aiContent.topic,
      objective: aiContent.objective,
      hook: aiContent.hook,
      fullScript: aiContent.fullScript,
      sceneBreakdown: aiContent.sceneBreakdown,
      visualDirections: aiContent.visualDirections,
      cameraAngles: aiContent.cameraAngles,
      doctorTalkingPoints: aiContent.doctorTalkingPoints,
      bRollRequirements: aiContent.bRollRequirements,
      cta: aiContent.cta,
      caption: aiContent.caption,
      hashtags: aiContent.hashtags,
      thumbnailConcept: aiContent.thumbnailConcept,
      thumbnailText: aiContent.thumbnailText,
      postingTime: new Date(aiContent.postingTime ?? postingTime),
      platformRecommendation: aiContent.platformRecommendation,
      targetKpi: aiContent.targetKpi,
      publishingPayload: { platform: aiContent.platformRecommendation, status: "PENDING", publishExternally: false, generationMetadata: aiContent.generationMetadata },
      approvalStatus: "PENDING",
      revisionMetadata: { revisionRequiredDecision: "REJECTED_WITH_REVISION_METADATA" },
      status: "PENDING_APPROVAL",
    },
  };
}

async function retrieveLearningMemory(db: Db, workspaceId: string): Promise<LearningContext> {
  const recent = await db.agentLearningMemory.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 30 }).catch(() => []);
  const byScope = (scope: string) => recent.filter((item: any) => item.scope === scope);
  return {
    recent,
    winningTopics: [...byScope("winning_topics"), ...byScope("growth_patterns")].slice(0, 8),
    winningHooks: byScope("winning_hooks").slice(0, 8),
    winningFormats: [...byScope("winning_formats"), ...byScope("growth_patterns")].slice(0, 8),
    winningPostingTimes: byScope("winning_posting_times").slice(0, 8),
    failurePatterns: [...byScope("failure_patterns"), ...byScope("unavailable_sources")].slice(0, 8),
    growthPatterns: byScope("growth_patterns").slice(0, 8),
  };
}

function buildCalendarIntelligence(items: any[], businessDate: Date) {
  const today = startOfUtcDay(businessDate);
  const tomorrow = addDays(today, 1);
  const inSeven = addDays(today, 7);
  const inThirty = addDays(today, 30);
  const normalized = items.map((item) => ({ ...item, scheduledDate: new Date(item.scheduledDate) })).filter((item) => !Number.isNaN(item.scheduledDate.getTime()));
  const bucket = (from: Date, to: Date) => normalized.filter((item) => item.scheduledDate >= from && item.scheduledDate < to);
  const classified = normalized.map((item) => ({
    id: item.id,
    title: item.title,
    scheduledDate: item.scheduledDate.toISOString(),
    category: item.category,
    type: item.contentType,
    opportunityType: item.isSpecialDay ? "MEDICAL_AWARENESS_DAY" : String(item.category ?? "").includes("CAMPAIGN") ? "SEASONAL_CAMPAIGN" : "HOSPITAL_EVENT",
    score: item.isSpecialDay ? 88 : item.priority === "HIGH" ? 78 : 58,
  }));
  return {
    total: normalized.length,
    today: bucket(today, tomorrow),
    tomorrow: bucket(tomorrow, addDays(tomorrow, 1)),
    next7Days: bucket(today, inSeven),
    next30Days: bucket(today, inThirty),
    opportunities: classified.filter((item) => new Date(item.scheduledDate) >= today && new Date(item.scheduledDate) <= inThirty).slice(0, 12),
  };
}

function buildTrendIntelligence(signals: any[], contexts: any[], learning: LearningContext) {
  const normalized = signals.map((signal) => ({
    id: signal.id,
    label: signal.label ?? signal.signalKey ?? "trend",
    category: signal.category ?? "healthcare",
    score: Number(signal.score ?? 0),
    momentum: Number(signal.momentum ?? 0),
    confidence: Number(signal.confidence ?? 0.5),
    observedAt: signal.observedAt,
  }));
  const learningLift = Math.min(15, learning.growthPatterns.length * 3);
  const trendScore = Math.min(100, average(normalized.map((item) => item.score)) + learningLift || (contexts.length ? 42 : 20));
  const growthScore = Math.min(100, average(normalized.map((item) => item.momentum || item.score)) + learningLift || 25);
  return {
    signals: normalized.slice(0, 12),
    topics: normalized.map((item) => ({ topic: item.label, contentScore: Math.min(100, item.score * item.confidence + learningLift) })).slice(0, 8),
    trendScore,
    growthScore,
    contentScore: Math.min(100, trendScore * 0.55 + growthScore * 0.45),
    contexts: contexts.slice(0, 4),
  };
}

function buildCompetitorIntelligence(accounts: any[], learning: LearningContext) {
  const rows = accounts.map((account) => {
    const metrics = account.metrics && typeof account.metrics === "object" ? account.metrics : {};
    const engagement = Number(metrics.engagementRate ?? metrics.engagement ?? metrics.avgEngagementRate ?? 0);
    const posts = Number(metrics.posts ?? metrics.postCount ?? metrics.postingFrequency ?? 0);
    return {
      id: account.id,
      handle: account.handle,
      displayName: account.displayName,
      engagement,
      posts,
      topics: Array.isArray(metrics.topics) ? metrics.topics : [],
      score: Math.min(100, engagement * 100 + posts * 3),
    };
  });
  const gaps = rows.length
    ? rows.slice(0, 5).map((row) => ({ competitorId: row.id, title: `${row.displayName ?? row.handle} content gap`, detail: row.topics.length ? `Differentiate against ${row.topics.slice(0, 3).join(", ")}.` : "Configured competitor lacks topic-level persisted metrics.", score: Math.max(35, 80 - row.score) }))
    : learning.failurePatterns.map((item) => ({ title: "Competitor evidence gap", detail: labelFromMemory(item), score: 35 })).slice(0, 3);
  return { competitors: rows, gaps, winningPatterns: rows.filter((row) => row.score >= 50).slice(0, 5), score: rows.length ? average(rows.map((row) => row.score)) : 0 };
}

async function generateAIContentPackage(db: Db, workspaceId: string, missionExecutionId: string, brief: any, context: IntelligenceContext, postingTime: Date) {
  const promptKey = "daily-growth-content-production";
  const promptVersion = "2.0";
  await db.promptTemplate.upsert({
    where: { workspaceId_key_version: { workspaceId, key: promptKey, version: promptVersion } },
    create: {
      workspaceId,
      key: promptKey,
      version: promptVersion,
      agentType: "CONTENT_AGENT",
      systemPrompt: "You are VIP Daily Growth Mission Content Production Agent. Return only production-ready JSON.",
      userTemplate: "Generate a complete clinical marketing content package from performance, trend, calendar, competitor, brand, and learning context.",
      active: true,
    },
    update: { active: true },
  }).catch(() => null);
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const trace = await db.aIExecutionTrace.create({
    data: {
      workspaceId,
      agentType: "CONTENT_AGENT",
      operation: "daily_growth_content_production",
      status: "RUNNING",
      triggerType: "MISSION_EXECUTION",
      triggerId: missionExecutionId,
      model,
      promptKey,
      promptVersion,
      input: sanitizeForJson({ brief, context }),
    },
  });
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await executeTrackedAI({
      feature: "daily-growth-mission-content-production",
      provider: "openai",
      model,
      operation: () => client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are VIP Content Intelligence for hospital growth. Return only valid JSON with every required field." },
          { role: "user", content: JSON.stringify({ requiredFields: requiredContentFields(), brief, context: compactContext(context), postingTime: postingTime.toISOString() }) },
        ],
      }),
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = normalizeContentPackage(JSON.parse(raw), brief, postingTime, "openai", model);
    await db.aIExecutionTrace.update({
      where: { id: trace.id },
      data: {
        status: "COMPLETED",
        output: sanitizeForJson(parsed),
        inputTokens: Number(response.usage?.prompt_tokens ?? 0),
        outputTokens: Number(response.usage?.completion_tokens ?? 0),
        completedAt: new Date(),
      },
    });
    return parsed;
  } catch (error) {
    const fallback = normalizeContentPackage({}, brief, postingTime, "deterministic_fallback", model);
    await db.aIExecutionTrace.update({
      where: { id: trace.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message : String(error), output: sanitizeForJson(fallback), completedAt: new Date() },
    });
    return fallback;
  }
}

function normalizeContentPackage(value: any, brief: any, postingTime: Date, provider: string, model: string) {
  const fallbackTopic = String(brief.title ?? "Daily patient education reel");
  return {
    topic: stringOr(value.topic, fallbackTopic),
    objective: stringOr(value.objective, brief.objective ?? "Improve patient trust and engagement."),
    hook: stringOr(value.hook, "Most patients miss this one simple signal before they book a consult."),
    fullScript: stringOr(value.fullScript, "Open with the patient worry, explain the clinical signal in plain language, show what happens during evaluation, then close with a clear consult CTA."),
    sceneBreakdown: arrayOr(value.sceneBreakdown, [
      { scene: 1, durationSeconds: 4, direction: "Doctor faces camera with hook." },
      { scene: 2, durationSeconds: 12, direction: "Explain concern in patient-friendly language." },
      { scene: 3, durationSeconds: 8, direction: "Show clinic B-roll and evaluation context." },
      { scene: 4, durationSeconds: 5, direction: "Close with CTA." },
    ]),
    visualDirections: arrayOr(value.visualDirections, ["Clean clinic background", "Readable lower-third keywords", "Approved diagrams only"]),
    cameraAngles: arrayOr(value.cameraAngles, ["Medium doctor shot", "Over-shoulder B-roll", "Close-up CTA"]),
    doctorTalkingPoints: arrayOr(value.doctorTalkingPoints, ["Name the concern", "Explain why it matters", "Describe the next safe step"]),
    bRollRequirements: arrayOr(value.bRollRequirements, ["Clinic exterior", "Consultation room", "Hands preparing notes", "Approved equipment detail"]),
    cta: stringOr(value.cta, "Book a consultation if this sounds familiar."),
    caption: stringOr(value.caption, `${fallbackTopic}. Save this before your next consultation.`),
    hashtags: arrayOr(value.hashtags, ["#PatientEducation", "#DoctorAdvice", "#ClinicGrowth", "#HealthAwareness"]),
    thumbnailConcept: stringOr(value.thumbnailConcept, "Doctor beside a bold patient question."),
    thumbnailText: stringOr(value.thumbnailText, "Do not ignore this"),
    postingTime: stringOr(value.postingTime, postingTime.toISOString()),
    platformRecommendation: stringOr(value.platformRecommendation, "INSTAGRAM_REELS"),
    targetKpi: value.targetKpi && typeof value.targetKpi === "object" ? value.targetKpi : { reach: 1200, engagementRate: 0.05, saves: 20 },
    generationMetadata: { provider, model, generatedAt: new Date().toISOString(), promptVersion: "2.0" },
  };
}

function buildPdfPayload(input: Record<string, any>) {
  return {
    pageType: "daily-growth-mission",
    title: "Daily Growth Mission Report",
    generatedAt: new Date().toISOString(),
    sections: [
      { title: "Executive Summary", body: input.opportunity.title },
      { title: "Performance Analysis", body: input.analytics },
      { title: "Growth Analysis", body: input.learningContext.growthPatterns },
      { title: "Review Analysis", body: input.sourceStatuses.reviews },
      { title: "Competitor Analysis", body: input.competitorIntelligence },
      { title: "Trend Analysis", body: input.trendIntelligence },
      { title: "Opportunities", body: input.opportunity },
      { title: "Strategy Plan", body: input.productionPackage.objective },
      { title: "Content Packages", body: input.productionPackage.topic },
      { title: "Full Scripts", body: input.productionPackage.fullScript },
      { title: "Captions", body: input.productionPackage.caption },
      { title: "Hashtags", body: input.productionPackage.hashtags },
      { title: "Thumbnail Concepts", body: input.productionPackage.thumbnailConcept },
      { title: "Publishing Schedule", body: input.productionPackage.postingTime },
      { title: "Expected Outcomes", body: input.productionPackage.targetKpi },
    ],
  };
}

async function generateDailyGrowthPdf(workspaceId: string, executionId: string, businessDate: Date, payload: any) {
  const fileName = `daily-growth-mission-${workspaceId}-${businessDate.toISOString().slice(0, 10)}-${executionId.slice(0, 8)}.pdf`;
  const directory = path.join(process.cwd(), "public", "generated", "daily-growth-mission");
  await mkdir(directory, { recursive: true });
  const bytes = minimalPdf(`${payload.title}\n\n${payload.sections.map((section: any) => `${section.title}: ${JSON.stringify(section.body).slice(0, 500)}`).join("\n\n")}`);
  await writeFile(path.join(directory, fileName), bytes);
  return { fileName: `/generated/daily-growth-mission/${fileName}`, fileSizeBytes: bytes.byteLength };
}

function summarizeAnalytics(posts: any[]) {
  const metrics = posts.map((post) => post.metrics).filter(Boolean);
  const reach = sum(metrics, "reach");
  const impressions = sum(metrics, "impressions");
  const likes = sum(metrics, "likes");
  const comments = sum(metrics, "comments");
  const shares = sum(metrics, "shares");
  const saves = sum(metrics, "saves");
  const engagement = likes + comments + shares + saves;
  return { posts: posts.length, reach, impressions, likes, comments, shares, saves, engagement, engagementRate: reach ? engagement / reach : 0 };
}

function bestOpportunityTitle(trends: ReturnType<typeof buildTrendIntelligence>, calendar: ReturnType<typeof buildCalendarIntelligence>, competitors: ReturnType<typeof buildCompetitorIntelligence>, learning: LearningContext) {
  const calendarHit = calendar.opportunities[0]?.title;
  const trendHit = trends.topics[0]?.topic;
  const competitorHit = competitors.gaps[0]?.title;
  const learningHit = learning.winningTopics[0] ? labelFromMemory(learning.winningTopics[0]) : "";
  if (calendarHit) return `Use ${calendarHit} for a timely patient education reel`;
  if (trendHit) return `Turn ${trendHit} into a patient education reel`;
  if (competitorHit) return `Close ${competitorHit} with doctor-led education`;
  if (learningHit) return `Repeat winning learning pattern: ${learningHit}`;
  return "Create a trust-building patient education reel";
}

function labelFromMemory(item: any) {
  if (!item) return "stored learning";
  const content = item.content && typeof item.content === "object" ? item.content : {};
  return String(content.title ?? content.topic ?? content.key ?? item.key ?? item.scope ?? "stored learning");
}

function compactContext(context: IntelligenceContext) {
  return {
    analytics: context.analytics,
    opportunity: context.opportunity,
    learningContext: context.learningContext,
    calendarIntelligence: context.calendarIntelligence,
    trendIntelligence: context.trendIntelligence,
    competitorIntelligence: context.competitorIntelligence,
    brandMemory: context.brandMemory,
    vectorMemory: context.vectorMemory.slice(0, 5).map((item) => ({ id: item.id, chunkText: item.chunkText })),
    contentHistory: context.contentHistory.map((item) => ({ caption: item.caption, platform: item.platform, postedAt: item.postedAt })).slice(0, 8),
  };
}

function requiredContentFields() {
  return [
    "topic",
    "objective",
    "hook",
    "fullScript",
    "sceneBreakdown",
    "visualDirections",
    "cameraAngles",
    "doctorTalkingPoints",
    "bRollRequirements",
    "cta",
    "caption",
    "hashtags",
    "thumbnailConcept",
    "thumbnailText",
    "postingTime",
    "platformRecommendation",
    "targetKpi",
  ];
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function arrayOr<T>(value: unknown, fallback: T[]) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function sanitizeForJson(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_key, inner) => inner instanceof Date ? inner.toISOString() : inner));
}

function average(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? finite.reduce((total, value) => total + value, 0) / finite.length : 0;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function minimalPdf(text: string) {
  const escaped = text.replace(/[\\()]/g, "\\$&").replace(/\r?\n/g, "\\n");
  const stream = `BT /F1 10 Tf 40 780 Td (${escaped.slice(0, 6000)}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

function sourceStatus(count: number, configured: unknown[]) {
  if (count > 0) return "COLLECTED";
  if (!configured.length) return "NOT_CONFIGURED";
  return "NO_DATA";
}

function sum(records: any[], field: string) {
  return records.reduce((total, item) => total + Number(item?.[field] ?? 0), 0);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function stableId(value: string) {
  return createHash("sha1").update(value).digest("hex");
}
