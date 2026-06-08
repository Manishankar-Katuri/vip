CREATE TYPE "ContentScriptType" AS ENUM (
  'REEL',
  'CAROUSEL',
  'POST',
  'SHORT_VIDEO',
  'ADVERTISEMENT'
);

CREATE TYPE "ContentScriptStatus" AS ENUM (
  'DRAFT',
  'APPROVED',
  'ARCHIVED'
);

DROP INDEX IF EXISTS "ContentCalendarScript_calendarItemId_key";

ALTER TABLE "ContentCalendarScript"
  DROP CONSTRAINT IF EXISTS "ContentCalendarScript_calendarItemId_fkey";

ALTER TABLE "ContentCalendarScript"
  RENAME COLUMN "body" TO "script";

ALTER TABLE "ContentCalendarScript"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ContentScriptStatus"
  USING COALESCE(NULLIF("status", ''), 'DRAFT')::"ContentScriptStatus",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "ContentCalendarScript"
  ADD COLUMN "hospitalId" TEXT,
  ADD COLUMN "scriptType" "ContentScriptType" NOT NULL DEFAULT 'POST',
  ADD COLUMN "hook" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "caption" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "cta" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "hashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);

UPDATE "ContentCalendarScript" script
SET
  "hospitalId" = item."hospitalId",
  "createdBy" = item."createdBy"
FROM "ContentCalendarItem" item
WHERE script."calendarItemId" = item."id";

ALTER TABLE "ContentCalendarScript"
  ALTER COLUMN "hospitalId" SET NOT NULL,
  ALTER COLUMN "createdBy" SET NOT NULL;

ALTER TABLE "ContentCalendarScript"
  ADD CONSTRAINT "ContentCalendarScript_calendarItemId_fkey"
  FOREIGN KEY ("calendarItemId") REFERENCES "ContentCalendarItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentCalendarScript"
  ADD CONSTRAINT "ContentCalendarScript_hospitalId_fkey"
  FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentCalendarScript"
  ADD CONSTRAINT "ContentCalendarScript_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContentCalendarScript"
  ADD CONSTRAINT "ContentCalendarScript_approvedBy_fkey"
  FOREIGN KEY ("approvedBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ContentCalendarScript_calendarItemId_version_key"
  ON "ContentCalendarScript"("calendarItemId", "version");

CREATE INDEX "ContentCalendarScript_hospitalId_createdAt_idx"
  ON "ContentCalendarScript"("hospitalId", "createdAt");

CREATE INDEX "ContentCalendarScript_hospitalId_status_idx"
  ON "ContentCalendarScript"("hospitalId", "status");

CREATE INDEX "ContentCalendarScript_calendarItemId_version_idx"
  ON "ContentCalendarScript"("calendarItemId", "version");
