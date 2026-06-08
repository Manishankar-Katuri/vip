-- Phase 4 report foundation: first-class editable report drafts.
CREATE TABLE "ReportDraft" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "missionExecutionId" TEXT,
  "businessDate" TIMESTAMP(3) NOT NULL,
  "reportType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "sections" JSONB NOT NULL DEFAULT '[]',
  "sourceData" JSONB NOT NULL DEFAULT '{}',
  "approvalStatus" TEXT NOT NULL DEFAULT 'not_requested',
  "exportStatus" TEXT NOT NULL DEFAULT 'not_exported',
  "sentStatus" TEXT NOT NULL DEFAULT 'not_sent',
  "pdfUrl" TEXT,
  "docxUrl" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReportDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportDraft_idempotencyKey_key" ON "ReportDraft"("idempotencyKey");
CREATE INDEX "ReportDraft_workspaceId_reportType_businessDate_idx" ON "ReportDraft"("workspaceId", "reportType", "businessDate");
CREATE INDEX "ReportDraft_workspaceId_status_updatedAt_idx" ON "ReportDraft"("workspaceId", "status", "updatedAt");
CREATE INDEX "ReportDraft_missionExecutionId_idx" ON "ReportDraft"("missionExecutionId");
CREATE INDEX "ReportDraft_generatedAt_idx" ON "ReportDraft"("generatedAt");

ALTER TABLE "ReportDraft" ADD CONSTRAINT "ReportDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportDraft" ADD CONSTRAINT "ReportDraft_missionExecutionId_fkey" FOREIGN KEY ("missionExecutionId") REFERENCES "MissionExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
