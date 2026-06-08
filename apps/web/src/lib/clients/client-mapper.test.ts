import assert from "node:assert/strict";
import test from "node:test";

import { buildIntegrationHealth, buildOwnerClient, mergeClientSettings, normalizeClientSettings } from "./mapper.js";
import type { ReportListItem, ReportRecipient } from "../reports/types.js";
import type { WorkflowListItem } from "../workflows/types.js";

const workspaceA = {
  id: "workspace-a",
  name: "Asha Dental",
  slug: "asha-dental",
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T01:00:00.000Z",
};
const workspaceB = {
  id: "workspace-b",
  name: "Bharat Clinic",
  slug: "bharat-clinic",
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T01:00:00.000Z",
};

test("builds owner client summaries without mixing workspace-scoped data", () => {
  const workflows: WorkflowListItem[] = [
    workflow("run-a", "workspace-a", "completed"),
    workflow("run-b", "workspace-b", "failed"),
  ];
  const reports: ReportListItem[] = [
    report("report-a-1", "workspace-a", "exported", "approved", "not_sent"),
    report("report-a-2", "workspace-a", "draft", "pending", "not_sent"),
    report("report-b-1", "workspace-b", "draft", "pending", "failed"),
  ];
  const recipients: ReportRecipient[] = [
    recipient("recipient-a", "workspace-a", true),
    recipient("recipient-b", "workspace-b", true),
    recipient("recipient-disabled", "workspace-a", false),
  ];

  const clientA = buildOwnerClient({ workspace: workspaceA, workflows, reports, recipients, integrations: [] });
  const clientB = buildOwnerClient({ workspace: workspaceB, workflows, reports, recipients, integrations: [] });

  assert.equal(clientA.lastWorkflowRunId, "run-a");
  assert.equal(clientA.reportsReadyCount, 1);
  assert.equal(clientA.approvalsPendingCount, 1);
  assert.equal(clientA.failedDeliveryCount, 0);
  assert.equal(clientA.recipientsCount, 1);
  assert.equal(clientB.lastWorkflowRunId, "run-b");
  assert.equal(clientB.reportsReadyCount, 0);
  assert.equal(clientB.approvalsPendingCount, 1);
  assert.equal(clientB.failedDeliveryCount, 1);
  assert.equal(clientB.recipientsCount, 1);
});

test("normalizes settings while preserving manual approval and disabling auto-send", () => {
  const existing = normalizeClientSettings({
    status: "active",
    timezone: "Asia/Kolkata",
    workflowSchedule: { enabled: true, timeOfDay: "07:30", timezone: "Asia/Kolkata" },
    approvalPolicy: {
      manualApprovalRequired: true,
      autoSendEnabled: false,
      allowedReportTypes: ["DAILY_ANALYTICS_REPORT"],
    },
    reportPreferences: {
      defaultFormats: "PDF",
      defaultReportTypes: ["DAILY_ANALYTICS_REPORT"],
    },
  });

  const merged = mergeClientSettings(existing, {
    timezone: "Invalid/Zone",
    approvalPolicy: {
      manualApprovalRequired: false,
      autoSendEnabled: true as false,
      allowedReportTypes: ["DAILY_STRATEGY_REPORT", "NOT_A_REPORT" as never],
    },
    reportPreferences: {
      defaultFormats: "BOTH",
      defaultReportTypes: ["THREE_DAY_CONTENT_PLAN", "BAD_TYPE" as never],
    },
  });

  assert.equal(merged.timezone, "Asia/Kolkata");
  assert.equal(merged.approvalPolicy.manualApprovalRequired, true);
  assert.equal(merged.approvalPolicy.autoSendEnabled, false);
  assert.deepEqual(merged.approvalPolicy.allowedReportTypes, ["DAILY_STRATEGY_REPORT"]);
  assert.deepEqual(merged.reportPreferences.defaultReportTypes, ["THREE_DAY_CONTENT_PLAN"]);
});

test("maps integration health without exposing credential fields", () => {
  const health = buildIntegrationHealth([
    {
      provider: "google_business_profile",
      apiName: "gbp",
      encryptedCredentials: "secret-ciphertext",
      status: "ACTIVE",
      lastSyncAt: "2026-06-08T06:00:00.000Z",
    },
    {
      provider: "instagram",
      apiName: "graph",
      encryptedCredentials: "secret-ciphertext",
      status: "ACTIVE",
      lastError: "Token expired",
      updatedAt: "2026-06-08T06:05:00.000Z",
    },
  ], [recipient("recipient-a", "workspace-a", true)]);

  const instagram = health.find((item) => item.provider === "instagram");
  const google = health.find((item) => item.provider === "google_business_profile");

  assert.equal(instagram?.status, "needs_reconnect");
  assert.equal(google?.status, "connected");
  assert.equal(JSON.stringify(health).includes("secret-ciphertext"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(instagram ?? {}, "encryptedCredentials"), false);
});

function workflow(id: string, workspaceId: string, status: WorkflowListItem["status"]): WorkflowListItem {
  return {
    id,
    clientId: workspaceId,
    workspaceId,
    clientName: workspaceId,
    workflowType: "Daily Growth Mission",
    status,
    startedAt: "2026-06-08T06:00:00.000Z",
    completedAt: null,
    duration: null,
    durationMs: null,
    currentStep: "REPORT_GENERATION",
    progressPercent: 80,
    triggerType: "manual",
    reportStatus: "draft",
    approvalStatus: "pending",
    errorCount: status === "failed" ? 1 : 0,
    warningCount: 0,
    lastUpdatedAt: "2026-06-08T06:10:00.000Z",
  };
}

function report(id: string, workspaceId: string, status: ReportListItem["status"], approvalStatus: string, sentStatus: string): ReportListItem {
  return {
    id,
    clientId: workspaceId,
    workspaceId,
    clientName: workspaceId,
    workflowRunId: null,
    reportType: "DAILY_ANALYTICS_REPORT",
    title: id,
    status,
    createdAt: "2026-06-08T06:00:00.000Z",
    updatedAt: "2026-06-08T06:00:00.000Z",
    generatedAt: "2026-06-08T06:00:00.000Z",
    editedAt: null,
    approvalStatus,
    exportStatus: status === "exported" ? "exported" : "not_exported",
    sentStatus,
    pdfUrl: null,
    docxUrl: null,
    summary: "",
  };
}

function recipient(id: string, workspaceId: string, receivesReports: boolean): ReportRecipient {
  return {
    id,
    workspaceId,
    name: id,
    email: `${id}@example.com`,
    role: null,
    isDefault: true,
    receivesReports,
    createdAt: "2026-06-08T06:00:00.000Z",
    updatedAt: "2026-06-08T06:00:00.000Z",
  };
}
