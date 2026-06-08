-- CreateEnum
CREATE TYPE "ContentPlanDecisionType" AS ENUM ('KEEP', 'IMPROVE', 'REPLACE', 'ADD', 'PAUSE');

-- AlterTable
ALTER TABLE "ContentCalendarItem"
ADD COLUMN "clientId" TEXT,
ADD COLUMN "platform" TEXT,
ADD COLUMN "plannedTopic" TEXT,
ADD COLUMN "plannedCaption" TEXT,
ADD COLUMN "plannedAssets" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "plannedPostingTime" TEXT,
ADD COLUMN "campaignTheme" TEXT,
ADD COLUMN "goal" TEXT,
ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "content_execution_windows" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "windowType" TEXT NOT NULL,
  "sendDay" TEXT NOT NULL,
  "sendTime" TEXT NOT NULL,
  "windowStartDate" TIMESTAMP(3) NOT NULL,
  "windowEndDate" TIMESTAMP(3) NOT NULL,
  "purpose" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'GENERATED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "content_execution_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_plan_decisions" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "clientId" TEXT,
  "calendarItemId" TEXT,
  "executionWindowId" TEXT NOT NULL,
  "decision" "ContentPlanDecisionType" NOT NULL,
  "originalTopic" TEXT,
  "finalTopic" TEXT NOT NULL,
  "originalContentType" TEXT,
  "finalContentType" TEXT NOT NULL,
  "decisionReason" TEXT NOT NULL,
  "intelligenceSignalsUsed" JSONB NOT NULL DEFAULT '{}',
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "content_plan_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_execution_documents" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "executionWindowId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentJson" JSONB NOT NULL,
  "fileUrl" TEXT,
  "emailSubject" TEXT NOT NULL,
  "emailBody" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "content_execution_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_delivery_logs" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "executionDocumentId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "content_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_execution_windows_workspaceId_windowStartDate_windowEndDate_idx" ON "content_execution_windows"("workspaceId", "windowStartDate", "windowEndDate");

-- CreateIndex
CREATE INDEX "content_execution_windows_workspaceId_sendDay_createdAt_idx" ON "content_execution_windows"("workspaceId", "sendDay", "createdAt");

-- CreateIndex
CREATE INDEX "content_plan_decisions_workspaceId_createdAt_idx" ON "content_plan_decisions"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "content_plan_decisions_calendarItemId_idx" ON "content_plan_decisions"("calendarItemId");

-- CreateIndex
CREATE INDEX "content_plan_decisions_executionWindowId_idx" ON "content_plan_decisions"("executionWindowId");

-- CreateIndex
CREATE INDEX "content_execution_documents_workspaceId_generatedAt_idx" ON "content_execution_documents"("workspaceId", "generatedAt");

-- CreateIndex
CREATE INDEX "content_execution_documents_executionWindowId_idx" ON "content_execution_documents"("executionWindowId");

-- CreateIndex
CREATE INDEX "content_execution_documents_deliveryStatus_idx" ON "content_execution_documents"("deliveryStatus");

-- CreateIndex
CREATE INDEX "content_delivery_logs_workspaceId_createdAt_idx" ON "content_delivery_logs"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "content_delivery_logs_executionDocumentId_idx" ON "content_delivery_logs"("executionDocumentId");

-- CreateIndex
CREATE INDEX "content_delivery_logs_deliveryStatus_idx" ON "content_delivery_logs"("deliveryStatus");

-- AddForeignKey
ALTER TABLE "content_execution_windows" ADD CONSTRAINT "content_execution_windows_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_plan_decisions" ADD CONSTRAINT "content_plan_decisions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_plan_decisions" ADD CONSTRAINT "content_plan_decisions_calendarItemId_fkey" FOREIGN KEY ("calendarItemId") REFERENCES "ContentCalendarItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_plan_decisions" ADD CONSTRAINT "content_plan_decisions_executionWindowId_fkey" FOREIGN KEY ("executionWindowId") REFERENCES "content_execution_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_execution_documents" ADD CONSTRAINT "content_execution_documents_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_execution_documents" ADD CONSTRAINT "content_execution_documents_executionWindowId_fkey" FOREIGN KEY ("executionWindowId") REFERENCES "content_execution_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_delivery_logs" ADD CONSTRAINT "content_delivery_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_delivery_logs" ADD CONSTRAINT "content_delivery_logs_executionDocumentId_fkey" FOREIGN KEY ("executionDocumentId") REFERENCES "content_execution_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
