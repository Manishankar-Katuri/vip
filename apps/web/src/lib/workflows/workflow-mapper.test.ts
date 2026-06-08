import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRetrySummary,
  buildWorkflowSteps,
  dataSourcesFromSnapshot,
  normalizeRunStatus,
  toWorkflowListItem,
} from "./mapper.js";

const baseRun = {
  id: "run-1",
  workspaceId: "workspace-1",
  missionType: "DAILY_GROWTH_MISSION",
  status: "WAITING_APPROVAL",
  currentPhase: "APPROVAL",
  triggerType: "MANUAL",
  startedAt: "2026-06-08T06:00:00.000Z",
  completedAt: null,
  failedAt: null,
  failureReason: null,
  createdAt: "2026-06-08T06:00:00.000Z",
  updatedAt: "2026-06-08T06:10:00.000Z",
  workspace: { id: "workspace-1", name: "Harika ENT", slug: "harika-ent" },
  dailyGrowthReports: [{ status: "GENERATED" }],
  contentProductionPackages: [{ approvalStatus: "PENDING" }],
};

test("maps mission execution to stable workflow list item", () => {
  const item = toWorkflowListItem({ run: baseRun });

  assert.equal(item.id, "run-1");
  assert.equal(item.clientName, "Harika ENT");
  assert.equal(item.workflowType, "Daily Growth Mission");
  assert.equal(item.status, "waiting_approval");
  assert.equal(item.triggerType, "manual");
  assert.equal(item.reportStatus, "generated");
  assert.equal(item.approvalStatus, "pending");
  assert.equal(item.progressPercent, 92);
});

test("infers workflow steps without faking future success", () => {
  const steps = buildWorkflowSteps({
    run: baseRun,
    events: [
      {
        eventType: "operations.mission.daily_growth.started",
        occurredAt: "2026-06-08T06:00:01.000Z",
        event: { payload: { phase: "STARTED", summary: "Started." } },
      },
      {
        eventType: "report.generated",
        occurredAt: "2026-06-08T06:08:00.000Z",
        event: { payload: { phase: "REPORT_GENERATION", summary: "Report generated." } },
      },
    ],
  });

  assert.equal(steps.find((step) => step.name === "STARTED")?.status, "completed");
  assert.equal(steps.find((step) => step.name === "REPORT_GENERATION")?.status, "completed");
  assert.equal(steps.find((step) => step.name === "APPROVAL")?.status, "waiting_approval");
  assert.equal(steps.find((step) => step.name === "COMPLETED")?.status, "pending");
});

test("derives data source statuses from snapshot source statuses", () => {
  const sources = dataSourcesFromSnapshot({
    snapshot: {
      createdAt: "2026-06-08T06:02:00.000Z",
      updatedAt: "2026-06-08T06:02:00.000Z",
      sourceStatuses: {
        analytics: { status: "COLLECTED", count: 24 },
        reviews: { status: "FAILED", error: "Token expired" },
      },
    },
  });

  assert.equal(sources.find((source) => source.id === "instagram-facebook")?.status, "completed");
  assert.equal(sources.find((source) => source.id === "instagram-facebook")?.recordsFetched, 24);
  assert.equal(sources.find((source) => source.id === "reviews")?.status, "failed");
  assert.equal(sources.find((source) => source.id === "reviews")?.errorMessage, "Token expired");
});

test("allows retry only for failed or retryable workflows", () => {
  const failedRun = {
    ...baseRun,
    status: "FAILED",
    currentPhase: "ACQUISITION",
    failureReason: "Reviews source failed.",
    failedAt: "2026-06-08T06:03:00.000Z",
  };
  const steps = buildWorkflowSteps({ run: failedRun });
  const retry = buildRetrySummary({ run: failedRun, steps, errors: [] });

  assert.equal(normalizeRunStatus(failedRun.status), "failed");
  assert.equal(retry.retryable, true);
  assert.equal(retry.retryMode, "manual_rerun");

  const waitingRetry = buildRetrySummary({ run: baseRun, steps: buildWorkflowSteps({ run: baseRun }), errors: [] });
  assert.equal(waitingRetry.retryable, false);
});

