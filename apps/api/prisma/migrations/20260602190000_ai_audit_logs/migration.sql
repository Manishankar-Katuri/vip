CREATE TABLE "AiAuditLog" (
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

CREATE TABLE "AiModelPricing" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelPricing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiAuditLog_createdAt_idx" ON "AiAuditLog"("createdAt");
CREATE INDEX "AiAuditLog_hospitalId_createdAt_idx" ON "AiAuditLog"("hospitalId", "createdAt");
CREATE INDEX "AiAuditLog_userId_createdAt_idx" ON "AiAuditLog"("userId", "createdAt");
CREATE INDEX "AiAuditLog_roleId_createdAt_idx" ON "AiAuditLog"("roleId", "createdAt");
CREATE INDEX "AiAuditLog_feature_createdAt_idx" ON "AiAuditLog"("feature", "createdAt");
CREATE INDEX "AiAuditLog_provider_createdAt_idx" ON "AiAuditLog"("provider", "createdAt");
CREATE INDEX "AiAuditLog_model_createdAt_idx" ON "AiAuditLog"("model", "createdAt");
CREATE INDEX "AiAuditLog_success_createdAt_idx" ON "AiAuditLog"("success", "createdAt");
CREATE UNIQUE INDEX "AiModelPricing_provider_model_currency_effectiveFrom_key" ON "AiModelPricing"("provider", "model", "currency", "effectiveFrom");
CREATE INDEX "AiModelPricing_provider_model_isActive_idx" ON "AiModelPricing"("provider", "model", "isActive");
CREATE INDEX "AiModelPricing_effectiveFrom_effectiveTo_idx" ON "AiModelPricing"("effectiveFrom", "effectiveTo");

ALTER TABLE "AiAuditLog" ADD CONSTRAINT "AiAuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiAuditLog" ADD CONSTRAINT "AiAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
    ('00000000-0000-4000-8000-000000000003', 'openai', 'text-embedding-3-small', 0.02, 0, 'USD', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
