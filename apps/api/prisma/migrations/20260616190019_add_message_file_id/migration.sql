-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileId" TEXT;

-- CreateIndex
CREATE INDEX "Message_fileId_idx" ON "Message"("fileId");
