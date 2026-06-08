ALTER TABLE "HospitalWorkspace"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "hospitalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "domain" TEXT,
  ADD COLUMN IF NOT EXISTS "industryType" TEXT,
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "specialty" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "HospitalWorkspace"
SET "name" = "hospitalName"
WHERE "name" IS NULL;

ALTER TABLE "HospitalWorkspace"
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "hospitalRequestId" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'PRODUCTION', 'STAFF');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'STAFF',
  "hospitalId" TEXT,
  "isGlobal" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_hospitalId_idx" ON "User"("hospitalId");
CREATE INDEX IF NOT EXISTS "User_isGlobal_idx" ON "User"("isGlobal");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_hospitalId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvitationStatus') THEN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Invitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "hospitalId" TEXT,
  "isGlobal" BOOLEAN NOT NULL,
  "token" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX IF NOT EXISTS "Invitation_email_idx" ON "Invitation"("email");
CREATE INDEX IF NOT EXISTS "Invitation_status_expiresAt_idx" ON "Invitation"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "Invitation_hospitalId_idx" ON "Invitation"("hospitalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Invitation_hospitalId_fkey'
  ) THEN
    ALTER TABLE "Invitation"
      ADD CONSTRAINT "Invitation_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "hospitalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_hospitalId_createdAt_idx" ON "AuditLog"("hospitalId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_hospitalId_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AdminRolePermission" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT,
  "roleId" "UserRole" NOT NULL,
  "featureKey" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminRolePermission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminRolePermission_hospitalId_idx" ON "AdminRolePermission"("hospitalId");
CREATE INDEX IF NOT EXISTS "AdminRolePermission_roleId_idx" ON "AdminRolePermission"("roleId");
CREATE INDEX IF NOT EXISTS "AdminRolePermission_featureKey_idx" ON "AdminRolePermission"("featureKey");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminRolePermission_global_roleId_featureKey_key"
  ON "AdminRolePermission"("roleId", "featureKey")
  WHERE "hospitalId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "AdminRolePermission_hospitalId_roleId_featureKey_key"
  ON "AdminRolePermission"("hospitalId", "roleId", "featureKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminRolePermission_hospitalId_fkey'
  ) THEN
    ALTER TABLE "AdminRolePermission"
      ADD CONSTRAINT "AdminRolePermission_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BrandVoice" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "tone" TEXT NOT NULL DEFAULT '',
  "style" TEXT NOT NULL DEFAULT '',
  "audience" TEXT NOT NULL DEFAULT '',
  "messaging" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BrandVoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BrandVoice_hospitalId_key" ON "BrandVoice"("hospitalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BrandVoice_hospitalId_fkey'
  ) THEN
    ALTER TABLE "BrandVoice"
      ADD CONSTRAINT "BrandVoice_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Template" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Template_hospitalId_category_idx" ON "Template"("hospitalId", "category");
CREATE INDEX IF NOT EXISTS "Template_hospitalId_isActive_idx" ON "Template"("hospitalId", "isActive");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Template_hospitalId_fkey'
  ) THEN
    ALTER TABLE "Template"
      ADD CONSTRAINT "Template_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AiAuditLog" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT,
  "userId" TEXT,
  "roleId" TEXT,
  "feature" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "responseTimeMs" INTEGER NOT NULL,
  "success" BOOLEAN NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AiAuditLog_createdAt_idx" ON "AiAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_hospitalId_createdAt_idx" ON "AiAuditLog"("hospitalId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_userId_createdAt_idx" ON "AiAuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_roleId_createdAt_idx" ON "AiAuditLog"("roleId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_feature_createdAt_idx" ON "AiAuditLog"("feature", "createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_provider_createdAt_idx" ON "AiAuditLog"("provider", "createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_model_createdAt_idx" ON "AiAuditLog"("model", "createdAt");
CREATE INDEX IF NOT EXISTS "AiAuditLog_success_createdAt_idx" ON "AiAuditLog"("success", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AiAuditLog_hospitalId_fkey'
  ) THEN
    ALTER TABLE "AiAuditLog"
      ADD CONSTRAINT "AiAuditLog_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AiAuditLog_userId_fkey'
  ) THEN
    ALTER TABLE "AiAuditLog"
      ADD CONSTRAINT "AiAuditLog_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AiModelPricing" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokenPricePerMillion" DOUBLE PRECISION NOT NULL,
  "outputTokenPricePerMillion" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiModelPricing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AiModelPricing_provider_model_currency_effectiveFrom_key"
  ON "AiModelPricing"("provider", "model", "currency", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "AiModelPricing_provider_model_isActive_idx"
  ON "AiModelPricing"("provider", "model", "isActive");
CREATE INDEX IF NOT EXISTS "AiModelPricing_effectiveFrom_effectiveTo_idx"
  ON "AiModelPricing"("effectiveFrom", "effectiveTo");

INSERT INTO "AiModelPricing" (
  "id",
  "provider",
  "model",
  "inputTokenPricePerMillion",
  "outputTokenPricePerMillion",
  "currency",
  "isActive",
  "effectiveFrom",
  "updatedAt"
) VALUES
  ('00000000-0000-4000-8000-000000000411', 'openai', 'gpt-4.1-mini', 0.40, 1.60, 'USD', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000003', 'openai', 'text-embedding-3-small', 0.02, 0, 'USD', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalWorkspace_hospitalCode_key"
  ON "HospitalWorkspace"("hospitalCode");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IntegrationConfigStatus') THEN
    CREATE TYPE "IntegrationConfigStatus" AS ENUM ('PENDING', 'CONNECTED', 'NEEDS_ATTENTION', 'DISABLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "HospitalIntegrationConfig" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalIntegrationConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalIntegrationConfig_hospitalId_provider_apiName_key"
  ON "HospitalIntegrationConfig"("hospitalId", "provider", "apiName");

CREATE INDEX IF NOT EXISTS "HospitalIntegrationConfig_hospitalId_idx"
  ON "HospitalIntegrationConfig"("hospitalId");

CREATE INDEX IF NOT EXISTS "HospitalIntegrationConfig_provider_idx"
  ON "HospitalIntegrationConfig"("provider");

CREATE INDEX IF NOT EXISTS "HospitalIntegrationConfig_status_updatedAt_idx"
  ON "HospitalIntegrationConfig"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "HospitalIntegrationConfig_updatedAt_idx"
  ON "HospitalIntegrationConfig"("updatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'HospitalIntegrationConfig_hospitalId_fkey'
  ) THEN
    ALTER TABLE "HospitalIntegrationConfig"
      ADD CONSTRAINT "HospitalIntegrationConfig_hospitalId_fkey"
      FOREIGN KEY ("hospitalId")
      REFERENCES "HospitalWorkspace"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
