CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'NOT_CONFIGURED', 'UNKNOWN');
CREATE TYPE "VerificationResultStatus" AS ENUM ('RUNNING', 'PASS', 'WARNING', 'FAIL');
CREATE TYPE "VerificationCheckStatus" AS ENUM ('PASS', 'WARNING', 'FAIL');
CREATE TYPE "DataProvenanceStatus" AS ENUM ('LIVE', 'CACHED', 'STALE', 'MOCK');
CREATE TYPE "PdfExportStatus" AS ENUM ('REQUESTED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "DuplicateStatus" AS ENUM ('UNIQUE', 'DUPLICATE', 'REVIEW');

CREATE TABLE "SystemEndpointHealth" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "authentication" TEXT NOT NULL,
  "status" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
  "sourceService" TEXT NOT NULL,
  "sourceFile" TEXT,
  "responseTimeMs" INTEGER,
  "lastStatusCode" INTEGER,
  "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "schemaValid" BOOLEAN,
  "schemaMessage" TEXT,
  "errorMessage" TEXT,
  "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemEndpointHealth_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemVerificationRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "status" "VerificationResultStatus" NOT NULL DEFAULT 'RUNNING',
  "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "summary" JSONB NOT NULL DEFAULT '{}',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemVerificationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemVerificationCheck" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "runId" TEXT NOT NULL,
  "subsystem" TEXT NOT NULL,
  "status" "VerificationCheckStatus" NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "message" TEXT NOT NULL,
  "details" JSONB NOT NULL DEFAULT '{}',
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemVerificationCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataProvenanceSnapshot" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "page" TEXT NOT NULL,
  "widgetKey" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceService" TEXT NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "cacheAgeSeconds" INTEGER NOT NULL,
  "freshnessScore" DOUBLE PRECISION NOT NULL,
  "status" "DataProvenanceStatus" NOT NULL,
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "apiCalled" TEXT,
  "lastSuccessfulSyncAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DataProvenanceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiProviderHealth" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "status" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
  "latencyMs" INTEGER,
  "availability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastCallAt" TIMESTAMP(3),
  "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tokenUsage" JSONB NOT NULL DEFAULT '{}',
  "costEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "structuredOutputValid" BOOLEAN,
  "errorMessage" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiProviderHealth_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PdfExportRun" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "pageType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "business" TEXT,
  "status" "PdfExportStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedBy" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "fileName" TEXT,
  "fileSizeBytes" INTEGER,
  "errorMessage" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PdfExportRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationSimilarityFingerprint" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "recommendationId" TEXT,
  "normalizedText" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "embeddingHash" TEXT,
  "similarityScore" DOUBLE PRECISION,
  "duplicateOfId" TEXT,
  "status" "DuplicateStatus" NOT NULL DEFAULT 'UNIQUE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationSimilarityFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemEndpointHealth_endpoint_method_key" ON "SystemEndpointHealth"("endpoint", "method");
CREATE INDEX "SystemEndpointHealth_status_lastCheckedAt_idx" ON "SystemEndpointHealth"("status", "lastCheckedAt");
CREATE INDEX "SystemEndpointHealth_workspaceId_lastCheckedAt_idx" ON "SystemEndpointHealth"("workspaceId", "lastCheckedAt");
CREATE INDEX "SystemVerificationRun_workspaceId_startedAt_idx" ON "SystemVerificationRun"("workspaceId", "startedAt");
CREATE INDEX "SystemVerificationRun_status_startedAt_idx" ON "SystemVerificationRun"("status", "startedAt");
CREATE INDEX "SystemVerificationCheck_runId_idx" ON "SystemVerificationCheck"("runId");
CREATE INDEX "SystemVerificationCheck_workspaceId_checkedAt_idx" ON "SystemVerificationCheck"("workspaceId", "checkedAt");
CREATE INDEX "SystemVerificationCheck_subsystem_status_idx" ON "SystemVerificationCheck"("subsystem", "status");
CREATE INDEX "DataProvenanceSnapshot_workspaceId_page_widgetKey_createdAt_idx" ON "DataProvenanceSnapshot"("workspaceId", "page", "widgetKey", "createdAt");
CREATE INDEX "DataProvenanceSnapshot_status_fetchedAt_idx" ON "DataProvenanceSnapshot"("status", "fetchedAt");
CREATE INDEX "AiProviderHealth_workspaceId_checkedAt_idx" ON "AiProviderHealth"("workspaceId", "checkedAt");
CREATE INDEX "AiProviderHealth_provider_model_checkedAt_idx" ON "AiProviderHealth"("provider", "model", "checkedAt");
CREATE INDEX "AiProviderHealth_status_checkedAt_idx" ON "AiProviderHealth"("status", "checkedAt");
CREATE INDEX "PdfExportRun_workspaceId_requestedAt_idx" ON "PdfExportRun"("workspaceId", "requestedAt");
CREATE INDEX "PdfExportRun_pageType_requestedAt_idx" ON "PdfExportRun"("pageType", "requestedAt");
CREATE INDEX "PdfExportRun_status_requestedAt_idx" ON "PdfExportRun"("status", "requestedAt");
CREATE INDEX "RecommendationSimilarityFingerprint_workspaceId_fingerprint_idx" ON "RecommendationSimilarityFingerprint"("workspaceId", "fingerprint");
CREATE INDEX "RecommendationSimilarityFingerprint_workspaceId_status_createdAt_idx" ON "RecommendationSimilarityFingerprint"("workspaceId", "status", "createdAt");
CREATE INDEX "RecommendationSimilarityFingerprint_recommendationId_idx" ON "RecommendationSimilarityFingerprint"("recommendationId");

ALTER TABLE "SystemEndpointHealth" ADD CONSTRAINT "SystemEndpointHealth_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemVerificationRun" ADD CONSTRAINT "SystemVerificationRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemVerificationCheck" ADD CONSTRAINT "SystemVerificationCheck_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemVerificationCheck" ADD CONSTRAINT "SystemVerificationCheck_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SystemVerificationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DataProvenanceSnapshot" ADD CONSTRAINT "DataProvenanceSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiProviderHealth" ADD CONSTRAINT "AiProviderHealth_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PdfExportRun" ADD CONSTRAINT "PdfExportRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationSimilarityFingerprint" ADD CONSTRAINT "RecommendationSimilarityFingerprint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationSimilarityFingerprint" ADD CONSTRAINT "RecommendationSimilarityFingerprint_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
