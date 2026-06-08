-- CreateTable
CREATE TABLE "ContentGeneratorRun" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT '',
    "objective" TEXT NOT NULL DEFAULT '',
    "doctorName" TEXT,
    "serviceLine" TEXT,
    "languagePlan" TEXT NOT NULL DEFAULT '',
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "requestType" TEXT NOT NULL DEFAULT 'outside_strategy',
    "desiredPublishDate" TIMESTAMP(3),
    "strategyFit" TEXT NOT NULL DEFAULT 'Adjacent',
    "contentPillar" TEXT NOT NULL DEFAULT 'education',
    "generatedContext" JSONB NOT NULL DEFAULT '{}',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "safetyNotes" JSONB NOT NULL DEFAULT '[]',
    "output" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "calendarItemId" TEXT,
    "scriptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGeneratorRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentGeneratorRun_hospitalId_createdAt_idx" ON "ContentGeneratorRun"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentGeneratorRun_hospitalId_status_idx" ON "ContentGeneratorRun"("hospitalId", "status");

-- CreateIndex
CREATE INDEX "ContentGeneratorRun_hospitalId_strategyFit_idx" ON "ContentGeneratorRun"("hospitalId", "strategyFit");

-- CreateIndex
CREATE INDEX "ContentGeneratorRun_calendarItemId_idx" ON "ContentGeneratorRun"("calendarItemId");

-- CreateIndex
CREATE INDEX "ContentGeneratorRun_scriptId_idx" ON "ContentGeneratorRun"("scriptId");

-- AddForeignKey
ALTER TABLE "ContentGeneratorRun" ADD CONSTRAINT "ContentGeneratorRun_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
