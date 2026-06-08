-- CreateTable
CREATE TABLE "MissionExecution" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionType" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "currentPhase" TEXT NOT NULL DEFAULT 'SCHEDULER',
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "traceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "startedEventId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "replayCursor" INTEGER NOT NULL DEFAULT 0,
    "phaseState" JSONB NOT NULL DEFAULT '{}',
    "emittedEventIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBusinessSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "sourceStatuses" JSONB NOT NULL DEFAULT '{}',
    "analytics" JSONB NOT NULL DEFAULT '{}',
    "reviews" JSONB NOT NULL DEFAULT '{}',
    "competitors" JSONB NOT NULL DEFAULT '{}',
    "trends" JSONB NOT NULL DEFAULT '{}',
    "calendar" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBusinessSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPerformanceReport" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyOutcome" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "previousStrategies" JSONB NOT NULL DEFAULT '[]',
    "actualResults" JSONB NOT NULL DEFAULT '{}',
    "repeatActions" JSONB NOT NULL DEFAULT '[]',
    "stopActions" JSONB NOT NULL DEFAULT '[]',
    "patterns" JSONB NOT NULL DEFAULT '[]',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendOpportunity" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "signals" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBrief" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "trendOpportunityId" TEXT,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "horizon" TEXT NOT NULL DEFAULT 'DAILY',
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inputs" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentProductionPackage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "contentBriefId" TEXT,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "fullScript" TEXT NOT NULL,
    "sceneBreakdown" JSONB NOT NULL DEFAULT '[]',
    "visualDirections" JSONB NOT NULL DEFAULT '[]',
    "cameraAngles" JSONB NOT NULL DEFAULT '[]',
    "doctorTalkingPoints" JSONB NOT NULL DEFAULT '[]',
    "bRollRequirements" JSONB NOT NULL DEFAULT '[]',
    "cta" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" JSONB NOT NULL DEFAULT '[]',
    "thumbnailConcept" TEXT NOT NULL,
    "thumbnailText" TEXT NOT NULL,
    "postingTime" TIMESTAMP(3) NOT NULL,
    "platformRecommendation" TEXT NOT NULL,
    "targetKpi" JSONB NOT NULL DEFAULT '{}',
    "publishingPayload" JSONB NOT NULL DEFAULT '{}',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "revisionMetadata" JSONB NOT NULL DEFAULT '{}',
    "actionPlanId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentProductionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyGrowthReport" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "pdfPayload" JSONB NOT NULL DEFAULT '{}',
    "pdfFileName" TEXT,
    "pdfExportRunId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "viewedBy" JSONB NOT NULL DEFAULT '[]',
    "downloadedBy" JSONB NOT NULL DEFAULT '[]',
    "approvedBy" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyGrowthReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentOutcome" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "contentProductionPackageId" TEXT,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "predictedKpi" JSONB NOT NULL DEFAULT '{}',
    "actualKpi" JSONB NOT NULL DEFAULT '{}',
    "attribution" JSONB NOT NULL DEFAULT '{}',
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLearningMemory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentLearningMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissionExecution_workspaceId_missionType_businessDate_key" ON "MissionExecution"("workspaceId", "missionType", "businessDate");
CREATE UNIQUE INDEX "MissionExecution_workspaceId_idempotencyKey_key" ON "MissionExecution"("workspaceId", "idempotencyKey");
CREATE INDEX "MissionExecution_workspaceId_status_businessDate_idx" ON "MissionExecution"("workspaceId", "status", "businessDate");
CREATE INDEX "MissionExecution_workspaceId_currentPhase_updatedAt_idx" ON "MissionExecution"("workspaceId", "currentPhase", "updatedAt");
CREATE INDEX "MissionExecution_traceId_idx" ON "MissionExecution"("traceId");

CREATE UNIQUE INDEX "DailyBusinessSnapshot_workspaceId_missionExecutionId_key" ON "DailyBusinessSnapshot"("workspaceId", "missionExecutionId");
CREATE INDEX "DailyBusinessSnapshot_workspaceId_businessDate_idx" ON "DailyBusinessSnapshot"("workspaceId", "businessDate");
CREATE INDEX "DailyBusinessSnapshot_missionExecutionId_idx" ON "DailyBusinessSnapshot"("missionExecutionId");

CREATE UNIQUE INDEX "DailyPerformanceReport_workspaceId_missionExecutionId_key" ON "DailyPerformanceReport"("workspaceId", "missionExecutionId");
CREATE INDEX "DailyPerformanceReport_workspaceId_businessDate_idx" ON "DailyPerformanceReport"("workspaceId", "businessDate");
CREATE INDEX "DailyPerformanceReport_missionExecutionId_idx" ON "DailyPerformanceReport"("missionExecutionId");

CREATE UNIQUE INDEX "StrategyOutcome_workspaceId_missionExecutionId_key" ON "StrategyOutcome"("workspaceId", "missionExecutionId");
CREATE INDEX "StrategyOutcome_workspaceId_businessDate_idx" ON "StrategyOutcome"("workspaceId", "businessDate");
CREATE INDEX "StrategyOutcome_missionExecutionId_idx" ON "StrategyOutcome"("missionExecutionId");

CREATE INDEX "TrendOpportunity_workspaceId_status_businessDate_idx" ON "TrendOpportunity"("workspaceId", "status", "businessDate");
CREATE INDEX "TrendOpportunity_missionExecutionId_idx" ON "TrendOpportunity"("missionExecutionId");

CREATE INDEX "ContentBrief_workspaceId_status_businessDate_idx" ON "ContentBrief"("workspaceId", "status", "businessDate");
CREATE INDEX "ContentBrief_missionExecutionId_idx" ON "ContentBrief"("missionExecutionId");
CREATE INDEX "ContentBrief_trendOpportunityId_idx" ON "ContentBrief"("trendOpportunityId");

CREATE INDEX "ContentProductionPackage_workspaceId_status_businessDate_idx" ON "ContentProductionPackage"("workspaceId", "status", "businessDate");
CREATE INDEX "ContentProductionPackage_missionExecutionId_idx" ON "ContentProductionPackage"("missionExecutionId");
CREATE INDEX "ContentProductionPackage_contentBriefId_idx" ON "ContentProductionPackage"("contentBriefId");
CREATE INDEX "ContentProductionPackage_actionPlanId_idx" ON "ContentProductionPackage"("actionPlanId");

CREATE UNIQUE INDEX "DailyGrowthReport_workspaceId_missionExecutionId_key" ON "DailyGrowthReport"("workspaceId", "missionExecutionId");
CREATE INDEX "DailyGrowthReport_workspaceId_businessDate_idx" ON "DailyGrowthReport"("workspaceId", "businessDate");
CREATE INDEX "DailyGrowthReport_missionExecutionId_idx" ON "DailyGrowthReport"("missionExecutionId");
CREATE INDEX "DailyGrowthReport_pdfExportRunId_idx" ON "DailyGrowthReport"("pdfExportRunId");

CREATE INDEX "ContentOutcome_workspaceId_businessDate_idx" ON "ContentOutcome"("workspaceId", "businessDate");
CREATE INDEX "ContentOutcome_missionExecutionId_idx" ON "ContentOutcome"("missionExecutionId");
CREATE INDEX "ContentOutcome_contentProductionPackageId_idx" ON "ContentOutcome"("contentProductionPackageId");

CREATE UNIQUE INDEX "AgentLearningMemory_workspaceId_scope_key_key" ON "AgentLearningMemory"("workspaceId", "scope", "key");
CREATE INDEX "AgentLearningMemory_workspaceId_scope_updatedAt_idx" ON "AgentLearningMemory"("workspaceId", "scope", "updatedAt");
CREATE INDEX "AgentLearningMemory_missionExecutionId_idx" ON "AgentLearningMemory"("missionExecutionId");

-- AddForeignKey
ALTER TABLE "MissionExecution" ADD CONSTRAINT "MissionExecution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyBusinessSnapshot" ADD CONSTRAINT "DailyBusinessSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyBusinessSnapshot" ADD CONSTRAINT "DailyBusinessSnapshot_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPerformanceReport" ADD CONSTRAINT "DailyPerformanceReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyPerformanceReport" ADD CONSTRAINT "DailyPerformanceReport_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyOutcome" ADD CONSTRAINT "StrategyOutcome_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyOutcome" ADD CONSTRAINT "StrategyOutcome_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendOpportunity" ADD CONSTRAINT "TrendOpportunity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrendOpportunity" ADD CONSTRAINT "TrendOpportunity_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentBrief" ADD CONSTRAINT "ContentBrief_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentBrief" ADD CONSTRAINT "ContentBrief_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentProductionPackage" ADD CONSTRAINT "ContentProductionPackage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentProductionPackage" ADD CONSTRAINT "ContentProductionPackage_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentProductionPackage" ADD CONSTRAINT "ContentProductionPackage_contentBriefId_fkey" FOREIGN KEY ("contentBriefId") REFERENCES "ContentBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DailyGrowthReport" ADD CONSTRAINT "DailyGrowthReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyGrowthReport" ADD CONSTRAINT "DailyGrowthReport_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentOutcome" ADD CONSTRAINT "ContentOutcome_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentOutcome" ADD CONSTRAINT "ContentOutcome_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentOutcome" ADD CONSTRAINT "ContentOutcome_contentProductionPackageId_fkey" FOREIGN KEY ("contentProductionPackageId") REFERENCES "ContentProductionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentLearningMemory" ADD CONSTRAINT "AgentLearningMemory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
