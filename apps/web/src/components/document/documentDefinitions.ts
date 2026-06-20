import type { DocumentType } from "../../types/documents";

export interface DocumentDefinition {
  type: DocumentType;
  label: string;
  category: "Solicitudes judiciales" | "Actas de actuacion" | "Fiscalia";
  description: string;
}

export const DOCUMENT_DEFINITIONS: readonly DocumentDefinition[] = [
  { type: "allanamiento", label: "Solicitud de allanamiento", category: "Solicitudes judiciales", description: "Autorizacion judicial para registro de inmueble." },
  { type: "busca-captura", label: "Busca y captura", category: "Solicitudes judiciales", description: "Orden para localizacion y puesta a disposicion." },
  { type: "registro-telefonico", label: "Registro telefonico", category: "Solicitudes judiciales", description: "Solicitud de registros, trafico y datos telefonicos." },
  { type: "interrogatorio", label: "Interrogatorio", category: "Solicitudes judiciales", description: "Autorizacion y condiciones para interrogatorio." },
  { type: "acusacion", label: "Acusacion", category: "Fiscalia", description: "Escrito formal de acusacion fiscal." },
  { type: "orden-arresto", label: "Orden de arresto", category: "Solicitudes judiciales", description: "Peticion motivada de arresto." },
  { type: "solicitud-informacion", label: "Solicitud de informacion", category: "Solicitudes judiciales", description: "Requerimiento formal a entidad externa." },
  { type: "plea-bargain", label: "Acuerdo de conformidad", category: "Fiscalia", description: "Plea bargain con condiciones y firmas." },
  { type: "acta-interrogatorio", label: "Acta de interrogatorio", category: "Actas de actuacion", description: "Acta de preguntas, respuestas y observaciones." },
  { type: "acta-allanamiento", label: "Acta de allanamiento", category: "Actas de actuacion", description: "Registro de ejecucion, participantes e incautaciones." },
  { type: "acta-registro-movil", label: "Acta de registro movil", category: "Actas de actuacion", description: "Registro de vehiculo, personas y objetos." },
  { type: "acta-registro-telefonico", label: "Acta de registro telefonico", category: "Actas de actuacion", description: "Recepcion de datos telefonicos y cadena de custodia." },
  { type: "acta-solicitud-informacion", label: "Acta de solicitud de informacion", category: "Actas de actuacion", description: "Recepcion de informacion solicitada." },
  { type: "reconocimiento-facial", label: "Reconocimiento facial", category: "Fiscalia", description: "Solicitud tecnica de identificacion facial." },
  { type: "citacion-fiscal", label: "Citacion fiscal", category: "Fiscalia", description: "Citacion formal para comparecencia." },
  { type: "extraccion-telefonica", label: "Extraccion telefonica", category: "Solicitudes judiciales", description: "Orden para extraccion de dispositivo telefonico." }
];

export const DOCUMENT_TYPE_VALUES = DOCUMENT_DEFINITIONS.map((definition) => definition.type);

export const DOCUMENT_TYPE_LABELS: Readonly<Record<DocumentType, string>> = Object.fromEntries(
  DOCUMENT_DEFINITIONS.map((definition) => [definition.type, definition.label])
) as Readonly<Record<DocumentType, string>>;

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPE_VALUES.includes(value as DocumentType);
}
