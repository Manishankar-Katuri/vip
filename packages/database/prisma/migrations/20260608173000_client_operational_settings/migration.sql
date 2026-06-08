-- Phase 8 canonical owner client settings.
CREATE TABLE "ClientOperationalSettings" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'setup_needed',
  "businessType" TEXT,
  "location" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "workflowSchedule" JSONB NOT NULL DEFAULT '{}',
  "approvalPolicy" JSONB NOT NULL DEFAULT '{}',
  "reportPreferences" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientOperationalSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientOperationalSettings_workspaceId_key" ON "ClientOperationalSettings"("workspaceId");
CREATE INDEX "ClientOperationalSettings_status_updatedAt_idx" ON "ClientOperationalSettings"("status", "updatedAt");

ALTER TABLE "ClientOperationalSettings" ADD CONSTRAINT "ClientOperationalSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
