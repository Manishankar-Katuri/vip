import assert from "node:assert/strict";
import test from "node:test";

import { WeeklyAnalysisReportGenerator, type WeeklyAnalysisReportInput } from "./weekly-analysis-report";

const generator = new WeeklyAnalysisReportGenerator();

test("uses rolling 7-day and previous 7-day report windows", () => {
  const report = generator.generate(baseInput({ asOf: new Date("2026-06-02T10:30:00.000Z") }));

  assert.equal(report.period.startsAt, "2026-05-27T00:00:00.000Z");
  assert.equal(report.period.endsAt, "2026-06-02T10:30:00.000Z");
  assert.equal(report.comparisonPeriod.startsAt, "2026-05-20T00:00:00.000Z");
  assert.equal(report.comparisonPeriod.endsAt, "2026-05-26T23:59:59.999Z");
});

test("aggregates KPI totals and reports delta direction", () => {
  const report = generator.generate(baseInput());

  assert.equal(report.kpiSnapshot.reach.value, 900);
  assert.equal(report.kpiSnapshot.reach.previousValue, 400);
  assert.equal(report.kpiSnapshot.reach.changeDirection, "UP");
  assert.equal(report.kpiSnapshot.engagement.value, 109);
  assert.equal(report.socialMedia.instagram.posts, 1);
  assert.equal(report.socialMedia.facebook.posts, 1);
  assert.equal(report.socialMedia.contentPerformance[0].label, "Doctor education");
});

test("keeps missing conversion, local, and WhatsApp metrics data-limited", () => {
  const report = generator.generate(baseInput());

  assert.equal(report.kpiSnapshot.leads.dataState, "DATA_LIMITED");
  assert.equal(report.kpiSnapshot.appointments.dataState, "DATA_LIMITED");
  assert.equal(report.kpiSnapshot.websiteTraffic.dataState, "DATA_LIMITED");
  assert.equal(report.gbp.profileViews.dataState, "DATA_LIMITED");
  assert.equal(report.whatsapp.inquiries.dataState, "DATA_LIMITED");
  assert.ok(report.dataQualityNotes.some((note) => note.startsWith("Leads:")));
});

test("calculates growth score coverage and status thresholds", () => {
  const limited = generator.generate(baseInput());
  const connected = generator.generate(baseInput({
    leads: { current: 20, previous: 10 },
    appointments: { current: 12, previous: 8 },
    websiteTraffic: { current: 800, previous: 600 },
    gbp: {
      profileViews: { current: 300, previous: 200 },
      calls: { current: 18, previous: 12 },
      directionRequests: { current: 26, previous: 20 },
      websiteClicks: { current: 42, previous: 30 },
    },
    whatsapp: {
      inquiries: { current: 30, previous: 20 },
      conversionRate: { current: 40, previous: 33, unit: "PERCENT" },
      responsePerformance: { current: 92, previous: 88 },
    },
  }));

  assert.equal(limited.weeklyGrowthScore.coveragePercent, 65);
  assert.notEqual(limited.executiveSummary.overallStatus, "DATA_LIMITED");
  assert.equal(connected.weeklyGrowthScore.coveragePercent, 100);
  assert.ok(connected.weeklyGrowthScore.score >= limited.weeklyGrowthScore.score);
});

test("returns exactly top five actions and structured key insights", () => {
  const report = generator.generate(baseInput());

  assert.equal(report.recommendedActions.length, 5);
  assert.ok(report.keyInsights.length >= 3);
  for (const insight of report.keyInsights) {
    assert.ok(insight.whatHappened);
    assert.ok(insight.whyItHappened);
    assert.ok(insight.whatItMeans);
  }
});

function baseInput(overrides: Partial<WeeklyAnalysisReportInput> = {}): WeeklyAnalysisReportInput {
  return {
    workspaceId: "workspace_demo_health",
    hospitalName: "VIP Health Network",
    asOf: new Date("2026-06-02T10:30:00.000Z"),
    socialPosts: [
      {
        id: "post-current-instagram",
        platform: "INSTAGRAM",
        caption: "Doctor explains safe ENT warning signs",
        contentCategory: "Doctor education",
        contentType: "REEL",
        postedAt: "2026-06-01T09:00:00.000Z",
        metrics: { likes: 52, comments: 8, shares: 9, saves: 14, clicks: 6, reach: 620, engagementRate: 1.25 },
      },
      {
        id: "post-current-facebook",
        platform: "FACEBOOK",
        caption: "Clinic hours update",
        contentCategory: "Operations",
        contentType: "POST",
        postedAt: "2026-05-30T09:00:00.000Z",
        metrics: { likes: 14, comments: 1, shares: 0, saves: 0, clicks: 5, reach: 280, engagementRate: 0.35 },
      },
      {
        id: "post-previous-instagram",
        platform: "INSTAGRAM",
        caption: "Previous week post",
        contentCategory: "Doctor education",
        contentType: "POST",
        postedAt: "2026-05-24T09:00:00.000Z",
        metrics: { likes: 25, comments: 2, shares: 2, saves: 3, clicks: 1, reach: 400, engagementRate: 0.7 },
      },
    ],
    reviews: [
      { id: "review-current", rating: 5, sentiment: "POSITIVE", createdAt: "2026-06-01T11:00:00.000Z" },
      { id: "review-previous", rating: 3, sentiment: "NEUTRAL", createdAt: "2026-05-23T11:00:00.000Z" },
    ],
    competitors: [{ label: "Peer Hospital", metrics: { engagementRate: 0.8, posts: 4 } }],
    ...overrides,
  };
}
