-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('CREATING', 'ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "HospitalWorkspace" (
    "id" TEXT NOT NULL,
    "hospitalRequestId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'CREATING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HospitalWorkspace_hospitalRequestId_key" ON "HospitalWorkspace"("hospitalRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalWorkspace_slug_key" ON "HospitalWorkspace"("slug");

-- AddForeignKey
ALTER TABLE "HospitalWorkspace" ADD CONSTRAINT "HospitalWorkspace_hospitalRequestId_fkey" FOREIGN KEY ("hospitalRequestId") REFERENCES "HospitalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "HospitalWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
