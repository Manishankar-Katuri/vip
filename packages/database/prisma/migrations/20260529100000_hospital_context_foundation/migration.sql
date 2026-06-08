-- AlterTable
ALTER TABLE "HospitalWorkspace" ADD COLUMN "name" TEXT;
ALTER TABLE "HospitalWorkspace" ADD COLUMN "specialty" TEXT;
ALTER TABLE "HospitalWorkspace" ADD COLUMN "city" TEXT;
ALTER TABLE "HospitalWorkspace" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Backfill existing hospital workspaces from the legacy display name.
UPDATE "HospitalWorkspace"
SET
    "name" = "hospitalName",
    "updatedAt" = "createdAt"
WHERE "name" IS NULL OR "updatedAt" IS NULL;

-- Enforce canonical fields for future multi-tenant context.
ALTER TABLE "HospitalWorkspace" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "HospitalWorkspace" ALTER COLUMN "updatedAt" SET NOT NULL;
