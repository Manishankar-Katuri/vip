import { prisma } from "@vip/database";

const MISSION_TYPE = "DAILY_GROWTH_MISSION";
const PILOT_DAYS = [1, 2, 3, 7];

type Db = typeof prisma & Record<string, any>;

export async function getPilotOperations(workspaceId: string) {
  const db = prisma as Db;
  const executions = await db.missionExecution.findMany({
    where: { workspaceId, missionType: MISSION_TYPE },
    orderBy: { businessDate: "asc" },
    take: 14,
    include: {
      dailyGrowthReports: true,
      contentProductionPackages: true,
      contentBriefs: true,
      trendOpportunities: true,
      contentOutcomes: true,
      businessSnapshots: true,
    },
  });
  const latest = executions.at(-1) ?? null;
  const [events, reviews, learning, tasks, approvals, traces] = await Promise.all([
    latest ? db.eventEnvelope.findMany({ where: { workspaceId, aggregateType: MISSION_TYPE, aggregateId: latest.id }, orderBy: { sequence: "asc" } }) : Promise.resolve([]),
    db.pilotQualityReview.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []),
    db.agentLearningMemory.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 50 }),
    db.operationalTask.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.approvalRequest.findMany({ where: { workspaceId }, orderBy: { requestedAt: "desc" }, take: 100 }),
    db.aIExecutionTrace.findMany({ where: { workspaceId, operation: "daily_growth_content_production" }, orderBy: { startedAt: "desc" }, take: 50 }).catch(() => []),
  ]);
  const compared = comparePilotDays(executions);
  const scorecard = buildScorecard({ executions, reviews, learning, approvals, traces });
  return {
    latest,
    executions,
    events,
    reviews,
    learning,
    tasks,
    approvals,
    traces,
    compared,
    scorecard,
    exitCriteria: exitCriteria(scorecard, executions),
  };
}

export async function savePilotQualityReview(input: {
  workspaceId: string;
  missionExecutionId: string;
  targetType: "REPORT" | "CONTENT_PACKAGE";
  targetId: string;
  reviewerRole?: string;
  reviewerId?: string;
  accuracy?: number;
  relevance?: number;
  actionability?: number;
  hookQuality?: number;
  scriptQuality?: number;
  ctaQuality?: number;
  brandAlignment?: number;
  comments?: string;
}) {
  const db = prisma as Db;
  return db.pilotQualityReview.create({
    data: {
      workspaceId: input.workspaceId,
      missionExecutionId: input.missionExecutionId,
      targetType: input.targetType,
      targetId: input.targetId,
      reviewerRole: input.reviewerRole ?? "pilot_reviewer",
      reviewerId: input.reviewerId,
      accuracy: score(input.accuracy),
      relevance: score(input.relevance),
      actionability: score(input.actionability),
      hookQuality: score(input.hookQuality),
      scriptQuality: score(input.scriptQuality),
      ctaQuality: score(input.ctaQuality),
      brandAlignment: score(input.brandAlignment),
      comments: input.comments,
      metadata: { source: "pilot-operations-console" },
    },
  });
}

export function reportQualityScore(report: any, review?: any) {
  if (review) return average([review.accuracy, review.relevance, review.actionability].map(scaleReview));
  const sections = Array.isArray(report?.sections) ? report.sections : [];
  const completeness = Math.min(100, sections.length * 7);
  const relevance = sections.some((section: any) => JSON.stringify(section).includes("Performance")) ? 80 : 55;
  const actionability = sections.some((section: any) => JSON.stringify(section).includes("Production")) ? 82 : 50;
  return Math.round(average([completeness, relevance, actionability]));
}

export function contentQualityScore(pkg: any, review?: any) {
  if (review) return average([review.hookQuality, review.scriptQuality, review.ctaQuality, review.brandAlignment].map(scaleReview));
  const hook = String(pkg?.hook ?? "");
  const script = String(pkg?.fullScript ?? "");
  const cta = String(pkg?.cta ?? "");
  const brand = pkg?.publishingPayload?.generationMetadata?.provider === "openai" ? 82 : 66;
  return Math.round(average([
    hook.length > 15 ? 78 : 45,
    script.length > 120 ? 82 : 50,
    cta.length > 8 ? 80 : 45,
    brand,
  ]));
}

export function strategyQualityScore(execution: any) {
  const opportunity = execution?.trendOpportunities?.[0];
  if (!opportunity) return 0;
  return Math.round(average([
    Number(opportunity.priorityScore ?? 0),
    Number(opportunity.growthScore ?? 0),
    Number(opportunity.confidenceScore ?? 0) * 100,
  ]));
}

function buildScorecard(input: { executions: any[]; reviews: any[]; learning: any[]; approvals: any[]; traces: any[] }) {
  const completed = input.executions.filter((execution) => execution.status === "COMPLETED").length;
  const failed = input.executions.filter((execution) => execution.status === "FAILED").length;
  const reliability = input.executions.length ? Math.round((completed / input.executions.length) * 100 - failed * 8) : 0;
  const reportScores = input.executions.flatMap((execution) => execution.dailyGrowthReports.map((report: any) => reportQualityScore(report, reviewFor(input.reviews, "REPORT", report.id))));
  const contentScores = input.executions.flatMap((execution) => execution.contentProductionPackages.map((pkg: any) => contentQualityScore(pkg, reviewFor(input.reviews, "CONTENT_PACKAGE", pkg.id))));
  const strategyScores = input.executions.map(strategyQualityScore).filter(Boolean);
  const learningEffectiveness = Math.min(100, input.learning.length * 8 + recommendationEvolution(input.executions) * 12);
  const aiErrors = input.traces.filter((trace) => trace.status === "FAILED").length;
  const approvalPenalty = input.approvals.filter((approval) => approval.status === "PENDING").length * 2;
  const intelligenceQuality = Math.max(0, Math.round(average([...reportScores, ...strategyScores]) - aiErrors * 4));
  const contentQuality = Math.round(average(contentScores));
  const overall = Math.round(average([reliability, intelligenceQuality, learningEffectiveness, contentQuality]) - approvalPenalty);
  return {
    missionReliabilityScore: clamp(reliability, 0, 100),
    intelligenceQualityScore: clamp(intelligenceQuality, 0, 100),
    learningEffectivenessScore: clamp(learningEffectiveness, 0, 100),
    contentQualityScore: clamp(contentQuality, 0, 100),
    overallPilotScore: clamp(overall, 0, 100),
  };
}

function comparePilotDays(executions: any[]) {
  return PILOT_DAYS.map((day) => {
    const execution = executions[day - 1];
    const previous = day > 1 ? executions[day - 2] : null;
    return {
      day,
      execution,
      strategyChange: diffText(previous?.trendOpportunities?.[0]?.title, execution?.trendOpportunities?.[0]?.title),
      contentChange: diffText(previous?.contentProductionPackages?.[0]?.hook, execution?.contentProductionPackages?.[0]?.hook),
      learningChange: execution?.contentBriefs?.[0]?.inputs?.learningContext ? "Learning context injected" : "No learning context captured",
      kpiPredictionChange: diffText(JSON.stringify(previous?.contentProductionPackages?.[0]?.targetKpi ?? {}), JSON.stringify(execution?.contentProductionPackages?.[0]?.targetKpi ?? {})),
    };
  });
}

function exitCriteria(scorecard: ReturnType<typeof buildScorecard>, executions: any[]) {
  const sevenDayCoverage = executions.length >= 7;
  const completed = executions.filter((execution) => execution.status === "COMPLETED").length;
  if (scorecard.overallPilotScore >= 88 && sevenDayCoverage && completed >= 7) return "PRODUCTION READY";
  if (scorecard.overallPilotScore >= 70 && executions.length >= 3) return "PILOT READY";
  return "NOT READY";
}

function recommendationEvolution(executions: any[]) {
  const titles = new Set(executions.map((execution) => execution.trendOpportunities?.[0]?.title).filter(Boolean));
  return titles.size;
}

function reviewFor(reviews: any[], targetType: string, targetId: string) {
  return reviews.find((review) => review.targetType === targetType && review.targetId === targetId);
}

function diffText(previous?: string, current?: string) {
  if (!current) return "No data";
  if (!previous) return current;
  return previous === current ? "No change" : `${previous} -> ${current}`;
}

function score(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function scaleReview(value: unknown) {
  return typeof value === "number" ? value * 20 : 0;
}

function average(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value) && value > 0);
  return finite.length ? finite.reduce((total, value) => total + value, 0) / finite.length : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
