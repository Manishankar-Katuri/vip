import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "@vip/database";

import type {
  GenerateReportInput,
  PatchReportInput,
  ReportApproval,
  ReportDelivery,
  ReportDeliveryResponse,
  ReportDetailResponse,
  ReportExport,
  ReportExportListResponse,
  ReportListItem,
  ReportListResponse,
  ReportRecipient,
  ReportRecipientListResponse,
  ReportSection,
  ReportSourceData,
  ReportStatus,
  ReportType,
} from "./types";
import { REPORT_TYPE_LABELS, REPORT_TYPES } from "./types";
import { renderReportDocx, renderReportPdf } from "./renderers";
import { reportEmailProviderUnavailableReason, resolveGeneratedReportAttachment, sendReportEmail } from "./email-provider";

type Db = typeof prisma & Record<string, any>;
type ReportQuery = {
  clientId?: string | null;
  workflowRunId?: string | null;
  reportType?: string | null;
  status?: string | null;
  date?: string | null;
  limit?: string | number | null;
};
type GenerationContext = {
  workspace: any;
  workflow: any | null;
  businessDate: Date;
  approvals: any[];
  pdfExports: any[];
  contentDocuments: any[];
  deliveries: any[];
};

const DAILY_GROWTH_MISSION = "DAILY_GROWTH_MISSION";

export async function listReports(query: ReportQuery = {}): Promise<ReportListResponse> {
  const db = prisma as Db;
  const limit = normalizeLimit(query.limit);
  const where: Record<string, unknown> = {};

  if (query.clientId) where.workspaceId = query.clientId;
  if (query.workflowRunId) where.missionExecutionId = query.workflowRunId;
  if (isReportType(query.reportType)) where.reportType = query.reportType;
  if (isReportStatus(query.status)) where.status = query.status;
  const dateRange = dateFilter(query.date);
  if (dateRange) where.businessDate = dateRange;

  const drafts = await db.reportDraft.findMany({
    where,
    orderBy: [{ generatedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
  });

  return {
    reports: drafts.map(mapReportListItem),
    filters: {
      clientId: query.clientId ?? null,
      workflowRunId: query.workflowRunId ?? null,
      reportType: query.reportType ?? null,
      status: query.status ?? null,
      date: query.date ?? null,
      limit,
    },
  };
}

export async function getReportDetail(reportId: string): Promise<ReportDetailResponse | null> {
  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({
    where: { id: reportId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      missionExecution: true,
    },
  });

  if (!draft) return null;
  return buildReportDetail(draft);
}

export async function generateReport(input: GenerateReportInput): Promise<ReportDetailResponse> {
  if (!isReportType(input.reportType)) {
    throw new ReportServiceError(400, "Unsupported reportType.");
  }

  const db = prisma as Db;
  const context = await loadGenerationContext(input);
  const idempotencyKey = reportIdempotencyKey({
    workspaceId: context.workspace.id,
    reportType: input.reportType,
    businessDate: context.businessDate,
    workflowRunId: context.workflow?.id ?? null,
  });
  const existing = await db.reportDraft.findUnique({
    where: { idempotencyKey },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      missionExecution: true,
    },
  });

  if (existing && !input.forceRegenerate) {
    return buildReportDetail(existing);
  }

  const draftContent = buildDraftContent(input.reportType, context);
  const data = {
    workspaceId: context.workspace.id,
    missionExecutionId: context.workflow?.id ?? null,
    businessDate: context.businessDate,
    reportType: input.reportType,
    title: draftContent.title,
    summary: draftContent.summary,
    status: "draft",
    sections: draftContent.sections,
    sourceData: draftContent.sourceData,
    approvalStatus: context.approvals.length ? aggregateApprovalStatus(context.approvals) : "not_requested",
    exportStatus: context.pdfExports.length ? aggregateExportStatus(context.pdfExports) : "not_exported",
    sentStatus: context.deliveries.length ? aggregateDeliveryStatus(context.deliveries) : "not_sent",
    pdfUrl: firstCompletedPdfUrl(context.pdfExports),
    docxUrl: null,
    idempotencyKey,
    generatedAt: new Date(),
    editedAt: null,
    archivedAt: null,
  };

  const draft = existing
    ? await db.reportDraft.update({
        where: { id: existing.id },
        data,
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          missionExecution: true,
        },
      })
    : await db.reportDraft.create({
        data,
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          missionExecution: true,
        },
      });

  return buildReportDetail(draft);
}

export async function patchReport(reportId: string, input: PatchReportInput): Promise<ReportDetailResponse | null> {
  const db = prisma as Db;
  const existing = await db.reportDraft.findUnique({ where: { id: reportId } });
  if (!existing) return null;

  const data: Record<string, unknown> = { editedAt: new Date() };
  if (typeof input.title === "string") data.title = input.title.trim() || existing.title;
  if (typeof input.summary === "string") data.summary = input.summary;
  if (input.status) {
    if (!["draft", "ready_for_review", "archived"].includes(input.status)) {
      throw new ReportServiceError(400, "Only draft, ready_for_review, and archived statuses can be set in Phase 4.");
    }
    data.status = input.status;
    data.archivedAt = input.status === "archived" ? new Date() : null;
  }
  if (Array.isArray(input.sections)) {
    data.sections = mergeSectionUpdates(parseSections(existing.sections), input.sections);
  }

  const updated = await db.reportDraft.update({
    where: { id: reportId },
    data,
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      missionExecution: true,
    },
  });

  return buildReportDetail(updated);
}

export async function listReportExports(reportId: string): Promise<ReportExportListResponse | null> {
  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({ where: { id: reportId } });
  if (!draft) return null;

  const exports = await db.reportExport.findMany({
    where: { reportDraftId: reportId },
    orderBy: { createdAt: "desc" },
  });
  const mapped = exports.map(mapReportExport);

  return {
    exports: mapped,
    latest: {
      PDF: latestCompletedOrRecent(mapped, "PDF"),
      DOCX: latestCompletedOrRecent(mapped, "DOCX"),
    },
  };
}

export async function exportReport(reportId: string, input: { format?: string; forceRegenerate?: boolean }) {
  const format = normalizeExportFormat(input.format);
  if (!format) throw new ReportServiceError(400, "format must be PDF or DOCX.");

  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({
    where: { id: reportId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      missionExecution: true,
    },
  });
  if (!draft) return null;

  const existing = await db.reportExport.findFirst({
    where: { reportDraftId: reportId, format, status: "completed" },
    orderBy: { completedAt: "desc" },
  });
  if (existing && !input.forceRegenerate) {
    return {
      export: mapReportExport(existing),
      report: await buildReportDetail(draft),
      reused: true,
    };
  }

  const exportRecord = await db.reportExport.create({
    data: {
      reportDraftId: draft.id,
      workspaceId: draft.workspaceId,
      workflowRunId: draft.missionExecutionId,
      format,
      status: "generating",
      startedAt: new Date(),
    },
  });

  try {
    const detail = await buildReportDetail(draft);
    const storage = await reportExportStoragePath({ reportId: draft.id, title: draft.title, clientName: draft.workspace?.name ?? "client", format });
    let bytes: Buffer;
    if (format === "PDF") {
      await renderReportPdf(detail, storage.absolutePath);
      bytes = await fs.readFile(storage.absolutePath);
    } else {
      bytes = await renderReportDocx(detail);
      await fs.writeFile(storage.absolutePath, bytes);
    }

    const completed = await db.reportExport.update({
      where: { id: exportRecord.id },
      data: {
        status: "completed",
        fileUrl: storage.publicUrl,
        fileName: storage.fileName,
        mimeType: format === "PDF" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: bytes.length,
        completedAt: new Date(),
      },
    });

    const updatedDraft = await db.reportDraft.update({
      where: { id: draft.id },
      data: {
        exportStatus: "exported",
        ...(format === "PDF" ? { pdfUrl: storage.publicUrl } : { docxUrl: storage.publicUrl }),
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        missionExecution: true,
      },
    });

    return {
      export: mapReportExport(completed),
      report: await buildReportDetail(updatedDraft),
      reused: false,
    };
  } catch (error) {
    const failed = await db.reportExport.update({
      where: { id: exportRecord.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unable to export report.",
        completedAt: new Date(),
      },
    });
    const updatedDraft = await db.reportDraft.update({
      where: { id: draft.id },
      data: { exportStatus: "failed" },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        missionExecution: true,
      },
    });

    return {
      export: mapReportExport(failed),
      report: await buildReportDetail(updatedDraft),
      reused: false,
    };
  }
}

export async function getReportApproval(reportId: string) {
  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({ where: { id: reportId } });
  if (!draft) return null;
  const history = await db.reportApproval.findMany({
    where: { reportDraftId: reportId },
    orderBy: { createdAt: "desc" },
  });

  return {
    current: history[0] ? mapReportApproval(history[0]) : null,
    history: history.map(mapReportApproval),
    approvalStatus: draft.approvalStatus ?? "not_requested",
  };
}

export async function actOnReportApproval(reportId: string, input: { action?: string; notes?: string; decidedBy?: string }) {
  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({ where: { id: reportId } });
  if (!draft) return null;
  if (draft.status === "archived" && input.action === "approve") {
    throw new ReportServiceError(409, "Archived reports cannot be approved.");
  }

  const action = String(input.action ?? "");
  const notes = sanitizeText(input.notes);
  const decidedBy = sanitizeText(input.decidedBy);
  let approvalStatus: string;
  let reportStatus: string | undefined;
  let decidedAt: Date | null = null;

  if (action === "request_approval") {
    approvalStatus = "pending";
    reportStatus = "ready_for_review";
  } else if (action === "approve") {
    if (draft.approvalStatus === "rejected") throw new ReportServiceError(409, "Rejected reports must be moved back to review before approval.");
    approvalStatus = "approved";
    reportStatus = "approved";
    decidedAt = new Date();
  } else if (action === "request_changes") {
    approvalStatus = "changes_requested";
    reportStatus = "draft";
    decidedAt = new Date();
  } else if (action === "reject") {
    approvalStatus = "rejected";
    reportStatus = "failed";
    decidedAt = new Date();
  } else {
    throw new ReportServiceError(400, "action must be request_approval, approve, request_changes, or reject.");
  }

  await db.reportApproval.create({
    data: {
      reportDraftId: draft.id,
      workspaceId: draft.workspaceId,
      status: approvalStatus,
      notes,
      decidedBy: decidedAt ? decidedBy : null,
      decidedAt,
    },
  });

  await db.reportDraft.update({
    where: { id: draft.id },
    data: {
      approvalStatus,
      ...(reportStatus ? { status: reportStatus } : {}),
    },
  });

  return getReportApproval(reportId);
}

export async function listReportRecipients(workspaceId: string): Promise<ReportRecipientListResponse | null> {
  const db = prisma as Db;
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { id: true } });
  if (!workspace) return null;
  const recipients = await db.reportRecipient.findMany({
    where: { workspaceId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return { recipients: recipients.map(mapReportRecipient) };
}

export async function createReportRecipient(workspaceId: string, input: { name?: string; email?: string; role?: string; isDefault?: boolean; receivesReports?: boolean }): Promise<ReportRecipient> {
  const db = prisma as Db;
  const email = normalizeEmail(input.email);
  if (!email) throw new ReportServiceError(400, "A valid recipient email is required.");
  const name = sanitizeText(input.name) || email;
  const recipient = await db.reportRecipient.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    create: {
      workspaceId,
      email,
      name,
      role: sanitizeText(input.role),
      isDefault: Boolean(input.isDefault),
      receivesReports: input.receivesReports !== false,
    },
    update: {
      name,
      role: sanitizeText(input.role),
      isDefault: Boolean(input.isDefault),
      receivesReports: input.receivesReports !== false,
    },
  });
  return mapReportRecipient(recipient);
}

export async function updateReportRecipient(workspaceId: string, recipientId: string, input: { name?: string; email?: string; role?: string; isDefault?: boolean; receivesReports?: boolean }) {
  const db = prisma as Db;
  const existing = await db.reportRecipient.findFirst({ where: { id: recipientId, workspaceId } });
  if (!existing) return null;
  const email = input.email === undefined ? existing.email : normalizeEmail(input.email);
  if (!email) throw new ReportServiceError(400, "A valid recipient email is required.");
  const recipient = await db.reportRecipient.update({
    where: { id: recipientId },
    data: {
      email,
      name: input.name === undefined ? existing.name : sanitizeText(input.name) || email,
      role: input.role === undefined ? existing.role : sanitizeText(input.role),
      isDefault: input.isDefault === undefined ? existing.isDefault : Boolean(input.isDefault),
      receivesReports: input.receivesReports === undefined ? existing.receivesReports : Boolean(input.receivesReports),
    },
  });
  return mapReportRecipient(recipient);
}

export async function deleteReportRecipient(workspaceId: string, recipientId: string) {
  const db = prisma as Db;
  const existing = await db.reportRecipient.findFirst({ where: { id: recipientId, workspaceId } });
  if (!existing) return null;
  await db.reportRecipient.delete({ where: { id: recipientId } });
  return { deleted: true };
}

export async function listReportDeliveries(reportId: string): Promise<ReportDeliveryResponse | null> {
  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({ where: { id: reportId } });
  if (!draft) return null;
  const deliveries = await db.reportDelivery.findMany({
    where: { reportDraftId: reportId },
    orderBy: { createdAt: "desc" },
  });
  return { deliveries: deliveries.map(mapReportDelivery), sentStatus: draft.sentStatus ?? "not_sent" };
}

export async function sendReport(reportId: string, input: {
  recipients?: Array<string | { id?: string; email?: string; name?: string }>;
  formats?: string;
  message?: string;
}) {
  const db = prisma as Db;
  const draft = await db.reportDraft.findUnique({
    where: { id: reportId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!draft) return null;
  if (draft.status === "archived" || draft.approvalStatus !== "approved") {
    throw new ReportServiceError(409, "Only approved, non-archived reports can be sent.");
  }

  const formats = normalizeSendFormats(input.formats);
  if (!formats.length) throw new ReportServiceError(400, "formats must be PDF, DOCX, or BOTH.");
  const exports = await db.reportExport.findMany({
    where: { reportDraftId: reportId, status: "completed", format: { in: formats } },
    orderBy: { completedAt: "desc" },
  });
  const selectedExports = formats.map((format) => exports.find((item: any) => item.format === format)).filter(Boolean);
  if (selectedExports.length !== formats.length) {
    throw new ReportServiceError(409, "The requested completed export file is missing.");
  }

  const recipients = await resolveRecipients(db, draft.workspaceId, input.recipients ?? []);
  if (!recipients.length) throw new ReportServiceError(400, "At least one valid recipient is required.");

  const message = sanitizeText(input.message);
  const attachments = await Promise.all(selectedExports.map((item: any) => {
    if (!item.fileUrl) throw new ReportServiceError(409, "A completed export is missing its file URL.");
    return resolveGeneratedReportAttachment(item.fileUrl, item.fileName, item.mimeType);
  }));

  const deliveryRows = [];
  for (const recipient of recipients) {
    const queued = await db.reportDelivery.create({
      data: {
        reportDraftId: draft.id,
        workspaceId: draft.workspaceId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        format: input.formats === "BOTH" ? "BOTH" : formats[0],
        status: "sending",
        exportIds: selectedExports.map((item: any) => item.id),
        primaryExportId: selectedExports[0]?.id ?? null,
        message,
      },
    });

    try {
      const providerMessageId = await sendReportEmail({
        to: recipient.email,
        recipientName: recipient.name,
        clientName: draft.workspace?.name ?? "Client",
        reportTitle: draft.title,
        message,
        attachments,
      });
      deliveryRows.push(await db.reportDelivery.update({
        where: { id: queued.id },
        data: {
          status: "sent",
          providerMessageId,
          sentAt: new Date(),
        },
      }));
    } catch (error) {
      deliveryRows.push(await db.reportDelivery.update({
        where: { id: queued.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : reportEmailProviderUnavailableReason(),
        },
      }));
    }
  }

  const anySent = deliveryRows.some((item: any) => item.status === "sent");
  const anyFailed = deliveryRows.some((item: any) => item.status === "failed");
  await db.reportDraft.update({
    where: { id: draft.id },
    data: { sentStatus: anySent ? "sent" : anyFailed ? "failed" : "not_sent" },
  });

  const deliveries = await listReportDeliveries(reportId);
  return {
    deliveries: deliveries?.deliveries ?? deliveryRows.map(mapReportDelivery),
    sentStatus: anySent ? "sent" : anyFailed ? "failed" : "not_sent",
  };
}

export class ReportServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function loadGenerationContext(input: GenerateReportInput): Promise<GenerationContext> {
  const db = prisma as Db;
  const workspaceId = input.workspaceId ?? input.clientId;
  const requestedDate = parseBusinessDate(input.date);

  let workflow: any | null = null;
  if (input.workflowRunId) {
    workflow = await db.missionExecution.findUnique({
      where: { id: input.workflowRunId },
      include: workflowInclude(),
    });
  } else if (workspaceId) {
    const where: Record<string, unknown> = {
      workspaceId,
      missionType: DAILY_GROWTH_MISSION,
    };
    const requestedRange = requestedDate ? dateFilter(formatDate(requestedDate)) : null;
    if (requestedRange) where.businessDate = requestedRange;
    workflow = await db.missionExecution.findFirst({
      where,
      orderBy: [{ businessDate: "desc" }, { updatedAt: "desc" }],
      include: workflowInclude(),
    });
  }

  const resolvedWorkspaceId = workflow?.workspaceId ?? workspaceId;
  if (!resolvedWorkspaceId) {
    throw new ReportServiceError(400, "workspaceId, clientId, or workflowRunId is required.");
  }

  const workspace = workflow?.workspace ?? await db.workspace.findUnique({
    where: { id: resolvedWorkspaceId },
    select: { id: true, name: true, slug: true },
  });
  if (!workspace) {
    throw new ReportServiceError(404, "Workspace/client was not found.");
  }

  const businessDate = requestedDate ?? workflow?.businessDate ?? startOfDay(new Date());
  const actionPlanIds = actionPlanIdsFromWorkflow(workflow);
  const [approvals, pdfExports, contentDocuments, deliveries] = await Promise.all([
    db.approvalRequest.findMany({
      where: {
        workspaceId: workspace.id,
        ...(actionPlanIds.length ? { actionPlanId: { in: actionPlanIds } } : {}),
      },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }).catch(() => []),
    db.pdfExportRun.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }).catch(() => []),
    db.contentExecutionDocument.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { generatedAt: "desc" },
      take: 10,
      include: { deliveryLogs: true },
    }).catch(() => []),
    db.contentDeliveryLog.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []),
  ]);

  return {
    workspace,
    workflow,
    businessDate,
    approvals,
    pdfExports,
    contentDocuments,
    deliveries,
  };
}

function workflowInclude() {
  return {
    workspace: { select: { id: true, name: true, slug: true } },
    businessSnapshots: true,
    performanceReports: true,
    strategyOutcomes: true,
    trendOpportunities: true,
    contentBriefs: true,
    contentProductionPackages: true,
    dailyGrowthReports: true,
  };
}

function buildDraftContent(reportType: ReportType, context: Awaited<ReturnType<typeof loadGenerationContext>>) {
  const clientName = context.workspace.name;
  const dateLabel = formatDate(context.businessDate);
  const warnings = missingWarnings(context);
  const sourceData: ReportSourceData = {
    analyticsSourcesUsed: sourcesUsed(context.workflow?.businessSnapshots?.[0]?.analytics, "DailyBusinessSnapshot.analytics"),
    strategySourcesUsed: sourcesUsed(context.workflow?.strategyOutcomes?.[0], "StrategyOutcome"),
    contentPlanSourcesUsed: [
      ...sourcesUsed(context.workflow?.contentProductionPackages, "ContentProductionPackage"),
      ...sourcesUsed(context.contentDocuments, "ContentExecutionDocument"),
    ],
    workflowReferencesUsed: context.workflow ? [`MissionExecution:${context.workflow.id}`] : [],
    missingDataWarnings: warnings,
  };

  if (reportType === "DAILY_ANALYTICS_REPORT") {
    const performance = context.workflow?.performanceReports?.[0];
    const snapshot = context.workflow?.businessSnapshots?.[0];
    const recommendations = stringList(performance?.recommendations);
    return {
      title: `${clientName} Daily Analytics Report - ${dateLabel}`,
      summary: performance ? "Daily analytics draft generated from persisted workflow performance data." : "Daily analytics draft generated with missing analytics data warnings.",
      sections: withWarnings([
        textSection("client", "Client name", clientName, 1, ["Workspace"]),
        textSection("date", "Date", dateLabel, 2, ["MissionExecution.businessDate"]),
        textSection("executive-summary", "Executive summary", summarizeObject(performance?.summary) || "No persisted performance summary is available yet.", 3, ["DailyPerformanceReport.summary"]),
        textSection("what-changed", "What changed", summarizeObject(performance?.metrics) || "No persisted metric changes are available yet.", 4, ["DailyPerformanceReport.metrics"]),
        textSection("why-it-matters", "Why it matters", recommendations[0] ?? "Once analytics are available, this section will explain the business impact in plain language.", 5, ["DailyPerformanceReport.recommendations"]),
        textSection("social-performance", "Social performance", summarizeObject(snapshot?.analytics) || "Social analytics were not found in the saved daily snapshot.", 6, ["DailyBusinessSnapshot.analytics"]),
        textSection("review-gbp-performance", "Review and GBP performance", summarizeObject(snapshot?.reviews) || "Review and Google Business Profile data were not found for this report date.", 7, ["DailyBusinessSnapshot.reviews"]),
        textSection("website-lead-performance", "Website and lead performance", nestedSummary(snapshot?.analytics, ["website", "leads"]) || "Website and lead data were not found for this report date.", 8, ["DailyBusinessSnapshot.analytics"]),
        listSection("next-actions", "Recommended next actions", recommendations.length ? recommendations : ["Connect missing data sources, then regenerate this draft for stronger recommendations."], 9, ["DailyPerformanceReport.recommendations"]),
      ], warnings),
      sourceData,
    };
  }

  if (reportType === "DAILY_STRATEGY_REPORT") {
    const strategy = context.workflow?.strategyOutcomes?.[0];
    const opportunities = (context.workflow?.trendOpportunities ?? []).slice(0, 5);
    const actions = [
      ...stringList(strategy?.repeatActions),
      ...opportunities.map((item: any) => `${item.title}: ${item.description}`),
    ].filter(Boolean);
    return {
      title: `${clientName} Daily Strategy Report - ${dateLabel}`,
      summary: strategy ? "Daily strategy draft generated from persisted strategy outcomes and opportunities." : "Daily strategy draft generated with missing strategy data warnings.",
      sections: withWarnings([
        textSection("client", "Client name", clientName, 1, ["Workspace"]),
        textSection("date", "Date", dateLabel, 2, ["MissionExecution.businessDate"]),
        listSection("top-priorities", "Top priorities", actions.length ? actions.slice(0, 5) : ["No saved strategy priorities are available yet."], 3, ["StrategyOutcome", "TrendOpportunity"]),
        textSection("data-says", "What the data says", summarizeObject(strategy?.patterns) || "No saved strategy pattern analysis is available yet.", 4, ["StrategyOutcome.patterns"]),
        listSection("recommended-actions", "Recommended actions", actions.length ? actions : ["Review missing data warnings and regenerate after the daily workflow completes."], 5, ["StrategyOutcome.repeatActions"]),
        textSection("expected-impact", "Expected impact", confidenceSummary(strategy?.confidenceScore), 6, ["StrategyOutcome.confidenceScore"]),
        textSection("approval-notes", "Required owner approval notes", approvalNotes(context.approvals), 7, ["ApprovalRequest"]),
      ], warnings),
      sourceData,
    };
  }

  if (reportType === "THREE_DAY_CONTENT_PLAN") {
    const packages = (context.workflow?.contentProductionPackages ?? []).slice(0, 3);
    const document = context.contentDocuments[0];
    return {
      title: `${clientName} Three-Day Content Plan - ${dateLabel}`,
      summary: packages.length || document ? "Three-day content plan draft generated from saved workflow content and content execution documents." : "Three-day content plan draft generated with missing content plan warnings.",
      sections: withWarnings([
        textSection("client", "Client name", clientName, 1, ["Workspace"]),
        textSection("date-range", "Date range", threeDayRange(context.businessDate), 2, ["MissionExecution.businessDate"]),
        ...contentPlanSections(packages, document, 3),
      ], warnings),
      sourceData,
    };
  }

  return {
    title: `${clientName} ${REPORT_TYPE_LABELS[reportType]} - ${dateLabel}`,
    summary: `${REPORT_TYPE_LABELS[reportType]} is represented in the report system but draft generation is planned for a later phase.`,
    sections: withWarnings([
      textSection("client", "Client name", clientName, 1, ["Workspace"]),
      textSection("date", "Date", dateLabel, 2, ["MissionExecution.businessDate"]),
      textSection("planned", "Planned report type", `${REPORT_TYPE_LABELS[reportType]} will be generated once weekly/monthly aggregation is implemented.`, 3, []),
    ], [...warnings, `${REPORT_TYPE_LABELS[reportType]} draft generation is not available yet.`]),
    sourceData,
  };
}

async function buildReportDetail(draft: any): Promise<ReportDetailResponse> {
  const db = prisma as Db;
  const [approvals, exports, deliveries] = await Promise.all([
    findApprovalsForDraft(db, draft),
    findExportsForDraft(db, draft),
    findDeliveriesForDraft(db, draft),
  ]);

  return {
    report: mapReportListItem(draft),
    sections: parseSections(draft.sections),
    sourceData: normalizeSourceData(draft.sourceData),
    workflow: {
      workflowRunId: draft.missionExecutionId ?? null,
      workflowStatus: draft.missionExecution?.status ?? null,
      workflowStartedAt: iso(draft.missionExecution?.startedAt),
      workflowCompletedAt: iso(draft.missionExecution?.completedAt),
    },
    approvals,
    exports,
    deliveries,
  };
}

function mapReportListItem(draft: any): ReportListItem {
  return {
    id: draft.id,
    clientId: draft.workspaceId,
    workspaceId: draft.workspaceId,
    clientName: draft.workspace?.name ?? "Unknown client",
    workflowRunId: draft.missionExecutionId ?? null,
    reportType: isReportType(draft.reportType) ? draft.reportType : "DAILY_ANALYTICS_REPORT",
    title: draft.title,
    status: isReportStatus(draft.status) ? draft.status : "draft",
    createdAt: iso(draft.createdAt) ?? new Date(0).toISOString(),
    updatedAt: iso(draft.updatedAt) ?? new Date(0).toISOString(),
    generatedAt: iso(draft.generatedAt),
    editedAt: iso(draft.editedAt),
    approvalStatus: draft.approvalStatus ?? "not_requested",
    exportStatus: draft.exportStatus ?? "not_exported",
    sentStatus: draft.sentStatus ?? "not_sent",
    pdfUrl: draft.pdfUrl ?? null,
    docxUrl: draft.docxUrl ?? null,
    summary: draft.summary ?? "",
  };
}

function parseSections(value: unknown): ReportSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ReportSection => Boolean(item && typeof item === "object" && "id" in item && "title" in item))
    .map((item, index) => ({
      id: String(item.id),
      title: String(item.title),
      order: Number(item.order ?? index + 1),
      content: normalizeSectionContent(item.content),
      contentType: ["text", "table", "list", "metric_summary", "action_plan"].includes(String(item.contentType)) ? item.contentType : "text",
      editable: item.editable !== false,
      sourceRefs: Array.isArray(item.sourceRefs) ? item.sourceRefs.map(String) : [],
    }));
}

function mergeSectionUpdates(existing: ReportSection[], updates: NonNullable<PatchReportInput["sections"]>) {
  const updateMap = new Map(updates.map((item) => [item.id, item.content]));
  return existing.map((section) => updateMap.has(section.id) && section.editable ? { ...section, content: updateMap.get(section.id) } : section);
}

function normalizeSectionContent(content: unknown): ReportSection["content"] {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    if (content.every((item) => typeof item === "string")) return content.map(String);
    return content.map((item) => typeof item === "object" && item ? item as Record<string, string | number | null> : { value: String(item) });
  }
  if (content && typeof content === "object") return summarizeObject(content);
  return "";
}

function normalizeSourceData(value: unknown): ReportSourceData {
  const source = value && typeof value === "object" ? value as Partial<ReportSourceData> : {};
  return {
    analyticsSourcesUsed: Array.isArray(source.analyticsSourcesUsed) ? source.analyticsSourcesUsed.map(String) : [],
    strategySourcesUsed: Array.isArray(source.strategySourcesUsed) ? source.strategySourcesUsed.map(String) : [],
    contentPlanSourcesUsed: Array.isArray(source.contentPlanSourcesUsed) ? source.contentPlanSourcesUsed.map(String) : [],
    workflowReferencesUsed: Array.isArray(source.workflowReferencesUsed) ? source.workflowReferencesUsed.map(String) : [],
    missingDataWarnings: Array.isArray(source.missingDataWarnings) ? source.missingDataWarnings.map(String) : [],
  };
}

function withWarnings(sections: ReportSection[], warnings: string[]) {
  return warnings.length
    ? [
        ...sections,
        listSection("missing-data-warnings", "Missing data warnings", warnings, sections.length + 1, []),
      ]
    : sections;
}

function textSection(id: string, title: string, content: string, order: number, sourceRefs: string[]): ReportSection {
  return { id, title, order, content, contentType: "text", editable: true, sourceRefs };
}

function listSection(id: string, title: string, content: string[], order: number, sourceRefs: string[]): ReportSection {
  return { id, title, order, content, contentType: "list", editable: true, sourceRefs };
}

function contentPlanSections(packages: any[], document: any | null, startOrder: number): ReportSection[] {
  if (!packages.length && document?.contentJson) {
    return [
      textSection("saved-content-document", "Saved content execution document", summarizeObject(document.contentJson), startOrder, ["ContentExecutionDocument.contentJson"]),
    ];
  }

  if (!packages.length) {
    return [
      listSection("day-wise-plan", "Day-wise plan", ["No saved content packages are available yet."], startOrder, ["ContentProductionPackage"]),
    ];
  }

  return packages.map((item, index): ReportSection => ({
    id: `day-${index + 1}`,
    title: `Day ${index + 1}`,
    order: startOrder + index,
    contentType: "table",
    editable: true,
    sourceRefs: [`ContentProductionPackage:${item.id}`],
    content: [
      { field: "Topic", value: item.topic ?? "Not available" },
      { field: "Format", value: item.platformRecommendation ?? "Not available" },
      { field: "Main message", value: item.objective ?? "Not available" },
      { field: "Opening line", value: item.hook ?? "Not available" },
      { field: "Video shots needed", value: summarizeObject(item.bRollRequirements) || summarizeObject(item.visualDirections) || "Not available" },
      { field: "Caption direction", value: item.caption ?? "Not available" },
      { field: "Patient action", value: item.cta ?? "Not available" },
      { field: "Doctor/staff instruction", value: summarizeObject(item.doctorTalkingPoints) || summarizeObject(item.sceneBreakdown) || "Not available" },
    ],
  }));
}

function missingWarnings(context: Awaited<ReturnType<typeof loadGenerationContext>>) {
  const warnings: string[] = [];
  if (!context.workflow) warnings.push("No workflow run was linked to this report.");
  if (!context.workflow?.businessSnapshots?.length) warnings.push("No daily business snapshot was found.");
  if (!context.workflow?.performanceReports?.length) warnings.push("No daily performance report was found.");
  if (!context.workflow?.strategyOutcomes?.length) warnings.push("No daily strategy outcome was found.");
  if (!context.workflow?.contentProductionPackages?.length && !context.contentDocuments.length) warnings.push("No saved content plan package or content execution document was found.");
  if (!context.pdfExports.length) warnings.push("No PDF export record exists yet. Final export is Phase 5.");
  return [...new Set(warnings)];
}

function actionPlanIdsFromWorkflow(workflow: any | null) {
  return (workflow?.contentProductionPackages ?? [])
    .map((item: any) => item.actionPlanId)
    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
}

async function findApprovalsForDraft(db: Db, draft: any): Promise<ReportApproval[]> {
  const approvals = await db.reportApproval.findMany({
    where: { reportDraftId: draft.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);

  return approvals.map(mapReportApproval);
}

async function findExportsForDraft(db: Db, draft: any): Promise<ReportExport[]> {
  const reportExports = await db.reportExport.findMany({
    where: { reportDraftId: draft.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);
  const mapped: ReportExport[] = reportExports.map(mapReportExport);
  if (mapped.some((item) => item.format === "PDF")) return mapped;

  const legacyPdfExports = await db.pdfExportRun.findMany({
    where: { workspaceId: draft.workspaceId },
    orderBy: { requestedAt: "desc" },
    take: 5,
  }).catch(() => []);

  return [
    ...mapped,
    ...legacyPdfExports.map((item: any) => ({
      id: item.id,
      format: "PDF" as const,
      status: String(item.status).toLowerCase(),
      url: item.fileName ? `/reports/${item.fileName}` : draft.pdfUrl ?? null,
      fileUrl: item.fileName ? `/reports/${item.fileName}` : draft.pdfUrl ?? null,
      fileName: item.fileName ?? null,
      mimeType: "application/pdf",
      fileSize: item.fileSizeBytes ?? null,
      errorMessage: item.errorMessage ?? null,
      createdAt: iso(item.requestedAt),
      startedAt: iso(item.requestedAt),
      completedAt: iso(item.completedAt),
    })),
  ];
}

function mapReportExport(item: any): ReportExport {
  const format = String(item.format).toUpperCase() === "DOCX" ? "DOCX" : "PDF";
  return {
    id: item.id,
    format,
    status: String(item.status).toLowerCase(),
    url: item.fileUrl ?? null,
    fileUrl: item.fileUrl ?? null,
    fileName: item.fileName ?? null,
    mimeType: item.mimeType ?? null,
    fileSize: item.fileSize ?? null,
    errorMessage: item.errorMessage ?? null,
    createdAt: iso(item.createdAt),
    startedAt: iso(item.startedAt),
    completedAt: iso(item.completedAt),
  };
}

function mapReportApproval(item: any): ReportApproval {
  return {
    id: item.id,
    status: String(item.status ?? "pending").toLowerCase(),
    requestedAt: iso(item.requestedAt ?? item.createdAt),
    approvedAt: String(item.status).toLowerCase() === "approved" ? iso(item.decidedAt) : null,
    decidedAt: iso(item.decidedAt),
    decidedBy: item.decidedBy ?? null,
    notes: item.notes ?? null,
  };
}

function mapReportRecipient(item: any): ReportRecipient {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    name: item.name,
    email: item.email,
    role: item.role ?? null,
    isDefault: Boolean(item.isDefault),
    receivesReports: Boolean(item.receivesReports),
    createdAt: iso(item.createdAt) ?? new Date(0).toISOString(),
    updatedAt: iso(item.updatedAt) ?? new Date(0).toISOString(),
  };
}

function mapReportDelivery(item: any): ReportDelivery {
  return {
    id: item.id,
    recipient: item.recipientEmail,
    recipientName: item.recipientName ?? null,
    format: item.format,
    status: String(item.status ?? "queued").toLowerCase(),
    exportIds: arrayOrEmpty(item.exportIds).map(String),
    sentAt: iso(item.sentAt),
    error: item.errorMessage ?? null,
    providerMessageId: item.providerMessageId ?? null,
    message: item.message ?? null,
    createdAt: iso(item.createdAt),
  };
}

function normalizeSendFormats(value: unknown): Array<"PDF" | "DOCX"> {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "PDF") return ["PDF"];
  if (normalized === "DOCX") return ["DOCX"];
  if (normalized === "BOTH") return ["PDF", "DOCX"];
  return [];
}

async function resolveRecipients(db: Db, workspaceId: string, input: Array<string | { id?: string; email?: string; name?: string }>) {
  const resolved: Array<{ email: string; name: string | null }> = [];
  for (const item of input) {
    if (typeof item === "string") {
      if (item.includes("@")) {
        const email = normalizeEmail(item);
        if (email) resolved.push({ email, name: null });
      } else {
        const recipient = await db.reportRecipient.findFirst({ where: { id: item, workspaceId, receivesReports: true } });
        if (recipient) resolved.push({ email: recipient.email, name: recipient.name });
      }
    } else if (item?.id) {
      const recipient = await db.reportRecipient.findFirst({ where: { id: item.id, workspaceId, receivesReports: true } });
      if (recipient) resolved.push({ email: recipient.email, name: recipient.name });
    } else {
      const email = normalizeEmail(item?.email);
      if (email) resolved.push({ email, name: sanitizeText(item?.name) || null });
    }
  }

  const seen = new Set<string>();
  return resolved.filter((recipient) => {
    if (seen.has(recipient.email)) return false;
    seen.add(recipient.email);
    return true;
  });
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return null;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000) || null;
}

async function findDeliveriesForDraft(db: Db, draft: any): Promise<ReportDelivery[]> {
  const deliveries = await db.reportDelivery.findMany({
    where: { reportDraftId: draft.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);

  return deliveries.map(mapReportDelivery);
}

function aggregateApprovalStatus(approvals: any[]) {
  if (approvals.some((item) => String(item.status).toUpperCase() === "APPROVED")) return "approved";
  if (approvals.some((item) => String(item.status).toUpperCase() === "REJECTED")) return "rejected";
  return "pending";
}

function aggregateExportStatus(exports: any[]) {
  if (exports.some((item) => String(item.status).toUpperCase() === "COMPLETED")) return "exported";
  if (exports.some((item) => String(item.status).toUpperCase() === "FAILED")) return "failed";
  return "requested";
}

function aggregateDeliveryStatus(deliveries: any[]) {
  if (deliveries.some((item) => String(item.deliveryStatus).toUpperCase() === "SENT")) return "sent";
  if (deliveries.some((item) => String(item.deliveryStatus).toUpperCase() === "FAILED")) return "failed";
  return "not_sent";
}

function firstCompletedPdfUrl(exports: any[]) {
  const completed = exports.find((item) => String(item.status).toUpperCase() === "COMPLETED" && item.fileName);
  return completed?.fileName ? `/reports/${completed.fileName}` : null;
}

function sourcesUsed(value: unknown, label: string) {
  if (Array.isArray(value)) return value.length ? [label] : [];
  if (value && typeof value === "object" && Object.keys(value).length) return [label];
  return [];
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === "string" ? item : summarizeObject(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function arrayOrEmpty(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function summarizeObject(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === "string" ? item : summarizeObject(item)).filter(Boolean).slice(0, 5).join("; ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .slice(0, 6)
      .map(([key, val]) => `${humanize(key)}: ${Array.isArray(val) ? val.length : typeof val === "object" && val ? summarizeObject(val) : String(val ?? "Not available")}`)
      .join("; ");
  }
  return String(value);
}

function nestedSummary(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return keys.map((key) => record[key] ? `${humanize(key)}: ${summarizeObject(record[key])}` : "").filter(Boolean).join("; ");
}

function confidenceSummary(score: unknown) {
  return typeof score === "number"
    ? `Expected impact is based on saved strategy confidence of ${Math.round(score * 100)}%.`
    : "Expected impact will be calculated once strategy confidence is saved.";
}

function approvalNotes(approvals: any[]) {
  if (!approvals.length) return "No owner approval request is linked yet. Approval/send controls are planned for Phase 6.";
  return approvals.map((item) => item.reason ?? item.decisionNote ?? item.status).filter(Boolean).join("; ");
}

function reportIdempotencyKey(input: { workspaceId: string; reportType: ReportType; businessDate: Date; workflowRunId: string | null }) {
  const raw = [input.workspaceId, input.reportType, formatDate(input.businessDate), input.workflowRunId ?? "no-workflow"].join(":");
  return createHash("sha256").update(raw).digest("hex");
}

function normalizeExportFormat(value: unknown): "PDF" | "DOCX" | null {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "PDF" || normalized === "DOCX") return normalized;
  return null;
}

function latestCompletedOrRecent(exports: ReportExport[], format: "PDF" | "DOCX") {
  const matching = exports.filter((item) => item.format === format);
  return matching.find((item) => item.status === "completed") ?? matching[0] ?? null;
}

async function reportExportStoragePath(input: { reportId: string; title: string; clientName: string; format: "PDF" | "DOCX" }) {
  const outputDir = path.join(process.cwd(), "public", "generated", "reports");
  await fs.mkdir(outputDir, { recursive: true });
  const extension = input.format === "PDF" ? "pdf" : "docx";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${sanitizeFileName(input.clientName)}-${sanitizeFileName(input.title)}-${input.reportId.slice(0, 8)}-${stamp}.${extension}`.slice(0, 180);
  const absolutePath = path.join(outputDir, fileName);
  const resolvedOutputDir = path.resolve(outputDir);
  const resolvedFile = path.resolve(absolutePath);
  if (!resolvedFile.startsWith(resolvedOutputDir)) {
    throw new ReportServiceError(400, "Invalid export file path.");
  }

  return {
    absolutePath: resolvedFile,
    fileName,
    publicUrl: `/generated/reports/${fileName}`,
  };
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 72)
    .toLowerCase() || "report";
}

function isReportType(value: unknown): value is ReportType {
  return typeof value === "string" && REPORT_TYPES.includes(value as ReportType);
}

function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && ["draft", "ready_for_review", "approved", "exported", "sent", "archived", "failed"].includes(value);
}

function parseBusinessDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateFilter(value: string | null | undefined) {
  const date = parseBusinessDate(value ?? undefined);
  if (!date) return null;
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return { gte: date, lt: next };
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function threeDayRange(date: Date) {
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 2);
  return `${formatDate(date)} to ${formatDate(end)}`;
}

function normalizeLimit(value: string | number | null | undefined) {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function humanize(value: string) {
  return value.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
