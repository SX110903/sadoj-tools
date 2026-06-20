-- CreateEnum
CREATE TYPE "PropertyIncidentType" AS ENUM ('RAID', 'SEIZURE', 'SURVEILLANCE', 'SIGHTING', 'INTERVENTION', 'INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentResult" AS ENUM ('POSITIVE', 'NEGATIVE', 'PARTIAL', 'PENDING');

-- CreateEnum
CREATE TYPE "IncidentOrigin" AS ENUM ('MANUAL', 'WARRANT');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "createdById" TEXT;

-- AlterTable
ALTER TABLE "File" ADD COLUMN "propertyIncidentId" TEXT;

-- CreateTable
CREATE TABLE "PropertyIncident" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "PropertyIncidentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" "IncidentResult",
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "origin" "IncidentOrigin" NOT NULL DEFAULT 'MANUAL',
    "warrantId" TEXT,
    "participatingAgencies" TEXT,
    "evidence" TEXT,
    "personsPresent" TEXT,
    "investigationId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMember" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'READ',
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyIncident_warrantId_key" ON "PropertyIncident"("warrantId");

-- CreateIndex
CREATE INDEX "PropertyIncident_propertyId_sequence_idx" ON "PropertyIncident"("propertyId", "sequence");

-- CreateIndex
CREATE INDEX "PropertyIncident_type_idx" ON "PropertyIncident"("type");

-- CreateIndex
CREATE INDEX "PropertyIncident_result_idx" ON "PropertyIncident"("result");

-- CreateIndex
CREATE INDEX "PropertyIncident_origin_idx" ON "PropertyIncident"("origin");

-- CreateIndex
CREATE INDEX "PropertyIncident_investigationId_idx" ON "PropertyIncident"("investigationId");

-- CreateIndex
CREATE INDEX "PropertyIncident_createdById_idx" ON "PropertyIncident"("createdById");

-- CreateIndex
CREATE INDEX "PropertyIncident_occurredAt_idx" ON "PropertyIncident"("occurredAt");

-- CreateIndex
CREATE INDEX "PropertyMember_propertyId_idx" ON "PropertyMember"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyMember_userId_idx" ON "PropertyMember"("userId");

-- CreateIndex
CREATE INDEX "PropertyMember_addedById_idx" ON "PropertyMember"("addedById");

-- CreateIndex
CREATE INDEX "PropertyMember_accessLevel_idx" ON "PropertyMember"("accessLevel");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyMember_propertyId_userId_key" ON "PropertyMember"("propertyId", "userId");

-- CreateIndex
CREATE INDEX "Property_createdById_idx" ON "Property"("createdById");

-- CreateIndex
CREATE INDEX "File_propertyIncidentId_idx" ON "File"("propertyIncidentId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIncident" ADD CONSTRAINT "PropertyIncident_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIncident" ADD CONSTRAINT "PropertyIncident_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIncident" ADD CONSTRAINT "PropertyIncident_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIncident" ADD CONSTRAINT "PropertyIncident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMember" ADD CONSTRAINT "PropertyMember_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMember" ADD CONSTRAINT "PropertyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMember" ADD CONSTRAINT "PropertyMember_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_propertyIncidentId_fkey" FOREIGN KEY ("propertyIncidentId") REFERENCES "PropertyIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
