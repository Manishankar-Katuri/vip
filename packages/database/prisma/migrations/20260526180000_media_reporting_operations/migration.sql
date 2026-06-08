ALTER TABLE "OperationalCampaign"
ADD COLUMN "objective" TEXT NOT NULL DEFAULT '',
ADD COLUMN "audienceNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "engagementExpectation" TEXT NOT NULL DEFAULT '',
ADD COLUMN "hashtags" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "format" TEXT NOT NULL DEFAULT 'announcement';

CREATE TABLE "OperationalMediaAsset" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceRole" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "rightsNote" TEXT NOT NULL,
    "visibleTo" JSONB NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationalMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalContentVersion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "caption" TEXT NOT NULL,
    "strategyNote" TEXT NOT NULL,
    "changedSummary" TEXT NOT NULL,
    "modifiedBy" TEXT NOT NULL,
    "approval" TEXT NOT NULL,
    "rollbackAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalContentVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalMediaAsset_workspaceId_status_uploadedAt_idx" ON "OperationalMediaAsset"("workspaceId", "status", "uploadedAt");
CREATE INDEX "OperationalMediaAsset_workspaceId_campaignId_uploadedAt_idx" ON "OperationalMediaAsset"("workspaceId", "campaignId", "uploadedAt");
CREATE UNIQUE INDEX "OperationalContentVersion_campaignId_version_key" ON "OperationalContentVersion"("campaignId", "version");
CREATE INDEX "OperationalContentVersion_workspaceId_createdAt_idx" ON "OperationalContentVersion"("workspaceId", "createdAt");

ALTER TABLE "OperationalMediaAsset" ADD CONSTRAINT "OperationalMediaAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalMediaAsset" ADD CONSTRAINT "OperationalMediaAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OperationalCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalContentVersion" ADD CONSTRAINT "OperationalContentVersion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalContentVersion" ADD CONSTRAINT "OperationalContentVersion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OperationalCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
