-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('FISCAL_GENERAL', 'FISCAL_ADJUNTO', 'FISCAL_DIVISION', 'FISCAL_SUPERIOR', 'FISCAL_JEFE', 'FISCAL', 'FISCAL_AUXILIAR', 'INVESTIGADOR_SENIOR', 'INVESTIGADOR_JUNIOR', 'PASANTE');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_SANCTIONS', 'CREATE_INVESTIGATION', 'VIEW_ALL_INVESTIGATIONS', 'VIEW_ASSIGNED_INVESTIGATIONS', 'EDIT_INVESTIGATION', 'DELETE_INVESTIGATION', 'SHARE_INVESTIGATION', 'MANAGE_SUBJECTS', 'VIEW_SUBJECTS', 'ADD_NOTES', 'VIEW_NOTES', 'MANAGE_ZONES', 'UPLOAD_FILES', 'MANAGE_WARRANTS', 'VIEW_AUDIT_LOG', 'SYSTEM_CONFIG');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('OPEN', 'ACTIVE', 'SUSPENDED', 'CLOSED_SUCCESSFUL', 'CLOSED_DISMISSED');

-- CreateEnum
CREATE TYPE "InvestigationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InvestigationType" AS ENUM ('CRIMINAL', 'FINANCIAL', 'CORRUPTION', 'ORGANIZED_CRIME', 'NARCOTICS', 'WEAPONS', 'CIVIL', 'MIXED');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "DangerLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('FREE', 'WANTED', 'UNDER_SURVEILLANCE', 'ARRESTED', 'INDICTED', 'CONVICTED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENCE', 'BUSINESS', 'WAREHOUSE', 'HIDEOUT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('ASSOCIATE', 'FAMILY', 'EMPLOYER', 'EMPLOYEE', 'ACCOMPLICE', 'RIVAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WarrantType" AS ENUM ('ALLANAMIENTO', 'DETENCION', 'INTERCEPCION', 'INCAUTACION');

-- CreateEnum
CREATE TYPE "WarrantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('REPRIMAND', 'WARNING', 'SUSPENSION', 'DEMOTION', 'DISMISSAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "badgeNumber" TEXT,
    "division" TEXT,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" "RoleType" NOT NULL DEFAULT 'PASANTE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "InvestigationPriority" NOT NULL DEFAULT 'MEDIUM',
    "type" "InvestigationType" NOT NULL,
    "legalBasis" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeDate" TIMESTAMP(3),
    "leadFiscalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationParticipant" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'READ',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT,

    CONSTRAINT "InvestigationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationSubject" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "alias" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "occupation" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "photo" TEXT,
    "dangerLevel" "DangerLevel" NOT NULL DEFAULT 'LOW',
    "status" "SubjectStatus" NOT NULL DEFAULT 'FREE',
    "isOrganized" BOOLEAN NOT NULL DEFAULT false,
    "organization" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "year" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "zone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectVehicle" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,

    CONSTRAINT "SubjectVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectProperty" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,

    CONSTRAINT "SubjectProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectRelationship" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "description" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SubjectRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "description" TEXT,
    "coordsJson" TEXT,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectZone" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "frequency" TEXT,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "SubjectZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "investigationId" TEXT,
    "subjectId" TEXT,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warrant" (
    "id" TEXT NOT NULL,
    "warrantNumber" TEXT NOT NULL,
    "type" "WarrantType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "status" "WarrantStatus" NOT NULL DEFAULT 'PENDING',
    "investigationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "executedAt" TIMESTAMP(3),
    "executionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sanction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SanctionType" NOT NULL,
    "description" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNotes" TEXT,

    CONSTRAINT "Sanction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "investigationId" TEXT,
    "noteId" TEXT,
    "warrantId" TEXT,
    "subjectId" TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "investigationId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "permission" "Permission" NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_badgeNumber_key" ON "User"("badgeNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_caseNumber_key" ON "Investigation"("caseNumber");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Investigation_leadFiscalId_idx" ON "Investigation"("leadFiscalId");

-- CreateIndex
CREATE INDEX "Investigation_type_idx" ON "Investigation"("type");

-- CreateIndex
CREATE INDEX "Investigation_priority_idx" ON "Investigation"("priority");

-- CreateIndex
CREATE INDEX "InvestigationParticipant_investigationId_idx" ON "InvestigationParticipant"("investigationId");

-- CreateIndex
CREATE INDEX "InvestigationParticipant_userId_idx" ON "InvestigationParticipant"("userId");

-- CreateIndex
CREATE INDEX "InvestigationParticipant_addedById_idx" ON "InvestigationParticipant"("addedById");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationParticipant_investigationId_userId_key" ON "InvestigationParticipant"("investigationId", "userId");

-- CreateIndex
CREATE INDEX "InvestigationSubject_investigationId_idx" ON "InvestigationSubject"("investigationId");

-- CreateIndex
CREATE INDEX "InvestigationSubject_subjectId_idx" ON "InvestigationSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationSubject_investigationId_subjectId_key" ON "InvestigationSubject"("investigationId", "subjectId");

-- CreateIndex
CREATE INDEX "Subject_status_idx" ON "Subject"("status");

-- CreateIndex
CREATE INDEX "Subject_lastName_idx" ON "Subject"("lastName");

-- CreateIndex
CREATE INDEX "Subject_dangerLevel_idx" ON "Subject"("dangerLevel");

-- CreateIndex
CREATE INDEX "Subject_organization_idx" ON "Subject"("organization");

-- CreateIndex
CREATE INDEX "Subject_createdById_idx" ON "Subject"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_plate_idx" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Property_address_idx" ON "Property"("address");

-- CreateIndex
CREATE INDEX "Property_type_idx" ON "Property"("type");

-- CreateIndex
CREATE INDEX "Property_zone_idx" ON "Property"("zone");

-- CreateIndex
CREATE INDEX "SubjectVehicle_subjectId_idx" ON "SubjectVehicle"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectVehicle_vehicleId_idx" ON "SubjectVehicle"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVehicle_subjectId_vehicleId_key" ON "SubjectVehicle"("subjectId", "vehicleId");

-- CreateIndex
CREATE INDEX "SubjectProperty_subjectId_idx" ON "SubjectProperty"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectProperty_propertyId_idx" ON "SubjectProperty"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectProperty_subjectId_propertyId_key" ON "SubjectProperty"("subjectId", "propertyId");

-- CreateIndex
CREATE INDEX "SubjectRelationship_fromId_idx" ON "SubjectRelationship"("fromId");

-- CreateIndex
CREATE INDEX "SubjectRelationship_toId_idx" ON "SubjectRelationship"("toId");

-- CreateIndex
CREATE INDEX "SubjectRelationship_type_idx" ON "SubjectRelationship"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectRelationship_fromId_toId_key" ON "SubjectRelationship"("fromId", "toId");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE INDEX "Zone_district_idx" ON "Zone"("district");

-- CreateIndex
CREATE INDEX "SubjectZone_subjectId_idx" ON "SubjectZone"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectZone_zoneId_idx" ON "SubjectZone"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectZone_subjectId_zoneId_key" ON "SubjectZone"("subjectId", "zoneId");

-- CreateIndex
CREATE INDEX "Note_authorId_idx" ON "Note"("authorId");

-- CreateIndex
CREATE INDEX "Note_investigationId_idx" ON "Note"("investigationId");

-- CreateIndex
CREATE INDEX "Note_subjectId_idx" ON "Note"("subjectId");

-- CreateIndex
CREATE INDEX "Note_targetUserId_idx" ON "Note"("targetUserId");

-- CreateIndex
CREATE INDEX "Note_isPinned_idx" ON "Note"("isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "Warrant_warrantNumber_key" ON "Warrant"("warrantNumber");

-- CreateIndex
CREATE INDEX "Warrant_status_idx" ON "Warrant"("status");

-- CreateIndex
CREATE INDEX "Warrant_type_idx" ON "Warrant"("type");

-- CreateIndex
CREATE INDEX "Warrant_investigationId_idx" ON "Warrant"("investigationId");

-- CreateIndex
CREATE INDEX "Warrant_requestedById_idx" ON "Warrant"("requestedById");

-- CreateIndex
CREATE INDEX "Warrant_approvedById_idx" ON "Warrant"("approvedById");

-- CreateIndex
CREATE INDEX "Sanction_userId_idx" ON "Sanction"("userId");

-- CreateIndex
CREATE INDEX "Sanction_issuedById_idx" ON "Sanction"("issuedById");

-- CreateIndex
CREATE INDEX "Sanction_active_idx" ON "Sanction"("active");

-- CreateIndex
CREATE INDEX "Sanction_type_idx" ON "Sanction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "File_messageId_key" ON "File"("messageId");

-- CreateIndex
CREATE INDEX "File_uploadedById_idx" ON "File"("uploadedById");

-- CreateIndex
CREATE INDEX "File_investigationId_idx" ON "File"("investigationId");

-- CreateIndex
CREATE INDEX "File_noteId_idx" ON "File"("noteId");

-- CreateIndex
CREATE INDEX "File_warrantId_idx" ON "File"("warrantId");

-- CreateIndex
CREATE INDEX "File_subjectId_idx" ON "File"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_investigationId_key" ON "ChatRoom"("investigationId");

-- CreateIndex
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

-- CreateIndex
CREATE INDEX "Message_authorId_idx" ON "Message"("authorId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_investigationId_idx" ON "AuditLog"("investigationId");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "RolePermission_permission_idx" ON "RolePermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_leadFiscalId_fkey" FOREIGN KEY ("leadFiscalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationParticipant" ADD CONSTRAINT "InvestigationParticipant_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationParticipant" ADD CONSTRAINT "InvestigationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationSubject" ADD CONSTRAINT "InvestigationSubject_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationSubject" ADD CONSTRAINT "InvestigationSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectVehicle" ADD CONSTRAINT "SubjectVehicle_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectVehicle" ADD CONSTRAINT "SubjectVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProperty" ADD CONSTRAINT "SubjectProperty_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProperty" ADD CONSTRAINT "SubjectProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectRelationship" ADD CONSTRAINT "SubjectRelationship_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectRelationship" ADD CONSTRAINT "SubjectRelationship_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectZone" ADD CONSTRAINT "SubjectZone_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectZone" ADD CONSTRAINT "SubjectZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_warrantId_fkey" FOREIGN KEY ("warrantId") REFERENCES "Warrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
