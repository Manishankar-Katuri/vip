-- Phase 5 report export tracking for ReportDraft PDF/DOCX files.
CREATE TABLE "ReportExport" (
  "id" TEXT NOT NULL,
  "reportDraftId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "workflowRunId" TEXT,
  "format" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "fileUrl" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportExport_reportDraftId_format_createdAt_idx" ON "ReportExport"("reportDraftId", "format", "createdAt");
CREATE INDEX "ReportExport_workspaceId_createdAt_idx" ON "ReportExport"("workspaceId", "createdAt");
CREATE INDEX "ReportExport_status_createdAt_idx" ON "ReportExport"("status", "createdAt");

ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_reportDraftId_fkey" FOREIGN KEY ("reportDraftId") REFERENCES "ReportDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
