import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { hasPermission, Permission } from "@sadoj/shared";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";
import { Prisma, type PrismaClient } from "../../shared/prisma";
import { StorageService } from "../../shared/storage/storage.service";
import { canSeeConfidentialNotes } from "../../shared/utils/role";
import type { AuthenticatedUser } from "../../types/fastify";
import { ensurePropertyAccess } from "../properties/property-access";
import type { FileTargetType } from "./files.schema";

interface UploadTarget {
  type: FileTargetType;
  id: string;
}

interface ProcessedFile {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  thumbnail?: {
    buffer: Buffer;
    mimeType: string;
    extension: string;
  };
}

export interface FileUploadResult {
  file: unknown;
  thumbnailUrl?: string;
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
const PROCESSABLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ENTITY_FOLDER: Readonly<Record<FileTargetType, string>> = {
  investigation: "investigations",
  subject: "subjects",
  warrant: "warrants",
  note: "notes",
  warrantReport: "warrant-reports",
  propertyIncident: "property-incidents"
};

export class FilesService {
  private readonly storage = new StorageService();

  public constructor(private readonly prisma: PrismaClient) {}

  public async listForTarget(target: UploadTarget, requester: AuthenticatedUser): Promise<unknown[]> {
    await this.ensureTargetAccess(target, requester, "read");

    return this.prisma.file.findMany({
      where: this.buildTargetWhere(target),
      include: { uploadedBy: { select: { id: true, displayName: true, role: true, avatar: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  public async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    uploadedBy: AuthenticatedUser,
    target: UploadTarget
  ): Promise<FileUploadResult> {
    this.validateFile(buffer, mimeType);
    await this.ensureTargetAccess(target, uploadedBy, "write");

    const processed = await this.processFile(buffer, mimeType);
    const objectName = `${ENTITY_FOLDER[target.type]}/${target.id}/${randomUUID()}.${processed.extension}`;
    const storedFile = await this.storage.uploadBuffer(objectName, processed.buffer, processed.mimeType);
    const thumbnailUrl = await this.uploadThumbnail(target, processed);
    const fileData = this.buildFileData(storedFile.filename, originalName, storedFile.mimeType, storedFile.size, storedFile.url, uploadedBy.id, target);
    const file = await this.prisma.file.create({
      data: fileData,
      include: { uploadedBy: { select: { id: true, displayName: true, role: true, avatar: true } } }
    });

    return thumbnailUrl === undefined ? { file } : { file, thumbnailUrl };
  }

  public async delete(fileId: string, requester: AuthenticatedUser): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (file === null) {
      throw new AppError(404, "FILE_NOT_FOUND", "No se encontró el archivo solicitado.");
    }

    if (file.uploadedById !== requester.id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para borrar este archivo.");
    }

    await this.storage.deleteObject(file.filename);
    await this.prisma.file.delete({ where: { id: fileId } });
  }

  public async getSignedUrl(fileId: string, requester: AuthenticatedUser): Promise<string> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });

    if (file === null) {
      throw new AppError(404, "FILE_NOT_FOUND", "No se encontró el archivo solicitado.");
    }

    await this.ensureFileAccess(file, requester);
    return this.storage.getSignedUrl(file.filename, 60 * 60);
  }

  private validateFile(buffer: Buffer, mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new AppError(400, "INVALID_FILE_TYPE", "Solo se permiten imágenes JPG, PNG, WebP, GIF o documentos PDF.");
    }

    const maxSize = env.MAX_FILE_SIZE_MB * 1024 * 1024;

    if (buffer.byteLength > maxSize) {
      throw new AppError(400, "FILE_TOO_LARGE", `El archivo no puede superar ${env.MAX_FILE_SIZE_MB} MB.`);
    }
  }

  private async processFile(input: Buffer, mimeType: string): Promise<ProcessedFile> {
    if (!PROCESSABLE_IMAGE_TYPES.has(mimeType)) {
      return { buffer: input, mimeType, extension: this.extensionForMimeType(mimeType) };
    }

    const image = sharp(input).rotate();
    const metadata = await image.metadata();
    const shouldResize = (metadata.width ?? 0) > 2000 || (metadata.height ?? 0) > 2000;
    const pipeline = shouldResize ? image.resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }) : image;
    const output = await pipeline.webp({ quality: 86 }).toBuffer();
    const thumbnail = await sharp(input).rotate().resize(300, 300, { fit: "cover", position: "center" }).webp({ quality: 82 }).toBuffer();

    return {
      buffer: output,
      mimeType: "image/webp",
      extension: "webp",
      thumbnail: {
        buffer: thumbnail,
        mimeType: "image/webp",
        extension: "webp"
      }
    };
  }

  private async uploadThumbnail(target: UploadTarget, processed: ProcessedFile): Promise<string | undefined> {
    if (processed.thumbnail === undefined) {
      return undefined;
    }

    const thumbnailName = `${ENTITY_FOLDER[target.type]}/${target.id}/${randomUUID()}-thumb.${processed.thumbnail.extension}`;
    const storedThumbnail = await this.storage.uploadBuffer(thumbnailName, processed.thumbnail.buffer, processed.thumbnail.mimeType);
    return storedThumbnail.url;
  }

  private buildFileData(
    filename: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
    uploadedById: string,
    target: UploadTarget
  ): Prisma.FileUncheckedCreateInput {
    const data: Prisma.FileUncheckedCreateInput = {
      filename,
      originalName,
      mimeType,
      size,
      url,
      uploadedById
    };

    if (target.type === "investigation") data.investigationId = target.id;
    if (target.type === "subject") data.subjectId = target.id;
    if (target.type === "warrant") data.warrantId = target.id;
    if (target.type === "note") data.noteId = target.id;
    if (target.type === "warrantReport") data.warrantReportId = target.id;
    if (target.type === "propertyIncident") data.propertyIncidentId = target.id;

    return data;
  }

  private buildTargetWhere(target: UploadTarget): Prisma.FileWhereInput {
    if (target.type === "investigation") return { investigationId: target.id };
    if (target.type === "subject") return { subjectId: target.id };
    if (target.type === "warrant") return { warrantId: target.id };
    if (target.type === "warrantReport") return { warrantReportId: target.id };
    if (target.type === "propertyIncident") return { propertyIncidentId: target.id };
    return { noteId: target.id };
  }

  private extensionForMimeType(mimeType: string): string {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType === "image/gif") return "gif";

    const extension = extname(mimeType).replace(".", "");
    return extension.length > 0 ? extension : "bin";
  }

  private async ensureTargetAccess(target: UploadTarget, requester: AuthenticatedUser, propertyAccess: "read" | "write"): Promise<void> {
    if (target.type === "investigation") {
      await this.ensureInvestigationAccess(target.id, requester);
      return;
    }

    if (target.type === "subject") {
      await this.ensureSubjectAccess(target.id, requester);
      return;
    }

    if (target.type === "warrant") {
      const warrant = await this.prisma.warrant.findUnique({ where: { id: target.id } });

      if (warrant === null) {
        throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
      }

      await this.ensureInvestigationAccess(warrant.investigationId, requester);
      return;
    }

    if (target.type === "warrantReport") {
      const report = await this.prisma.warrantReport.findUnique({ where: { id: target.id }, include: { warrant: true } });

      if (report === null) {
        throw new AppError(404, "WARRANT_REPORT_NOT_FOUND", "No se encontró el informe solicitado.");
      }

      await this.ensureInvestigationAccess(report.warrant.investigationId, requester);
      return;
    }

    if (target.type === "propertyIncident") {
      const incident = await this.prisma.propertyIncident.findUnique({ where: { id: target.id }, select: { propertyId: true } });

      if (incident === null) {
        throw new AppError(404, "PROPERTY_INCIDENT_NOT_FOUND", "No se encontro el incidente solicitado.");
      }

      await ensurePropertyAccess(this.prisma, requester, incident.propertyId, propertyAccess);
      return;
    }

    await this.ensureNoteAccess(target.id, requester);
  }

  private async ensureFileAccess(file: Prisma.FileUncheckedCreateInput & { id?: string }, requester: AuthenticatedUser): Promise<void> {
    if (file.investigationId !== null && file.investigationId !== undefined) {
      await this.ensureInvestigationAccess(file.investigationId, requester);
      return;
    }

    if (file.subjectId !== null && file.subjectId !== undefined) {
      await this.ensureSubjectAccess(file.subjectId, requester);
      return;
    }

    if (file.warrantId !== null && file.warrantId !== undefined) {
      const warrant = await this.prisma.warrant.findUnique({ where: { id: file.warrantId } });

      if (warrant === null) {
        throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
      }

      await this.ensureInvestigationAccess(warrant.investigationId, requester);
      return;
    }

    if (file.warrantReportId !== null && file.warrantReportId !== undefined) {
      const report = await this.prisma.warrantReport.findUnique({ where: { id: file.warrantReportId }, include: { warrant: true } });

      if (report === null) {
        throw new AppError(404, "WARRANT_REPORT_NOT_FOUND", "No se encontró el informe solicitado.");
      }

      await this.ensureInvestigationAccess(report.warrant.investigationId, requester);
      return;
    }

    if (file.propertyIncidentId !== null && file.propertyIncidentId !== undefined) {
      const incident = await this.prisma.propertyIncident.findUnique({ where: { id: file.propertyIncidentId }, select: { propertyId: true } });

      if (incident === null) {
        throw new AppError(404, "PROPERTY_INCIDENT_NOT_FOUND", "No se encontro el incidente solicitado.");
      }

      await ensurePropertyAccess(this.prisma, requester, incident.propertyId, "read");
      return;
    }

    if (file.noteId !== null && file.noteId !== undefined) {
      await this.ensureNoteAccess(file.noteId, requester);
    }
  }

  private async ensureInvestigationAccess(investigationId: string, requester: AuthenticatedUser): Promise<void> {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { participants: { where: { userId: requester.id } } }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    const hasGlobalAccess = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS);
    const isLead = investigation.leadFiscalId === requester.id;
    const isParticipant = investigation.participants.length > 0;

    if (!hasGlobalAccess && !isLead && !isParticipant) {
      throw new AppError(403, "INVESTIGATION_ACCESS_DENIED", "No tienes acceso a esta investigación.");
    }
  }

  private async ensureSubjectAccess(subjectId: string, requester: AuthenticatedUser): Promise<void> {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });

    if (subject === null) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
    }

    if (!hasPermission(requester.role, Permission.VIEW_SUBJECTS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver este sujeto.");
    }
  }

  private async ensureNoteAccess(noteId: string, requester: AuthenticatedUser): Promise<void> {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });

    if (note === null) {
      throw new AppError(404, "NOTE_NOT_FOUND", "No se encontró la nota solicitada.");
    }

    if (note.isConfidential && !canSeeConfidentialNotes(requester.role)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver esta nota confidencial.");
    }

    if (note.investigationId !== null) {
      await this.ensureInvestigationAccess(note.investigationId, requester);
      return;
    }

    if (note.subjectId !== null) {
      await this.ensureSubjectAccess(note.subjectId, requester);
      return;
    }

    if (note.targetUserId !== null && note.targetUserId !== requester.id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver esta nota.");
    }
  }
}
