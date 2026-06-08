import { NextResponse } from "next/server";

import prisma from "@vip/database";

import {
  HARIKA_HOSPITAL_SLUG,
  HARIKA_HOSPITAL_WORKSPACE_ID,
  HARIKA_SOCIAL_WORKSPACE_ID,
  resolveHarikaSocialWorkspaceId,
} from "@/lib/harika-workspace";

const MONTH_DAYS = 30;

type Trend = "UP" | "DOWN" | "STABLE";
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const generatedAt = new Date();
  const selectedHospitalId = request.headers.get("x-hospital-id");
  const hospital = await resolveHospital(selectedHospitalId);
  const socialWorkspaceId = resolveHarikaSocialWorkspaceId(hospital.id) ?? await resolveSocialWorkspaceId(hospital);
  const since = addDays(generatedAt, -MONTH_DAYS);
  const previousSince = addDays(since, -MONTH_DAYS);

  const [
    content,
    social,
    recommendations,
    actions,
    automations,
    integrations,
    activity,
    ai,
  ] = await Promise.all([
    contentStats(hospital.id, since, previousSince),
    socialStats(socialWorkspaceId, since, previousSince),
    recommendationStats(socialWorkspaceId, since),
    actionStats(socialWorkspaceId, since),
    automationStats(socialWorkspaceId, since),
    integrationStats(hospital.id),
    recentActivity(socialWorkspaceId, hospital.id),
    aiStats(socialWorkspaceId, since),
  ]);

  const modules = [
    buildContentModule(content),
    buildLeadModule(social),
    buildStrategyModule(recommendations, actions),
    buildAutomationModule(automations, actions),
    buildIntegrationModule(integrations, ai),
  ];
  const alerts = buildAlerts(modules, content, social, recommendations, actions, automations, integrations);
  const kpis = buildKpis(content, social, recommendations, actions, automations);
  const aiRecommendations = buildRecommendations(content, social, recommendations, actions, automations, integrations);

  return NextResponse.json({
    hospital,
    generatedAt: generatedAt.toISOString(),
    executiveSummary: {
      narrative: buildNarrative(hospital.name, modules, alerts, aiRecommendations),
      wins: compact([
        social.engagementDelta >= 0 ? `Social engagement is ${signedPercent(social.engagementDelta)} vs previous period.` : null,
        content.createdThisMonth > 0 ? `${content.createdThisMonth} content items were created this month.` : null,
        recommendations.accepted > 0 ? `${recommendations.accepted} AI recommendations have been accepted.` : null,
      ]),
      risks: compact([
        content.awaitingApproval > 0 ? `${content.awaitingApproval} content items are awaiting approval.` : null,
        actions.failed > 0 ? `${actions.failed} action executions failed this period.` : null,
        automations.attentionRequired > 0 ? `${automations.attentionRequired} automations need attention.` : null,
        integrations.needsAttention > 0 ? `${integrations.needsAttention} integrations need attention.` : null,
      ]),
      opportunities: compact([
        social.topSource ? `Top acquisition source is ${social.topSource}; allocate next campaign tests there.` : null,
        recommendations.generated > 0 ? `${recommendations.generated} generated recommendations are available for prioritization.` : null,
        social.reach > 0 ? `${number(social.reach)} people reached in the current period.` : null,
      ]),
      bottlenecks: compact([
        content.scheduled > 0 && content.awaitingApproval > 0 ? "Publishing velocity is constrained by approvals." : null,
        actions.pending > 0 ? `${actions.pending} action plans are still queued or pending approval.` : null,
        integrations.connected === 0 ? "No connected integration is available for governed sync." : null,
      ]),
    },
    kpis,
    modules,
    recentActivity: activity,
    alerts,
    recommendations: aiRecommendations,
    source: {
      generatedAt: generatedAt.toISOString(),
      cacheStatus: "fresh",
    },
  });
}

async function resolveHospital(selectedHospitalId: string | null) {
  const hospital = await prisma.hospitalWorkspace.findFirst({
    where: selectedHospitalId
      ? { OR: [{ id: selectedHospitalId }, { slug: selectedHospitalId }] }
      : { OR: [{ id: HARIKA_HOSPITAL_WORKSPACE_ID }, { slug: HARIKA_HOSPITAL_SLUG }] },
    select: { id: true, name: true, slug: true, specialty: true, city: true, status: true },
  }).catch(() => null);

  return hospital ?? {
    id: HARIKA_HOSPITAL_WORKSPACE_ID,
    name: "Dr.Harika ENT care hospitals",
    slug: HARIKA_HOSPITAL_SLUG,
    specialty: "ENT care",
    city: "Hyderabad",
    status: "ACTIVE",
  };
}

async function resolveSocialWorkspaceId(hospital: { id: string; slug: string; name: string }) {
  const mapped = resolveHarikaSocialWorkspaceId(hospital.id) ?? resolveHarikaSocialWorkspaceId(hospital.slug) ?? resolveHarikaSocialWorkspaceId(hospital.name);
  if (mapped) return mapped;
  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ id: hospital.id }, { slug: hospital.slug }, { name: { equals: hospital.name, mode: "insensitive" } }] },
    select: { id: true },
  }).catch(() => null);
  return workspace?.id ?? HARIKA_SOCIAL_WORKSPACE_ID;
}

async function contentStats(hospitalId: string, since: Date, previousSince: Date) {
  const where = { hospitalId };
  const [createdThisMonth, createdPrevious, scheduled, awaitingApproval, scriptsApproved, runs, failedRuns] = await Promise.all([
    prisma.contentCalendarItem.count({ where: { ...where, createdAt: { gte: since } } }).catch(() => 0),
    prisma.contentCalendarItem.count({ where: { ...where, createdAt: { gte: previousSince, lt: since } } }).catch(() => 0),
    prisma.contentCalendarItem.count({ where: { ...where, scheduledDate: { gte: since }, status: { in: ["SCHEDULED", "READY", "APPROVED"] as never[] } } }).catch(() => 0),
    prisma.contentCalendarScript.count({ where: { hospitalId, status: "DRAFT" } }).catch(() => 0),
    prisma.contentCalendarScript.count({ where: { hospitalId, status: "APPROVED", updatedAt: { gte: since } } }).catch(() => 0),
    prisma.contentGeneratorRun.count({ where: { hospitalId, createdAt: { gte: since } } }).catch(() => 0),
    prisma.contentGeneratorRun.count({ where: { hospitalId, status: { in: ["FAILED", "REJECTED"] }, createdAt: { gte: since } } }).catch(() => 0),
  ]);
  return { createdThisMonth, createdPrevious, scheduled, awaitingApproval, scriptsApproved, generatedRuns: runs, failedRuns };
}

async function socialStats(workspaceId: string, since: Date, previousSince: Date) {
  const [posts, previousPosts, metrics, previousMetrics, accounts] = await Promise.all([
    prisma.socialPost.count({ where: { workspaceId, postedAt: { gte: since } } }).catch(() => 0),
    prisma.socialPost.count({ where: { workspaceId, postedAt: { gte: previousSince, lt: since } } }).catch(() => 0),
    prisma.postMetrics.findMany({
      where: { socialPost: { workspaceId, postedAt: { gte: since } } },
      select: { clicks: true, reach: true, impressions: true, engagementRate: true },
    }).catch(() => []),
    prisma.postMetrics.findMany({
      where: { socialPost: { workspaceId, postedAt: { gte: previousSince, lt: since } } },
      select: { engagementRate: true },
    }).catch(() => []),
    prisma.socialAccount.findMany({ where: { workspaceId }, select: { platform: true, status: true } }).catch(() => []),
  ]);
  const engagement = average(metrics.map((metric) => metric.engagementRate));
  const previousEngagement = average(previousMetrics.map((metric) => metric.engagementRate));
  const clicks = sum(metrics.map((metric) => metric.clicks));
  return {
    posts,
    previousPosts,
    reach: sum(metrics.map((metric) => metric.reach)),
    impressions: sum(metrics.map((metric) => metric.impressions)),
    clicks,
    qualifiedLeads: clicks,
    meetingsBooked: 0,
    conversionRate: clicks ? 0 : 0,
    engagement,
    engagementDelta: engagement - previousEngagement,
    topSource: accounts[0]?.platform ? titleCase(String(accounts[0].platform).toLowerCase()) : null,
    activeAccounts: accounts.filter((account) => account.status === "ACTIVE").length,
  };
}

async function recommendationStats(workspaceId: string, since: Date) {
  const [generated, accepted, rejected, implemented, top] = await Promise.all([
    prisma.aIRecommendation.count({ where: { workspaceId, generatedAt: { gte: since } } }).catch(() => 0),
    prisma.aIRecommendation.count({ where: { workspaceId, status: "ACCEPTED" } }).catch(() => 0),
    prisma.aIRecommendation.count({ where: { workspaceId, status: "REJECTED" } }).catch(() => 0),
    prisma.aIRecommendation.count({ where: { workspaceId, status: "IMPLEMENTED" } }).catch(() => 0),
    prisma.aIRecommendation.findMany({
      where: { workspaceId },
      orderBy: [{ priority: "asc" }, { score: "desc" }],
      take: 3,
      select: { id: true, title: true, summary: true, confidence: true, evidence: true },
    }).catch(() => []),
  ]);
  return { generated, accepted, rejected, implemented, top };
}

async function actionStats(workspaceId: string, since: Date) {
  const [active, pending, failed, completed] = await Promise.all([
    prisma.actionPlan.count({ where: { workspaceId, status: { in: ["QUEUED", "RUNNING", "APPROVED"] } } }).catch(() => 0),
    prisma.actionPlan.count({ where: { workspaceId, status: { in: ["DRAFT", "PENDING_APPROVAL"] } } }).catch(() => 0),
    prisma.actionExecution.count({ where: { workspaceId, status: { in: ["FAILED", "DEAD_LETTERED"] }, createdAt: { gte: since } } }).catch(() => 0),
    prisma.actionExecution.count({ where: { workspaceId, status: "COMPLETED", completedAt: { gte: since } } }).catch(() => 0),
  ]);
  return { active, pending, failed, completed };
}

async function automationStats(workspaceId: string, since: Date) {
  const [active, completedThisWeek, attentionRequired] = await Promise.all([
    prisma.automationRule.count({ where: { workspaceId, enabled: true } }).catch(() => 0),
    prisma.automationExecution.count({ where: { workspaceId, status: "COMPLETED", completedAt: { gte: addDays(new Date(), -7) } } }).catch(() => 0),
    prisma.automationExecution.count({ where: { workspaceId, status: { in: ["FAILED", "DEAD_LETTERED", "RETRYING"] }, queuedAt: { gte: since } } }).catch(() => 0),
  ]);
  return { active, completedThisWeek, attentionRequired };
}

async function integrationStats(hospitalId: string) {
  const configs = await prisma.hospitalIntegrationConfig.findMany({
    where: { hospitalId },
    select: { provider: true, apiName: true, status: true, lastSyncAt: true, lastError: true },
  }).catch(() => []);
  return {
    total: configs.length,
    connected: configs.filter((config) => config.status === "CONNECTED").length,
    needsAttention: configs.filter((config) => config.status === "NEEDS_ATTENTION" || Boolean(config.lastError)).length,
    lastSyncAt: configs.map((config) => config.lastSyncAt).filter(Boolean).sort((left, right) => right!.getTime() - left!.getTime())[0] ?? null,
  };
}

async function aiStats(workspaceId: string, since: Date) {
  const [calls, failures] = await Promise.all([
    prisma.aIExecutionTrace.count({ where: { workspaceId, startedAt: { gte: since } } }).catch(() => 0),
    prisma.aIExecutionTrace.count({ where: { workspaceId, status: "FAILED", startedAt: { gte: since } } }).catch(() => 0),
  ]);
  return { calls, failures };
}

async function recentActivity(workspaceId: string, hospitalId: string) {
  const [ops, recommendations, content, audits] = await Promise.all([
    prisma.operationalActivityEvent.findMany({ where: { workspaceId }, orderBy: { occurredAt: "desc" }, take: 5, select: { id: true, title: true, description: true, category: true, occurredAt: true, tone: true } }).catch(() => []),
    prisma.aIRecommendation.findMany({ where: { workspaceId }, orderBy: { generatedAt: "desc" }, take: 5, select: { id: true, title: true, summary: true, generatedAt: true } }).catch(() => []),
    prisma.contentCalendarItem.findMany({ where: { hospitalId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, status: true, updatedAt: true } }).catch(() => []),
    prisma.auditLog.findMany({ where: { hospitalId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, action: true, resource: true, createdAt: true } }).catch(() => []),
  ]);
  return [
    ...ops.map((item) => ({ id: `op-${item.id}`, module: item.category, title: item.title, detail: item.description, occurredAt: item.occurredAt.toISOString(), tone: toneFromText(item.tone) })),
    ...recommendations.map((item) => ({ id: `rec-${item.id}`, module: "AI", title: item.title, detail: item.summary, occurredAt: item.generatedAt.toISOString(), tone: "info" as Tone, href: "/admin#intelligence-recommendations" })),
    ...content.map((item) => ({ id: `content-${item.id}`, module: "Content", title: item.title, detail: `Status: ${item.status}`, occurredAt: item.updatedAt.toISOString(), tone: "neutral" as Tone, href: "/production/content-calendar" })),
    ...audits.map((item) => ({ id: `audit-${item.id}`, module: "Governance", title: item.action, detail: item.resource, occurredAt: item.createdAt.toISOString(), tone: "neutral" as Tone, href: "/admin/audit-logs" })),
  ].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()).slice(0, 10);
}

function buildContentModule(content: Awaited<ReturnType<typeof contentStats>>) {
  return module("content", "Content Operations", "/production/content-calendar", content.failedRuns ? "WATCH" : content.createdThisMonth ? "HEALTHY" : "EMPTY", [
    metric("Created this month", content.createdThisMonth, `${signedNumber(content.createdThisMonth - content.createdPrevious)} vs previous period`, trend(content.createdThisMonth - content.createdPrevious)),
    metric("Scheduled", content.scheduled, "Items with upcoming publish dates", "STABLE"),
    metric("Awaiting approval", content.awaitingApproval, "Draft scripts requiring review", content.awaitingApproval ? "UP" : "STABLE"),
    metric("AI content runs", content.generatedRuns, `${content.failedRuns} failed or rejected`, content.failedRuns ? "DOWN" : "STABLE"),
  ], content.scheduled, content.awaitingApproval, content.failedRuns, `${content.createdThisMonth} content items created in the last ${MONTH_DAYS} days.`, content.awaitingApproval ? "Approvals are the main content bottleneck right now." : "Content operations have no approval backlog recorded.");
}

function buildLeadModule(social: Awaited<ReturnType<typeof socialStats>>) {
  return module("lead", "Lead Acquisition", "/admin/analytics/instagram", social.reach ? "HEALTHY" : "EMPTY", [
    metric("New leads", social.clicks, "Tracked from stored social click metrics", social.clicks ? "UP" : "STABLE"),
    metric("Qualified", social.qualifiedLeads, "Qualified signal proxy from high-intent clicks", "STABLE"),
    metric("Meetings booked", social.meetingsBooked, "No booked-meeting table is connected", "STABLE"),
    metric("Conversion rate", `${social.conversionRate.toFixed(1)}%`, `Top source: ${social.topSource ?? "none recorded"}`, "STABLE"),
  ], social.activeAccounts, 0, 0, `${number(social.reach)} reach and ${percent(social.engagement)} engagement.`, social.topSource ? `${social.topSource} is the strongest recorded acquisition source.` : "Connect acquisition source data to identify the strongest channel.");
}

function buildStrategyModule(recommendations: Awaited<ReturnType<typeof recommendationStats>>, actions: Awaited<ReturnType<typeof actionStats>>) {
  return module("strategy", "Strategy & Recommendations", "/admin#intelligence-recommendations", actions.failed ? "WATCH" : recommendations.generated ? "HEALTHY" : "EMPTY", [
    metric("Generated", recommendations.generated, "AI recommendations in current period", recommendations.generated ? "UP" : "STABLE"),
    metric("Accepted", recommendations.accepted, "Recommendations approved for action", recommendations.accepted ? "UP" : "STABLE"),
    metric("Implemented", recommendations.implemented, "Recommendations marked implemented", recommendations.implemented ? "UP" : "STABLE"),
    metric("Rejected", recommendations.rejected, "Rejected recommendations", recommendations.rejected ? "DOWN" : "STABLE"),
  ], actions.active, actions.pending, actions.failed, `${actions.completed} action executions completed this period.`, recommendations.top[0] ? `Highest priority recommendation: ${recommendations.top[0].title}` : "No recommendation backlog is recorded.");
}

function buildAutomationModule(automations: Awaited<ReturnType<typeof automationStats>>, actions: Awaited<ReturnType<typeof actionStats>>) {
  return module("automation", "Automation & Execution", "/admin/automation", automations.attentionRequired || actions.failed ? "CRITICAL" : automations.active ? "HEALTHY" : "EMPTY", [
    metric("Active rules", automations.active, "Enabled automation rules", automations.active ? "UP" : "STABLE"),
    metric("Completed this week", automations.completedThisWeek, "Automation runs completed", automations.completedThisWeek ? "UP" : "STABLE"),
    metric("Failed actions", actions.failed, "Failed or dead-letter action executions", actions.failed ? "DOWN" : "STABLE"),
    metric("Pending actions", actions.pending, "Draft or pending approval action plans", actions.pending ? "UP" : "STABLE"),
  ], automations.active + actions.active, actions.pending, automations.attentionRequired + actions.failed, `${automations.completedThisWeek} automations completed this week.`, automations.attentionRequired ? "Automation failures should be reviewed before adding new rules." : "Automation execution has no current failure backlog recorded.");
}

function buildIntegrationModule(integrations: Awaited<ReturnType<typeof integrationStats>>, ai: Awaited<ReturnType<typeof aiStats>>) {
  return module("integrations", "Integrations & AI Reliability", "/admin/integrations/health", integrations.needsAttention || ai.failures ? "WATCH" : integrations.connected ? "HEALTHY" : "EMPTY", [
    metric("Connected APIs", integrations.connected, `${integrations.total} configured`, integrations.connected ? "UP" : "STABLE"),
    metric("Needs attention", integrations.needsAttention, "Integration records with errors or attention status", integrations.needsAttention ? "DOWN" : "STABLE"),
    metric("AI calls", ai.calls, "AI execution traces this period", ai.calls ? "UP" : "STABLE"),
    metric("AI failures", ai.failures, "Failed AI execution traces", ai.failures ? "DOWN" : "STABLE"),
  ], integrations.connected, integrations.needsAttention, integrations.needsAttention + ai.failures, integrations.lastSyncAt ? `Last integration sync: ${integrations.lastSyncAt.toLocaleString()}.` : "No integration sync timestamp recorded.", ai.failures ? "AI failures need review before relying on new generated actions." : "AI reliability has no failures recorded in the current period.");
}

function buildKpis(content: Awaited<ReturnType<typeof contentStats>>, social: Awaited<ReturnType<typeof socialStats>>, recommendations: Awaited<ReturnType<typeof recommendationStats>>, actions: Awaited<ReturnType<typeof actionStats>>, automations: Awaited<ReturnType<typeof automationStats>>) {
  return [
    kpi("content", "Content Created", content.createdThisMonth, `${signedNumber(content.createdThisMonth - content.createdPrevious)} vs previous period`, trend(content.createdThisMonth - content.createdPrevious), content.createdThisMonth >= content.createdPrevious ? "success" : "warning"),
    kpi("leads", "New Leads", social.clicks, "From stored high-intent social clicks", social.clicks ? "UP" : "STABLE", social.clicks ? "success" : "neutral"),
    kpi("recommendations", "AI Recommendations", recommendations.generated, `${recommendations.accepted} accepted`, recommendations.generated ? "UP" : "STABLE", recommendations.generated ? "info" : "neutral"),
    kpi("execution", "Pending Work", actions.pending + content.awaitingApproval, `${actions.failed + automations.attentionRequired} critical`, actions.pending || content.awaitingApproval ? "UP" : "STABLE", actions.failed || automations.attentionRequired ? "danger" : "warning"),
  ];
}

function buildAlerts(modules: ReturnType<typeof module>[], content: Awaited<ReturnType<typeof contentStats>>, social: Awaited<ReturnType<typeof socialStats>>, recommendations: Awaited<ReturnType<typeof recommendationStats>>, actions: Awaited<ReturnType<typeof actionStats>>, automations: Awaited<ReturnType<typeof automationStats>>, integrations: Awaited<ReturnType<typeof integrationStats>>) {
  return compact([
    content.awaitingApproval ? priority("content-approval", "Content approvals pending", "Content Operations", `${content.awaitingApproval} scripts are awaiting approval.`, "HIGH", "/production/content-calendar") : null,
    actions.failed ? priority("failed-actions", "Failed action executions", "Automation & Execution", `${actions.failed} action executions failed this period.`, "HIGH", "/admin/automation") : null,
    automations.attentionRequired ? priority("automation-attention", "Automation attention required", "Automation & Execution", `${automations.attentionRequired} automation runs need review.`, "HIGH", "/admin/automation") : null,
    integrations.needsAttention ? priority("integration-health", "Integration needs attention", "Integrations", `${integrations.needsAttention} configured APIs have health issues.`, "MEDIUM", "/admin/integrations/health") : null,
    social.reach === 0 ? priority("social-data", "No current social reach", "Lead Acquisition", "No reach is recorded for the current period.", "MEDIUM", "/admin/analytics/instagram") : null,
    recommendations.generated === 0 ? priority("recommendation-gap", "No current AI recommendations", "Strategy", "No recommendations were generated in the current period.", "LOW", "/admin#intelligence-recommendations") : null,
    ...modules.filter((item) => item.status === "CRITICAL").map((item) => priority(`${item.id}-critical`, `${item.title} critical`, item.title, item.performanceIndicator, "HIGH", item.href)),
  ]).slice(0, 8);
}

function buildRecommendations(content: Awaited<ReturnType<typeof contentStats>>, social: Awaited<ReturnType<typeof socialStats>>, recommendations: Awaited<ReturnType<typeof recommendationStats>>, actions: Awaited<ReturnType<typeof actionStats>>, automations: Awaited<ReturnType<typeof automationStats>>, integrations: Awaited<ReturnType<typeof integrationStats>>) {
  const stored = recommendations.top.map((item) => ({
    id: item.id,
    title: item.title,
    action: item.summary,
    confidence: Math.round(item.confidence * 100),
    evidence: evidenceText(item.evidence) || "Stored recommendation evidence",
    href: "/admin#intelligence-recommendations",
  }));
  return [
    ...stored,
    ...(content.awaitingApproval ? [{ id: "approval", title: "Clear approval backlog", action: "Review and approve pending scripts before creating more content.", confidence: 88, evidence: `${content.awaitingApproval} scripts awaiting approval`, href: "/production/content-calendar" }] : []),
    ...(social.topSource ? [{ id: "source", title: `Double down on ${social.topSource}`, action: "Use the top acquisition source for the next content and lead test.", confidence: 82, evidence: `${number(social.reach)} reach and ${social.clicks} high-intent clicks`, href: "/admin/analytics/instagram" }] : []),
    ...(automations.attentionRequired || actions.failed ? [{ id: "automation", title: "Stabilize failed execution paths", action: "Resolve failed automations and action executions before scaling new workflows.", confidence: 91, evidence: `${automations.attentionRequired + actions.failed} execution issues`, href: "/admin/automation" }] : []),
    ...(integrations.needsAttention ? [{ id: "integrations", title: "Repair unhealthy integrations", action: "Validate credentials and sync state for APIs marked as needing attention.", confidence: 86, evidence: `${integrations.needsAttention} integration health issues`, href: "/admin/integrations/health" }] : []),
  ].slice(0, 6);
}

function buildNarrative(hospitalName: string, modules: ReturnType<typeof module>[], alerts: ReturnType<typeof priority>[], recommendations: Array<{ title: string }>) {
  const healthy = modules.filter((item) => item.status === "HEALTHY").length;
  const watch = modules.filter((item) => item.status === "WATCH" || item.status === "CRITICAL").length;
  const next = recommendations[0]?.title ?? "review module scorecards";
  return `${hospitalName} has ${healthy} healthy modules and ${watch} modules needing attention. ${alerts.length} cross-platform priorities are active. Next best action: ${next}.`;
}

function module(id: string, title: string, href: string, status: "HEALTHY" | "WATCH" | "CRITICAL" | "EMPTY", metrics: Array<{ label: string; value: string; detail: string; trend: Trend }>, activeItems: number, pendingItems: number, criticalAlerts: number, performanceIndicator: string, aiInsight: string) {
  return { id, title, href, status, metrics, activeItems, pendingItems, criticalAlerts, performanceIndicator, aiInsight };
}

function metric(label: string, value: string | number, detail: string, trendValue: Trend) {
  return { label, value: typeof value === "number" ? number(value) : value, detail, trend: trendValue };
}

function kpi(id: string, label: string, value: string | number, comparison: string, trendValue: Trend, tone: Tone) {
  return { id, label, value: typeof value === "number" ? number(value) : value, comparison, trend: trendValue, tone };
}

function priority(id: string, title: string, moduleName: string, detail: string, priorityValue: "HIGH" | "MEDIUM" | "LOW", href: string) {
  return { id, title, module: moduleName, detail, priority: priorityValue, href };
}

function evidenceText(value: unknown) {
  if (Array.isArray(value)) return value.slice(0, 2).map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("; ");
  if (value && typeof value === "object") return JSON.stringify(value).slice(0, 140);
  return typeof value === "string" ? value : "";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function trend(value: number): Trend {
  if (value > 0) return "UP";
  if (value < 0) return "DOWN";
  return "STABLE";
}

function signedNumber(value: number) {
  return `${value >= 0 ? "+" : ""}${number(value)}`;
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${percent(value)}`;
}

function number(value: number) {
  return Math.round(value).toLocaleString("en-IN");
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneFromText(value: string): Tone {
  const normalized = value.toLowerCase();
  if (normalized.includes("danger") || normalized.includes("error") || normalized.includes("fail")) return "danger";
  if (normalized.includes("warning") || normalized.includes("risk")) return "warning";
  if (normalized.includes("success") || normalized.includes("ready")) return "success";
  return "info";
}

function compact<T>(items: Array<T | null | undefined | false>) {
  return items.filter(Boolean) as T[];
}
