export type DocumentType =
  | 'allanamiento'
  | 'busca-captura'
  | 'registro-telefonico'
  | 'interrogatorio'
  | 'acusacion'
  | 'orden-arresto'
  | 'solicitud-informacion'
  | 'plea-bargain'
  | 'acta-interrogatorio'
  | 'acta-allanamiento'
  | 'acta-registro-movil'
  | 'acta-registro-telefonico'
  | 'acta-solicitud-informacion'
  | 'reconocimiento-facial'
  | 'citacion-fiscal'
  | 'extraccion-telefonica';

export interface Prueba {
  tipo: string;
  descripcion: string;
  enlace: string;
}

export interface BaseFormData {
  numeroCausa: string;
  fecha: string;
  fiscalSolicitante: string;
  tribunalDestinatario: string;
  fundamentoLegal: string;
}

export interface Delito {
  numero: string;
  tipificacion: string;
  delito: string;
  gravedad: string;
}

export interface InterrogatorioFormData extends BaseFormData {
  nombreCompleto: string;
  fechaNacimiento: string;
  domicilio: string;
  condicionProcesal: string[];
  situacionActual: string[];
  delitos: Delito[];
  justificacion: string;
  temasAbordar: string;
  condiciones: string[];
  idiomaInterprete: string;
  otraCondicion: string;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
  fechaInterrogatorio: string;
  horaInterrogatorio: string;
  lugarInterrogatorio: string;
}

export interface AllanamientoFormData extends BaseFormData {
  direccionCompleta: string;
  referenciaInmueble: string;
  propietario: string;
  ocupantes: string;
  objetoBusqueda: string;
  justificacion: string;
  horarioSugerido: string;
  usoFuerza: boolean;
  presenciaCerrajero: boolean;
  cadenaCustodia: boolean;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
  fechaEjecucion: string;
  horaEjecucion: string;
  lugarEjecucion: string;
}

export interface BuscaCapturaFormData extends BaseFormData {
  nombreCompleto: string;
  alias: string;
  identificacion: string;
  fechaNacimiento: string;
  nacionalidad: string;
  ultimoDomicilio: string;
  motivoHechos: string;
  delitos: Delito[];
  detencionDisposicion: boolean;
  allanamientoLocalizacion: boolean;
  alertasUnidades: boolean;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
  fechaEjecucion: string;
  horaEjecucion: string;
}

export interface RegistroTelefonicoFormData extends BaseFormData {
  numerosTelefono: string;
  operador: string;
  titular: string;
  tipoMedida: string[];
  fechaDesde: string;
  fechaHasta: string;
  justificacion: string;
  cadenaCustodia: boolean;
  detallesCustodia: string;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
  vigencia: string;
}

export interface Acusado {
  nombre: string;
  identificacion: string;
  domicilio: string;
  defensor: string;
}

export interface MedioPrueba {
  tipo: string;
  descripcion: string;
}

export interface Antecedente {
  fecha: string;
  delito: string;
  tribunal: string;
  sentencia: string;
}

export interface AcusacionFormData extends BaseFormData {
  acusados: Acusado[];
  relacionHechos: string;
  delitos: Delito[];
  atenuantes: string[];
  otrosAtenuantes: string;
  agravantes: string[];
  otrosAgravantes: string;
  antecedentes: Antecedente[];
  mediosPrueba: MedioPrueba[];
  pruebas: Prueba[];
  petitorio: string;
  lugarFirma: string;
  fechaFirma: string;
}

// Orden de Arresto
export interface OrdenArrestoFormData extends BaseFormData {
  nombreCompleto: string;
  alias: string;
  identificacion: string;
  fechaNacimiento: string;
  nacionalidad: string;
  descripcionFisica: string;
  ultimoDomicilio: string;
  delitos: Delito[];
  motivoHechos: string;
  peligroFuga: boolean;
  peligroReiteracion: boolean;
  destruccionPruebas: boolean;
  otroMotivo: string;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
  fechaEjecucion: string;
}

// Solicitud de Informacion
export interface SolicitudInformacionFormData extends BaseFormData {
  entidadDestinataria: string;
  personaContacto: string;
  tipoInformacion: string[];
  personaInvestigada: string;
  identificacionPersona: string;
  periodoDesde: string;
  periodoHasta: string;
  justificacion: string;
  plazoEntrega: string;
  formatoEntrega: string;
  confidencialidad: boolean;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
}

// Plea Bargain / Acuerdo de Conformidad
export interface PleaBargainFormData extends BaseFormData {
  nombreAcusado: string;
  identificacionAcusado: string;
  domicilioAcusado: string;
  abogadoDefensor: string;
  delitosOriginales: Delito[];
  delitosAcordados: Delito[];
  hechoReconocido: string;
  penaOriginal: string;
  penaAcordada: string;
  condicionesAcuerdo: string;
  reparacionDano: string;
  compromisosAcusado: string;
  plazoCondiciones: string;
  consecuenciasIncumplimiento: string;
  firmaFiscal: boolean;
  firmaDefensor: boolean;
  firmaAcusado: boolean;
  lugarFirma: string;
  fechaFirma: string;
  fechaAcuerdo: string;
}

// ACTAS Types
export interface PreguntaRespuesta {
  pregunta: string;
  respuesta: string;
}

export interface ActaInterrogatorioFormData {
  numeroCausa: string;
  fecha: string;
  hora: string;
  lugar: string;
  fiscalActuante: string;
  nombreInterrogado: string;
  identificacion: string;
  domicilio: string;
  condicionProcesal: string;
  abogadoDefensor: string;
  funcionariosPresentes: string;
  preguntasRespuestas: PreguntaRespuesta[];
  observaciones: string;
  firmaInterrogado: boolean;
  motivoNoFirma: string;
}

export interface ObjetoIncautado {
  numero: string;
  descripcion: string;
  cantidad: string;
  ubicacionEncontrada: string;
  estado: string;
}

export interface PersonaAfectada {
  nombre: string;
  identificacion: string;
  relacion: string;
  observaciones: string;
}

export interface ActaAllanamientoFormData {
  numeroCausa: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  direccion: string;
  propietario: string;
  ordenJudicial: string;
  fechaOrden: string;
  juzgadoEmisor: string;
  agenciasParticipantes: string[];
  funcionariosParticipantes: string;
  personasPresentes: PersonaAfectada[];
  objetosIncautados: ObjetoIncautado[];
  descripcionProcedimiento: string;
  observaciones: string;
  firmaResponsable: string;
  testigos: string;
}

export interface ActaRegistroMovilFormData {
  numeroCausa: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  tipoVehiculo: string;
  placas: string;
  marca: string;
  modelo: string;
  color: string;
  propietarioVehiculo: string;
  conductorIdentificacion: string;
  motivoRegistro: string;
  agenciasParticipantes: string[];
  funcionariosParticipantes: string;
  personasRegistradas: PersonaAfectada[];
  objetosIncautados: ObjetoIncautado[];
  descripcionProcedimiento: string;
  observaciones: string;
  firmaResponsable: string;
  testigos: string;
}

export interface RegistroObtenido {
  numero: string;
  fecha: string;
  hora: string;
  tipo: string;
  origen: string;
  destino: string;
  duracion: string;
  observaciones: string;
}

export interface ActaRegistroTelefonicoFormData {
  numeroCausa: string;
  fecha: string;
  ordenJudicial: string;
  fechaOrden: string;
  juzgadoEmisor: string;
  numerosTelefonicos: string;
  operadorTelefono: string;
  titularLinea: string;
  periodoDesde: string;
  periodoHasta: string;
  tipoInformacion: string[];
  agenciasParticipantes: string[];
  funcionarioResponsable: string;
  registrosObtenidos: RegistroObtenido[];
  resumenHallazgos: string;
  observaciones: string;
  cadenaCustodia: string;
  firmaResponsable: string;
}

export interface InformacionRecibida {
  numero: string;
  tipo: string;
  descripcion: string;
  fuenteEntidad: string;
  fechaRecepcion: string;
  formato: string;
}

export interface ActaSolicitudInformacionFormData {
  numeroCausa: string;
  fecha: string;
  entidadQueResponde: string;
  personaContacto: string;
  ordenJudicial: string;
  fechaOrden: string;
  informacionSolicitada: string;
  informacionRecibida: InformacionRecibida[];
  resumenHallazgos: string;
  cadenaCustodia: string;
  observaciones: string;
  firmaResponsable: string;
}

export interface FotoAdjunta {
  id: string;
  nombre: string;
  dataUrl: string;
  descripcion: string;
  tipo: 'frontal' | 'lateral-derecho' | 'lateral-izquierdo' | 'camara-seguridad' | 'otro';
}

export interface ReconocimientoFacialFormData extends BaseFormData {
  // Agencia LEA destinataria
  agenciaDestinataria: string;
  unidadEspecializada: string;
  oficialReceptor: string;
  // Sujeto a identificar
  nombreConocido: string;
  aliasApodo: string;
  edadAproximada: string;
  sexo: string;
  complexion: string;
  estatura: string;
  colorPiel: string;
  colorCabello: string;
  colorOjos: string;
  rasgosDistintivos: string;
  // Circunstancias del hecho
  lugarHechos: string;
  fechaHechos: string;
  horaHechos: string;
  descripcionHechos: string;
  // Tipo de reconocimiento
  tipoReconocimiento: string[];
  // Fotografías adjuntas
  fotos: FotoAdjunta[];
  // Bases de datos a consultar
  basesDatos: string[];
  // Justificación
  justificacion: string;
  instruccionesEspecificas: string;
  prioridad: string;
  plazoRespuesta: string;
  // Confidencialidad
  nivelClasificacion: string;
  // Firma
  lugarFirma: string;
  fechaFirma: string;
}

export interface DocumentoRequerido {
  descripcion: string;
}

export interface CitacionFiscalFormData {
  numeroExpediente: string;
  fechaEmision: string;
  nombreFiscal: string;
  cargoFiscal: string;
  nombreCitado: string;
  identificacionCitado: string;
  cargoInstitucionCitado: string;
  condicionCitado: string;
  descripcionHecho: string;
  fechaComparecencia: string;
  horaComparecencia: string;
  lugarComparecencia: string;
  documentosRequeridos: DocumentoRequerido[];
  lugarFirma: string;
  fechaFirma: string;
}

export interface OrdenExtraccionTelefonicaFormData extends BaseFormData {
  nombreDetenido: string;
  identificacionDetenido: string;
  alias: string;
  fechaDetencion: string;
  lugarDetencion: string;
  agenciaDetencion: string;
  delitosImputados: string;
  motivoExtraccion: string;
  metodoExtraccion: string[];
  equipoUtilizado: string;
  funcionarioResponsable: string;
  observaciones: string;
  pruebas: Prueba[];
  lugarFirma: string;
  fechaFirma: string;
  resolucion: string;
  condicionesResolucion: string;
}

export type FormData =
  | InterrogatorioFormData
  | AllanamientoFormData
  | BuscaCapturaFormData
  | RegistroTelefonicoFormData
  | AcusacionFormData
  | OrdenArrestoFormData
  | SolicitudInformacionFormData
  | PleaBargainFormData
  | ActaInterrogatorioFormData
  | ActaAllanamientoFormData
  | ActaRegistroMovilFormData
  | ActaRegistroTelefonicoFormData
  | ActaSolicitudInformacionFormData
  | ReconocimientoFacialFormData
  | CitacionFiscalFormData
  | OrdenExtraccionTelefonicaFormData;
