import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

import { ContentDecisionEngine } from "./decision-engine";
import { ContentPlanDocumentGenerator } from "./document-generator";
import { renderContentExecutionHtml } from "./document-template";
import { determineExecutionWindow, determineFromTodayExecutionWindow } from "./execution-window";
import { assertCalendarDataForMode, NO_CONTENT_CALENDAR_DATA_ERROR } from "./mode";
import { buildGeneratedDocumentAttachment, ContentExecutionPdfGenerator } from "./pdf-generator";
import { getContentExecutionSchedulerDefinitions } from "./scheduler";
import type { DailyIntelligenceSnapshot, PlannedCalendarItem } from "./types";

test("execution windows map Sunday, Wednesday, and Saturday to the required three-day ranges", () => {
  const sunday = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  assert.equal(sunday.sendDay, "Sunday");
  assert.equal(sunday.windowStartDate, "2026-06-08");
  assert.equal(sunday.windowEndDate, "2026-06-10");
  assert.equal(sunday.label, "Monday-Wednesday Content Execution Plan");

  const wednesday = determineExecutionWindow(new Date("2026-06-10T04:00:00.000Z"));
  assert.equal(wednesday.sendDay, "Wednesday");
  assert.equal(wednesday.windowStartDate, "2026-06-11");
  assert.equal(wednesday.windowEndDate, "2026-06-13");
  assert.equal(wednesday.label, "Thursday-Saturday Content Execution Plan");

  const saturday = determineExecutionWindow(new Date("2026-06-13T04:00:00.000Z"));
  assert.equal(saturday.sendDay, "Saturday");
  assert.equal(saturday.windowStartDate, "2026-06-14");
  assert.equal(saturday.windowEndDate, "2026-06-16");
  assert.equal(saturday.label, "Weekend + Next Week Preparation Plan");
});

test("fromToday generation covers the selected run date and next two days", () => {
  const window = determineFromTodayExecutionWindow(new Date("2026-06-08T04:00:00.000Z"));

  assert.equal(window.windowStartDate, "2026-06-08");
  assert.equal(window.windowEndDate, "2026-06-10");
  assert.equal(window.label, "8–10 June 2026 Content Execution Plan");
  assert.equal(window.purpose, "Prepare and execute the next 3 days of content from today.");
  assert.equal(window.generationMode, "fromToday");
});

test("decision engine keeps strong content", () => {
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems: [item({ id: "strong", plannedTopic: "Ear infection prevention" })],
    intelligence: snapshot({
      recentContentPerformance: [{
        id: "post-1",
        platform: "INSTAGRAM",
        topic: "Ear infection prevention tips",
        contentType: "REEL",
        postedAt: "2026-06-01T00:00:00.000Z",
        reach: 1200,
        engagementRate: 0.028,
        saves: 20,
        shares: 12,
        comments: 8,
      }],
    }),
  });

  assert.equal(decisions[0].decision, "KEEP");
});

test("decision engine improves content when a better format exists", () => {
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems: [item({ id: "format", plannedContentType: "POST" })],
    intelligence: snapshot({
      platformAnalytics: [{
        platform: "INSTAGRAM",
        bestContentType: "REEL",
        bestPostingTime: "09:30",
        averageEngagementRate: 0.02,
        averageReach: 900,
      }],
    }),
  });

  assert.equal(decisions[0].decision, "IMPROVE");
  assert.equal(decisions[0].finalContentType, "REEL");
});

test("decision engine replaces weak or repetitive content", () => {
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems: [item({ id: "weak", plannedTopic: "Sinus care" })],
    intelligence: snapshot({
      recentContentPerformance: [{
        id: "post-2",
        platform: "INSTAGRAM",
        topic: "Sinus care mistakes",
        contentType: "POST",
        postedAt: "2026-06-01T00:00:00.000Z",
        reach: 100,
        engagementRate: 0.002,
        saves: 0,
        shares: 0,
        comments: 0,
      }],
    }),
  });

  assert.equal(decisions[0].decision, "REPLACE");
});

test("decision engine adds trend-based item", () => {
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems: [item({ id: "baseline", plannedTopic: "Hearing test checklist" })],
    intelligence: snapshot({
      trendSignals: [{ label: "Monsoon allergy spike", score: 91, confidence: 0.8, category: "seasonal" }],
    }),
  });

  assert.equal(decisions.some((decision) => decision.decision === "ADD"), true);
});

test("decision engine pauses risky or asset-unavailable item", () => {
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems: [item({ id: "risk", plannedTopic: "Guaranteed cure for tinnitus" })],
    intelligence: snapshot({}),
  });

  assert.equal(decisions[0].decision, "PAUSE");
});

test("decision engine handles empty intelligence gracefully and clamps confidence", () => {
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems: [item({ id: "empty", plannedTopic: "General ENT FAQ" })],
    intelligence: snapshot({
      platformAnalytics: [],
      recentContentPerformance: [],
      audienceSignals: [],
      trendSignals: [],
      competitorSignals: [],
      platformPerformance: [],
      topicPerformance: [],
      trendSignalsNormalized: [],
      assetSignals: [],
    }),
  });

  assert.equal(decisions[0].decision, "KEEP");
  assert.ok(decisions[0].confidenceScore >= 0);
  assert.ok(decisions[0].confidenceScore <= 1);
  assert.match(decisions[0].decisionReason, /planned topic|campaign/i);
});

test("document generation includes required sections and email payload", () => {
  const window = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  const plannedItems = [item({ id: "doc", plannedTopic: "Ear infection prevention" })];
  const decisions = new ContentDecisionEngine().evaluate({
    plannedItems,
    intelligence: snapshot({
      recentContentPerformance: [{
        id: "post-3",
        platform: "INSTAGRAM",
        topic: "Ear infection prevention",
        contentType: "REEL",
        postedAt: "2026-06-01T00:00:00.000Z",
        reach: 1200,
        engagementRate: 0.025,
        saves: 14,
        shares: 9,
        comments: 6,
      }],
    }),
  });
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions,
    intelligence: snapshot({}),
    generatedAt: new Date("2026-06-07T04:00:00.000Z"),
  });

  assert.equal(generated.document.executiveBrief.totalContentPieces, 1);
  assert.equal(generated.document.mode, "real");
  assert.equal(generated.document.modeLabel, "Real document");
  assert.equal(generated.document.clientName, "Harika ENT");
  assert.equal(generated.document.workspaceName, "Harika ENT");
  assert.equal(generated.document.contentWindow.sendDay, "Sunday");
  assert.ok(generated.document.intelligenceNote);
  assert.ok(generated.document.intelligenceBasedAdjustments.length > 0);
  assert.equal(generated.document.dayWiseSchedule.length, 1);
  assert.equal(generated.document.detailedContentInstructions.length, 1);
  assert.ok(generated.document.assetChecklist.neededFromClient.length > 0);
  assert.ok(generated.document.priorityActions.length > 0);
  assert.equal(generated.document.emailSummaryPreview.subject, "VIP Content Execution Plan: Monday-Wednesday | Harika ENT");
  assert.equal(generated.email.subject, "VIP Content Execution Plan: Monday-Wednesday | Harika ENT");
  assert.match(generated.email.body, /Top preparation needed/);
  assert.doesNotMatch(generated.document.title, /\b(TEST|SAMPLE|mock)\b/i);
  assert.doesNotMatch(generated.document.intelligenceNote, /\b(TEST|SAMPLE|mock)\b/i);
});

test("preview mode is labeled for review without fake or sample language", () => {
  const window = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  const plannedItems = [item({ id: "preview", plannedTopic: "Ear infection prevention" })];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions: new ContentDecisionEngine().evaluate({ plannedItems, intelligence: snapshot({}) }),
    intelligence: snapshot({}),
    mode: "preview",
    generatedAt: new Date("2026-06-07T04:00:00.000Z"),
  });

  assert.equal(generated.document.mode, "preview");
  assert.equal(generated.document.modeLabel, "Preview document");
  assert.match(generated.document.intelligenceNote, /Preview document generated for review/);
  assert.doesNotMatch(generated.document.intelligenceNote, /fake|sample client data|TEST\/SAMPLE/i);
});

test("real mode fails clearly when calendar data is missing", () => {
  assert.throws(
    () => assertCalendarDataForMode("real", []),
    new RegExp(NO_CONTENT_CALENDAR_DATA_ERROR)
  );
  assert.doesNotThrow(() => assertCalendarDataForMode("preview", []));
});

test("document generation creates full content packages by format", () => {
  const window = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  const plannedItems = [
    item({ id: "reel", plannedTopic: "Monsoon ear infection prevention", plannedContentType: "REEL", platform: "INSTAGRAM" }),
    item({ id: "carousel", plannedTopic: "Hearing test checklist for families", plannedContentType: "CAROUSEL", platform: "FACEBOOK" }),
    item({ id: "gbp", plannedTopic: "Clinic weekend consultation reminder", plannedContentType: "POST", platform: "GBP" }),
    item({ id: "whatsapp", plannedTopic: "Rainy season throat irritation", plannedContentType: "WHATSAPP", platform: "WHATSAPP" }),
  ];
  const decisions = plannedItems.map((plannedItem) => ({
    decision: "KEEP" as const,
    calendarItemId: plannedItem.id,
    originalTopic: plannedItem.plannedTopic,
    finalTopic: plannedItem.plannedTopic,
    originalContentType: plannedItem.plannedContentType,
    finalContentType: plannedItem.plannedContentType,
    decisionReason: "The calendar item fits the current campaign and remains execution-ready.",
    intelligenceSignalsUsed: {},
    confidenceScore: 0.7,
    date: plannedItem.date,
    platform: plannedItem.platform,
    postingTime: plannedItem.plannedPostingTime,
    approvalStatus: plannedItem.approvalStatus,
  }));
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions,
    intelligence: snapshot({}),
    generatedAt: new Date("2026-06-07T04:00:00.000Z"),
  });
  const reel = generated.document.detailedContentInstructions.find((entry) => entry.contentType === "REEL");
  const carousel = generated.document.detailedContentInstructions.find((entry) => entry.contentType === "CAROUSEL");
  const gbp = generated.document.detailedContentInstructions.find((entry) => entry.platform === "Google Business Profile");
  const whatsapp = generated.document.detailedContentInstructions.find((entry) => entry.platform === "WhatsApp");

  assert.ok(reel?.fullScript?.scenes.length);
  assert.ok(reel.fullScript.scenes[0].doctorLines?.length);
  assert.ok(reel.fullScript.scenes[0].onScreenText?.length);
  assert.ok(reel.recordingInstructions?.length);
  assert.ok(reel.editingInstructions?.length);
  assert.ok(carousel?.carouselSlides?.length);
  assert.match(carousel.carouselSlides[0].headline, /Hearing|checklist/i);
  assert.match(gbp?.gbpPostCopy ?? "", /Harika ENT/);
  assert.match(whatsapp?.whatsappMessage ?? "", /Hi, this is Harika ENT/);
});

test("document template renders doctor-friendly sections without internal decision logic", () => {
  const window = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  const plannedItems = [item({ id: "doc", plannedTopic: "Ear infection prevention" })];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions: new ContentDecisionEngine().evaluate({ plannedItems, intelligence: snapshot({}) }),
    intelligence: snapshot({}),
    generatedAt: new Date("2026-06-07T04:00:00.000Z"),
  });
  const html = renderContentExecutionHtml(generated.document);

  for (const section of [
    "Executive Brief",
    "Intelligence Note",
    "Day-Wise Execution Schedule",
    "Detailed Content Instructions",
    "Asset Checklist: Needed from Client",
    "Asset Checklist: Needed from Internal Team",
    "Priority Actions",
    "Email Summary Preview",
    "Full video script for doctor",
    "Opening line",
    "Patient action",
    "Extra clinic visuals",
    "How the post should look",
    "Things needed",
    "What the clinic team should prepare",
    "Work for our team",
    "Final check before posting",
    "Medical safety note",
  ]) {
    assert.match(html, new RegExp(section));
  }

  for (const internalText of [
    "Intelligence-Based Adjustments",
    "Original:",
    "Final:",
    "Reason:",
    "CTA",
    "Hook",
    "B-roll",
    "Creative direction",
  ]) {
    assert.doesNotMatch(html, new RegExp(internalText));
  }
});

test("document schedule and details are sorted by date, time, and platform", () => {
  const window = determineFromTodayExecutionWindow(new Date("2026-06-08T04:00:00.000Z"));
  const decisions = [
    decision({ finalTopic: "Wednesday GBP", finalContentType: "POST", date: "2026-06-10", platform: "GBP", postingTime: "09:30" }),
    decision({ finalTopic: "Monday Instagram", finalContentType: "REEL", date: "2026-06-08", platform: "INSTAGRAM", postingTime: "09:30" }),
    decision({ finalTopic: "Tuesday late Instagram", finalContentType: "REEL", date: "2026-06-09", platform: "INSTAGRAM", postingTime: "16:00" }),
    decision({ finalTopic: "Monday Facebook", finalContentType: "CAROUSEL", date: "2026-06-08", platform: "FACEBOOK", postingTime: "13:00" }),
    decision({ finalTopic: "Tuesday early Instagram", finalContentType: "REEL", date: "2026-06-09", platform: "INSTAGRAM", postingTime: "09:30" }),
  ];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems: decisions.map((entry, index) => item({
      id: `item-${index}`,
      date: entry.date,
      platform: entry.platform,
      plannedTopic: entry.finalTopic,
      plannedContentType: entry.finalContentType,
      plannedPostingTime: entry.postingTime ?? "09:30",
    })),
    decisions,
    intelligence: snapshot({}),
    mode: "preview",
    generationMode: "fromToday",
    generatedAt: new Date("2026-06-08T04:00:00.000Z"),
  });

  assert.deepEqual(
    generated.document.dayWiseSchedule.map((entry) => entry.topic),
    ["Monday Instagram", "Monday Facebook", "Tuesday early Instagram", "Tuesday late Instagram", "Wednesday GBP"]
  );
  assert.deepEqual(
    generated.document.detailedContentInstructions.map((entry) => entry.topic),
    ["Monday Instagram", "Monday Facebook", "Tuesday early Instagram", "Tuesday late Instagram", "Wednesday GBP"]
  );
});

test("generated HTML uses readable dates and avoids local path/footer artifacts", () => {
  const window = determineFromTodayExecutionWindow(new Date("2026-06-08T04:00:00.000Z"));
  const plannedItems = [item({ id: "today", date: "2026-06-08", plannedTopic: "Monsoon ear infection prevention" })];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions: new ContentDecisionEngine().evaluate({ plannedItems, intelligence: snapshot({}) }),
    intelligence: snapshot({}),
    mode: "preview",
    generationMode: "fromToday",
    generatedAt: new Date("2026-06-08T04:00:00.000Z"),
  });
  const html = renderContentExecutionHtml(generated.document);

  assert.equal(generated.document.title, "8–10 June 2026 Content Execution Plan");
  assert.match(html, /8–10 June 2026 Content Execution Plan/);
  assert.match(html, /Mon 8 Jun/);
  assert.doesNotMatch(html, /2026-06-0[8-9]|2026-06-10/);
  assert.doesNotMatch(html, /file:\/\/\/|C:\\|No priority preparation listed|No priority actions listed/);
  assert.doesNotMatch(html, /Intelligence-Based Adjustments|Original:|Final:|Reason:/);
});

test("generated scripts avoid awkward direct topic insertion", () => {
  const window = determineFromTodayExecutionWindow(new Date("2026-06-08T04:00:00.000Z"));
  const plannedItems = [item({ id: "script", date: "2026-06-08", plannedTopic: "Monsoon ear infection prevention" })];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions: new ContentDecisionEngine().evaluate({ plannedItems, intelligence: snapshot({}) }),
    intelligence: snapshot({}),
    mode: "preview",
    generationMode: "fromToday",
    generatedAt: new Date("2026-06-08T04:00:00.000Z"),
  });
  const scriptText = generated.document.detailedContentInstructions
    .flatMap((instruction) => instruction.fullScript?.scenes.flatMap((scene) => scene.doctorLines ?? []) ?? [])
    .join(" ");

  assert.doesNotMatch(scriptText, /noticing monsoon ear infection prevention/i);
  assert.match(scriptText, /During the rainy season, ear pain, blockage, itching, or discharge can become more common/);
});

test("HTML fallback generation produces a preview file URL", async () => {
  const window = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  const plannedItems = [item({ id: "file", plannedTopic: "Ear infection prevention" })];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions: new ContentDecisionEngine().evaluate({ plannedItems, intelligence: snapshot({}) }),
    intelligence: snapshot({}),
    generatedAt: new Date("2026-06-07T04:00:00.000Z"),
  });
  const file = await new ContentExecutionPdfGenerator().generate(generated.document);

  assert.equal(file.format, "HTML_FALLBACK");
  assert.match(file.fileUrl, /^\/generated\/content-execution\/.+\.html$/);
  await assert.doesNotReject(stat(file.filePath));
});

test("email attachment builder reads generated document file", async () => {
  const window = determineExecutionWindow(new Date("2026-06-07T04:00:00.000Z"));
  const plannedItems = [item({ id: "attachment", plannedTopic: "Ear infection prevention" })];
  const generated = new ContentPlanDocumentGenerator().generate({
    workspaceId: "workspace-1",
    clientName: "Harika ENT",
    window,
    plannedItems,
    decisions: new ContentDecisionEngine().evaluate({ plannedItems, intelligence: snapshot({}) }),
    intelligence: snapshot({}),
    generatedAt: new Date("2026-06-07T04:00:00.000Z"),
  });
  const file = await new ContentExecutionPdfGenerator().generate(generated.document);
  const attachments = await buildGeneratedDocumentAttachment(file.fileUrl);

  assert.equal(attachments.length, 1);
  assert.equal(attachments[0].filename.endsWith(".html"), true);
  assert.ok(attachments[0].content.length > 0);
});

test("scheduler definitions are disabled by default and keep Saturday overlap readiness", () => {
  delete process.env.CONTENT_EXECUTION_SCHEDULER_ENABLED;
  const jobs = getContentExecutionSchedulerDefinitions("Asia/Kolkata");

  assert.equal(jobs.length, 3);
  assert.equal(jobs.every((job) => job.enabled === false), true);
  assert.equal(jobs.some((job) => job.cron === "0 9 * * 6"), true);
});

function item(overrides: Partial<PlannedCalendarItem>): PlannedCalendarItem {
  return {
    id: "item-1",
    workspaceId: "workspace-1",
    date: "2026-06-08",
    platform: "INSTAGRAM",
    plannedTopic: "Ear infection prevention",
    plannedContentType: "REEL",
    plannedCaption: "Patient education caption",
    plannedAssets: ["Doctor video"],
    plannedPostingTime: "10:00",
    campaignTheme: "Patient education",
    goal: "Increase saved educational posts",
    status: "PLANNED",
    approvalStatus: "PENDING",
    ...overrides,
  };
}

function decision(overrides: {
  finalTopic: string;
  finalContentType: string;
  date: string;
  platform: string;
  postingTime: string;
}) {
  return {
    decision: "KEEP" as const,
    finalTopic: overrides.finalTopic,
    originalTopic: overrides.finalTopic,
    finalContentType: overrides.finalContentType,
    originalContentType: overrides.finalContentType,
    decisionReason: "Final content item remains in the plan.",
    intelligenceSignalsUsed: {},
    confidenceScore: 0.75,
    date: overrides.date,
    platform: overrides.platform,
    postingTime: overrides.postingTime,
    approvalStatus: "PENDING",
  };
}

function snapshot(overrides: Partial<DailyIntelligenceSnapshot>): DailyIntelligenceSnapshot {
  return {
    workspaceId: "workspace-1",
    generatedAt: "2026-06-07T04:00:00.000Z",
    lookbackWindowDays: 30,
    sourceLabel: "REAL",
    platformPerformance: [{
      platform: "INSTAGRAM",
      reach: 600,
      engagementRate: 0.015,
      saves: 8,
      shares: 4,
      comments: 3,
      bestPostingTime: "09:30",
      topContentTypes: ["REEL"],
      weakContentTypes: ["POST"],
    }],
    topicPerformance: [],
    trendSignalsNormalized: [],
    assetSignals: [],
    platformAnalytics: [{
      platform: "INSTAGRAM",
      bestContentType: "REEL",
      bestPostingTime: "09:30",
      averageEngagementRate: 0.015,
      averageReach: 600,
    }],
    recentContentPerformance: [],
    audienceSignals: [],
    trendSignals: [],
    competitorSignals: [],
    ...overrides,
  };
}
