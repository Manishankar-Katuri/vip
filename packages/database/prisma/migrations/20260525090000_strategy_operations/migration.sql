-- CreateEnum
CREATE TYPE "RecommendationLifecycleStatus" AS ENUM ('GENERATED', 'VIEWED', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecommendationOutcomeStatus" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "StrategyActorType" AS ENUM ('USER', 'SYSTEM', 'AI_COPILOT', 'AGENT', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "StrategyEventStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- AlterTable
ALTER TABLE "AIRecommendation"
ADD COLUMN "strategySnapshotId" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "adaptiveConfidence" DOUBLE PRECISION,
ADD COLUMN "actions" JSONB,
ADD COLUMN "expectedOutcome" TEXT,
ADD COLUMN "explanation" JSONB,
ADD COLUMN "evidence" JSONB,
ADD COLUMN "dashboardData" JSONB,
ADD COLUMN "scoreFactors" JSONB,
ADD COLUMN "status" "RecommendationLifecycleStatus" NOT NULL DEFAULT 'GENERATED',
ADD COLUMN "viewedAt" TIMESTAMP(3),
ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "implementedAt" TIMESTAMP(3),
ADD COLUMN "expiredAt" TIMESTAMP(3),
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "implementationProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "implementationNotes" TEXT,
ADD COLUMN "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "StrategySnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "periodStartsAt" TIMESTAMP(3) NOT NULL,
    "periodEndsAt" TIMESTAMP(3) NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "signalCoverage" JSONB NOT NULL,
    "watchlist" JSONB NOT NULL,
    "dashboard" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationStatusTransition" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "fromStatus" "RecommendationLifecycleStatus",
    "toStatus" "RecommendationLifecycleStatus" NOT NULL,
    "actorType" "StrategyActorType" NOT NULL,
    "actorId" TEXT,
    "actorMetadata" JSONB,
    "note" TEXT,
    "progress" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationStatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationOutcome" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "outcome" "RecommendationOutcomeStatus" NOT NULL,
    "engagementBaseline" DOUBLE PRECISION,
    "engagementCurrent" DOUBLE PRECISION,
    "engagementDelta" DOUBLE PRECISION,
    "engagementDeltaPercent" DOUBLE PRECISION,
    "effectivenessScore" DOUBLE PRECISION NOT NULL,
    "confidenceBefore" DOUBLE PRECISION NOT NULL,
    "confidenceAfter" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyAuditEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "strategySnapshotId" TEXT,
    "action" TEXT NOT NULL,
    "actorType" "StrategyActorType" NOT NULL,
    "actorId" TEXT,
    "actorMetadata" JSONB,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyOutboxEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "strategySnapshotId" TEXT,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "StrategyEventStatus" NOT NULL DEFAULT 'PENDING',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "StrategyOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIRecommendation_workspaceId_status_score_idx" ON "AIRecommendation"("workspaceId", "status", "score");
CREATE INDEX "AIRecommendation_workspaceId_category_generatedAt_idx" ON "AIRecommendation"("workspaceId", "category", "generatedAt");
CREATE INDEX "AIRecommendation_strategySnapshotId_idx" ON "AIRecommendation"("strategySnapshotId");
CREATE INDEX "StrategySnapshot_workspaceId_generatedAt_idx" ON "StrategySnapshot"("workspaceId", "generatedAt");
CREATE INDEX "StrategySnapshot_workspaceId_periodStartsAt_periodEndsAt_idx" ON "StrategySnapshot"("workspaceId", "periodStartsAt", "periodEndsAt");
CREATE INDEX "RecommendationStatusTransition_workspaceId_occurredAt_idx" ON "RecommendationStatusTransition"("workspaceId", "occurredAt");
CREATE INDEX "RecommendationStatusTransition_recommendationId_occurredAt_idx" ON "RecommendationStatusTransition"("recommendationId", "occurredAt");
CREATE INDEX "RecommendationOutcome_workspaceId_observedAt_idx" ON "RecommendationOutcome"("workspaceId", "observedAt");
CREATE INDEX "RecommendationOutcome_recommendationId_observedAt_idx" ON "RecommendationOutcome"("recommendationId", "observedAt");
CREATE INDEX "RecommendationOutcome_workspaceId_outcome_observedAt_idx" ON "RecommendationOutcome"("workspaceId", "outcome", "observedAt");
CREATE INDEX "StrategyAuditEvent_workspaceId_createdAt_idx" ON "StrategyAuditEvent"("workspaceId", "createdAt");
CREATE INDEX "StrategyAuditEvent_recommendationId_createdAt_idx" ON "StrategyAuditEvent"("recommendationId", "createdAt");
CREATE INDEX "StrategyAuditEvent_strategySnapshotId_createdAt_idx" ON "StrategyAuditEvent"("strategySnapshotId", "createdAt");
CREATE INDEX "StrategyOutboxEvent_status_occurredAt_idx" ON "StrategyOutboxEvent"("status", "occurredAt");
CREATE INDEX "StrategyOutboxEvent_workspaceId_occurredAt_idx" ON "StrategyOutboxEvent"("workspaceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_strategySnapshotId_fkey" FOREIGN KEY ("strategySnapshotId") REFERENCES "StrategySnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StrategySnapshot" ADD CONSTRAINT "StrategySnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationStatusTransition" ADD CONSTRAINT "RecommendationStatusTransition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationStatusTransition" ADD CONSTRAINT "RecommendationStatusTransition_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationOutcome" ADD CONSTRAINT "RecommendationOutcome_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationOutcome" ADD CONSTRAINT "RecommendationOutcome_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyAuditEvent" ADD CONSTRAINT "StrategyAuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyAuditEvent" ADD CONSTRAINT "StrategyAuditEvent_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyAuditEvent" ADD CONSTRAINT "StrategyAuditEvent_strategySnapshotId_fkey" FOREIGN KEY ("strategySnapshotId") REFERENCES "StrategySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyOutboxEvent" ADD CONSTRAINT "StrategyOutboxEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyOutboxEvent" ADD CONSTRAINT "StrategyOutboxEvent_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyOutboxEvent" ADD CONSTRAINT "StrategyOutboxEvent_strategySnapshotId_fkey" FOREIGN KEY ("strategySnapshotId") REFERENCES "StrategySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
