'use client';

import type { OrdenExtraccionTelefonicaFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { CheckboxGroup } from '../CheckboxGroup';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const metodoExtraccionOptions = [
  { value: 'solo-numero', label: 'Solo obtener numero telefonico del detenido' },
  { value: 'revision-dispositivo', label: 'Revision fisica del dispositivo movil' },
  { value: 'consulta-operador', label: 'Consulta a operador/compania telefonica' },
  { value: 'extraccion-sim', label: 'Extraccion de datos de tarjeta SIM' },
  { value: 'imei-imsi', label: 'Consulta por IMEI/IMSI del dispositivo' },
  { value: 'registros-contacto', label: 'Revision de agenda de contactos' },
  { value: 'software-forense', label: 'Software de extraccion forense' },
];

const tiposPruebaExtraccion = [
  'Acta de detencion',
  'Orden de arresto',
  'Informe policial',
  'Evidencia del dispositivo',
  'Registros previos',
  'Documentos relacionados',
];

interface OrdenExtraccionTelefonicaTemplateProps {
  data: OrdenExtraccionTelefonicaFormData;
  onChange: (data: OrdenExtraccionTelefonicaFormData) => void;
}

export function OrdenExtraccionTelefonicaTemplate({ data, onChange }: OrdenExtraccionTelefonicaTemplateProps) {
  const updateField = <K extends keyof OrdenExtraccionTelefonicaFormData>(
    field: K,
    value: OrdenExtraccionTelefonicaFormData[K]
  ) => {
    onChange(((current: OrdenExtraccionTelefonicaFormData) => ({ ...current, [field]: value })) as unknown as OrdenExtraccionTelefonicaFormData);
  };

  return (
    <div className="space-y-4">
      {/* FUNDAMENTO LEGAL */}
      <FundamentoLegal
        texto={data.fundamentoLegal}
        onChange={(v) => updateField('fundamentoLegal', v)}
      />

      {/* I. DATOS DEL PROCESO */}
      <div>
        <SectionHeader number="I" title="Datos del Proceso" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Numero de Causa"
              name="numeroCausa"
              value={data.numeroCausa}
              onChange={(v) => updateField('numeroCausa', v)}
              required
            />
            <LabeledInput
              label="Fecha"
              name="fecha"
              type="date"
              value={data.fecha}
              onChange={(v) => updateField('fecha', v)}
              required
            />
          </div>
          <LabeledInput
            label="Fiscal Solicitante"
            name="fiscalSolicitante"
            value={data.fiscalSolicitante}
            onChange={(v) => updateField('fiscalSolicitante', v)}
            required
          />
          <LabeledInput
            label="Tribunal Destinatario"
            name="tribunalDestinatario"
            value={data.tribunalDestinatario}
            onChange={(v) => updateField('tribunalDestinatario', v)}
            required
          />
        </div>
      </div>

      {/* II. DATOS DEL DETENIDO */}
      <div>
        <SectionHeader number="II" title="Datos del Detenido" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Nombre Completo"
              name="nombreDetenido"
              value={data.nombreDetenido}
              onChange={(v) => updateField('nombreDetenido', v)}
              required
            />
            <LabeledInput
              label="Identificacion (DNI / Pasaporte)"
              name="identificacionDetenido"
              value={data.identificacionDetenido}
              onChange={(v) => updateField('identificacionDetenido', v)}
              required
            />
          </div>
          <LabeledInput
            label="Alias / Apodo (si se conoce)"
            name="alias"
            value={data.alias}
            onChange={(v) => updateField('alias', v)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Fecha de Detencion"
              name="fechaDetencion"
              type="date"
              value={data.fechaDetencion}
              onChange={(v) => updateField('fechaDetencion', v)}
              required
            />
            <LabeledInput
              label="Lugar de Detencion"
              name="lugarDetencion"
              value={data.lugarDetencion}
              onChange={(v) => updateField('lugarDetencion', v)}
              required
            />
          </div>
          <LabeledInput
            label="Agencia que Realizo la Detencion"
            name="agenciaDetencion"
            value={data.agenciaDetencion}
            onChange={(v) => updateField('agenciaDetencion', v)}
            required
          />
        </div>
      </div>

      {/* III. DELITOS IMPUTADOS */}
      <div>
        <SectionHeader number="III" title="Delitos Imputados" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="delitosImputados"
            value={data.delitosImputados}
            onChange={(v) => updateField('delitosImputados', v)}
            required
            rows={4}
            placeholder="Detalle los delitos imputados al detenido que justifican la extraccion del numero telefonico..."
          />
        </div>
      </div>

      {/* IV. JUSTIFICACION DE LA EXTRACCION */}
      <div>
        <SectionHeader number="IV" title="Justificacion y Necesidad de la Extraccion" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="motivoExtraccion"
            value={data.motivoExtraccion}
            onChange={(v) => updateField('motivoExtraccion', v)}
            required
            rows={6}
            placeholder="Exponga los motivos que justifican la necesidad de obtener el numero telefonico del detenido, la relevancia para la investigacion y la conexion con los hechos investigados..."
          />
        </div>
      </div>

      {/* V. METODO DE EXTRACCION */}
      <div>
        <SectionHeader number="V" title="Metodo de Extraccion Solicitado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1c2537] mb-2 block">
              Metodo(s) de extraccion a emplear:
            </label>
            <CheckboxGroup
              options={metodoExtraccionOptions}
              selectedValues={data.metodoExtraccion}
              onChange={(v) => updateField('metodoExtraccion', v)}
              columns={2}
            />
          </div>
          <LabeledInput
            label="Equipo / Herramienta a Utilizar (si aplica)"
            name="equipoUtilizado"
            value={data.equipoUtilizado}
            onChange={(v) => updateField('equipoUtilizado', v)}
            placeholder="Ej: UFED, Cellebrite, consulta directa al operador..."
          />
          <LabeledInput
            label="Funcionario Responsable de la Extraccion"
            name="funcionarioResponsable"
            value={data.funcionarioResponsable}
            onChange={(v) => updateField('funcionarioResponsable', v)}
            required
            placeholder="Nombre, rango y placa del funcionario"
          />
        </div>
      </div>

      {/* VI. OBSERVACIONES */}
      <div>
        <SectionHeader number="VI" title="Observaciones" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="observaciones"
            value={data.observaciones}
            onChange={(v) => updateField('observaciones', v)}
            rows={4}
            placeholder="Observaciones adicionales relevantes..."
          />
        </div>
      </div>

      {/* VII. PRUEBAS Y EVIDENCIAS */}
      <div>
        <SectionHeader number="VII" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection
            pruebas={data.pruebas}
            onChange={(v) => updateField('pruebas', v)}
            tiposPrueba={tiposPruebaExtraccion}
          />
        </div>
      </div>

      {/* FIRMA FISCAL */}
      <SignatureBlock
        showPlaceDate
        lugar={data.lugarFirma}
        onLugarChange={(v) => updateField('lugarFirma', v)}
        fecha={data.fechaFirma}
        onFechaChange={(v) => updateField('fechaFirma', v)}
        signatures={[
          { label: 'Fiscal Solicitante', value: data.fiscalSolicitante || '[Nombre del Fiscal]' },
        ]}
        columns={1}
      />

      {/* RESOLUCION JUDICIAL */}
      <ResolucionJudicial
        resolucion={data.resolucion}
        onResolucionChange={(v) => updateField('resolucion', v)}
        condiciones={data.condicionesResolucion}
        onCondicionesChange={(v) => updateField('condicionesResolucion', v)}
        fecha={data.fecha}
        fechaName="fecha"
        onFechaChange={(v) => updateField('fecha', v)}
        showHora={false}
        showLugar={false}
        showVigencia={false}
      />
    </div>
  );
}
