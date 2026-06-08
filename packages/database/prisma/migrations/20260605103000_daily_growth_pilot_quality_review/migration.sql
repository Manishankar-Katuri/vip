-- CreateTable
CREATE TABLE "PilotQualityReview" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "missionExecutionId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL DEFAULT 'pilot_reviewer',
    "reviewerId" TEXT,
    "accuracy" INTEGER,
    "relevance" INTEGER,
    "actionability" INTEGER,
    "hookQuality" INTEGER,
    "scriptQuality" INTEGER,
    "ctaQuality" INTEGER,
    "brandAlignment" INTEGER,
    "comments" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotQualityReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PilotQualityReview_workspaceId_missionExecutionId_targetType_idx" ON "PilotQualityReview"("workspaceId", "missionExecutionId", "targetType");
CREATE INDEX "PilotQualityReview_targetType_targetId_idx" ON "PilotQualityReview"("targetType", "targetId");
CREATE INDEX "PilotQualityReview_workspaceId_createdAt_idx" ON "PilotQualityReview"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "PilotQualityReview" ADD CONSTRAINT "PilotQualityReview_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotQualityReview" ADD CONSTRAINT "PilotQualityReview_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
