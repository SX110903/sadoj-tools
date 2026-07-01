CREATE TYPE "BoardScope" AS ENUM ('SUBJECT', 'INVESTIGATION', 'GLOBAL');

CREATE TYPE "BoardCardType" AS ENUM ('EVIDENCE', 'NOTE', 'ENTITY');

ALTER TABLE "File" ADD COLUMN "evidenceBoardId" TEXT;

CREATE TABLE "EvidenceBoard" (
    "id" TEXT NOT NULL,
    "scope" "BoardScope" NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "subjectId" TEXT,
    "investigationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoardCard" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "type" "BoardCardType" NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "color" TEXT NOT NULL DEFAULT '#f8fafc',
    "x" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 220,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 170,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "fileId" TEXT,
    "imageUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoardConnection" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "fromCardId" TEXT NOT NULL,
    "toCardId" TEXT NOT NULL,
    "label" TEXT,
    "color" TEXT NOT NULL DEFAULT '#dc2626',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EvidenceBoard_subjectId_key" ON "EvidenceBoard"("subjectId");
CREATE UNIQUE INDEX "EvidenceBoard_investigationId_key" ON "EvidenceBoard"("investigationId");
CREATE INDEX "EvidenceBoard_scope_idx" ON "EvidenceBoard"("scope");
CREATE INDEX "EvidenceBoard_ownerId_idx" ON "EvidenceBoard"("ownerId");
CREATE INDEX "EvidenceBoard_subjectId_idx" ON "EvidenceBoard"("subjectId");
CREATE INDEX "EvidenceBoard_investigationId_idx" ON "EvidenceBoard"("investigationId");

CREATE INDEX "BoardCard_boardId_idx" ON "BoardCard"("boardId");
CREATE INDEX "BoardCard_type_idx" ON "BoardCard"("type");
CREATE INDEX "BoardCard_fileId_idx" ON "BoardCard"("fileId");
CREATE INDEX "BoardCard_entityType_entityId_idx" ON "BoardCard"("entityType", "entityId");
CREATE INDEX "BoardCard_eventDate_idx" ON "BoardCard"("eventDate");
CREATE INDEX "BoardCard_createdById_idx" ON "BoardCard"("createdById");

CREATE UNIQUE INDEX "BoardConnection_boardId_fromCardId_toCardId_key" ON "BoardConnection"("boardId", "fromCardId", "toCardId");
CREATE INDEX "BoardConnection_boardId_idx" ON "BoardConnection"("boardId");
CREATE INDEX "BoardConnection_fromCardId_idx" ON "BoardConnection"("fromCardId");
CREATE INDEX "BoardConnection_toCardId_idx" ON "BoardConnection"("toCardId");

CREATE INDEX "File_evidenceBoardId_idx" ON "File"("evidenceBoardId");

ALTER TABLE "EvidenceBoard" ADD CONSTRAINT "EvidenceBoard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EvidenceBoard" ADD CONSTRAINT "EvidenceBoard_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceBoard" ADD CONSTRAINT "EvidenceBoard_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "File" ADD CONSTRAINT "File_evidenceBoardId_fkey" FOREIGN KEY ("evidenceBoardId") REFERENCES "EvidenceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardCard" ADD CONSTRAINT "BoardCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "EvidenceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardCard" ADD CONSTRAINT "BoardCard_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BoardCard" ADD CONSTRAINT "BoardCard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BoardConnection" ADD CONSTRAINT "BoardConnection_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "EvidenceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardConnection" ADD CONSTRAINT "BoardConnection_fromCardId_fkey" FOREIGN KEY ("fromCardId") REFERENCES "BoardCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardConnection" ADD CONSTRAINT "BoardConnection_toCardId_fkey" FOREIGN KEY ("toCardId") REFERENCES "BoardCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
