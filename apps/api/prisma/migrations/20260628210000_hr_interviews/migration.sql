CREATE TYPE "CandidateStatus" AS ENUM ('PENDING', 'INTERVIEWED', 'APPROVED', 'REJECTED');

CREATE TYPE "InterviewResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');

CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "contact" TEXT,
    "notes" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedUserId" TEXT,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "conductedAt" TIMESTAMP(3),
    "score" INTEGER,
    "result" "InterviewResult" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Candidate_approvedUserId_key" ON "Candidate"("approvedUserId");
CREATE INDEX "Candidate_status_idx" ON "Candidate"("status");
CREATE INDEX "Candidate_createdById_idx" ON "Candidate"("createdById");
CREATE UNIQUE INDEX "Interview_candidateId_key" ON "Interview"("candidateId");
CREATE INDEX "Interview_interviewerId_idx" ON "Interview"("interviewerId");
CREATE INDEX "Interview_result_idx" ON "Interview"("result");

ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_approvedUserId_fkey"
    FOREIGN KEY ("approvedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Interview" ADD CONSTRAINT "Interview_interviewerId_fkey"
    FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
