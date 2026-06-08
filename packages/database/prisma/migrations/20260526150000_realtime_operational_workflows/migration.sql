CREATE TABLE "OperationalCampaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "approval" TEXT NOT NULL,
    "clinicalRisk" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "strategyNote" TEXT NOT NULL,
    "recommendation" TEXT,
    "scheduledFor" TEXT,
    "performance" TEXT,
    "owner" TEXT NOT NULL,
    "reviewer" TEXT,
    "participants" JSONB NOT NULL,
    "updatedLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationalCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalActivityEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "visibleTo" JSONB NOT NULL,
    "transitionFrom" TEXT,
    "transitionTo" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalNotification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "role" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "OperationalNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalTask" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assigneeRole" TEXT NOT NULL DEFAULT 'staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationalTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalRecommendationAction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalRecommendationAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalCampaign_workspaceId_stage_updatedAt_idx" ON "OperationalCampaign"("workspaceId", "stage", "updatedAt");
CREATE INDEX "OperationalCampaign_workspaceId_approval_updatedAt_idx" ON "OperationalCampaign"("workspaceId", "approval", "updatedAt");
CREATE INDEX "OperationalActivityEvent_workspaceId_occurredAt_idx" ON "OperationalActivityEvent"("workspaceId", "occurredAt");
CREATE INDEX "OperationalActivityEvent_workspaceId_campaignId_occurredAt_idx" ON "OperationalActivityEvent"("workspaceId", "campaignId", "occurredAt");
CREATE INDEX "OperationalNotification_workspaceId_role_unread_createdAt_idx" ON "OperationalNotification"("workspaceId", "role", "unread", "createdAt");
CREATE INDEX "OperationalNotification_workspaceId_groupKey_createdAt_idx" ON "OperationalNotification"("workspaceId", "groupKey", "createdAt");
CREATE INDEX "OperationalTask_workspaceId_assigneeRole_status_idx" ON "OperationalTask"("workspaceId", "assigneeRole", "status");
CREATE UNIQUE INDEX "OperationalRecommendationAction_workspaceId_title_key" ON "OperationalRecommendationAction"("workspaceId", "title");
CREATE INDEX "OperationalRecommendationAction_workspaceId_actedAt_idx" ON "OperationalRecommendationAction"("workspaceId", "actedAt");

ALTER TABLE "OperationalCampaign" ADD CONSTRAINT "OperationalCampaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalActivityEvent" ADD CONSTRAINT "OperationalActivityEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalNotification" ADD CONSTRAINT "OperationalNotification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalRecommendationAction" ADD CONSTRAINT "OperationalRecommendationAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
