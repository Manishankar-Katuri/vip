-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT,
    "roleId" "UserRole" NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RolePermission_hospitalId_idx" ON "RolePermission"("hospitalId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_featureKey_idx" ON "RolePermission"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_global_roleId_featureKey_key"
ON "RolePermission"("roleId", "featureKey")
WHERE "hospitalId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_hospitalId_roleId_featureKey_key"
ON "RolePermission"("hospitalId", "roleId", "featureKey");

-- AddForeignKey
ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_hospitalId_fkey"
FOREIGN KEY ("hospitalId") REFERENCES "HospitalWorkspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
