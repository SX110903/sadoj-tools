'use client';

import { useState, useEffect, useCallback } from 'react';
import { reportClientError } from '../utils/clientDiagnostics';
import type {
  DocumentType,
  InterrogatorioFormData,
  AllanamientoFormData,
  BuscaCapturaFormData,
  RegistroTelefonicoFormData,
  AcusacionFormData,
  OrdenArrestoFormData,
  SolicitudInformacionFormData,
  PleaBargainFormData,
  ActaInterrogatorioFormData,
  ActaAllanamientoFormData,
  ActaRegistroMovilFormData,
  ActaRegistroTelefonicoFormData,
  ActaSolicitudInformacionFormData,
  ReconocimientoFacialFormData,
  CitacionFiscalFormData,
  OrdenExtraccionTelefonicaFormData,
  Delito,
} from '../types/documents';

const emptyDelitos: Delito[] = [
  { numero: '1', tipificacion: '', delito: '', gravedad: '' },
  { numero: '2', tipificacion: '', delito: '', gravedad: '' },
  { numero: '3', tipificacion: '', delito: '', gravedad: '' },
  { numero: '4', tipificacion: '', delito: '', gravedad: '' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const getInitialInterrogatorio = (): InterrogatorioFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  nombreCompleto: '',
  fechaNacimiento: '',
  domicilio: '',
  condicionProcesal: [],
  situacionActual: [],
  delitos: [...emptyDelitos],
  justificacion: '',
  temasAbordar: '',
  condiciones: [],
  idiomaInterprete: '',
  otraCondicion: '',
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
  fechaInterrogatorio: '',
  horaInterrogatorio: '',
  lugarInterrogatorio: '',
});

const getInitialAllanamiento = (): AllanamientoFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  direccionCompleta: '',
  referenciaInmueble: '',
  propietario: '',
  ocupantes: '',
  objetoBusqueda: '',
  justificacion: '',
  horarioSugerido: '',
  usoFuerza: false,
  presenciaCerrajero: false,
  cadenaCustodia: true,
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
  fechaEjecucion: '',
  horaEjecucion: '',
  lugarEjecucion: '',
});

const getInitialBuscaCaptura = (): BuscaCapturaFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  nombreCompleto: '',
  alias: '',
  identificacion: '',
  fechaNacimiento: '',
  nacionalidad: '',
  ultimoDomicilio: '',
  motivoHechos: '',
  delitos: [...emptyDelitos],
  detencionDisposicion: true,
  allanamientoLocalizacion: false,
  alertasUnidades: false,
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
  fechaEjecucion: '',
  horaEjecucion: '',
});

const getInitialRegistroTelefonico = (): RegistroTelefonicoFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  numerosTelefono: '',
  operador: '',
  titular: '',
  tipoMedida: [],
  fechaDesde: '',
  fechaHasta: '',
  justificacion: '',
  cadenaCustodia: true,
  detallesCustodia: '',
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
  vigencia: '',
});

const getInitialAcusacion = (): AcusacionFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  acusados: [{ nombre: '', identificacion: '', domicilio: '', defensor: '' }],
  relacionHechos: '',
  delitos: [...emptyDelitos],
  atenuantes: [],
  otrosAtenuantes: '',
  agravantes: [],
  otrosAgravantes: '',
  antecedentes: [],
  mediosPrueba: [{ tipo: '', descripcion: '' }],
  pruebas: [],
  petitorio: '',
  lugarFirma: '',
  fechaFirma: todayISO(),
});

const getInitialOrdenArresto = (): OrdenArrestoFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  nombreCompleto: '',
  alias: '',
  identificacion: '',
  fechaNacimiento: '',
  nacionalidad: '',
  descripcionFisica: '',
  ultimoDomicilio: '',
  delitos: [...emptyDelitos],
  motivoHechos: '',
  peligroFuga: false,
  peligroReiteracion: false,
  destruccionPruebas: false,
  otroMotivo: '',
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
  fechaEjecucion: '',
});

const getInitialSolicitudInformacion = (): SolicitudInformacionFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  entidadDestinataria: '',
  personaContacto: '',
  tipoInformacion: [],
  personaInvestigada: '',
  identificacionPersona: '',
  periodoDesde: '',
  periodoHasta: '',
  justificacion: '',
  plazoEntrega: '',
  formatoEntrega: '',
  confidencialidad: true,
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
});

const getInitialPleaBargain = (): PleaBargainFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  nombreAcusado: '',
  identificacionAcusado: '',
  domicilioAcusado: '',
  abogadoDefensor: '',
  delitosOriginales: [...emptyDelitos],
  delitosAcordados: [
    { numero: '1', tipificacion: '', delito: '', gravedad: '' },
    { numero: '2', tipificacion: '', delito: '', gravedad: '' },
  ],
  hechoReconocido: '',
  penaOriginal: '',
  penaAcordada: '',
  condicionesAcuerdo: '',
  reparacionDano: '',
  compromisosAcusado: '',
  plazoCondiciones: '',
  consecuenciasIncumplimiento: '',
  firmaFiscal: false,
  firmaDefensor: false,
  firmaAcusado: false,
  lugarFirma: '',
  fechaFirma: todayISO(),
  fechaAcuerdo: todayISO(),
});

const getInitialActaInterrogatorio = (): ActaInterrogatorioFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  hora: '',
  lugar: '',
  fiscalActuante: '',
  nombreInterrogado: '',
  identificacion: '',
  domicilio: '',
  condicionProcesal: '',
  abogadoDefensor: '',
  funcionariosPresentes: '',
  preguntasRespuestas: [{ pregunta: '', respuesta: '' }],
  observaciones: '',
  firmaInterrogado: false,
  motivoNoFirma: '',
});

const getInitialActaAllanamiento = (): ActaAllanamientoFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  horaInicio: '',
  horaFin: '',
  direccion: '',
  propietario: '',
  ordenJudicial: '',
  fechaOrden: '',
  juzgadoEmisor: '',
  agenciasParticipantes: [],
  funcionariosParticipantes: '',
  personasPresentes: [
    { nombre: '', identificacion: '', relacion: '', observaciones: '' },
    { nombre: '', identificacion: '', relacion: '', observaciones: '' },
    { nombre: '', identificacion: '', relacion: '', observaciones: '' },
  ],
  objetosIncautados: [
    { numero: '1', descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' },
    { numero: '2', descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' },
    { numero: '3', descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' },
  ],
  descripcionProcedimiento: '',
  observaciones: '',
  firmaResponsable: '',
  testigos: '',
});

const getInitialActaRegistroMovil = (): ActaRegistroMovilFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  hora: '',
  ubicacion: '',
  tipoVehiculo: '',
  placas: '',
  marca: '',
  modelo: '',
  color: '',
  propietarioVehiculo: '',
  conductorIdentificacion: '',
  motivoRegistro: '',
  agenciasParticipantes: [],
  funcionariosParticipantes: '',
  personasRegistradas: [
    { nombre: '', identificacion: '', relacion: '', observaciones: '' },
    { nombre: '', identificacion: '', relacion: '', observaciones: '' },
    { nombre: '', identificacion: '', relacion: '', observaciones: '' },
  ],
  objetosIncautados: [
    { numero: '1', descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' },
    { numero: '2', descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' },
    { numero: '3', descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' },
  ],
  descripcionProcedimiento: '',
  observaciones: '',
  firmaResponsable: '',
  testigos: '',
});

const getInitialActaRegistroTelefonico = (): ActaRegistroTelefonicoFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  ordenJudicial: '',
  fechaOrden: '',
  juzgadoEmisor: '',
  numerosTelefonicos: '',
  operadorTelefono: '',
  titularLinea: '',
  periodoDesde: '',
  periodoHasta: '',
  tipoInformacion: [],
  agenciasParticipantes: [],
  funcionarioResponsable: '',
  registrosObtenidos: [
    { numero: '1', fecha: '', hora: '', tipo: '', origen: '', destino: '', duracion: '', observaciones: '' },
    { numero: '2', fecha: '', hora: '', tipo: '', origen: '', destino: '', duracion: '', observaciones: '' },
    { numero: '3', fecha: '', hora: '', tipo: '', origen: '', destino: '', duracion: '', observaciones: '' },
    { numero: '4', fecha: '', hora: '', tipo: '', origen: '', destino: '', duracion: '', observaciones: '' },
    { numero: '5', fecha: '', hora: '', tipo: '', origen: '', destino: '', duracion: '', observaciones: '' },
  ],
  resumenHallazgos: '',
  observaciones: '',
  cadenaCustodia: '',
  firmaResponsable: '',
});

const getInitialActaSolicitudInformacion = (): ActaSolicitudInformacionFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  entidadQueResponde: '',
  personaContacto: '',
  ordenJudicial: '',
  fechaOrden: '',
  informacionSolicitada: '',
  informacionRecibida: [
    { numero: '1', tipo: '', descripcion: '', fuenteEntidad: '', fechaRecepcion: '', formato: '' },
    { numero: '2', tipo: '', descripcion: '', fuenteEntidad: '', fechaRecepcion: '', formato: '' },
    { numero: '3', tipo: '', descripcion: '', fuenteEntidad: '', fechaRecepcion: '', formato: '' },
  ],
  resumenHallazgos: '',
  cadenaCustodia: '',
  observaciones: '',
  firmaResponsable: '',
});

const getInitialCitacionFiscal = (): CitacionFiscalFormData => ({
  numeroExpediente: '',
  fechaEmision: todayISO(),
  nombreFiscal: '',
  cargoFiscal: '',
  nombreCitado: '',
  identificacionCitado: '',
  cargoInstitucionCitado: '',
  condicionCitado: '',
  descripcionHecho: '',
  fechaComparecencia: '',
  horaComparecencia: '',
  lugarComparecencia: '',
  documentosRequeridos: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
});

const getInitialReconocimientoFacial = (): ReconocimientoFacialFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitucion de San Andreas — Facultades del Ministerio Fiscal para solicitar colaboracion a Agencias de Aplicacion de la Ley (LEA) en investigaciones penales activas.',
  agenciaDestinataria: '',
  unidadEspecializada: '',
  oficialReceptor: '',
  nombreConocido: '',
  aliasApodo: '',
  edadAproximada: '',
  sexo: '',
  complexion: '',
  estatura: '',
  colorPiel: '',
  colorCabello: '',
  colorOjos: '',
  rasgosDistintivos: '',
  lugarHechos: '',
  fechaHechos: '',
  horaHechos: '',
  descripcionHechos: '',
  tipoReconocimiento: [],
  fotos: [],
  basesDatos: [],
  justificacion: '',
  instruccionesEspecificas: '',
  prioridad: '',
  plazoRespuesta: '',
  nivelClasificacion: 'USO INTERNO — Solo personal autorizado',
  lugarFirma: '',
  fechaFirma: todayISO(),
});

const getInitialExtraccionTelefonica = (): OrdenExtraccionTelefonicaFormData => ({
  numeroCausa: '',
  fecha: todayISO(),
  fiscalSolicitante: '',
  tribunalDestinatario: 'Los Santos Courts - Tribunal de Justicia',
  fundamentoLegal: 'Art. 28 de la Constitucion de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo).',
  nombreDetenido: '',
  identificacionDetenido: '',
  alias: '',
  fechaDetencion: '',
  lugarDetencion: '',
  agenciaDetencion: '',
  delitosImputados: '',
  motivoExtraccion: '',
  metodoExtraccion: [],
  equipoUtilizado: '',
  funcionarioResponsable: '',
  observaciones: '',
  pruebas: [],
  lugarFirma: '',
  fechaFirma: todayISO(),
  resolucion: '',
  condicionesResolucion: '',
});

export type FormDataMap = {
  interrogatorio: InterrogatorioFormData;
  allanamiento: AllanamientoFormData;
  'busca-captura': BuscaCapturaFormData;
  'registro-telefonico': RegistroTelefonicoFormData;
  acusacion: AcusacionFormData;
  'orden-arresto': OrdenArrestoFormData;
  'solicitud-informacion': SolicitudInformacionFormData;
  'plea-bargain': PleaBargainFormData;
  'acta-interrogatorio': ActaInterrogatorioFormData;
  'acta-allanamiento': ActaAllanamientoFormData;
  'acta-registro-movil': ActaRegistroMovilFormData;
  'acta-registro-telefonico': ActaRegistroTelefonicoFormData;
  'acta-solicitud-informacion': ActaSolicitudInformacionFormData;
  'reconocimiento-facial': ReconocimientoFacialFormData;
  'citacion-fiscal': CitacionFiscalFormData;
  'extraccion-telefonica': OrdenExtraccionTelefonicaFormData;
};

const STORAGE_KEY = 'fiscalia-documentos';

const initializers: Record<DocumentType, () => FormDataMap[DocumentType]> = {
  interrogatorio: getInitialInterrogatorio,
  allanamiento: getInitialAllanamiento,
  'busca-captura': getInitialBuscaCaptura,
  'registro-telefonico': getInitialRegistroTelefonico,
  acusacion: getInitialAcusacion,
  'orden-arresto': getInitialOrdenArresto,
  'solicitud-informacion': getInitialSolicitudInformacion,
  'plea-bargain': getInitialPleaBargain,
  'acta-interrogatorio': getInitialActaInterrogatorio,
  'acta-allanamiento': getInitialActaAllanamiento,
  'acta-registro-movil': getInitialActaRegistroMovil,
  'acta-registro-telefonico': getInitialActaRegistroTelefonico,
  'acta-solicitud-informacion': getInitialActaSolicitudInformacion,
  'reconocimiento-facial': getInitialReconocimientoFacial,
  'citacion-fiscal': getInitialCitacionFiscal,
  'extraccion-telefonica': getInitialExtraccionTelefonica,
};

export function getInitialDocumentData<T extends DocumentType>(documentType: T): FormDataMap[T] {
  return initializers[documentType]() as FormDataMap[T];
}

interface UseDocumentFormOptions<T extends DocumentType> {
  initialData?: FormDataMap[T] | null;
  autosaveKey?: string | null;
}

export function useDocumentForm<T extends DocumentType>(documentType: T, options: UseDocumentFormOptions<T> = {}) {
  const { initialData = null, autosaveKey = null } = options;
  const [data, setData] = useState<FormDataMap[T]>(() => initialData ?? getInitialDocumentData(documentType));

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      if (initialData !== null) {
        setData(initialData);
        setIsLoaded(true);
        return;
      }

      const key = autosaveKey ?? `${STORAGE_KEY}:${documentType}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setData(JSON.parse(stored) as FormDataMap[T]);
      } else {
        setData(getInitialDocumentData(documentType));
      }
    } catch (error) {
      reportClientError('No se pudo cargar el autoguardado del documento.', error);
    }
    setIsLoaded(true);
  }, [autosaveKey, documentType, initialData]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (autosaveKey === null) return;
      localStorage.setItem(autosaveKey, JSON.stringify(data));
    } catch (error) {
      reportClientError('No se pudo guardar el borrador del documento.', error);
    }
  }, [autosaveKey, data, isLoaded]);

  const reset = useCallback(() => {
    setData(getInitialDocumentData(documentType));
  }, [documentType]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const numeroCausa = 'numeroCausa' in data ? data.numeroCausa : 'sin-numero';
    a.download = `${documentType}-${numeroCausa || 'sin-numero'}-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data, documentType]);

  return { data, setData, reset, exportJSON, isLoaded };
}
