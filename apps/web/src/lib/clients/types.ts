import type { ReportListItem, ReportRecipient, ReportType } from "@/lib/reports/types";
import type { WorkflowListItem } from "@/lib/workflows/types";

export type OwnerClientStatus = "active" | "inactive" | "setup_needed";
export type IntegrationHealthStatus = "connected" | "disconnected" | "needs_reconnect" | "unavailable" | "unknown";

export type WorkflowScheduleSettings = {
  enabled: boolean;
  timeOfDay: string;
  timezone: string;
  frequency: "daily";
  manualStartAllowed: boolean;
};

export type ApprovalPolicySettings = {
  manualApprovalRequired: boolean;
  autoSendEnabled: false;
  allowedReportTypes: ReportType[];
  defaultApprovalNotes?: string | null;
};

export type ReportPreferenceSettings = {
  defaultFormats: "PDF" | "DOCX" | "BOTH";
  defaultReportTypes: ReportType[];
  includeMissingDataWarnings: boolean;
  clientFriendlyLanguage: boolean;
};

export type ClientOperationalSettings = {
  status: OwnerClientStatus;
  businessType: string | null;
  location: string | null;
  timezone: string;
  workflowSchedule: WorkflowScheduleSettings;
  approvalPolicy: ApprovalPolicySettings;
  reportPreferences: ReportPreferenceSettings;
};

export type IntegrationHealthItem = {
  provider: string;
  label: string;
  status: IntegrationHealthStatus;
  lastSuccessfulSyncAt: string | null;
  lastAttemptAt: string | null;
  issue: string | null;
  actionRequired: string;
};

export type OwnerClient = {
  id: string;
  workspaceId: string;
  hospitalId: string | null;
  name: string;
  businessType: string | null;
  status: OwnerClientStatus;
  location: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastWorkflowRunId: string | null;
  lastWorkflowStatus: string | null;
  lastWorkflowAt: string | null;
  reportsReadyCount: number;
  approvalsPendingCount: number;
  failedDeliveryCount: number;
  recipientsCount: number;
  integrationsConnectedCount: number;
  integrationsNeedingAttentionCount: number;
  settings: ClientOperationalSettings;
  integrationHealth: IntegrationHealthItem[];
};

export type OwnerClientListResponse = {
  clients: OwnerClient[];
  filters: {
    status: string | null;
    search: string | null;
    limit: number;
  };
};

export type OwnerClientDetailResponse = {
  client: OwnerClient;
  recipients: ReportRecipient[];
  recentWorkflows: WorkflowListItem[];
  recentReports: ReportListItem[];
  integrationHealth: IntegrationHealthItem[];
  setupWarnings: string[];
};

export type ClientSettingsPatch = Partial<Pick<ClientOperationalSettings, "status" | "businessType" | "location" | "timezone">> & {
  workflowSchedule?: Partial<WorkflowScheduleSettings>;
  approvalPolicy?: Partial<ApprovalPolicySettings>;
  reportPreferences?: Partial<ReportPreferenceSettings>;
};

export const ALL_REPORT_TYPES: ReportType[] = [
  "DAILY_ANALYTICS_REPORT",
  "DAILY_STRATEGY_REPORT",
  "THREE_DAY_CONTENT_PLAN",
  "WEEKLY_GROWTH_REPORT",
  "MONTHLY_CLIENT_REPORT",
];

export const DEFAULT_WORKFLOW_SCHEDULE: WorkflowScheduleSettings = {
  enabled: false,
  timeOfDay: "06:00",
  timezone: "Asia/Kolkata",
  frequency: "daily",
  manualStartAllowed: true,
};

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicySettings = {
  manualApprovalRequired: true,
  autoSendEnabled: false,
  allowedReportTypes: ALL_REPORT_TYPES,
  defaultApprovalNotes: null,
};

export const DEFAULT_REPORT_PREFERENCES: ReportPreferenceSettings = {
  defaultFormats: "BOTH",
  defaultReportTypes: ["DAILY_ANALYTICS_REPORT", "DAILY_STRATEGY_REPORT", "THREE_DAY_CONTENT_PLAN"],
  includeMissingDataWarnings: true,
  clientFriendlyLanguage: true,
};
