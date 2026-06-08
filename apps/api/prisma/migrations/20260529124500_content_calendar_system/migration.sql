CREATE TYPE "ContentCalendarType" AS ENUM (
  'REEL',
  'POST',
  'CAROUSEL',
  'STORY',
  'YOUTUBE_SHORT',
  'BLOG'
);

CREATE TYPE "ContentCalendarStatus" AS ENUM (
  'IDEA',
  'PLANNED',
  'SCRIPT_READY',
  'IN_PRODUCTION',
  'READY_TO_POST',
  'PUBLISHED',
  'CANCELLED'
);

CREATE TYPE "ContentCalendarPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE "ContentCalendarCategory" AS ENUM (
  'EDUCATIONAL',
  'AWARENESS',
  'PROMOTIONAL',
  'PATIENT_STORY',
  'DOCTOR_BRANDING',
  'SEASONAL',
  'SPECIAL_DAY',
  'TRENDING'
);

CREATE TABLE "ContentCalendarItem" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "contentType" "ContentCalendarType" NOT NULL,
  "category" "ContentCalendarCategory" NOT NULL,
  "status" "ContentCalendarStatus" NOT NULL DEFAULT 'IDEA',
  "priority" "ContentCalendarPriority" NOT NULL DEFAULT 'MEDIUM',
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "publishedDate" TIMESTAMP(3),
  "campaignId" TEXT,
  "createdBy" TEXT NOT NULL,
  "assignedTo" TEXT,
  "tags" TEXT[],
  "isSpecialDay" BOOLEAN NOT NULL DEFAULT false,
  "specialDayName" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentCalendarItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentCalendarScript" (
  "id" TEXT NOT NULL,
  "calendarItemId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentCalendarScript_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentCalendarScript_calendarItemId_key"
  ON "ContentCalendarScript"("calendarItemId");

CREATE INDEX "ContentCalendarItem_hospitalId_scheduledDate_idx"
  ON "ContentCalendarItem"("hospitalId", "scheduledDate");

CREATE INDEX "ContentCalendarItem_hospitalId_status_scheduledDate_idx"
  ON "ContentCalendarItem"("hospitalId", "status", "scheduledDate");

CREATE INDEX "ContentCalendarItem_hospitalId_contentType_idx"
  ON "ContentCalendarItem"("hospitalId", "contentType");

CREATE INDEX "ContentCalendarItem_hospitalId_category_idx"
  ON "ContentCalendarItem"("hospitalId", "category");

CREATE INDEX "ContentCalendarItem_hospitalId_assignedTo_idx"
  ON "ContentCalendarItem"("hospitalId", "assignedTo");

CREATE INDEX "ContentCalendarItem_campaignId_idx"
  ON "ContentCalendarItem"("campaignId");

CREATE INDEX "ContentCalendarItem_deletedAt_idx"
  ON "ContentCalendarItem"("deletedAt");

ALTER TABLE "ContentCalendarItem"
  ADD CONSTRAINT "ContentCalendarItem_hospitalId_fkey"
  FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentCalendarItem"
  ADD CONSTRAINT "ContentCalendarItem_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContentCalendarItem"
  ADD CONSTRAINT "ContentCalendarItem_assignedTo_fkey"
  FOREIGN KEY ("assignedTo") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContentCalendarScript"
  ADD CONSTRAINT "ContentCalendarScript_calendarItemId_fkey"
  FOREIGN KEY ("calendarItemId") REFERENCES "ContentCalendarItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
