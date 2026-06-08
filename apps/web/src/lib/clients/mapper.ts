import type { ReportListItem, ReportRecipient, ReportType } from "@/lib/reports/types";
import type { WorkflowListItem } from "@/lib/workflows/types";
import {
  ALL_REPORT_TYPES,
  DEFAULT_REPORT_PREFERENCES,
  DEFAULT_WORKFLOW_SCHEDULE,
  type ApprovalPolicySettings,
  type ClientOperationalSettings,
  type ClientSettingsPatch,
  type IntegrationHealthItem,
  type OwnerClient,
  type OwnerClientStatus,
  type ReportPreferenceSettings,
  type WorkflowScheduleSettings,
} from "./types";

const PROVIDERS = [
  { provider: "instagram", label: "Instagram" },
  { provider: "facebook", label: "Facebook" },
  { provider: "google_business_profile", label: "Google Business Profile" },
  { provider: "reviews", label: "Reviews" },
  { provider: "website_leads", label: "Website / Leads" },
];

export function buildOwnerClient(input: {
  workspace: any;
  hospital?: any | null;
  settings?: any | null;
  workflows: WorkflowListItem[];
  reports: ReportListItem[];
  recipients: ReportRecipient[];
  integrations: any[];
}): OwnerClient {
  const settings = normalizeClientSettings(input.settings, input.hospital);
  const workflows = input.workflows.filter((workflow) => workflow.workspaceId === input.workspace.id);
  const reports = input.reports.filter((report) => report.workspaceId === input.workspace.id);
  const recipients = input.recipients.filter((recipient) => recipient.workspaceId === input.workspace.id && recipient.receivesReports);
  const integrationHealth = buildIntegrationHealth(input.integrations, recipients);
  const latestWorkflow = workflows[0] ?? null;

  return {
    id: input.workspace.id,
    workspaceId: input.workspace.id,
    hospitalId: input.hospital?.id ?? null,
    name: input.workspace.name ?? input.hospital?.hospitalName ?? "Unnamed client",
    businessType: settings.businessType,
    status: settings.status,
    location: settings.location,
    timezone: settings.timezone,
    createdAt: iso(input.workspace.createdAt),
    updatedAt: iso(input.settings?.updatedAt ?? input.workspace.updatedAt),
    lastWorkflowRunId: latestWorkflow?.id ?? null,
    lastWorkflowStatus: latestWorkflow?.status ?? null,
    lastWorkflowAt: latestWorkflow?.lastUpdatedAt ?? null,
    reportsReadyCount: reports.filter((report) => report.exportStatus === "exported" && report.sentStatus !== "sent").length,
    approvalsPendingCount: reports.filter((report) => ["pending", "changes_requested", "not_requested"].includes(report.approvalStatus)).length,
    failedDeliveryCount: reports.filter((report) => report.sentStatus === "failed").length,
    recipientsCount: recipients.length,
    integrationsConnectedCount: integrationHealth.filter((item) => item.status === "connected").length,
    integrationsNeedingAttentionCount: integrationHealth.filter((item) => ["disconnected", "needs_reconnect", "unavailable"].includes(item.status)).length,
    settings,
    integrationHealth,
  };
}

export function normalizeClientSettings(settings?: any | null, hospital?: any | null): ClientOperationalSettings {
  const workflowSchedule = normalizeWorkflowSchedule(settings?.workflowSchedule, settings?.timezone ?? hospital?.timezone);
  const approvalPolicy = normalizeApprovalPolicy(settings?.approvalPolicy);
  const reportPreferences = normalizeReportPreferences(settings?.reportPreferences);
  const timezone = validTimezone(settings?.timezone) ? settings.timezone : workflowSchedule.timezone;

  return {
    status: normalizeStatus(settings?.status),
    businessType: stringOrNull(settings?.businessType ?? hospital?.industryType ?? hospital?.specialty),
    location: stringOrNull(settings?.location ?? hospital?.city),
    timezone,
    workflowSchedule: { ...workflowSchedule, timezone },
    approvalPolicy,
    reportPreferences,
  };
}

export function mergeClientSettings(existing: ClientOperationalSettings, patch: ClientSettingsPatch): ClientOperationalSettings {
  const timezone = patch.timezone && validTimezone(patch.timezone) ? patch.timezone : existing.timezone;
  return {
    status: patch.status ? normalizeStatus(patch.status) : existing.status,
    businessType: patch.businessType === undefined ? existing.businessType : stringOrNull(patch.businessType),
    location: patch.location === undefined ? existing.location : stringOrNull(patch.location),
    timezone,
    workflowSchedule: normalizeWorkflowSchedule({ ...existing.workflowSchedule, ...(patch.workflowSchedule ?? {}), timezone }),
    approvalPolicy: normalizeApprovalPolicy({ ...existing.approvalPolicy, ...(patch.approvalPolicy ?? {}) }),
    reportPreferences: normalizeReportPreferences({ ...existing.reportPreferences, ...(patch.reportPreferences ?? {}) }),
  };
}

export function buildIntegrationHealth(integrations: any[], recipients: ReportRecipient[] = []): IntegrationHealthItem[] {
  const health: IntegrationHealthItem[] = PROVIDERS.map(({ provider, label }) => {
    const config = integrations.find((item) => normalizeProvider(item.provider, item.apiName) === provider);
    if (!config) {
      return {
        provider,
        label,
        status: "disconnected" as const,
        lastSuccessfulSyncAt: null,
        lastAttemptAt: null,
        issue: "No integration configuration found.",
        actionRequired: "Connect this provider in legacy integrations.",
      };
    }
    const status = String(config.status ?? "").toUpperCase();
    const hasError = Boolean(config.lastError);
    const connected = ["ACTIVE", "CONNECTED", "VALID"].includes(status);
    return {
      provider,
      label,
      status: hasError ? "needs_reconnect" as const : connected ? "connected" as const : status ? "needs_reconnect" as const : "unknown" as const,
      lastSuccessfulSyncAt: iso(config.lastSyncAt ?? config.lastValidatedAt),
      lastAttemptAt: iso(config.lastTestedAt ?? config.updatedAt),
      issue: config.lastError ?? (!connected ? `Integration status is ${status || "unknown"}.` : null),
      actionRequired: hasError || !connected ? "Review and reconnect this provider." : "No action required.",
    };
  });

  health.push({
    provider: "email_recipients",
    label: "Email Recipients",
    status: recipients.length ? "connected" : "needs_reconnect",
    lastSuccessfulSyncAt: null,
    lastAttemptAt: null,
    issue: recipients.length ? null : "No report recipients are enabled.",
    actionRequired: recipients.length ? "No action required." : "Add at least one report recipient.",
  });

  return health;
}

export function setupWarningsForClient(client: OwnerClient) {
  const warnings: string[] = [];
  if (!client.recipientsCount) warnings.push("No enabled report recipients are configured.");
  if (!client.settings.workflowSchedule.enabled) warnings.push("Workflow schedule is disabled. Manual start remains available.");
  if (!client.settings.approvalPolicy.manualApprovalRequired) warnings.push("Manual approval should remain required for production sending.");
  if (client.settings.approvalPolicy.autoSendEnabled) warnings.push("Auto-send is not available and should stay disabled.");
  if (client.integrationsNeedingAttentionCount) warnings.push(`${client.integrationsNeedingAttentionCount} integration areas need attention.`);
  return warnings;
}

function normalizeWorkflowSchedule(value: unknown, fallbackTimezone?: string): WorkflowScheduleSettings {
  const source = objectOrEmpty(value);
  const timezone = validTimezone(String(source.timezone ?? fallbackTimezone ?? "")) ? String(source.timezone ?? fallbackTimezone) : DEFAULT_WORKFLOW_SCHEDULE.timezone;
  const timeOfDay = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(source.timeOfDay ?? "")) ? String(source.timeOfDay) : DEFAULT_WORKFLOW_SCHEDULE.timeOfDay;
  return {
    enabled: Boolean(source.enabled),
    timeOfDay,
    timezone,
    frequency: "daily",
    manualStartAllowed: source.manualStartAllowed !== false,
  };
}

function normalizeApprovalPolicy(value: unknown): ApprovalPolicySettings {
  const source = objectOrEmpty(value);
  return {
    manualApprovalRequired: true,
    autoSendEnabled: false,
    allowedReportTypes: reportTypeList(source.allowedReportTypes, ALL_REPORT_TYPES),
    defaultApprovalNotes: stringOrNull(source.defaultApprovalNotes),
  };
}

function normalizeReportPreferences(value: unknown): ReportPreferenceSettings {
  const source = objectOrEmpty(value);
  const defaultFormats = ["PDF", "DOCX", "BOTH"].includes(String(source.defaultFormats)) ? source.defaultFormats as "PDF" | "DOCX" | "BOTH" : DEFAULT_REPORT_PREFERENCES.defaultFormats;
  return {
    defaultFormats,
    defaultReportTypes: reportTypeList(source.defaultReportTypes, DEFAULT_REPORT_PREFERENCES.defaultReportTypes),
    includeMissingDataWarnings: source.includeMissingDataWarnings !== false,
    clientFriendlyLanguage: source.clientFriendlyLanguage !== false,
  };
}

function reportTypeList(value: unknown, fallback: ReportType[]) {
  if (!Array.isArray(value)) return fallback;
  const valid = value.filter((item): item is ReportType => ALL_REPORT_TYPES.includes(item as ReportType));
  return valid.length ? valid : fallback;
}

function normalizeStatus(value: unknown): OwnerClientStatus {
  return value === "active" || value === "inactive" || value === "setup_needed" ? value : "setup_needed";
}

function normalizeProvider(provider: unknown, apiName: unknown) {
  const raw = `${String(provider ?? "")} ${String(apiName ?? "")}`.toLowerCase();
  if (raw.includes("instagram")) return "instagram";
  if (raw.includes("facebook")) return "facebook";
  if (raw.includes("google") || raw.includes("gbp") || raw.includes("business profile")) return "google_business_profile";
  if (raw.includes("review")) return "reviews";
  if (raw.includes("lead") || raw.includes("website")) return "website_leads";
  return String(provider ?? "unknown").toLowerCase();
}

function objectOrEmpty(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function stringOrNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 200) : null;
}

function validTimezone(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date(0).toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}
