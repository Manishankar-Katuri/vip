-- CreateTable
CREATE TABLE "MarketSignalObservation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "signalKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "momentum" DOUBLE PRECISION,
    "sentiment" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSignalObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketProviderCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketProviderCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketContextSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "context" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MarketContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketSignalObservation_workspaceId_provider_category_regionKey_signalKey_observedAt_key" ON "MarketSignalObservation"("workspaceId", "provider", "category", "regionKey", "signalKey", "observedAt");

-- CreateIndex
CREATE INDEX "MarketSignalObservation_workspaceId_category_regionKey_observedAt_idx" ON "MarketSignalObservation"("workspaceId", "category", "regionKey", "observedAt");

-- CreateIndex
CREATE INDEX "MarketSignalObservation_regionKey_signalKey_observedAt_idx" ON "MarketSignalObservation"("regionKey", "signalKey", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketProviderCache_cacheKey_key" ON "MarketProviderCache"("cacheKey");

-- CreateIndex
CREATE INDEX "MarketProviderCache_provider_category_regionKey_expiresAt_idx" ON "MarketProviderCache"("provider", "category", "regionKey", "expiresAt");

-- CreateIndex
CREATE INDEX "MarketContextSnapshot_workspaceId_generatedAt_idx" ON "MarketContextSnapshot"("workspaceId", "generatedAt");

-- CreateIndex
CREATE INDEX "MarketContextSnapshot_workspaceId_regionKey_generatedAt_idx" ON "MarketContextSnapshot"("workspaceId", "regionKey", "generatedAt");

-- AddForeignKey
ALTER TABLE "MarketSignalObservation" ADD CONSTRAINT "MarketSignalObservation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketContextSnapshot" ADD CONSTRAINT "MarketContextSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
