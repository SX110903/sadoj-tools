-- CreateEnum
CREATE TYPE "DecorationTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DECORATION_AWARDED';

-- CreateTable
CREATE TABLE "Decoration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT DEFAULT '#d4a843',
    "tier" "DecorationTier" NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decoration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecorationAward" (
    "id" TEXT NOT NULL,
    "decorationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "awardedById" TEXT NOT NULL,
    "reason" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecorationAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Decoration_tier_idx" ON "Decoration"("tier");

-- CreateIndex
CREATE INDEX "DecorationAward_userId_idx" ON "DecorationAward"("userId");

-- CreateIndex
CREATE INDEX "DecorationAward_decorationId_idx" ON "DecorationAward"("decorationId");

-- CreateIndex
CREATE INDEX "DecorationAward_awardedById_idx" ON "DecorationAward"("awardedById");

-- AddForeignKey
ALTER TABLE "DecorationAward" ADD CONSTRAINT "DecorationAward_decorationId_fkey" FOREIGN KEY ("decorationId") REFERENCES "Decoration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecorationAward" ADD CONSTRAINT "DecorationAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecorationAward" ADD CONSTRAINT "DecorationAward_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
