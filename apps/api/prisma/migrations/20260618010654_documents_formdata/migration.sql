/*
  Warnings:

  - You are about to drop the column `content` on the `Document` table. All the data in the column will be lost.
  - Changed the type of `type` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "content",
ADD COLUMN     "formData" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "subjectId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_subjectId_idx" ON "Document"("subjectId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
