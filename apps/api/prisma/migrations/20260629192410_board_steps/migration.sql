-- CreateEnum
CREATE TYPE "BoardStepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "BoardStep" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BoardStepStatus" NOT NULL DEFAULT 'PENDING',
    "fileId" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardStep_boardId_idx" ON "BoardStep"("boardId");

-- CreateIndex
CREATE INDEX "BoardStep_fileId_idx" ON "BoardStep"("fileId");

-- CreateIndex
CREATE INDEX "BoardStep_createdById_idx" ON "BoardStep"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "BoardStep_boardId_order_key" ON "BoardStep"("boardId", "order");

-- AddForeignKey
ALTER TABLE "BoardStep" ADD CONSTRAINT "BoardStep_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "EvidenceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardStep" ADD CONSTRAINT "BoardStep_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardStep" ADD CONSTRAINT "BoardStep_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
