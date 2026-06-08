-- HospitalWorkspace can now be created directly by admins without a prior request.
ALTER TABLE "HospitalWorkspace" ALTER COLUMN "hospitalRequestId" DROP NOT NULL;

-- User lifecycle support.
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- Audit foundation.
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "hospitalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX "AuditLog_hospitalId_createdAt_idx" ON "AuditLog"("hospitalId", "createdAt");
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Brand voice foundation.
CREATE TABLE "BrandVoice" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT '',
    "style" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT '',
    "messaging" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandVoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrandVoice_hospitalId_key" ON "BrandVoice"("hospitalId");
ALTER TABLE "BrandVoice" ADD CONSTRAINT "BrandVoice_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Template manager foundation.
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Template_hospitalId_category_idx" ON "Template"("hospitalId", "category");
CREATE INDEX "Template_hospitalId_isActive_idx" ON "Template"("hospitalId", "isActive");
ALTER TABLE "Template" ADD CONSTRAINT "Template_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
