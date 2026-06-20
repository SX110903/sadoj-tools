-- AlterTable
ALTER TABLE "Warrant" ADD COLUMN     "propertyId" TEXT;

-- AlterTable
ALTER TABLE "WarrantReport" ADD COLUMN     "participatingAgencies" TEXT,
ADD COLUMN     "raidSequence" INTEGER;

-- CreateIndex
CREATE INDEX "Warrant_propertyId_idx" ON "Warrant"("propertyId");

-- CreateIndex
CREATE INDEX "WarrantReport_raidSequence_idx" ON "WarrantReport"("raidSequence");

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
