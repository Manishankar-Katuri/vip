import prisma, { type Prisma } from "@vip/database";

import { ContentDecisionEngine } from "./decision-engine";
import { ContentPlanDocumentGenerator } from "./document-generator";
import { dateRangeForWindow, determineExecutionWindow, determineFromTodayExecutionWindow } from "./execution-window";
import { assertCalendarDataForMode } from "./mode";
import { buildGeneratedDocumentAttachment, ContentExecutionPdfGenerator } from "./pdf-generator";
import type {
  ContentDecision,
  ContentExecutionDocumentMode,
  ContentExecutionGenerationMode,
  DailyIntelligenceSnapshot,
  ExecutionWindow,
  NormalizedAssetSignal,
  PlannedCalendarItem,
  RecentContentPerformance,
  ThreeDayContentExecutionDocument,
} from "./types";
import { resolveHarikaSocialWorkspaceId } from "@/lib/harika-workspace";

export class MonthlyContentCalendarService {
  async getItemsForWindow(workspaceId: string, window: ExecutionWindow): Promise<PlannedCalendarItem[]> {
    const range = dateRangeForWindow(window);
    const items = await prisma.contentCalendarItem.findMany({
      where: {
        hospitalId: workspaceId,
        deletedAt: null,
        scheduledDate: { gte: range.start, lte: range.end },
      },
      orderBy: [{ scheduledDate: "asc" }, { position: "asc" }],
      select: {
        id: true,
        hospitalId: true,
        clientId: true,
        platform: true,
        plannedTopic: true,
        plannedCaption: true,
        plannedAssets: true,
        plannedPostingTime: true,
        campaignTheme: true,
        goal: true,
        title: true,
        description: true,
        contentType: true,
        category: true,
        status: true,
        approvalStatus: true,
        scheduledDate: true,
        tags: true,
      },
    });

    return items.map((item) => ({
      id: item.id,
      workspaceId: item.hospitalId,
      clientId: item.clientId,
      date: toIsoDate(item.scheduledDate),
      platform: item.platform ?? inferPlatform(item.tags),
      plannedTopic: item.plannedTopic ?? item.title,
      plannedContentType: item.contentType,
      plannedCaption: item.plannedCaption ?? item.description,
      plannedAssets: normalizeAssets(item.plannedAssets),
      plannedPostingTime: item.plannedPostingTime ?? timeLabel(item.scheduledDate),
      campaignTheme: item.campaignTheme ?? categoryLabel(item.category),
      goal: item.goal,
      status: item.status,
      approvalStatus: item.approvalStatus,
    }));
  }
}

export class DailyIntelligenceSnapshotService {
  async getSnapshot(workspaceId: string, asOf: Date = new Date()): Promise<DailyIntelligenceSnapshot> {
    const socialWorkspaceId = resolveSocialWorkspaceId(workspaceId);
    const lookbackWindowDays = 30;
    const since = new Date(asOf);
    since.setUTCDate(since.getUTCDate() - lookbackWindowDays);

    const [posts, trends, competitors] = await Promise.all([
      prisma.socialPost.findMany({
        where: { workspaceId: socialWorkspaceId, postedAt: { gte: since, lte: asOf } },
        orderBy: { postedAt: "desc" },
        take: 200,
        select: {
          id: true,
          platform: true,
          caption: true,
          contentType: true,
          postedAt: true,
          metrics: {
            select: {
              reach: true,
              engagementRate: true,
              saves: true,
              shares: true,
              comments: true,
            },
          },
        },
      }).catch(() => []),
      prisma.marketSignalObservation.findMany({
        where: { workspaceId: socialWorkspaceId, observedAt: { gte: since, lte: asOf } },
        orderBy: [{ score: "desc" }, { observedAt: "desc" }],
        take: 12,
        select: {
          label: true,
          score: true,
          category: true,
          momentum: true,
          confidence: true,
          metadata: true,
        },
      }).catch(() => []),
      prisma.competitorAccount.findMany({
        where: { workspaceId: socialWorkspaceId },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          displayName: true,
          handle: true,
          metrics: true,
        },
      }).catch(() => []),
    ]);

    const performance = posts.map((post): RecentContentPerformance => ({
      id: post.id,
      platform: post.platform,
      topic: post.caption ?? "Recent post",
      contentType: mapSocialContentType(post.contentType),
      postedAt: post.postedAt.toISOString(),
      reach: post.metrics?.reach ?? 0,
      engagementRate: post.metrics?.engagementRate ?? 0,
      saves: post.metrics?.saves ?? 0,
      shares: post.metrics?.shares ?? 0,
      comments: post.metrics?.comments ?? 0,
    }));
    const platformPerformance = buildPlatformPerformance(performance);
    const topicPerformance = buildTopicPerformance(performance);
    const normalizedTrends = trends.map((trend) => ({
      topic: trend.label,
      urgency: trend.score >= 85 ? "HIGH" as const : trend.score >= 65 ? "MEDIUM" as const : "LOW" as const,
      reason: metadataReason(trend.metadata) ?? `${trend.label} is showing ${Math.round(trend.score)} signal strength in recent market intelligence.`,
      recommendedContentType: metadataString(trend.metadata, "recommendedContentType"),
    }));
    const assetSignals: NormalizedAssetSignal[] = [
      { topicOrItemId: "default-client-assets", status: "AVAILABLE", reason: "No missing persisted asset signal was found in the connected content data." },
    ];
    const hasRealSignals = performance.length > 0 || trends.length > 0 || competitors.length > 0;
    const fallback = hasRealSignals
      ? null
      : buildFallbackIntelligence(workspaceId, asOf);

    return {
      workspaceId,
      generatedAt: asOf.toISOString(),
      lookbackWindowDays,
      sourceLabel: fallback ? "FALLBACK" : "REAL",
      platformPerformance: fallback?.platformPerformance ?? platformPerformance,
      topicPerformance: fallback?.topicPerformance ?? topicPerformance,
      trendSignalsNormalized: fallback?.trendSignalsNormalized ?? normalizedTrends,
      assetSignals: fallback?.assetSignals ?? assetSignals,
      platformAnalytics: fallback?.platformAnalytics ?? buildPlatformAnalytics(performance),
      recentContentPerformance: fallback?.recentContentPerformance ?? performance,
      audienceSignals: fallback?.audienceSignals ?? buildAudienceSignals(performance),
      trendSignals: fallback?.trendSignals ?? trends.map((trend) => ({
        label: trend.label,
        score: trend.score,
        category: trend.category,
        momentum: trend.momentum,
        confidence: trend.confidence,
        metadata: plainObject(trend.metadata),
      })),
      competitorSignals: competitors.map((competitor) => ({
        label: competitor.displayName ?? competitor.handle,
        score: competitorScore(competitor.metrics),
        category: "competitor",
        metadata: plainObject(competitor.metrics),
      })),
    };
  }
}

export class AdaptiveContentPlanService {
  constructor(
    private readonly calendar = new MonthlyContentCalendarService(),
    private readonly intelligence = new DailyIntelligenceSnapshotService(),
    private readonly decisionEngine = new ContentDecisionEngine(),
    private readonly documentGenerator = new ContentPlanDocumentGenerator(),
    private readonly pdfGenerator = new ContentExecutionPdfGenerator()
  ) {}

  async previewNextWindow(workspaceId: string, runDate = new Date()) {
    const workspace = await resolveWorkspace(workspaceId);
    const window = determineExecutionWindow(runDate);
    const plannedItems = await this.calendar.getItemsForWindow(workspace.id, window);

    return {
      workspaceId: workspace.id,
      clientName: workspace.name,
      nextSendDay: window.sendDay,
      sendTime: window.sendTime,
      contentWindow: {
        ...window,
        displayRange: readableRange(window.windowStartDate, window.windowEndDate),
      },
      plannedCalendarItems: plannedItems,
      expectedDocumentTitle: window.label,
    };
  }

  async generate(input: {
    workspaceId: string;
    runDate?: Date;
    mode?: ContentExecutionDocumentMode;
    generationMode?: ContentExecutionGenerationMode;
  }) {
    const mode = input.mode ?? "real";
    const generationMode = input.generationMode ?? "scheduled";
    const workspace = await resolveWorkspace(input.workspaceId);
    const window = generationMode === "fromToday"
      ? determineFromTodayExecutionWindow(input.runDate ?? new Date())
      : determineExecutionWindow(input.runDate ?? new Date());
    const persistedPlannedItems = await this.calendar.getItemsForWindow(workspace.id, window);
    assertCalendarDataForMode(mode, persistedPlannedItems);
    const plannedItems = persistedPlannedItems.length
      ? persistedPlannedItems
      : buildPreviewCalendarItems(workspace.id, window);
    const intelligence = await this.intelligence.getSnapshot(workspace.id, input.runDate ?? new Date());
    if (intelligence.sourceLabel === "FALLBACK") {
      console.info(`[content-execution] fallback intelligence used for workspace ${workspace.id}`);
    }
    const decisions = this.decisionEngine.evaluate({ plannedItems, intelligence });
    const generated = this.documentGenerator.generate({
      workspaceId: workspace.id,
      clientName: workspace.name,
      window,
      plannedItems,
      decisions,
      intelligence,
      mode,
      generationMode,
      generatedAt: input.runDate ?? new Date(),
    });
    const generatedFile = await this.pdfGenerator.generate(generated.document);

    const storedWindow = await prisma.contentExecutionWindow.create({
      data: {
        workspaceId: workspace.id,
        windowType: window.windowType,
        sendDay: window.sendDay,
        sendTime: window.sendTime,
        windowStartDate: new Date(`${window.windowStartDate}T00:00:00.000Z`),
        windowEndDate: new Date(`${window.windowEndDate}T00:00:00.000Z`),
        purpose: window.purpose,
        status: "GENERATED",
      },
    });

    await prisma.contentPlanDecision.createMany({
      data: decisions.map((decision) => ({
        workspaceId: workspace.id,
        clientId: plannedItems.find((item) => item.id === decision.calendarItemId)?.clientId ?? null,
        calendarItemId: decision.calendarItemId ?? null,
        executionWindowId: storedWindow.id,
        decision: decision.decision,
        originalTopic: decision.originalTopic ?? null,
        finalTopic: decision.finalTopic,
        originalContentType: decision.originalContentType ?? null,
        finalContentType: decision.finalContentType,
        decisionReason: decision.decisionReason,
        intelligenceSignalsUsed: decision.intelligenceSignalsUsed as Prisma.InputJsonValue,
        confidenceScore: decision.confidenceScore,
      })),
    });

    const storedDocument = await prisma.contentExecutionDocument.create({
      data: {
        workspaceId: workspace.id,
        executionWindowId: storedWindow.id,
        documentType: "THREE_DAY_CONTENT_EXECUTION_PLAN",
        title: generated.document.title,
        contentJson: generated.document,
        fileUrl: generatedFile.fileUrl,
        emailSubject: generated.email.subject,
        emailBody: generated.email.body,
        deliveryStatus: "DRAFT",
        generatedAt: input.runDate ?? new Date(),
      },
    });

    return {
      documentId: storedDocument.id,
      executionWindowId: storedWindow.id,
      document: generated.document,
      email: generated.email,
      file: generatedFile,
      decisions,
    };
  }
}

export class ThreeDayExecutionPlanService extends AdaptiveContentPlanService {}

export class ClientEmailDeliveryService {
  async sendDocument(documentId: string, recipientEmail?: string) {
    const document = await prisma.contentExecutionDocument.findUnique({
      where: { id: documentId },
      include: { workspace: { select: { contactEmail: true, hospitalName: true } }, executionWindow: true },
    });

    if (!document) {
      throw new Error(`Content execution document ${documentId} was not found.`);
    }

    const recipient = recipientEmail ?? document.workspace.contactEmail ?? "client@example.com";
    const emailEnabled = process.env.CONTENT_EXECUTION_EMAIL_ENABLED === "true";
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.REPORTS_FROM_EMAIL;
    const canSendRealEmail = Boolean(emailEnabled && resendApiKey && fromEmail);
    const status = canSendRealEmail ? "SENT" : "MOCK_SENT";
    const sentAt = new Date();
    const email = { subject: document.emailSubject, body: document.emailBody };
    const mockReason = status === "MOCK_SENT"
      ? mockEmailReason({ emailEnabled, resendApiKey, fromEmail })
      : null;
    const providerMessageId = canSendRealEmail
      ? await sendViaResend({
          apiKey: resendApiKey as string,
          fromEmail: fromEmail as string,
          replyToEmail: process.env.REPORTS_REPLY_TO_EMAIL,
          to: recipient,
          subject: email.subject,
          body: email.body,
          fileUrl: document.fileUrl,
        })
      : null;

    await prisma.contentExecutionDocument.update({
      where: { id: document.id },
      data: { deliveryStatus: status, sentAt },
    });

    const log = await new ContentWorkflowDeliveryLogger().log({
      workspaceId: document.workspaceId,
      executionDocumentId: document.id,
      recipientEmail: recipient,
      deliveryStatus: status,
      providerMessageId,
      errorMessage: mockReason,
      sentAt,
    });

    return {
      deliveryStatus: status,
      recipientEmail: recipient,
      email,
      attachmentFileUrl: document.fileUrl,
      mockReason,
      log,
    };
  }
}

export class ContentWorkflowDeliveryLogger {
  async log(input: {
    workspaceId: string;
    executionDocumentId: string;
    recipientEmail: string;
    deliveryStatus: string;
    providerMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: Date;
  }) {
    return prisma.contentDeliveryLog.create({
      data: {
        workspaceId: input.workspaceId,
        executionDocumentId: input.executionDocumentId,
        recipientEmail: input.recipientEmail,
        deliveryStatus: input.deliveryStatus,
        providerMessageId: input.providerMessageId,
        errorMessage: input.errorMessage,
        sentAt: input.sentAt ?? new Date(),
      },
    });
  }
}

export async function listExecutionDocuments(workspaceId: string) {
  const workspace = await resolveWorkspace(workspaceId);

  return prisma.contentExecutionDocument.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { generatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      documentType: true,
      emailSubject: true,
      fileUrl: true,
      deliveryStatus: true,
      generatedAt: true,
      sentAt: true,
      executionWindow: {
        select: {
          id: true,
          sendDay: true,
          sendTime: true,
          windowStartDate: true,
          windowEndDate: true,
          purpose: true,
        },
      },
    },
  });
}

export async function getExecutionDocument(documentId: string) {
  return prisma.contentExecutionDocument.findUnique({
    where: { id: documentId },
    include: {
      executionWindow: true,
      deliveryLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

async function resolveWorkspace(workspaceId: string) {
  const workspace = await prisma.hospitalWorkspace.findFirst({
    where: {
      OR: [
        { id: workspaceId },
        { slug: workspaceId },
        { hospitalName: { equals: workspaceId, mode: "insensitive" } },
      ],
    },
    select: { id: true, hospitalName: true, name: true },
  });

  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} was not found.`);
  }

  return {
    id: workspace.id,
    name: workspace.hospitalName || workspace.name,
  };
}

function buildPlatformAnalytics(performance: RecentContentPerformance[]) {
  const byPlatform = new Map<string, RecentContentPerformance[]>();

  for (const item of performance) {
    byPlatform.set(item.platform, [...(byPlatform.get(item.platform) ?? []), item]);
  }

  return Array.from(byPlatform.entries()).map(([platform, items]) => {
    const typeScores = new Map<string, number[]>();

    for (const item of items) {
      typeScores.set(item.contentType, [...(typeScores.get(item.contentType) ?? []), item.engagementRate]);
    }

    const bestContentType = Array.from(typeScores.entries())
      .sort((left, right) => average(right[1]) - average(left[1]))[0]?.[0];

    return {
      platform,
      bestContentType,
      bestPostingTime: "09:30",
      averageEngagementRate: average(items.map((item) => item.engagementRate)),
      averageReach: average(items.map((item) => item.reach)),
    };
  });
}

function buildPlatformPerformance(performance: RecentContentPerformance[]) {
  const byPlatform = new Map<string, RecentContentPerformance[]>();

  for (const item of performance) {
    byPlatform.set(item.platform, [...(byPlatform.get(item.platform) ?? []), item]);
  }

  return Array.from(byPlatform.entries()).map(([platform, items]) => {
    const typeScores = new Map<string, number[]>();

    for (const item of items) {
      typeScores.set(item.contentType, [...(typeScores.get(item.contentType) ?? []), item.engagementRate]);
    }

    const rankedTypes = Array.from(typeScores.entries())
      .map(([type, scores]) => ({ type, score: average(scores) }))
      .sort((left, right) => right.score - left.score);

    return {
      platform,
      reach: Math.round(sum(items.map((item) => item.reach))),
      engagementRate: average(items.map((item) => item.engagementRate)),
      saves: sum(items.map((item) => item.saves)),
      shares: sum(items.map((item) => item.shares)),
      comments: sum(items.map((item) => item.comments)),
      bestPostingTime: "09:30",
      topContentTypes: rankedTypes.slice(0, 2).map((item) => item.type),
      weakContentTypes: rankedTypes.slice(-2).filter((item) => item.score < 0.006).map((item) => item.type),
    };
  });
}

function buildTopicPerformance(performance: RecentContentPerformance[]) {
  return performance.slice(0, 20).map((item) => {
    const score = Math.min(1, Math.max(0, item.engagementRate / 0.03));
    const signal = item.engagementRate >= 0.018
      ? "STRONG" as const
      : item.engagementRate < 0.006
        ? "WEAK" as const
        : "NEUTRAL" as const;

    return {
      topic: item.topic,
      platform: item.platform,
      score,
      signal,
      reason: signal === "STRONG"
        ? `${item.platform} audience recently saved, shared, or commented strongly on this topic.`
        : signal === "WEAK"
          ? `${item.platform} engagement was low for this related topic, so the next plan should avoid repeating it as-is.`
          : `${item.platform} performance was moderate; keep only if the calendar goal still fits.`,
    };
  });
}

function buildAudienceSignals(performance: RecentContentPerformance[]) {
  const strongest = [...performance].sort((left, right) => right.engagementRate - left.engagementRate)[0];

  return strongest
    ? [{
        label: `Audience responded best to ${strongest.contentType.toLowerCase()} content`,
        score: Math.min(100, Math.round(strongest.engagementRate * 1000)),
        category: "audience_response",
        confidence: 0.72,
        metadata: { postId: strongest.id, reach: strongest.reach },
      }]
    : [];
}

function buildFallbackIntelligence(workspaceId: string, asOf: Date): DailyIntelligenceSnapshot {
  const recentContentPerformance = [{
    id: "fallback-strong-topic",
    platform: "INSTAGRAM",
    topic: "Ear infection prevention",
    contentType: "REEL",
    postedAt: asOf.toISOString(),
    reach: 1200,
    engagementRate: 0.019,
    saves: 18,
    shares: 9,
    comments: 5,
  }];

  return {
    workspaceId,
    generatedAt: asOf.toISOString(),
    lookbackWindowDays: 30,
    sourceLabel: "FALLBACK",
    platformPerformance: [{
      platform: "INSTAGRAM",
      reach: 1200,
      engagementRate: 0.019,
      saves: 18,
      shares: 9,
      comments: 5,
      bestPostingTime: "09:30",
      topContentTypes: ["REEL"],
      weakContentTypes: ["POST"],
    }],
    topicPerformance: [{
      topic: "Ear infection prevention",
      platform: "INSTAGRAM",
      score: 0.63,
      signal: "STRONG",
      reason: "Fallback intelligence marks this as a reliable education topic until connected analytics are available.",
    }],
    trendSignalsNormalized: [{
      topic: "Monsoon allergy spike",
      urgency: "HIGH",
      reason: "Fallback local seasonal signal used because connected trend data is unavailable.",
      recommendedContentType: "REEL",
    }],
    assetSignals: [{
      topicOrItemId: "fallback",
      status: "AVAILABLE",
      reason: "Fallback assumes standard creative assets are available unless the calendar item marks risk or missing assets.",
    }],
    platformAnalytics: [{
      platform: "INSTAGRAM",
      bestContentType: "REEL",
      bestPostingTime: "09:30",
      averageEngagementRate: 0.019,
      averageReach: 1200,
    }],
    recentContentPerformance,
    audienceSignals: [{
      label: "Fallback audience signal: patient education performs reliably",
      score: 70,
      category: "fallback",
      confidence: 0.5,
      metadata: { fallback: true },
    }],
    trendSignals: [{
      label: "Monsoon allergy spike",
      score: 88,
      category: "fallback-seasonal",
      momentum: 0.8,
      confidence: 0.6,
      metadata: { fallback: true, recommendedContentType: "REEL" },
    }],
    competitorSignals: [],
  };
}

function buildPreviewCalendarItems(workspaceId: string, window: ExecutionWindow): PlannedCalendarItem[] {
  return [
    {
      id: "preview-reel-1",
      workspaceId,
      date: window.windowStartDate,
      platform: "INSTAGRAM",
      plannedTopic: "Monsoon ear infection prevention",
      plannedContentType: "REEL",
      plannedCaption: "Patient education reel for rainy season ear care.",
      plannedAssets: ["Doctor video", "Clinic visuals"],
      plannedPostingTime: "09:30",
      campaignTheme: "Patient education",
      goal: "Increase saved educational posts and appointment enquiries",
      status: "PREVIEW",
      approvalStatus: "PENDING",
    },
    {
      id: "preview-carousel-1",
      workspaceId,
      date: window.windowStartDate,
      platform: "FACEBOOK",
      plannedTopic: "Hearing test checklist for families",
      plannedContentType: "CAROUSEL",
      plannedCaption: "Family hearing evaluation checklist.",
      plannedAssets: ["Carousel template"],
      plannedPostingTime: "13:00",
      campaignTheme: "Patient education",
      goal: "Increase saved educational posts and appointment enquiries",
      status: "PREVIEW",
      approvalStatus: "PENDING",
    },
    {
      id: "preview-gbp-1",
      workspaceId,
      date: window.windowEndDate,
      platform: "GBP",
      plannedTopic: "Clinic weekend consultation reminder",
      plannedContentType: "POST",
      plannedCaption: "Weekend clinic reminder.",
      plannedAssets: ["Clinic images"],
      plannedPostingTime: "09:30",
      campaignTheme: "Patient education",
      goal: "Increase saved educational posts and appointment enquiries",
      status: "PREVIEW",
      approvalStatus: "PENDING",
    },
  ];
}

function mapSocialContentType(value: string) {
  if (value === "SHORT_FORM_VIDEO" || value === "VIDEO") return "REEL";
  if (value === "IMAGE") return "POST";
  return value;
}

function normalizeAssets(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return [value];
  return ["Approved creative"];
}

function inferPlatform(tags: string[]) {
  const platform = tags.find((tag) => ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE"].includes(tag.toUpperCase()));

  return platform?.toUpperCase() ?? "INSTAGRAM";
}

function timeLabel(date: Date) {
  return date.toISOString().slice(11, 16);
}

function categoryLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function readableRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const startLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(endDate);

  return `${startLabel} – ${endLabel}`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function competitorScore(value: unknown) {
  const metrics = plainObject(value);
  const engagement = typeof metrics?.engagementRate === "number" ? metrics.engagementRate : 0;

  return Math.min(100, Math.round(engagement * 1000));
}

function plainObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function metadataString(value: unknown, key: string) {
  const object = plainObject(value);
  const field = object?.[key];

  return typeof field === "string" ? field : undefined;
}

function metadataReason(value: unknown) {
  return metadataString(value, "reason");
}

function resolveSocialWorkspaceId(workspaceId: string) {
  if (workspaceId === "content-execution-demo-hospital" || workspaceId === "vip-content-execution-demo") {
    return "content-execution-demo-social";
  }

  return resolveHarikaSocialWorkspaceId(workspaceId) ?? workspaceId;
}

async function sendViaResend(input: {
  apiKey: string;
  fromEmail: string;
  replyToEmail?: string;
  to: string;
  subject: string;
  body: string;
  fileUrl?: string | null;
}) {
  const attachments = input.fileUrl
    ? await buildResendAttachment(input.fileUrl)
    : undefined;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.fromEmail,
      to: [input.to],
      reply_to: input.replyToEmail,
      subject: input.subject,
      text: input.body,
      attachments,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Resend request failed.");
    throw new Error(`Resend delivery failed: ${message}`);
  }

  const payload = await response.json().catch(() => null) as { id?: string } | null;

  return payload?.id ?? null;
}

const buildResendAttachment = buildGeneratedDocumentAttachment;

function mockEmailReason(input: {
  emailEnabled: boolean;
  resendApiKey?: string;
  fromEmail?: string;
}) {
  if (!input.emailEnabled) return "CONTENT_EXECUTION_EMAIL_ENABLED is not true; mock delivery was logged.";
  if (!input.resendApiKey) return "RESEND_API_KEY is missing; mock delivery was logged.";
  if (!input.fromEmail) return "REPORTS_FROM_EMAIL is missing; mock delivery was logged.";
  return "Email provider unavailable; mock delivery was logged.";
}

export type StoredExecutionDocument = Awaited<ReturnType<typeof getExecutionDocument>>;
export type GeneratedExecutionPlanResult = {
  documentId: string;
  executionWindowId: string;
  document: ThreeDayContentExecutionDocument;
  email: { subject: string; body: string };
  file: { fileUrl: string; filePath: string; format: string; message: string };
  decisions: ContentDecision[];
};
