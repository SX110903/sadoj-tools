CREATE TYPE "AcademyContentType" AS ENUM ('NOTE', 'VIDEO', 'DOCUMENT', 'REGULATION');

CREATE TABLE "AcademyClass" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "instructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyClass_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AcademyClass_number_check" CHECK ("number" BETWEEN 1 AND 5)
);

CREATE TABLE "AcademyContent" (
    "id" TEXT NOT NULL,
    "type" "AcademyContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "videoUrl" TEXT,
    "fileId" TEXT,
    "classId" TEXT,
    "publishedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassAttendance" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "markedById" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademyClass_number_key" ON "AcademyClass"("number");
CREATE INDEX "AcademyClass_instructorId_idx" ON "AcademyClass"("instructorId");
CREATE UNIQUE INDEX "AcademyContent_fileId_key" ON "AcademyContent"("fileId");
CREATE INDEX "AcademyContent_type_idx" ON "AcademyContent"("type");
CREATE INDEX "AcademyContent_classId_idx" ON "AcademyContent"("classId");
CREATE INDEX "AcademyContent_publishedById_idx" ON "AcademyContent"("publishedById");
CREATE UNIQUE INDEX "ClassAttendance_classId_userId_key" ON "ClassAttendance"("classId", "userId");
CREATE INDEX "ClassAttendance_userId_idx" ON "ClassAttendance"("userId");
CREATE INDEX "ClassAttendance_markedById_idx" ON "ClassAttendance"("markedById");

ALTER TABLE "AcademyClass" ADD CONSTRAINT "AcademyClass_instructorId_fkey"
    FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AcademyContent" ADD CONSTRAINT "AcademyContent_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AcademyContent" ADD CONSTRAINT "AcademyContent_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "AcademyClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AcademyContent" ADD CONSTRAINT "AcademyContent_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "AcademyClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_markedById_fkey"
    FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "AcademyClass" ("id", "number", "title", "description", "createdAt", "updatedAt") VALUES
    ('academy-class-1', 1, 'Clase 1', 'Fundamentos y organización de la Fiscalía.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('academy-class-2', 2, 'Clase 2', 'Procedimientos y actuación profesional.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('academy-class-3', 3, 'Clase 3', 'Investigación, evidencias y documentación.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('academy-class-4', 4, 'Clase 4', 'Marco normativo y coordinación operativa.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('academy-class-5', 5, 'Clase 5', 'Preparación para la evaluación final.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
