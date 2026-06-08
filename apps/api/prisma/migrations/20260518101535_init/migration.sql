-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'REVIEWING', 'APPROVED', 'SETUP', 'LIVE');

-- CreateTable
CREATE TABLE "HospitalRequest" (
    "id" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalRequest_pkey" PRIMARY KEY ("id")
);
