-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('GANG', 'CARTEL', 'MAFIA', 'BIKER', 'CORPORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MapElementType" AS ENUM ('POINT', 'CIRCLE', 'POLYGON', 'POLYLINE');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "CriminalOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "color" TEXT NOT NULL DEFAULT '#dc2626',
    "description" TEXT,
    "type" "OrgType" NOT NULL DEFAULT 'GANG',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CriminalOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapElement" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT,
    "legendNumber" INTEGER NOT NULL,
    "type" "MapElementType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#dc2626',
    "geoJson" TEXT NOT NULL,
    "radius" DOUBLE PRECISION,
    "organizationId" TEXT,
    "propertyId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapElementSubject" (
    "id" TEXT NOT NULL,
    "mapElementId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "MapElementSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CriminalOrganization_name_key" ON "CriminalOrganization"("name");

-- CreateIndex
CREATE INDEX "CriminalOrganization_type_idx" ON "CriminalOrganization"("type");

-- CreateIndex
CREATE INDEX "CriminalOrganization_active_idx" ON "CriminalOrganization"("active");

-- CreateIndex
CREATE INDEX "CriminalOrganization_createdById_idx" ON "CriminalOrganization"("createdById");

-- CreateIndex
CREATE INDEX "MapElement_investigationId_idx" ON "MapElement"("investigationId");

-- CreateIndex
CREATE INDEX "MapElement_organizationId_idx" ON "MapElement"("organizationId");

-- CreateIndex
CREATE INDEX "MapElement_propertyId_idx" ON "MapElement"("propertyId");

-- CreateIndex
CREATE INDEX "MapElement_createdById_idx" ON "MapElement"("createdById");

-- CreateIndex
CREATE INDEX "MapElementSubject_subjectId_idx" ON "MapElementSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "MapElementSubject_mapElementId_subjectId_key" ON "MapElementSubject"("mapElementId", "subjectId");

-- CreateIndex
CREATE INDEX "Subject_organizationId_idx" ON "Subject"("organizationId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "CriminalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriminalOrganization" ADD CONSTRAINT "CriminalOrganization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElement" ADD CONSTRAINT "MapElement_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElement" ADD CONSTRAINT "MapElement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "CriminalOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElement" ADD CONSTRAINT "MapElement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElement" ADD CONSTRAINT "MapElement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElementSubject" ADD CONSTRAINT "MapElementSubject_mapElementId_fkey" FOREIGN KEY ("mapElementId") REFERENCES "MapElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElementSubject" ADD CONSTRAINT "MapElementSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
