-- CreateTable
CREATE TABLE "VectorMemory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorMemory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VectorMemory" ADD CONSTRAINT "VectorMemory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "HospitalWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorMemory" ADD CONSTRAINT "VectorMemory_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "WebsiteContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
