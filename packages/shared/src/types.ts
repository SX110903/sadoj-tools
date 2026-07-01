export enum RoleType {
  FISCAL_GENERAL = "FISCAL_GENERAL",
  FISCAL_ADJUNTO = "FISCAL_ADJUNTO",
  FISCAL_DIVISION = "FISCAL_DIVISION",
  FISCAL_SUPERIOR = "FISCAL_SUPERIOR",
  FISCAL_JEFE = "FISCAL_JEFE",
  FISCAL = "FISCAL",
  FISCAL_AUXILIAR = "FISCAL_AUXILIAR",
  INVESTIGADOR_SENIOR = "INVESTIGADOR_SENIOR",
  INVESTIGADOR_JUNIOR = "INVESTIGADOR_JUNIOR",
  PASANTE = "PASANTE"
}

export enum Permission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_ROLES = "MANAGE_ROLES",
  MANAGE_SANCTIONS = "MANAGE_SANCTIONS",
  CREATE_INVESTIGATION = "CREATE_INVESTIGATION",
  VIEW_ALL_INVESTIGATIONS = "VIEW_ALL_INVESTIGATIONS",
  VIEW_ASSIGNED_INVESTIGATIONS = "VIEW_ASSIGNED_INVESTIGATIONS",
  EDIT_INVESTIGATION = "EDIT_INVESTIGATION",
  DELETE_INVESTIGATION = "DELETE_INVESTIGATION",
  SHARE_INVESTIGATION = "SHARE_INVESTIGATION",
  MANAGE_SUBJECTS = "MANAGE_SUBJECTS",
  VIEW_SUBJECTS = "VIEW_SUBJECTS",
  ADD_NOTES = "ADD_NOTES",
  VIEW_NOTES = "VIEW_NOTES",
  MANAGE_ZONES = "MANAGE_ZONES",
  UPLOAD_FILES = "UPLOAD_FILES",
  MANAGE_WARRANTS = "MANAGE_WARRANTS",
  VIEW_AUDIT_LOG = "VIEW_AUDIT_LOG",
  SYSTEM_CONFIG = "SYSTEM_CONFIG",
  MANAGE_HR = "MANAGE_HR",
  PUBLISH_ACADEMY = "PUBLISH_ACADEMY",
  MANAGE_ACADEMY = "MANAGE_ACADEMY",
  VIEW_ACADEMY = "VIEW_ACADEMY"
}

export type InvestigationStatus = "OPEN" | "ACTIVE" | "SUSPENDED" | "CLOSED_SUCCESSFUL" | "CLOSED_DISMISSED";
export type InvestigationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InvestigationType = "CRIMINAL" | "FINANCIAL" | "CORRUPTION" | "ORGANIZED_CRIME" | "NARCOTICS" | "WEAPONS" | "CIVIL" | "MIXED";
export type DangerLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type SubjectStatus = "FREE" | "WANTED" | "UNDER_SURVEILLANCE" | "ARRESTED" | "INDICTED" | "CONVICTED";
export type PropertyType = "RESIDENCE" | "BUSINESS" | "WAREHOUSE" | "HIDEOUT" | "UNKNOWN";
export type WarrantType = "ALLANAMIENTO" | "DETENCION" | "INTERCEPCION" | "INCAUTACION";
export type WarrantStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "EXPIRED";
export type WarrantResult = "POSITIVE" | "NEGATIVE" | "PARTIAL";
export type MapDrawingType = "POLYGON" | "POLYLINE" | "CIRCLE" | "MARKER";
export type OrgType = "GANG" | "CARTEL" | "MAFIA" | "BIKER" | "CORPORATE" | "OTHER";
export type MapElementType = "POINT" | "CIRCLE" | "POLYGON" | "POLYLINE";
export type SanctionType = "REPRIMAND" | "WARNING" | "SUSPENSION" | "DEMOTION" | "DISMISSAL";
export type BoardScope = "SUBJECT" | "INVESTIGATION" | "GLOBAL";
export type BoardCardType = "EVIDENCE" | "NOTE" | "ENTITY";
export type BoardEntityType = "subject" | "investigation" | "property" | "organization" | "document";
export type CandidateStatus = "PENDING" | "INTERVIEWED" | "APPROVED" | "REJECTED";
export type InterviewResult = "PENDING" | "PASSED" | "FAILED";
export type AcademyContentType = "NOTE" | "VIDEO" | "DOCUMENT" | "REGULATION";
export type AcademyExamStatus = "PENDING" | "AVAILABLE" | "PASSED" | "FAILED";

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  avatar?: string | null;
  badgeNumber?: string | null;
  division?: string | null;
  bio?: string | null;
  active: boolean;
  role: RoleType;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  interviewerId: string;
  scheduledAt: string | null;
  conductedAt: string | null;
  score: number | null;
  result: InterviewResult;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  contact: string | null;
  notes: string | null;
  status: CandidateStatus;
  createdById: string;
  approvedUserId: string | null;
  interview: Interview | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyContent {
  id: string;
  type: AcademyContentType;
  title: string;
  body: string | null;
  videoUrl: string | null;
  fileId: string | null;
  classId: string | null;
  publishedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademyClass {
  id: string;
  number: number;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  instructorId: string | null;
  contents: AcademyContent[];
  createdAt: string;
  updatedAt: string;
}

export interface Investigation {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  type: InvestigationType;
  legalBasis?: string | null;
  startDate: string;
  closeDate?: string | null;
  leadFiscalId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  firstName: string;
  lastName: string;
  alias?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  occupation?: string | null;
  phone?: string | null;
  address?: string | null;
  photo?: string | null;
  dangerLevel: DangerLevel;
  status: SubjectStatus;
  isOrganized: boolean;
  organization?: string | null;
  organizationId?: string | null;
  criminalOrganization?: CriminalOrganization | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface Property {
  id: string;
  address: string;
  type: PropertyType;
  zone?: string | null;
  notes?: string | null;
  gtaX?: number | null;
  gtaY?: number | null;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  authorId: string;
  isConfidential: boolean;
  isPinned: boolean;
  investigationId?: string | null;
  subjectId?: string | null;
  targetUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Warrant {
  id: string;
  warrantNumber: string;
  type: WarrantType;
  title: string;
  description: string;
  location: string;
  justification: string;
  legalBasis: string;
  status: WarrantStatus;
  investigationId: string;
  requestedById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  executedAt?: string | null;
  executionNotes?: string | null;
  createdAt: string;
}

export interface WarrantReport {
  id: string;
  warrantId: string;
  result: WarrantResult;
  findings: string;
  evidence?: string | null;
  persons?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
}

export interface MapDrawing {
  id: string;
  investigationId: string;
  type: MapDrawingType;
  label?: string | null;
  geoJson: string;
  color?: string | null;
  description?: string | null;
  createdById: string;
  createdAt: string;
}

export interface CriminalOrganization {
  id: string;
  name: string;
  alias?: string | null;
  color: string;
  description?: string | null;
  type: OrgType;
  active: boolean;
  createdById: string;
  createdAt: string;
  _count?: {
    members: number;
    mapElements: number;
  };
}

export interface MapElementSubject {
  id: string;
  mapElementId: string;
  subjectId: string;
  role?: string | null;
  subject: Subject;
}

export interface MapElement {
  id: string;
  investigationId?: string | null;
  legendNumber: number;
  type: MapElementType;
  label: string;
  description?: string | null;
  color: string;
  geoJson: string;
  radius?: number | null;
  organizationId?: string | null;
  organization?: CriminalOrganization | null;
  propertyId?: string | null;
  property?: Property | null;
  linkedSubjects: MapElementSubject[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sanction {
  id: string;
  userId: string;
  type: SanctionType;
  description: string;
  issuedById: string;
  severity: number;
  active: boolean;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedNotes?: string | null;
}

export interface Zone {
  id: string;
  name: string;
  district: string;
  description?: string | null;
  coordsJson?: string | null;
}

export interface Message {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  editedAt?: string | null;
  createdAt: string;
}

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  investigationId?: string | null;
  noteId?: string | null;
  warrantId?: string | null;
  warrantReportId?: string | null;
  subjectId?: string | null;
  messageId?: string | null;
  evidenceBoardId?: string | null;
  createdAt: string;
}

export interface EvidenceBoardFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  createdAt: string;
}

export interface BoardCard {
  id: string;
  boardId: string;
  type: BoardCardType;
  title: string;
  text: string | null;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  fileId: string | null;
  file?: EvidenceBoardFile | null;
  imageUrl: string | null;
  eventDate: string | null;
  entityType: BoardEntityType | null;
  entityId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardConnection {
  id: string;
  boardId: string;
  fromCardId: string;
  toCardId: string;
  label: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceBoard {
  id: string;
  scope: BoardScope;
  title: string;
  ownerId: string;
  subjectId: string | null;
  investigationId: string | null;
  cards: BoardCard[];
  connections: BoardConnection[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  investigationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  error: false;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: true;
  code: string;
  message: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  error: false;
  data: T[];
  meta: PaginationMeta;
}
