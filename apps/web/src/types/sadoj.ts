import type { DocumentType, FormData as DocumentFormData } from "./documents";
export type { DocumentType } from "./documents";

export type RoleType =
  | "FISCAL_GENERAL"
  | "FISCAL_ADJUNTO"
  | "FISCAL_DIVISION"
  | "FISCAL_SUPERIOR"
  | "FISCAL_JEFE"
  | "FISCAL"
  | "FISCAL_AUXILIAR"
  | "INVESTIGADOR_SENIOR"
  | "INVESTIGADOR_JUNIOR"
  | "PASANTE";

export type InvestigationStatus = "OPEN" | "ACTIVE" | "SUSPENDED" | "CLOSED_SUCCESSFUL" | "CLOSED_DISMISSED";
export type InvestigationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InvestigationType = "CRIMINAL" | "FINANCIAL" | "CORRUPTION" | "ORGANIZED_CRIME" | "NARCOTICS" | "WEAPONS" | "CIVIL" | "MIXED";
export type DangerLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type SubjectStatus = "FREE" | "WANTED" | "UNDER_SURVEILLANCE" | "ARRESTED" | "INDICTED" | "CONVICTED";
export type PropertyType = "RESIDENCE" | "BUSINESS" | "WAREHOUSE" | "HIDEOUT" | "UNKNOWN";
export type WarrantType = "ALLANAMIENTO" | "DETENCION" | "INTERCEPCION" | "INCAUTACION";
export type WarrantStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "EXPIRED";
export type WarrantResult = "POSITIVE" | "NEGATIVE" | "PARTIAL";
export type PropertyIncidentType = "RAID" | "SEIZURE" | "SURVEILLANCE" | "SIGHTING" | "INTERVENTION" | "INSPECTION" | "OTHER";
export type IncidentResult = "POSITIVE" | "NEGATIVE" | "PARTIAL" | "PENDING";
export type IncidentOrigin = "MANUAL" | "WARRANT";
export type SanctionType = "REPRIMAND" | "WARNING" | "SUSPENSION" | "DEMOTION" | "DISMISSAL";
export type DocumentStatus = "DRAFT" | "ISSUED" | "SIGNED" | "ARCHIVED";
export type MapDrawingType = "POLYGON" | "POLYLINE" | "CIRCLE" | "MARKER";
export type OrgType = "GANG" | "CARTEL" | "MAFIA" | "BIKER" | "CORPORATE" | "OTHER";
export type MapElementType = "POINT" | "CIRCLE" | "POLYGON" | "POLYLINE";
export type AccessLevel = "READ" | "WRITE" | "ADMIN";
export type DatalinkNodeType = "subject" | "organization" | "property" | "vehicle" | "document" | "mapElement";
export type DatalinkEdgeType = "member_of" | "owns" | "linked_to" | "related" | "documented_in" | "mapped_in";
export type NotificationType =
  | "INVESTIGATION_ASSIGNED"
  | "INVESTIGATION_UPDATED"
  | "DOCUMENT_SIGNED"
  | "DOCUMENT_TO_SIGN"
  | "WARRANT_APPROVED"
  | "WARRANT_REJECTED"
  | "SANCTION_ISSUED"
  | "MENTION"
  | "NOTE_ADDED";

export interface PersonRef {
  id: string;
  displayName: string;
  role: RoleType;
  avatar: string | null;
}

export interface CaseFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  uploadedBy?: PersonRef;
  createdAt: string;
}

export interface NoteWithAuthor {
  id: string;
  content: string;
  authorId: string;
  author: PersonRef;
  isConfidential: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  files?: CaseFile[];
}

export interface InvestigationParticipant {
  id: string;
  accessLevel: AccessLevel;
  user: PersonRef & { badgeNumber: string | null };
}

export interface InvestigationSubjectItem {
  id: string;
  role: string;
  notes: string | null;
  subject: Subject;
}

export interface ChatRoom {
  id: string;
  investigationId: string;
  createdAt: string;
}

export interface InvestigationDetail {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  type: InvestigationType;
  legalBasis: string | null;
  startDate: string;
  closeDate: string | null;
  leadFiscalId: string;
  createdAt: string;
  updatedAt: string;
  leadFiscal: PersonRef;
  participants: InvestigationParticipant[];
  subjects: InvestigationSubjectItem[];
  chatRoom: ChatRoom | null;
  _count: {
    warrants: number;
    files: number;
    notes: number;
    documents?: number;
    subjects?: number;
    participants?: number;
  };
}

export interface InvestigationListItem {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  type: InvestigationType;
  leadFiscal: PersonRef;
  updatedAt: string;
  counts?: {
    participants: number;
    subjects: number;
  };
}

export interface Subject {
  id: string;
  firstName: string;
  lastName: string;
  alias: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  occupation: string | null;
  phone: string | null;
  address: string | null;
  photo: string | null;
  dangerLevel: DangerLevel;
  status: SubjectStatus;
  isOrganized: boolean;
  organization: string | null;
  organizationId?: string | null;
  criminalOrganization?: CriminalOrganization | null;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  address: string;
  type: PropertyType;
  zone: string | null;
  notes: string | null;
  gtaX: number | null;
  gtaY: number | null;
  createdById?: string | null;
  createdAt: string;
  subjects?: Array<{ id: string; relation: string; subject: Subject }>;
  operationsCount?: number;
}

export interface Zone {
  id: string;
  name: string;
  district: string;
  description: string | null;
  coordsJson: string | null;
  _count?: { subjects: number };
  subjects?: Array<{ id: string; subject: Subject }>;
}

export interface SubjectDetail extends Subject {
  _count?: { investigations: number; vehicles: number; properties: number; documents: number };
  vehicles: Array<{ id: string; relation: string; vehicle: { id: string; plate: string; brand: string; model: string; color: string; year: number | null; notes: string | null } }>;
  properties: Array<{ id: string; relation: string; property: Property }>;
  relationships: Array<{ id: string; type: string; description: string | null; strength: number; to: Subject }>;
  zones: Array<{ id: string; frequency: string | null; lastSeenAt: string | null; zone: { id: string; name: string; district: string; description: string | null } }>;
  investigations: Array<{ id: string; role: string; notes: string | null; investigation: { id: string; caseNumber: string; title: string; status: InvestigationStatus; leadFiscalId: string } }>;
  notes: NoteWithAuthor[];
  files: CaseFile[];
}

export interface WarrantReport {
  id: string;
  warrantId: string;
  result: WarrantResult;
  raidSequence: number | null;
  findings: string;
  evidence: string | null;
  persons: string | null;
  participatingAgencies: string | null;
  notes: string | null;
  createdById: string;
  createdBy?: PersonRef;
  createdAt: string;
  files?: CaseFile[];
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
  propertyId: string | null;
  requestedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  executedAt: string | null;
  executionNotes: string | null;
  createdAt: string;
  investigation?: { id: string; caseNumber: string; title: string; status: InvestigationStatus };
  property?: Property | null;
  requestedBy?: PersonRef;
  approvedBy?: PersonRef | null;
  files?: CaseFile[];
  warrantReport?: WarrantReport | null;
}

export interface PropertyDossierOwner {
  id: string;
  relation: string;
  subject: Pick<Subject, "id" | "firstName" | "lastName" | "alias" | "photo" | "status" | "dangerLevel" | "organizationId"> & {
    criminalOrganization?: Pick<CriminalOrganization, "id" | "name" | "alias" | "color" | "type"> | null;
  };
}

export interface PropertyDossierRaid {
  id: string;
  sequence: number;
  warrantNumber: string;
  type: WarrantType;
  title: string;
  date: string;
  fiscal: PersonRef;
  participatingAgencies: string;
  result: WarrantResult;
  findings: string;
  evidence: string | null;
  persons: string | null;
  notes: string | null;
  files: CaseFile[];
  investigation: { id: string; caseNumber: string; title: string; status: InvestigationStatus };
}

export interface PropertyIncident {
  id: string;
  propertyId: string;
  sequence: number;
  type: PropertyIncidentType;
  title: string;
  description: string;
  result: IncidentResult | null;
  occurredAt: string;
  origin: IncidentOrigin;
  warrantId: string | null;
  warrant?: Pick<Warrant, "id" | "warrantNumber" | "type" | "title" | "status"> | null;
  participatingAgencies: string | null;
  evidence: string | null;
  personsPresent: string | null;
  investigationId: string | null;
  investigation?: { id: string; caseNumber: string; title: string; status: InvestigationStatus } | null;
  createdById: string;
  createdBy: PersonRef;
  files: CaseFile[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyMember {
  id: string;
  propertyId: string;
  userId: string;
  accessLevel: AccessLevel;
  addedById: string | null;
  addedAt: string;
  user: PersonRef & {
    username: string;
    badgeNumber: string | null;
    division: string | null;
  };
  addedBy?: PersonRef | null;
}

export interface PropertyDossier {
  property: Property & { subjects: PropertyDossierOwner[] };
  owners: PropertyDossierOwner[];
  organizations: Array<Pick<CriminalOrganization, "id" | "name" | "alias" | "color" | "type">>;
  incidentCount: number;
  incidents: PropertyIncident[];
  members: PropertyMember[];
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canManageMembers: boolean;
  };
  raidCount?: number;
  raids?: PropertyDossierRaid[];
}

export interface Sanction {
  id: string;
  userId: string;
  user: PersonRef & { username: string; badgeNumber: string | null };
  type: SanctionType;
  description: string;
  issuedById: string;
  issuedBy: PersonRef;
  severity: number;
  active: boolean;
  createdAt: string;
  resolvedAt: string | null;
  resolvedNotes: string | null;
}

export interface OfficialDocument {
  id: string;
  documentNumber: string;
  type: DocumentType;
  title: string;
  formData: DocumentFormData;
  status: DocumentStatus;
  investigationId: string | null;
  investigation?: { id: string; caseNumber: string; title: string; status: InvestigationStatus } | null;
  subjectId: string | null;
  subject?: Pick<Subject, "id" | "firstName" | "lastName" | "alias" | "status" | "dangerLevel"> | null;
  createdById: string;
  createdBy: PersonRef;
  authorRole: RoleType;
  signedById: string | null;
  signedBy: PersonRef | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MapDrawing {
  id: string;
  investigationId: string;
  type: MapDrawingType;
  label: string | null;
  geoJson: string;
  color: string | null;
  description: string | null;
  createdById: string;
  createdBy?: PersonRef;
  createdAt: string;
}

export interface CriminalOrganization {
  id: string;
  name: string;
  alias: string | null;
  color: string;
  description: string | null;
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
  role: string | null;
  subject: Subject;
}

export interface MapElement {
  id: string;
  investigationId: string | null;
  legendNumber: number;
  type: MapElementType;
  label: string;
  description: string | null;
  color: string;
  geoJson: string;
  radius: number | null;
  organizationId: string | null;
  organization?: CriminalOrganization | null;
  propertyId: string | null;
  property?: Property | null;
  linkedSubjects: MapElementSubject[];
  createdById: string;
  createdBy?: PersonRef;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationMapData {
  drawings: MapDrawing[];
  elements?: MapElement[];
  properties: Property[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  fileUrl: string | null;
  fileId: string | null;
  fileName: string | null;
  createdAt: string;
  author: PersonRef;
}

export interface DatalinkNode {
  id: string;
  type: DatalinkNodeType;
  label: string;
  meta: Record<string, string | number | boolean | null>;
  href: string;
}

export interface DatalinkEdge {
  id: string;
  source: string;
  target: string;
  type: DatalinkEdgeType;
  label: string;
}

export interface DatalinkGraph {
  nodes: DatalinkNode[];
  edges: DatalinkEdge[];
}

export interface SearchResultItem {
  id: string;
  type: "investigation" | "subject" | "organization" | "document" | "property";
  label: string;
  description: string;
  href: string;
}

export interface SearchResults {
  investigations: SearchResultItem[];
  subjects: SearchResultItem[];
  organizations: SearchResultItem[];
  documents: SearchResultItem[];
  properties: SearchResultItem[];
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string | null;
  actor?: PersonRef | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export type TimelineEventType = "audit" | "document" | "note" | "file" | "investigation" | "warrant" | "map";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
  actorName: string | null;
}
