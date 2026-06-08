import { PrismaClient } from "./generated/client";
export type { Prisma } from "./generated/client";

type CachedPrismaClient = Partial<PrismaClient> & Pick<PrismaClient, "$disconnect">;

declare global {
  // Reuse the Prisma connection while Next.js reloads server modules in development.
  // eslint-disable-next-line no-var
  var vipPrisma: CachedPrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isCurrentClient(client: CachedPrismaClient | undefined): client is PrismaClient {
  const delegates = client as (CachedPrismaClient & Record<string, unknown>) | undefined;
  return Boolean(
    client?.workspace &&
      client.socialAccount &&
      client.socialPost &&
      client.postMetrics &&
      client.marketSignalObservation &&
      client.marketProviderCache &&
      client.marketContextSnapshot &&
      client.strategySnapshot &&
      client.recommendationStatusTransition &&
      client.recommendationOutcome &&
      client.strategyAuditEvent &&
      client.strategyOutboxEvent &&
      client.actionPlan &&
      client.actionExecution &&
      client.automationExecution &&
      client.automationRule &&
      client.automationWorkflowMapping &&
      client.automationExecutionLog &&
      client.automationOutboxEvent &&
      client.aIExecutionTrace &&
      client.workspaceMember &&
      client.aPIKey &&
      client.usageEvent &&
      client.subscriptionPlan &&
      client.hospitalIntegrationConfig &&
      client.operationalCampaign &&
      client.operationalActivityEvent &&
      client.operationalNotification &&
      client.operationalTask &&
      client.operationalRecommendationAction &&
      client.systemEndpointHealth &&
      client.systemVerificationRun &&
      client.systemVerificationCheck &&
      client.dataProvenanceSnapshot &&
      client.aiProviderHealth &&
      client.pdfExportRun &&
      client.recommendationSimilarityFingerprint &&
      delegates?.missionExecution &&
      delegates.dailyBusinessSnapshot &&
      delegates.dailyPerformanceReport &&
      delegates.strategyOutcome &&
      delegates.trendOpportunity &&
      delegates.contentBrief &&
      delegates.contentProductionPackage &&
      delegates.dailyGrowthReport &&
      delegates.reportDraft &&
      delegates.reportExport &&
      delegates.reportApproval &&
      delegates.reportRecipient &&
      delegates.reportDelivery &&
      delegates.clientOperationalSettings &&
      delegates.contentOutcome &&
      delegates.agentLearningMemory &&
      delegates.pilotQualityReview &&
      delegates.contentPlanDecision &&
      delegates.contentExecutionWindow &&
      delegates.contentExecutionDocument &&
      delegates.contentDeliveryLog
  );
}

const cachedPrisma = globalThis.vipPrisma;

if (cachedPrisma && !isCurrentClient(cachedPrisma)) {
  void cachedPrisma.$disconnect();
}

export const prisma = isCurrentClient(cachedPrisma)
  ? cachedPrisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.vipPrisma = prisma;
}

export default prisma;

export function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before running database operations.");
  }
}
