import type {
  WorkflowAgentActivity,
  WorkflowApproval,
  WorkflowDataSource,
  WorkflowDetailResponse,
  WorkflowError,
  WorkflowListItem,
  WorkflowReport,
  WorkflowRetrySummary,
  WorkflowRun,
  WorkflowRunStatus,
  WorkflowSourceType,
  WorkflowStep,
  WorkflowStepStatus,
  WorkflowTimelineEvent,
  WorkflowTriggerType,
} from "./types";

export const WORKFLOW_PHASES = [
  { name: "STARTED", label: "Workflow started", description: "Daily workflow was created or started." },
  { name: "CLIENT_SELECTED", label: "Client selected", description: "The workflow is scoped to one active client workspace." },
  { name: "SOCIAL_DATA", label: "Social data pulled", description: "Instagram, Facebook, and related social data are collected where configured." },
  { name: "GBP_DATA", label: "Google Business Profile data pulled", description: "GBP data is collected where configured." },
  { name: "REVIEWS", label: "Reviews analyzed", description: "Review and reputation signals are analyzed where available." },
  { name: "PERFORMANCE_ANALYSIS", label: "Analytics generated", description: "Performance metrics and business analytics are generated." },
  { name: "INTELLIGENCE", label: "Intelligence generated", description: "Signals are converted into risks, opportunities, and observations." },
  { name: "STRATEGY_PLANNING", label: "Strategy generated", description: "Prioritized strategy guidance is generated." },
  { name: "CONTENT_PRODUCTION", label: "Content plan generated", description: "Execution-ready content plan output is generated." },
  { name: "REPORT_GENERATION", label: "Report draft generated", description: "Owner-review report draft and export metadata are generated." },
  { name: "APPROVAL", label: "Waiting for approval", description: "Owner or role approval is required before downstream actions." },
  { name: "COMPLETED", label: "Completed / sent / failed", description: "The workflow has completed, failed, or moved to final delivery state." },
] as const;

const missionPhaseToOrder: Record<string, number> = {
  SCHEDULER: 0,
  STARTED: 1,
  ACQUISITION: 3,
  PERFORMANCE_ANALYSIS: 6,
  STRATEGY_LEARNING: 7,
  OPPORTUNITY_DISCOVERY: 7,
  STRATEGY_PLANNING: 8,
  CONTENT_PRODUCTION: 9,
  REPORT_GENERATION: 10,
  APPROVAL: 11,
  TASK_CREATION: 12,
  PUBLISHING_PREPARATION: 12,
  OUTCOME_TRACKING: 12,
  LEARNING_MEMORY: 12,
  COMPLETED: 12,
};

type RawRun = {
  id: string;
  workspaceId: string;
  missionType: string;
  status: string;
  currentPhase: string;
  triggerType: string;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  failedAt?: Date | string | null;
  failureReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  workspace?: { id?: string; name?: string | null; slug?: string | null } | null;
  dailyGrowthReports?: Array<{ status?: string | null; approvedBy?: unknown }> | null;
  contentProductionPackages?: Array<{ approvalStatus?: string | null }> | null;
};

export function toWorkflowListItem(input: {
  run: RawRun;
  errorCount?: number;
  warningCount?: number;
}): WorkflowListItem {
  const run = input.run;
  const normalizedStatus = normalizeRunStatus(run.status);
  return {
    id: run.id,
    clientId: run.workspaceId,
    workspaceId: run.workspaceId,
    clientName: clientName(run),
    workflowType: workflowTypeLabel(run.missionType),
    status: normalizedStatus,
    startedAt: iso(run.startedAt),
    completedAt: iso(run.completedAt ?? run.failedAt ?? null),
    duration: durationLabel(run.startedAt, run.completedAt ?? run.failedAt ?? null),
    durationMs: durationMs(run.startedAt, run.completedAt ?? run.failedAt ?? null),
    currentStep: currentStepLabel(run.currentPhase, normalizedStatus),
    progressPercent: progressPercent(run.currentPhase, normalizedStatus),
    triggerType: normalizeTrigger(run.triggerType),
    reportStatus: reportStatus(run.dailyGrowthReports ?? []),
    approvalStatus: approvalStatus(run.contentProductionPackages ?? [], run.status),
    errorCount: input.errorCount ?? (run.failureReason ? 1 : 0),
    warningCount: input.warningCount ?? 0,
    lastUpdatedAt: iso(run.updatedAt) ?? new Date(0).toISOString(),
  };
}

export function toWorkflowRun(run: RawRun): WorkflowRun {
  const normalizedStatus = normalizeRunStatus(run.status);
  return {
    id: run.id,
    clientId: run.workspaceId,
    workspaceId: run.workspaceId,
    clientName: clientName(run),
    workflowType: workflowTypeLabel(run.missionType),
    status: normalizedStatus,
    startedAt: iso(run.startedAt),
    completedAt: iso(run.completedAt ?? run.failedAt ?? null),
    duration: durationLabel(run.startedAt, run.completedAt ?? run.failedAt ?? null),
    durationMs: durationMs(run.startedAt, run.completedAt ?? run.failedAt ?? null),
    triggerType: normalizeTrigger(run.triggerType),
    currentPhase: run.currentPhase,
    progressPercent: progressPercent(run.currentPhase, normalizedStatus),
    summary: runSummary(run, normalizedStatus),
    createdAt: iso(run.createdAt) ?? new Date(0).toISOString(),
    updatedAt: iso(run.updatedAt) ?? new Date(0).toISOString(),
  };
}

export function buildWorkflowSteps(input: {
  run: RawRun;
  events?: Array<{ eventType?: string; occurredAt?: Date | string; event?: unknown; payload?: unknown }>;
  actionSteps?: Array<{
    id: string;
    name: string;
    processor?: string | null;
    position: number;
    status: string;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    output?: unknown;
    failures?: Array<{ message: string }> | null;
  }>;
}): WorkflowStep[] {
  const runStatus = normalizeRunStatus(input.run.status);
  const currentOrder = missionPhaseToOrder[input.run.currentPhase] ?? 0;
  const eventPhases = new Set((input.events ?? []).map((event) => eventPhase(event)).filter(Boolean));

  const base = WORKFLOW_PHASES.map((phase, index): WorkflowStep => {
    const order = index + 1;
    const completedByEvent = eventPhases.has(phase.name);
    const status = stepStatusFor(order, currentOrder, runStatus, phase.name, completedByEvent);
    const matchingEvent = (input.events ?? []).find((event) => eventPhase(event) === phase.name);
    return {
      id: `mission-${phase.name.toLowerCase()}`,
      name: phase.name,
      label: phase.label,
      description: phase.description,
      status,
      startedAt: iso(matchingEvent?.occurredAt ?? (phase.name === "STARTED" ? input.run.startedAt : null)),
      completedAt: completedByEvent ? iso(matchingEvent?.occurredAt) : phase.name === "COMPLETED" ? iso(input.run.completedAt ?? input.run.failedAt ?? null) : null,
      duration: null,
      durationMs: null,
      order,
      source: "mission",
      recordsProcessed: null,
      outputSummary: completedByEvent ? eventSummary(matchingEvent) : status === "pending" ? "Not reached yet." : "Status inferred from current mission phase.",
      errorMessage: phase.name === "COMPLETED" && input.run.failureReason ? input.run.failureReason : null,
    };
  });

  const actionSteps = (input.actionSteps ?? []).map((step): WorkflowStep => ({
    id: step.id,
    name: step.name,
    label: step.name,
    description: step.processor ? `Action processor: ${step.processor}` : "Action execution step.",
    status: normalizeStepStatus(step.status),
    startedAt: iso(step.startedAt),
    completedAt: iso(step.completedAt),
    duration: durationLabel(step.startedAt, step.completedAt),
    durationMs: durationMs(step.startedAt, step.completedAt),
    order: 100 + step.position,
    source: "action",
    recordsProcessed: null,
    outputSummary: summarizeValue(step.output),
    errorMessage: step.failures?.[0]?.message ?? null,
  }));

  return [...base, ...actionSteps].sort((left, right) => left.order - right.order);
}

export function buildRetrySummary(input: {
  run: RawRun;
  steps: WorkflowStep[];
  errors: WorkflowError[];
}): WorkflowRetrySummary {
  const failedStep = input.steps.find((step) => step.status === "failed") ?? null;
  const retryableError = input.errors.find((error) => error.retryable);
  const runStatus = normalizeRunStatus(input.run.status);
  if (runStatus === "failed" || retryableError) {
    return {
      retryable: true,
      retryMode: "manual_rerun",
      failedStepId: failedStep?.id ?? null,
      failedStepName: failedStep?.label ?? null,
      reason: retryableError?.message ?? input.run.failureReason ?? "Workflow is failed and can be manually rerun through the daily mission service.",
      recommendedAction: "Run a guarded manual retry. If the same failure returns, inspect source connection health before retrying again.",
    };
  }
  if (runStatus === "completed") {
    return {
      retryable: false,
      retryMode: "not_required",
      failedStepId: null,
      failedStepName: null,
      reason: "Workflow completed.",
      recommendedAction: "No retry is required.",
    };
  }
  return {
    retryable: false,
    retryMode: "not_available",
    failedStepId: failedStep?.id ?? null,
    failedStepName: failedStep?.label ?? null,
    reason: "Retry is only enabled for failed or retryable workflow runs.",
    recommendedAction: "Wait for the workflow to finish or resolve approval/reconnection requirements.",
  };
}

export function buildDetail(input: {
  run: RawRun;
  timeline: WorkflowTimelineEvent[];
  steps: WorkflowStep[];
  agentActivity: WorkflowAgentActivity[];
  dataSources: WorkflowDataSource[];
  reports: WorkflowReport[];
  approvals: WorkflowApproval[];
  errors: WorkflowError[];
}): WorkflowDetailResponse {
  return {
    run: toWorkflowRun(input.run),
    timeline: input.timeline,
    steps: input.steps,
    agentActivity: input.agentActivity,
    apiCalls: input.dataSources,
    dataSources: input.dataSources,
    reports: input.reports,
    approvals: input.approvals,
    errors: input.errors,
    retrySummary: buildRetrySummary({ run: input.run, steps: input.steps, errors: input.errors }),
  };
}

export function normalizeRunStatus(status: string | null | undefined): WorkflowRunStatus {
  const value = String(status ?? "").toUpperCase();
  if (value === "QUEUED") return "queued";
  if (value === "RUNNING") return "running";
  if (value === "WAITING_APPROVAL") return "waiting_approval";
  if (value === "COMPLETED") return "completed";
  if (value === "FAILED" || value === "DEAD_LETTERED") return "failed";
  if (value === "CANCELLED") return "cancelled";
  return "unknown";
}

export function normalizeStepStatus(status: string | null | undefined): WorkflowStepStatus {
  const value = String(status ?? "").toUpperCase();
  if (value === "QUEUED" || value === "PENDING" || value === "REQUESTED") return "pending";
  if (value === "RUNNING") return "running";
  if (value === "COMPLETED" || value === "PASS" || value === "CONNECTED" || value === "COLLECTED" || value === "GENERATED" || value === "APPROVED") return "completed";
  if (value === "FAILED" || value === "FAIL" || value === "NEEDS_ATTENTION" || value === "REJECTED") return "failed";
  if (value === "WAITING_APPROVAL" || value === "PENDING_APPROVAL") return "waiting_approval";
  if (value === "SKIPPED" || value === "NO_DATA" || value === "NOT_CONFIGURED") return "skipped";
  return "unknown";
}

export function normalizeTrigger(triggerType: string | null | undefined): WorkflowTriggerType {
  const value = String(triggerType ?? "").toUpperCase();
  if (value === "SCHEDULED") return "scheduled";
  if (value === "MANUAL") return "manual";
  if (value === "SYSTEM") return "system";
  if (value === "EVENT") return "event";
  return "unknown";
}

export function workflowTimelineFromEvents(events: Array<{
  id?: string;
  eventId?: string;
  eventType: string;
  occurredAt: Date | string;
  event?: unknown;
  metadata?: unknown;
}>): WorkflowTimelineEvent[] {
  return events.map((event) => ({
    id: event.eventId ?? event.id ?? `${event.eventType}-${iso(event.occurredAt)}`,
    timestamp: iso(event.occurredAt) ?? new Date(0).toISOString(),
    label: eventLabel(event.eventType),
    description: eventSummary(event),
    status: statusFromEventType(event.eventType),
    source: event.eventType,
    sourceType: sourceTypeFromEventType(event.eventType),
    metadata: objectOrEmpty(event.event),
  }));
}

export function dataSourcesFromSnapshot(input: {
  snapshot?: { sourceStatuses?: unknown; createdAt?: Date | string; updatedAt?: Date | string } | null;
  integrations?: Array<{ id: string; provider: string; apiName: string; status?: string; lastSyncAt?: Date | string | null; lastError?: string | null }> | null;
}): WorkflowDataSource[] {
  const sourceStatuses = objectOrEmpty(input.snapshot?.sourceStatuses);
  const createdAt = iso(input.snapshot?.createdAt);
  const sourceRows = [
    { id: "instagram-facebook", provider: "Meta", label: "Instagram / Facebook Graph API", key: "analytics", dataTypes: ["socialAccounts", "socialPosts", "postMetrics"] },
    { id: "gbp", provider: "Google", label: "Google Business Profile API", key: "gbp", dataTypes: ["businessProfile", "localVisibility"] },
    { id: "reviews", provider: "Reviews", label: "Reviews source", key: "reviews", dataTypes: ["reviews", "reviewAlerts"] },
    { id: "website-leads", provider: "Website", label: "Website / lead source", key: "leads", dataTypes: ["website", "leads"] },
    { id: "market-context", provider: "Market intelligence", label: "Competitors and trend sources", key: "competitors", dataTypes: ["competitors", "marketSignals", "trends"] },
  ];

  const derived = sourceRows.map((row): WorkflowDataSource => {
    const raw = objectOrEmpty(sourceStatuses[row.key]);
    const status = normalizeStepStatus(stringValue(raw.status) ?? stringValue(sourceStatuses[row.key]) ?? (input.snapshot ? "UNKNOWN" : "PENDING"));
    return {
      id: row.id,
      provider: row.provider,
      label: row.label,
      status,
      startedAt: createdAt,
      completedAt: status === "pending" || status === "unknown" ? null : createdAt,
      recordsFetched: numberValue(raw.count ?? raw.total ?? raw.recordsFetched),
      dataTypes: row.dataTypes,
      errorMessage: stringValue(raw.error ?? raw.lastError),
      lastSuccessfulSyncAt: status === "completed" ? createdAt : null,
    };
  });

  const integrations = (input.integrations ?? []).map((integration): WorkflowDataSource => ({
    id: `integration-${integration.id}`,
    provider: integration.provider,
    label: integration.apiName,
    status: normalizeStepStatus(integration.status),
    startedAt: iso(integration.lastSyncAt),
    completedAt: iso(integration.lastSyncAt),
    recordsFetched: null,
    dataTypes: [integration.provider, integration.apiName],
    errorMessage: integration.lastError ?? null,
    lastSuccessfulSyncAt: integration.status === "CONNECTED" ? iso(integration.lastSyncAt) : null,
  }));

  return [...derived, ...integrations];
}

export function objectOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function arrayOrEmpty(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function summarizeValue(value: unknown): string {
  if (value === null || value === undefined) return "No output recorded.";
  if (typeof value === "string") return value.slice(0, 220);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"} recorded.`;
  const object = objectOrEmpty(value);
  const keys = Object.keys(object);
  if (!keys.length) return "Output recorded.";
  return `Output fields: ${keys.slice(0, 6).join(", ")}${keys.length > 6 ? ", ..." : ""}.`;
}

function clientName(run: RawRun) {
  return run.workspace?.name ?? run.workspace?.slug ?? run.workspaceId;
}

function workflowTypeLabel(missionType: string) {
  if (missionType === "DAILY_GROWTH_MISSION") return "Daily Growth Mission";
  return missionType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function currentStepLabel(currentPhase: string, status: WorkflowRunStatus) {
  if (status === "completed") return "Completed / sent / failed";
  if (status === "failed") return "Completed / sent / failed";
  const order = missionPhaseToOrder[currentPhase] ?? 0;
  return WORKFLOW_PHASES[Math.max(0, Math.min(WORKFLOW_PHASES.length - 1, order - 1))]?.label ?? currentPhase;
}

function progressPercent(currentPhase: string, status: WorkflowRunStatus) {
  if (status === "completed") return 100;
  if (status === "failed" || status === "cancelled") return Math.max(8, Math.round(((missionPhaseToOrder[currentPhase] ?? 1) / WORKFLOW_PHASES.length) * 100));
  if (status === "waiting_approval") return 92;
  return Math.max(0, Math.min(95, Math.round(((missionPhaseToOrder[currentPhase] ?? 0) / WORKFLOW_PHASES.length) * 100)));
}

function reportStatus(reports: Array<{ status?: string | null }>) {
  if (!reports.length) return "not_generated";
  if (reports.some((report) => String(report.status ?? "").toUpperCase() === "GENERATED")) return "generated";
  return String(reports[0]?.status ?? "unknown").toLowerCase();
}

function approvalStatus(packages: Array<{ approvalStatus?: string | null }>, runStatus: string) {
  if (String(runStatus).toUpperCase() === "WAITING_APPROVAL") return "pending";
  if (!packages.length) return "not_requested";
  if (packages.some((item) => String(item.approvalStatus ?? "").toUpperCase() === "REJECTED")) return "rejected";
  if (packages.every((item) => String(item.approvalStatus ?? "").toUpperCase() === "APPROVED")) return "approved";
  return "pending";
}

function runSummary(run: RawRun, status: WorkflowRunStatus) {
  if (run.failureReason) return run.failureReason;
  if (status === "waiting_approval") return "Workflow generated the daily package and is waiting for approval.";
  if (status === "completed") return "Workflow completed.";
  if (status === "running") return `Workflow is running in ${run.currentPhase}.`;
  if (status === "queued") return "Workflow is queued.";
  return `Workflow status is ${status}.`;
}

function stepStatusFor(order: number, currentOrder: number, runStatus: WorkflowRunStatus, phaseName: string, completedByEvent: boolean): WorkflowStepStatus {
  if (completedByEvent) return "completed";
  if (runStatus === "failed" && phaseName === "COMPLETED") return "failed";
  if (runStatus === "completed") return "completed";
  if (runStatus === "waiting_approval" && phaseName === "APPROVAL") return "waiting_approval";
  if (order < currentOrder) return "completed";
  if (order === currentOrder) return runStatus === "running" ? "running" : runStatus === "queued" ? "pending" : "unknown";
  return "pending";
}

function eventPhase(event: { event?: unknown; payload?: unknown }) {
  const direct = objectOrEmpty(event);
  const payload = objectOrEmpty(objectOrEmpty(direct.event).payload ?? direct.payload);
  return stringValue(payload.phase);
}

function eventSummary(event: unknown) {
  const object = objectOrEmpty(event);
  const payload = objectOrEmpty(objectOrEmpty(object.event).payload ?? object.payload);
  return stringValue(payload.summary) ?? stringValue(object.eventType) ?? "Workflow event recorded.";
}

function eventLabel(eventType: string) {
  return eventType
    .replace(/^operations\.mission\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusFromEventType(eventType: string): WorkflowStepStatus {
  if (/failed|error|dead/i.test(eventType)) return "failed";
  if (/approval/i.test(eventType)) return "waiting_approval";
  return "completed";
}

function sourceTypeFromEventType(eventType: string): WorkflowSourceType {
  if (/approval/i.test(eventType)) return "approval";
  if (/report/i.test(eventType)) return "report";
  if (/ai|agent/i.test(eventType)) return "ai";
  if (/error|failed|dead/i.test(eventType)) return "error";
  if (/action|task|publishing/i.test(eventType)) return "action";
  if (/mission|analytics|performance|strategy|content|learning|opportunity/i.test(eventType)) return "mission";
  return "event";
}

function durationMs(start: Date | string | null | undefined, end: Date | string | null | undefined) {
  const startTime = timeValue(start);
  const endTime = timeValue(end);
  if (startTime === null || endTime === null) return null;
  return Math.max(0, endTime - startTime);
}

function durationLabel(start: Date | string | null | undefined, end: Date | string | null | undefined) {
  const ms = durationMs(start, end);
  if (ms === null) return null;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function timeValue(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

