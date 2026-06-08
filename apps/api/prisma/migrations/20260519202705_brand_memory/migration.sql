-- CreateTable
CREATE TABLE "BrandMemory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "hospitalName" TEXT,
    "specialty" TEXT,
    "tone" TEXT,
    "audience" TEXT,
    "doctors" JSONB,
    "platforms" JSONB,
    "topics" JSONB,
    "hashtags" JSONB,
    "contentPatterns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandMemory_pkey" PRIMARY KEY ("id")
);
