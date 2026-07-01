-- DropIndex
DROP INDEX "PropertyIncident_propertyId_sequence_idx";

-- CreateIndex
CREATE INDEX "File_createdAt_idx" ON "File"("createdAt");

-- CreateIndex
CREATE INDEX "Investigation_updatedAt_idx" ON "Investigation"("updatedAt");

-- CreateIndex
CREATE INDEX "Sanction_createdAt_idx" ON "Sanction"("createdAt");

-- CreateIndex
CREATE INDEX "Subject_createdAt_idx" ON "Subject"("createdAt");
