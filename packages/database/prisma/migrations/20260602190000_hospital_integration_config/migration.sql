CREATE TYPE "IntegrationConfigStatus" AS ENUM ('PENDING', 'CONNECTED', 'NEEDS_ATTENTION', 'DISABLED');

ALTER TABLE "HospitalWorkspace"
  ADD COLUMN "hospitalCode" TEXT,
  ADD COLUMN "domain" TEXT,
  ADD COLUMN "industryType" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "lastSyncAt" TIMESTAMP(3),
  ADD COLUMN "disabledAt" TIMESTAMP(3);

CREATE TABLE "HospitalIntegrationConfig" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "apiName" TEXT NOT NULL,
  "baseUrl" TEXT,
  "encryptedCredentials" TEXT NOT NULL,
  "credentialMeta" JSONB NOT NULL DEFAULT '{}',
  "settings" JSONB NOT NULL DEFAULT '{}',
  "status" "IntegrationConfigStatus" NOT NULL DEFAULT 'PENDING',
  "lastValidatedAt" TIMESTAMP(3),
  "lastTestedAt" TIMESTAMP(3),
  "lastSyncAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HospitalIntegrationConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalWorkspace_hospitalCode_key"
  ON "HospitalWorkspace"("hospitalCode");

CREATE UNIQUE INDEX "HospitalIntegrationConfig_hospitalId_provider_apiName_key"
  ON "HospitalIntegrationConfig"("hospitalId", "provider", "apiName");

CREATE INDEX "HospitalIntegrationConfig_hospitalId_idx"
  ON "HospitalIntegrationConfig"("hospitalId");

CREATE INDEX "HospitalIntegrationConfig_provider_idx"
  ON "HospitalIntegrationConfig"("provider");

CREATE INDEX "HospitalIntegrationConfig_status_updatedAt_idx"
  ON "HospitalIntegrationConfig"("status", "updatedAt");

CREATE INDEX "HospitalIntegrationConfig_updatedAt_idx"
  ON "HospitalIntegrationConfig"("updatedAt");

ALTER TABLE "HospitalIntegrationConfig"
  ADD CONSTRAINT "HospitalIntegrationConfig_hospitalId_fkey"
  FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
