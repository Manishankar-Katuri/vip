export type WorkflowRunStatus = "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled" | "unknown";
export type WorkflowStepStatus = "pending" | "running" | "completed" | "failed" | "waiting_approval" | "skipped" | "unknown";
export type WorkflowTriggerType = "scheduled" | "manual" | "system" | "event" | "unknown";
export type WorkflowSourceType = "mission" | "event" | "action" | "ai" | "report" | "approval" | "error";

export type WorkflowListItem = {
  id: string;
  clientId: string;
  workspaceId: string;
  clientName: string;
  workflowType: string;
  status: WorkflowRunStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: string | null;
  durationMs: number | null;
  currentStep: string;
  progressPercent: number;
  triggerType: WorkflowTriggerType;
  reportStatus: string;
  approvalStatus: string;
  errorCount: number;
  warningCount: number;
  lastUpdatedAt: string;
};

export type WorkflowRun = {
  id: string;
  clientId: string;
  workspaceId: string;
  clientName: string;
  workflowType: string;
  status: WorkflowRunStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: string | null;
  durationMs: number | null;
  triggerType: WorkflowTriggerType;
  currentPhase: string;
  progressPercent: number;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowTimelineEvent = {
  id: string;
  timestamp: string;
  label: string;
  description: string;
  status: WorkflowStepStatus;
  source: string;
  sourceType: WorkflowSourceType;
  metadata: Record<string, unknown>;
};

export type WorkflowStep = {
  id: string;
  name: string;
  label: string;
  description: string;
  status: WorkflowStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: string | null;
  durationMs: number | null;
  order: number;
  source: string;
  recordsProcessed: number | null;
  outputSummary: string;
  errorMessage: string | null;
};

export type WorkflowAgentActivity = {
  id: string;
  agentName: string;
  action: string;
  status: WorkflowStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  toolCalls: unknown[];
  inputSummary: string;
  outputSummary: string;
  tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number } | null;
  errorMessage: string | null;
};

export type WorkflowDataSource = {
  id: string;
  provider: string;
  label: string;
  status: WorkflowStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  recordsFetched: number | null;
  dataTypes: string[];
  errorMessage: string | null;
  lastSuccessfulSyncAt: string | null;
};

export type WorkflowReport = {
  id: string;
  reportType: string;
  title: string;
  status: string;
  generatedAt: string | null;
  exportStatus: string;
  pdfUrl: string | null;
  docxUrl: string | null;
  approvalStatus: string;
  sentStatus: string;
};

export type WorkflowApproval = {
  id: string;
  targetType: string;
  targetId: string;
  status: string;
  requestedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
};

export type WorkflowError = {
  id: string;
  source: string;
  sourceType: WorkflowSourceType;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  occurredAt: string;
  resolvedAt: string | null;
  retryable: boolean;
  recommendedAction: string;
};

export type WorkflowRetrySummary = {
  retryable: boolean;
  retryMode: "manual_rerun" | "not_available" | "not_required";
  failedStepId: string | null;
  failedStepName: string | null;
  reason: string;
  recommendedAction: string;
};

export type WorkflowDetailResponse = {
  run: WorkflowRun;
  timeline: WorkflowTimelineEvent[];
  steps: WorkflowStep[];
  agentActivity: WorkflowAgentActivity[];
  apiCalls: WorkflowDataSource[];
  dataSources: WorkflowDataSource[];
  reports: WorkflowReport[];
  approvals: WorkflowApproval[];
  errors: WorkflowError[];
  retrySummary: WorkflowRetrySummary;
};

export type WorkflowListResponse = {
  workflows: WorkflowListItem[];
  filters: {
    clientId: string | null;
    status: string | null;
    date: string | null;
    limit: number;
  };
};

