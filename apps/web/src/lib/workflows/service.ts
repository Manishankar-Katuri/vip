import { prisma } from "@vip/database";
import { createHash } from "node:crypto";

import { runDailyGrowthMission } from "@/lib/daily-growth-mission";
import {
  arrayOrEmpty,
  buildDetail,
  buildWorkflowSteps,
  dataSourcesFromSnapshot,
  normalizeStepStatus,
  summarizeValue,
  toWorkflowListItem,
  workflowTimelineFromEvents,
} from "./mapper";
import type {
  WorkflowAgentActivity,
  WorkflowApproval,
  WorkflowDetailResponse,
  WorkflowError,
  WorkflowListResponse,
  WorkflowReport,
  WorkflowTimelineEvent,
} from "./types";

type Db = typeof prisma & Record<string, any>;
type WorkflowQuery = {
  clientId?: string | null;
  status?: string | null;
  date?: string | null;
  limit?: string | number | null;
};

const DAILY_GROWTH_MISSION = "DAILY_GROWTH_MISSION";

export async function listWorkflows(query: WorkflowQuery = {}): Promise<WorkflowListResponse> {
  const db = prisma as Db;
  const limit = normalizeLimit(query.limit);
  const where: Record<string, unknown> = {
    missionType: DAILY_GROWTH_MISSION,
  };

  if (query.clientId) where.workspaceId = query.clientId;
  const status = normalizeStatusFilter(query.status);
  if (status) where.status = status;
  const dateRange = dateFilter(query.date);
  if (dateRange) where.businessDate = dateRange;

  const runs = await db.missionExecution.findMany({
    where,
    orderBy: [{ businessDate: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      dailyGrowthReports: true,
      contentProductionPackages: true,
    },
  });

  const runIds = runs.map((run: any) => run.id);
  const workspaceIds = [...new Set(runs.map((run: any) => run.workspaceId))];
  const [failures, operationalErrors] = await Promise.all([
    runIds.length ? db.executionFailure.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        actionExecution: {
          actionPlan: {
            idempotencyKey: { in: runs.map((run: any) => actionPlanIdempotencyKey(run.workspaceId, run.id)) },
          },
        },
      },
    }).catch(() => []) : [],
    workspaceIds.length ? db.operationalError.findMany({
      where: { workspaceId: { in: workspaceIds }, occurredAt: { gte: oldestRunDate(runs) } },
      take: 200,
    }).catch(() => []) : [],
  ]);

  return {
    workflows: runs.map((run: any) => toWorkflowListItem({
      run,
      errorCount: errorCountForRun(run, failures, operationalErrors),
      warningCount: warningCountForRun(run, operationalErrors),
    })),
    filters: {
      clientId: query.clientId ?? null,
      status: query.status ?? null,
      date: query.date ?? null,
      limit,
    },
  };
}

export async function getWorkflowDetail(runId: string): Promise<WorkflowDetailResponse | null> {
  const db = prisma as Db;
  const run = await db.missionExecution.findUnique({
    where: { id: runId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      businessSnapshots: true,
      performanceReports: true,
      strategyOutcomes: true,
      trendOpportunities: true,
      contentBriefs: true,
      contentProductionPackages: true,
      dailyGrowthReports: true,
      reportDrafts: true,
      contentOutcomes: true,
    },
  });

  if (!run) return null;

  const actionPlanIds = ((run.contentProductionPackages ?? []) as Array<{ actionPlanId?: string | null }>)
    .map((item) => item.actionPlanId)
    .filter((id): id is string => Boolean(id));
  const fallbackIdempotencyKey = actionPlanIdempotencyKey(run.workspaceId, run.id);
  const actionPlanWhere: Array<Record<string, unknown>> = [{ idempotencyKey: fallbackIdempotencyKey }];
  if (actionPlanIds.length) actionPlanWhere.unshift({ id: { in: actionPlanIds } });
  const reportPdfExportIds = ((run.dailyGrowthReports ?? []) as Array<{ pdfExportRunId?: string | null }>)
    .map((report) => report.pdfExportRunId)
    .filter((id): id is string => Boolean(id));
  const aiTraceWhere: Array<Record<string, unknown>> = [{ triggerId: run.id }];
  if (actionPlanIds.length) aiTraceWhere.unshift({ actionPlanId: { in: actionPlanIds } });

  const [
    events,
    actionPlans,
    aiTraces,
    pdfExports,
    operationalErrors,
    deadLetters,
    integrations,
  ] = await Promise.all([
    db.eventEnvelope.findMany({
      where: { workspaceId: run.workspaceId, aggregateType: DAILY_GROWTH_MISSION, aggregateId: run.id },
      orderBy: { sequence: "asc" },
    }).catch(() => []),
    db.actionPlan.findMany({
      where: {
        workspaceId: run.workspaceId,
        OR: actionPlanWhere,
      },
      include: {
        approvals: true,
        steps: { include: { failures: true } },
        executions: { include: { failures: true, steps: { include: { failures: true } }, logs: true } },
      },
    }).catch(() => []),
    db.aIExecutionTrace.findMany({
      where: {
        workspaceId: run.workspaceId,
        OR: aiTraceWhere,
      },
      orderBy: { startedAt: "asc" },
      take: 100,
    }).catch(() => []),
    db.pdfExportRun.findMany({
      where: {
        OR: [
          { workspaceId: run.workspaceId, pageType: "daily-growth-mission" },
          { id: { in: reportPdfExportIds } },
        ],
      },
      orderBy: { requestedAt: "desc" },
      take: 50,
    }).catch(() => []),
    db.operationalError.findMany({
      where: { workspaceId: run.workspaceId, occurredAt: { gte: run.startedAt ?? run.businessDate } },
      orderBy: { occurredAt: "asc" },
      take: 100,
    }).catch(() => []),
    db.eventDeadLetter.findMany({
      where: {
        workspaceId: run.workspaceId,
        envelope: { aggregateType: DAILY_GROWTH_MISSION, aggregateId: run.id },
      },
      include: { envelope: true },
      orderBy: { deadLetteredAt: "asc" },
      take: 100,
    }).catch(() => []),
    findWorkspaceIntegrations(db, run.workspace),
  ]);

  const actionSteps = flattenActionSteps(actionPlans);
  const actionFailures = flattenActionFailures(actionPlans);
  const reports = reportsFromRun(run.dailyGrowthReports ?? [], pdfExports, run.reportDrafts ?? []);
  const approvals = approvalsFromActionPlans(actionPlans);
  const errors = errorsFromSources({ run, actionFailures, operationalErrors, deadLetters });
  const timeline = buildTimeline({
    events,
    aiTraces,
    reports,
    approvals,
    errors,
  });
  const steps = buildWorkflowSteps({ run, events, actionSteps });
  const dataSources = dataSourcesFromSnapshot({
    snapshot: run.businessSnapshots?.[0] ?? null,
    integrations,
  });

  return buildDetail({
    run,
    timeline,
    steps,
    agentActivity: agentActivityFromTraces(aiTraces),
    dataSources,
    reports,
    approvals,
    errors,
  });
}

export async function manualStartWorkflow(input: { workspaceId?: string; clientId?: string }) {
  const workspaceId = input.workspaceId ?? input.clientId;
  if (!workspaceId) {
    return { status: 400, body: { error: "workspaceId or clientId is required." } };
  }

  const mission = await runDailyGrowthMission(workspaceId);
  if (!mission?.id) {
    return { status: 500, body: { error: "Daily workflow did not return a mission execution." } };
  }
  const detail = await getWorkflowDetail(mission.id);
  return { status: 200, body: { workflow: detail } };
}

export async function retryWorkflow(runId: string) {
  const detail = await getWorkflowDetail(runId);
  if (!detail) return { status: 404, body: { error: "Workflow run not found." } };
  if (!detail.retrySummary.retryable) {
    return {
      status: 409,
      body: {
        error: "Workflow retry is not allowed for this run.",
        retrySummary: detail.retrySummary,
      },
    };
  }

  const mission = await runDailyGrowthMission(detail.run.workspaceId);
  if (!mission?.id) {
    return { status: 500, body: { error: "Retry did not return a workflow run." } };
  }
  const retried = await getWorkflowDetail(mission.id);
  return { status: 200, body: { workflow: retried, retryMode: detail.retrySummary.retryMode } };
}

function buildTimeline(input: {
  events: any[];
  aiTraces: any[];
  reports: WorkflowReport[];
  approvals: WorkflowApproval[];
  errors: WorkflowError[];
}): WorkflowTimelineEvent[] {
  const events = workflowTimelineFromEvents(input.events);
  const ai = input.aiTraces.map((trace): WorkflowTimelineEvent => ({
    id: `ai-${trace.id}`,
    timestamp: iso(trace.startedAt) ?? new Date(0).toISOString(),
    label: `${String(trace.agentType).replace(/_/g, " ")}: ${trace.operation}`,
    description: trace.error ?? summarizeValue(trace.output),
    status: normalizeStepStatus(trace.status),
    source: trace.model ?? "ai",
    sourceType: "ai",
    metadata: { promptKey: trace.promptKey, promptVersion: trace.promptVersion, triggerType: trace.triggerType },
  }));
  const reports = input.reports.map((report): WorkflowTimelineEvent => ({
    id: `report-${report.id}`,
    timestamp: report.generatedAt ?? new Date(0).toISOString(),
    label: report.title,
    description: `${report.reportType} is ${report.status}.`,
    status: normalizeStepStatus(report.status),
    source: report.reportType,
    sourceType: "report",
    metadata: { exportStatus: report.exportStatus, pdfUrl: report.pdfUrl },
  }));
  const approvals = input.approvals.map((approval): WorkflowTimelineEvent => ({
    id: `approval-${approval.id}`,
    timestamp: approval.requestedAt ?? new Date(0).toISOString(),
    label: `${approval.targetType} approval`,
    description: approval.notes ?? `Approval status is ${approval.status}.`,
    status: normalizeStepStatus(approval.status),
    source: approval.targetType,
    sourceType: "approval",
    metadata: { targetId: approval.targetId, approvedBy: approval.approvedBy },
  }));
  const errors = input.errors.map((error): WorkflowTimelineEvent => ({
    id: `error-${error.id}`,
    timestamp: error.occurredAt,
    label: error.source,
    description: error.message,
    status: "failed",
    source: error.source,
    sourceType: "error",
    metadata: { severity: error.severity, retryable: error.retryable, recommendedAction: error.recommendedAction },
  }));

  return [...events, ...ai, ...reports, ...approvals, ...errors]
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
}

function reportsFromRun(reports: any[], pdfExports: any[], reportDrafts: any[] = []): WorkflowReport[] {
  const draftReports = reportDrafts.map((report): WorkflowReport => ({
    id: report.id,
    reportType: report.reportType,
    title: report.title,
    status: String(report.status ?? "draft").toLowerCase(),
    generatedAt: iso(report.generatedAt),
    exportStatus: String(report.exportStatus ?? "not_exported").toLowerCase(),
    pdfUrl: report.pdfUrl ?? null,
    docxUrl: report.docxUrl ?? null,
    approvalStatus: String(report.approvalStatus ?? "not_requested").toLowerCase(),
    sentStatus: String(report.sentStatus ?? "not_sent").toLowerCase(),
  }));

  const legacyReports = reports.map((report) => {
    const exportRun = pdfExports.find((item) => item.id === report.pdfExportRunId) ?? pdfExports.find((item) => item.fileName === report.pdfFileName);
    const approvedBy = arrayOrEmpty(report.approvedBy);
    return {
      id: report.id,
      reportType: "Daily Growth Report",
      title: report.title,
      status: String(report.status ?? "unknown").toLowerCase(),
      generatedAt: iso(report.generatedAt),
      exportStatus: String(exportRun?.status ?? (report.pdfFileName ? "COMPLETED" : "not_requested")).toLowerCase(),
      pdfUrl: report.pdfFileName ?? exportRun?.fileName ?? null,
      docxUrl: null,
      approvalStatus: approvedBy.length ? "approved" : "pending",
      sentStatus: "not_sent",
    };
  });

  return [...draftReports, ...legacyReports];
}

function approvalsFromActionPlans(actionPlans: any[]): WorkflowApproval[] {
  return actionPlans.flatMap((plan) => (plan.approvals ?? []).map((approval: any): WorkflowApproval => ({
    id: approval.id,
    targetType: "actionPlan",
    targetId: approval.actionPlanId,
    status: String(approval.status ?? "unknown").toLowerCase(),
    requestedAt: iso(approval.requestedAt),
    approvedAt: iso(approval.decidedAt),
    approvedBy: approval.decidedById ?? null,
    notes: approval.decisionNote ?? approval.reason ?? null,
  })));
}

function agentActivityFromTraces(traces: any[]): WorkflowAgentActivity[] {
  return traces.map((trace): WorkflowAgentActivity => ({
    id: trace.id,
    agentName: String(trace.agentType ?? "AI Agent").replace(/_/g, " "),
    action: trace.operation,
    status: normalizeStepStatus(trace.status),
    startedAt: iso(trace.startedAt),
    completedAt: iso(trace.completedAt),
    toolCalls: arrayOrEmpty(trace.toolCalls),
    inputSummary: summarizeValue(trace.input),
    outputSummary: summarizeValue(trace.output),
    tokenUsage: {
      inputTokens: trace.inputTokens ?? 0,
      outputTokens: trace.outputTokens ?? 0,
      totalTokens: (trace.inputTokens ?? 0) + (trace.outputTokens ?? 0),
    },
    errorMessage: trace.error ?? null,
  }));
}

function flattenActionSteps(actionPlans: any[]) {
  const planSteps = actionPlans.flatMap((plan) => plan.steps ?? []);
  const executionSteps = actionPlans.flatMap((plan) => (plan.executions ?? []).flatMap((execution: any) => execution.steps ?? []));
  const byId = new Map<string, any>();
  [...planSteps, ...executionSteps].forEach((step) => byId.set(step.id, step));
  return [...byId.values()];
}

function flattenActionFailures(actionPlans: any[]) {
  const stepFailures = flattenActionSteps(actionPlans).flatMap((step: any) => step.failures ?? []);
  const executionFailures = actionPlans.flatMap((plan) => (plan.executions ?? []).flatMap((execution: any) => execution.failures ?? []));
  return [...stepFailures, ...executionFailures];
}

function errorsFromSources(input: {
  run: any;
  actionFailures: any[];
  operationalErrors: any[];
  deadLetters: any[];
}): WorkflowError[] {
  const missionError: WorkflowError[] = input.run.failureReason ? [{
    id: `mission-${input.run.id}-failure`,
    source: "Daily Growth Mission",
    sourceType: "mission",
    message: input.run.failureReason,
    severity: "error",
    occurredAt: iso(input.run.failedAt ?? input.run.updatedAt) ?? new Date(0).toISOString(),
    resolvedAt: null,
    retryable: true,
    recommendedAction: "Inspect the failed phase and retry after source or approval issues are resolved.",
  }] : [];
  const actionErrors = input.actionFailures.map((failure): WorkflowError => ({
    id: failure.id,
    source: failure.code ?? "Action execution",
    sourceType: "action",
    message: failure.message,
    severity: "error",
    occurredAt: iso(failure.occurredAt) ?? new Date(0).toISOString(),
    resolvedAt: null,
    retryable: Boolean(failure.retryable),
    recommendedAction: failure.retryable ? "Retry the workflow after checking the failed action step." : "Manual investigation is required before retry.",
  }));
  const opsErrors = input.operationalErrors.map((error): WorkflowError => ({
    id: error.id,
    source: error.category ?? error.code ?? "Operational error",
    sourceType: "error",
    message: error.message,
    severity: severity(error.severity),
    occurredAt: iso(error.occurredAt) ?? new Date(0).toISOString(),
    resolvedAt: null,
    retryable: Boolean(error.retryable),
    recommendedAction: error.retryable ? "Resolve the operational issue and retry if the workflow is failed." : "Manual investigation is required.",
  }));
  const deadLetterErrors = input.deadLetters.map((letter): WorkflowError => ({
    id: letter.id,
    source: letter.subscriberId,
    sourceType: "event",
    message: letter.failure,
    severity: "error",
    occurredAt: iso(letter.deadLetteredAt) ?? new Date(0).toISOString(),
    resolvedAt: null,
    retryable: true,
    recommendedAction: "Inspect the dead-lettered event and replay through the event pipeline when available.",
  }));
  return [...missionError, ...actionErrors, ...opsErrors, ...deadLetterErrors];
}

async function findWorkspaceIntegrations(db: Db, workspace: { id: string; name?: string | null; slug?: string | null } | null) {
  if (!workspace) return [];
  const hospital = await db.hospitalWorkspace.findFirst({
    where: {
      OR: [
        { slug: workspace.slug ?? undefined },
        { name: workspace.name ?? undefined },
        { hospitalName: workspace.name ?? undefined },
      ].filter((item) => Object.values(item).some(Boolean)),
    },
  }).catch(() => null);
  if (!hospital?.id) return [];
  return db.hospitalIntegrationConfig.findMany({ where: { hospitalId: hospital.id }, orderBy: { updatedAt: "desc" }, take: 20 }).catch(() => []);
}

function errorCountForRun(run: any, failures: any[], operationalErrors: any[]) {
  const key = actionPlanIdempotencyKey(run.workspaceId, run.id);
  return (run.failureReason ? 1 : 0) +
    failures.filter((failure) => failure.actionExecution?.actionPlan?.idempotencyKey === key || failure.workspaceId === run.workspaceId).length +
    operationalErrors.filter((error) => error.workspaceId === run.workspaceId && severity(error.severity) !== "warning").length;
}

function warningCountForRun(run: any, operationalErrors: any[]) {
  return operationalErrors.filter((error) => error.workspaceId === run.workspaceId && severity(error.severity) === "warning").length;
}

function oldestRunDate(runs: any[]) {
  const dates = runs.map((run) => new Date(run.startedAt ?? run.businessDate ?? run.createdAt).getTime()).filter(Number.isFinite);
  return new Date(dates.length ? Math.min(...dates) : Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function normalizeLimit(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? "50"), 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(100, parsed));
}

function normalizeStatusFilter(value: string | null | undefined) {
  if (!value) return null;
  const upper = value.toUpperCase();
  const known: Record<string, string> = {
    QUEUED: "QUEUED",
    RUNNING: "RUNNING",
    WAITING_APPROVAL: "WAITING_APPROVAL",
    WAITING: "WAITING_APPROVAL",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
  };
  return known[upper] ?? null;
}

function dateFilter(date: string | null | undefined) {
  if (!date) return null;
  const start = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

function actionPlanIdempotencyKey(workspaceId: string, runId: string) {
  return stableId(`${workspaceId}:${runId}:daily-growth-action-plan`);
}

function stableId(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function severity(value: unknown): WorkflowError["severity"] {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("critical")) return "critical";
  if (normalized.includes("warn")) return "warning";
  if (normalized.includes("info")) return "info";
  return "error";
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
