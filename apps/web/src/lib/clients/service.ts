import { prisma } from "@vip/database";

import type { ReportListItem, ReportRecipient, ReportStatus, ReportType } from "@/lib/reports/types";
import { REPORT_TYPES } from "@/lib/reports/types";
import { listReports } from "@/lib/reports";
import { toWorkflowListItem } from "@/lib/workflows/mapper";
import { listWorkflows } from "@/lib/workflows";
import type { WorkflowListItem } from "@/lib/workflows/types";
import { buildOwnerClient, mergeClientSettings, normalizeClientSettings, setupWarningsForClient } from "./mapper";
import type { ClientSettingsPatch, OwnerClientDetailResponse, OwnerClientListResponse, OwnerClientStatus } from "./types";

type Db = typeof prisma & Record<string, any>;

type ClientQuery = {
  status?: string | null;
  search?: string | null;
  limit?: string | number | null;
};

export class ClientServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function listOwnerClients(query: ClientQuery = {}): Promise<OwnerClientListResponse> {
  const db = prisma as Db;
  const limit = normalizeLimit(query.limit);
  const search = sanitizeSearch(query.search);
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { id: { contains: search } },
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const workspaces = await (db.workspace as any).findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { clientOperationalSettings: true },
  });

  const aggregate = await loadClientAggregate(db, workspaces);
  const clients = workspaces
    .map((workspace: any) => buildOwnerClient({
      workspace,
      hospital: aggregate.hospitalsByWorkspaceId.get(workspace.id) ?? null,
      settings: workspace.clientOperationalSettings ?? null,
      workflows: aggregate.workflows,
      reports: aggregate.reports,
      recipients: aggregate.recipients,
      integrations: aggregate.integrationsByWorkspaceId.get(workspace.id) ?? [],
    }))
    .filter((client: ReturnType<typeof buildOwnerClient>) => !isClientStatus(query.status) || client.status === query.status);

  return {
    clients,
    filters: {
      status: query.status ?? null,
      search: query.search ?? null,
      limit,
    },
  };
}

export async function getOwnerClient(clientId: string): Promise<OwnerClientDetailResponse | null> {
  const db = prisma as Db;
  const workspace = await findWorkspace(db, clientId, true);
  if (!workspace) return null;

  const aggregate = await loadClientAggregate(db, [workspace]);
  const client = buildOwnerClient({
    workspace,
    hospital: aggregate.hospitalsByWorkspaceId.get(workspace.id) ?? null,
    settings: workspace.clientOperationalSettings ?? null,
    workflows: aggregate.workflows,
    reports: aggregate.reports,
    recipients: aggregate.recipients,
    integrations: aggregate.integrationsByWorkspaceId.get(workspace.id) ?? [],
  });

  const [recentWorkflows, recentReports] = await Promise.all([
    listWorkflows({ clientId: workspace.id, limit: 10 }).catch(() => ({ workflows: [] as WorkflowListItem[] })),
    listReports({ clientId: workspace.id, limit: 10 }).catch(() => ({ reports: [] as ReportListItem[] })),
  ]);

  return {
    client,
    recipients: aggregate.recipients.filter((recipient) => recipient.workspaceId === workspace.id),
    recentWorkflows: recentWorkflows.workflows,
    recentReports: recentReports.reports,
    integrationHealth: client.integrationHealth,
    setupWarnings: setupWarningsForClient(client),
  };
}

export async function patchOwnerClient(clientId: string, patch: ClientSettingsPatch): Promise<OwnerClientDetailResponse | null> {
  const db = prisma as Db;
  const workspace = await findWorkspace(db, clientId, true);
  if (!workspace) return null;

  const existing = normalizeClientSettings(workspace.clientOperationalSettings ?? null);
  const merged = mergeClientSettings(existing, patch);
  await db.clientOperationalSettings.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      status: merged.status,
      businessType: merged.businessType,
      location: merged.location,
      timezone: merged.timezone,
      workflowSchedule: merged.workflowSchedule,
      approvalPolicy: merged.approvalPolicy,
      reportPreferences: merged.reportPreferences,
    },
    update: {
      status: merged.status,
      businessType: merged.businessType,
      location: merged.location,
      timezone: merged.timezone,
      workflowSchedule: merged.workflowSchedule,
      approvalPolicy: merged.approvalPolicy,
      reportPreferences: merged.reportPreferences,
    },
  });

  return getOwnerClient(workspace.id);
}

async function loadClientAggregate(db: Db, workspaces: any[]) {
  const workspaceIds = workspaces.map((workspace) => workspace.id);
  if (!workspaceIds.length) {
    return {
      workflows: [] as WorkflowListItem[],
      reports: [] as ReportListItem[],
      recipients: [] as ReportRecipient[],
      hospitalsByWorkspaceId: new Map<string, any>(),
      integrationsByWorkspaceId: new Map<string, any[]>(),
    };
  }

  const [runs, reports, recipients, deliveries, hospitals] = await Promise.all([
    db.missionExecution.findMany({
      where: { workspaceId: { in: workspaceIds }, missionType: "DAILY_GROWTH_MISSION" },
      orderBy: [{ businessDate: "desc" }, { updatedAt: "desc" }],
      take: Math.min(workspaceIds.length * 10, 500),
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        dailyGrowthReports: true,
        contentProductionPackages: true,
      },
    }).catch(() => []),
    db.reportDraft.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: [{ generatedAt: "desc" }, { updatedAt: "desc" }],
      take: Math.min(workspaceIds.length * 25, 1000),
      include: { workspace: { select: { id: true, name: true, slug: true } } },
    }).catch(() => []),
    db.reportRecipient.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }).catch(() => []),
    db.reportDelivery.findMany({
      where: { workspaceId: { in: workspaceIds }, status: "failed" },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }).catch(() => []),
    findHospitalsForWorkspaces(db, workspaces),
  ]);

  const hospitalsByWorkspaceId = matchHospitalsToWorkspaces(workspaces, hospitals);
  const integrationsByWorkspaceId = await loadIntegrationsByWorkspace(db, hospitalsByWorkspaceId);
  const mappedReports = reports.map(mapReportListItem);
  const failedDeliveryReports = deliveries.map((delivery: any) => mapFailedDeliveryToReport(delivery, workspaces.find((workspace) => workspace.id === delivery.workspaceId)));

  return {
    workflows: runs.map((run: any) => toWorkflowListItem({ run })),
    reports: [...mappedReports, ...failedDeliveryReports],
    recipients: recipients.map(mapReportRecipient),
    hospitalsByWorkspaceId,
    integrationsByWorkspaceId,
  };
}

async function findWorkspace(db: Db, clientId: string, includeSettings = false) {
  const id = decodeURIComponent(clientId).trim();
  if (!id) return null;
  return (db.workspace as any).findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
        { name: { equals: id, mode: "insensitive" } },
      ],
    },
    include: includeSettings ? { clientOperationalSettings: true } : undefined,
  });
}

async function findHospitalsForWorkspaces(db: Db, workspaces: any[]) {
  const values = unique([
    ...workspaces.map((workspace) => workspace.id),
    ...workspaces.map((workspace) => workspace.slug),
    ...workspaces.map((workspace) => workspace.name),
  ].filter(Boolean).map(String));
  if (!values.length) return [];
  return db.hospitalWorkspace.findMany({
    where: {
      OR: [
        { id: { in: values } },
        { slug: { in: values } },
        { name: { in: values } },
        { hospitalName: { in: values } },
      ],
    },
    take: 500,
  }).catch(() => []);
}

function matchHospitalsToWorkspaces(workspaces: any[], hospitals: any[]) {
  const byWorkspaceId = new Map<string, any>();
  for (const workspace of workspaces) {
    const hospital = hospitals.find((item) =>
      item.id === workspace.id ||
      item.slug === workspace.slug ||
      item.name === workspace.name ||
      item.hospitalName === workspace.name
    );
    if (hospital) byWorkspaceId.set(workspace.id, hospital);
  }
  return byWorkspaceId;
}

async function loadIntegrationsByWorkspace(db: Db, hospitalsByWorkspaceId: Map<string, any>) {
  const hospitalIds = unique([...hospitalsByWorkspaceId.values()].map((hospital) => hospital.id).filter(Boolean));
  const byWorkspaceId = new Map<string, any[]>();
  if (!hospitalIds.length) return byWorkspaceId;
  const configs = await db.hospitalIntegrationConfig.findMany({
    where: { hospitalId: { in: hospitalIds } },
    orderBy: { updatedAt: "desc" },
  }).catch(() => []);
  for (const [workspaceId, hospital] of hospitalsByWorkspaceId.entries()) {
    byWorkspaceId.set(workspaceId, configs.filter((config: any) => config.hospitalId === hospital.id));
  }
  return byWorkspaceId;
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
    createdAt: iso(draft.createdAt),
    updatedAt: iso(draft.updatedAt),
    generatedAt: isoOrNull(draft.generatedAt),
    editedAt: isoOrNull(draft.editedAt),
    approvalStatus: String(draft.approvalStatus ?? "not_requested").toLowerCase(),
    exportStatus: String(draft.exportStatus ?? "not_exported").toLowerCase(),
    sentStatus: String(draft.sentStatus ?? "not_sent").toLowerCase(),
    pdfUrl: draft.pdfUrl ?? null,
    docxUrl: draft.docxUrl ?? null,
    summary: draft.summary ?? "",
  };
}

function mapFailedDeliveryToReport(delivery: any, workspace: any): ReportListItem {
  return {
    id: `failed-delivery-${delivery.id}`,
    clientId: delivery.workspaceId,
    workspaceId: delivery.workspaceId,
    clientName: workspace?.name ?? "Unknown client",
    workflowRunId: null,
    reportType: "DAILY_ANALYTICS_REPORT",
    title: "Failed report delivery",
    status: "failed",
    createdAt: iso(delivery.createdAt),
    updatedAt: iso(delivery.updatedAt ?? delivery.createdAt),
    generatedAt: null,
    editedAt: null,
    approvalStatus: "approved",
    exportStatus: "exported",
    sentStatus: "failed",
    pdfUrl: null,
    docxUrl: null,
    summary: delivery.errorMessage ?? "A report delivery failed for this client.",
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
    createdAt: iso(item.createdAt),
    updatedAt: iso(item.updatedAt),
  };
}

function isClientStatus(value: unknown): value is OwnerClientStatus {
  return value === "active" || value === "inactive" || value === "setup_needed";
}

function isReportType(value: unknown): value is ReportType {
  return typeof value === "string" && REPORT_TYPES.includes(value as ReportType);
}

function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && ["draft", "ready_for_review", "approved", "exported", "sent", "archived", "failed"].includes(value);
}

function normalizeLimit(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? "50"), 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(100, parsed));
}

function sanitizeSearch(value: string | null | undefined) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 120) : "";
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function iso(value: Date | string | null | undefined) {
  return isoOrNull(value) ?? new Date(0).toISOString();
}

function isoOrNull(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
