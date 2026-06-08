-- Phase 6 report approval, recipient, and explicit send tracking.
CREATE TABLE "ReportApproval" (
  "id" TEXT NOT NULL,
  "reportDraftId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedBy" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReportApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportRecipient" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "receivesReports" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReportRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportDelivery" (
  "id" TEXT NOT NULL,
  "reportDraftId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "format" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "exportIds" JSONB NOT NULL DEFAULT '[]',
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "message" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "primaryExportId" TEXT,

  CONSTRAINT "ReportDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportApproval_reportDraftId_createdAt_idx" ON "ReportApproval"("reportDraftId", "createdAt");
CREATE INDEX "ReportApproval_workspaceId_status_requestedAt_idx" ON "ReportApproval"("workspaceId", "status", "requestedAt");

CREATE UNIQUE INDEX "ReportRecipient_workspaceId_email_key" ON "ReportRecipient"("workspaceId", "email");
CREATE INDEX "ReportRecipient_workspaceId_receivesReports_idx" ON "ReportRecipient"("workspaceId", "receivesReports");

CREATE INDEX "ReportDelivery_reportDraftId_createdAt_idx" ON "ReportDelivery"("reportDraftId", "createdAt");
CREATE INDEX "ReportDelivery_workspaceId_status_createdAt_idx" ON "ReportDelivery"("workspaceId", "status", "createdAt");
CREATE INDEX "ReportDelivery_primaryExportId_idx" ON "ReportDelivery"("primaryExportId");

ALTER TABLE "ReportApproval" ADD CONSTRAINT "ReportApproval_reportDraftId_fkey" FOREIGN KEY ("reportDraftId") REFERENCES "ReportDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportApproval" ADD CONSTRAINT "ReportApproval_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportRecipient" ADD CONSTRAINT "ReportRecipient_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportDelivery" ADD CONSTRAINT "ReportDelivery_reportDraftId_fkey" FOREIGN KEY ("reportDraftId") REFERENCES "ReportDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportDelivery" ADD CONSTRAINT "ReportDelivery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportDelivery" ADD CONSTRAINT "ReportDelivery_primaryExportId_fkey" FOREIGN KEY ("primaryExportId") REFERENCES "ReportExport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
