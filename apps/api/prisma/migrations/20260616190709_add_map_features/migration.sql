-- CreateEnum
CREATE TYPE "MapDrawingType" AS ENUM ('POLYGON', 'POLYLINE', 'CIRCLE', 'MARKER');

-- CreateEnum
CREATE TYPE "WarrantResult" AS ENUM ('POSITIVE', 'NEGATIVE', 'PARTIAL');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "warrantReportId" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "gtaX" DOUBLE PRECISION,
ADD COLUMN     "gtaY" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "MapDrawing" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "type" "MapDrawingType" NOT NULL,
    "label" TEXT,
    "color" TEXT NOT NULL DEFAULT '#8b9db5',
    "geoJson" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapDrawing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantReport" (
    "id" TEXT NOT NULL,
    "warrantId" TEXT NOT NULL,
    "result" "WarrantResult" NOT NULL,
    "findings" TEXT NOT NULL,
    "evidence" TEXT,
    "persons" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MapDrawing_investigationId_idx" ON "MapDrawing"("investigationId");

-- CreateIndex
CREATE INDEX "MapDrawing_createdById_idx" ON "MapDrawing"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantReport_warrantId_key" ON "WarrantReport"("warrantId");

-- CreateIndex
CREATE INDEX "WarrantReport_createdById_idx" ON "WarrantReport"("createdById");

-- CreateIndex
CREATE INDEX "WarrantReport_result_idx" ON "WarrantReport"("result");

-- CreateIndex
CREATE INDEX "File_warrantReportId_idx" ON "File"("warrantReportId");

-- CreateIndex
CREATE INDEX "Property_gtaX_gtaY_idx" ON "Property"("gtaX", "gtaY");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_warrantReportId_fkey" FOREIGN KEY ("warrantReportId") REFERENCES "WarrantReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapDrawing" ADD CONSTRAINT "MapDrawing_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapDrawing" ADD CONSTRAINT "MapDrawing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantReport" ADD CONSTRAINT "WarrantReport_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantReport" ADD CONSTRAINT "WarrantReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
