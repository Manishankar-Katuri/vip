import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DAILY_GROWTH_MISSION,
  DailyGrowthMissionEventBridge,
  DailyGrowthMissionRunner,
  DailyGrowthMissionScheduler,
  InMemoryDailyGrowthMissionRepository,
  type DailyGrowthMissionEventType,
} from "../index";

describe("DailyGrowthMission", () => {
  it("manual trigger is idempotent and publishes the scheduler event", async () => {
    const repository = new InMemoryDailyGrowthMissionRepository();
    const events: string[] = [];
    const bus = { publish: async (event: { eventType: string }) => events.push(event.eventType) };
    const scheduler = new DailyGrowthMissionScheduler(
      repository,
      new DailyGrowthMissionEventBridge(bus as never, idSequence("event"), () => "2026-06-05T00:00:00.000Z"),
      idSequence("mission"),
      () => new Date("2026-06-05T04:59:00.000Z")
    );

    const first = await scheduler.triggerNow("workspace-1");
    const second = await scheduler.triggerNow("workspace-1");

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(repository.executions.size, 1);
    assert.equal(first.execution.missionType, DAILY_GROWTH_MISSION);
    assert.equal(events[0], "operations.mission.daily_growth.started");
  });

  it("computes the next 5:00 AM daily run", () => {
    const scheduler = new DailyGrowthMissionScheduler(new InMemoryDailyGrowthMissionRepository(), undefined, undefined, () => new Date("2026-06-05T06:00:00.000Z"));
    assert.equal(scheduler.nextRunAt({ hour: 5, minute: 0, from: new Date("2026-06-05T04:59:00.000Z") }).toISOString(), "2026-06-05T05:00:00.000Z");
    assert.equal(scheduler.nextRunAt({ hour: 5, minute: 0, from: new Date("2026-06-05T05:00:00.000Z") }).toISOString(), "2026-06-06T05:00:00.000Z");
  });

  it("runs all phases over persisted fixture records and records durable outputs", async () => {
    const repository = new InMemoryDailyGrowthMissionRepository();
    const events: DailyGrowthMissionEventType[] = [];
    const bus = { publish: async (event: { eventType: DailyGrowthMissionEventType }) => events.push(event.eventType) };
    const eventBridge = new DailyGrowthMissionEventBridge(bus as never, idSequence("event"), () => "2026-06-05T05:01:00.000Z");
    const scheduler = new DailyGrowthMissionScheduler(repository, eventBridge, idSequence("mission"), () => new Date("2026-06-05T05:00:00.000Z"));
    const { execution } = await scheduler.triggerNow("workspace-1", "MANUAL");
    const runner = new DailyGrowthMissionRunner(repository, eventBridge, idSequence("record"), () => "2026-06-05T05:02:00.000Z");

    const completed = await runner.run(execution, {
      socialAccounts: [{ id: "acct-1", platform: "INSTAGRAM" }],
      socialPosts: [{ id: "post-1", caption: "Patient education" }],
      postMetrics: [{ socialPostId: "post-1", reach: 1600, likes: 80, comments: 14, shares: 9, saves: 31 }],
      competitorAccounts: [{ id: "competitor-1", handle: "clinic-nearby" }],
      marketContexts: [{ id: "context-1", regionKey: "local" }],
      marketSignals: [{ id: "signal-1", label: "consultation tips", score: 81 }],
      contentCalendar: [{ id: "calendar-1", title: "Education reel" }],
      recommendationOutcomes: [{ id: "outcome-1", status: "SUCCESSFUL", topic: "consult readiness" }],
      existingMetrics: [{ reach: 1300 }],
    });

    assert.equal(completed.status, "COMPLETED");
    assert.equal(completed.currentPhase, "COMPLETED");
    assert.deepEqual(events, [
      "operations.mission.daily_growth.started",
      "analytics.acquisition.completed",
      "performance.analysis.completed",
      "strategy.learning.generated",
      "opportunity.discovery.completed",
      "strategy.plan.generated",
      "content.production.generated",
      "report.generated",
      "approval.completed",
      "production.tasks.created",
      "publishing.prepared",
      "content.outcome.generated",
      "learning.memory.updated",
    ]);
    assert.equal(repository.snapshots.length, 1);
    assert.equal((repository.snapshots[0].sourceStatuses as Record<string, string>).analytics, "COLLECTED");
    assert.equal(repository.packages.length, 1);
    assert.ok(repository.packages[0].fullScript);
    assert.ok(repository.packages[0].sceneBreakdown.length);
    assert.ok(repository.packages[0].doctorTalkingPoints.length);
    assert.equal((repository.packages[0].actionPlanInput as { requiresApproval: boolean }).requiresApproval, true);
    assert.equal(repository.notifications.length, 3);
    assert.equal(repository.tasks.length, 6);
    assert.equal(repository.reports.length, 1);
    assert.match(String(repository.reports[0].pdfFileName), /daily-growth-mission/);
    assert.equal(repository.outcomes.length, 1);
    assert.equal((repository.outcomes[0].actualKpi as Record<string, unknown>).source, "persisted_metrics");
    assert.equal(repository.learning.length, 3);
  });

  it("stores missing external integrations as NOT_CONFIGURED instead of mocked data", async () => {
    const repository = new InMemoryDailyGrowthMissionRepository();
    const scheduler = new DailyGrowthMissionScheduler(repository, new DailyGrowthMissionEventBridge(undefined, idSequence("event")), idSequence("mission"), () => new Date("2026-06-05T05:00:00.000Z"));
    const { execution } = await scheduler.triggerNow("workspace-1");
    const runner = new DailyGrowthMissionRunner(repository, new DailyGrowthMissionEventBridge(undefined, idSequence("event")), idSequence("record"), () => "2026-06-05T05:02:00.000Z");

    await runner.run(execution, {});

    const statuses = repository.snapshots[0].sourceStatuses as Record<string, string>;
    assert.equal(statuses.analytics, "NOT_CONFIGURED");
    assert.equal(statuses.reviews, "NOT_CONFIGURED");
    assert.equal(statuses.trends, "NOT_CONFIGURED");
    assert.equal(repository.packages[0].publishingPayload.publishExternally, false);
  });
});

function idSequence(prefix: string) {
  let index = 0;
  return () => `${prefix}-${++index}`;
}
