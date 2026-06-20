'use client';

import type { BuscaCapturaFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { DelitosTable } from '../DelitosTable';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const tiposPruebaBuscaCaptura = [
  'Fotografía del sujeto',
  'Video de identificación',
  'Informe policial',
  'Testimonios',
  'Antecedentes penales',
  'Documentos de identidad',
];

interface BuscaCapturaTemplateProps {
  data: BuscaCapturaFormData;
  onChange: (data: BuscaCapturaFormData) => void;
}

export function BuscaCapturaTemplate({ data, onChange }: BuscaCapturaTemplateProps) {
  const updateField = <K extends keyof BuscaCapturaFormData>(
    field: K,
    value: BuscaCapturaFormData[K]
  ) => {
    onChange(((current: BuscaCapturaFormData) => ({ ...current, [field]: value })) as unknown as BuscaCapturaFormData);
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
              label="Número de Causa"
              name="numeroCausa"
              value={data.numeroCausa}
              onChange={(v) => updateField('numeroCausa', v)}
              required
              placeholder=""
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
            placeholder=""
          />
          <LabeledInput
            label="Tribunal Destinatario"
            name="tribunalDestinatario"
            value={data.tribunalDestinatario}
            onChange={(v) => updateField('tribunalDestinatario', v)}
            required
            placeholder=""
          />
        </div>
      </div>

      {/* II. PERSONA A DETENER */}
      <div>
        <SectionHeader number="II" title="Persona a Detener" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Nombre Completo"
              name="nombreCompleto"
              value={data.nombreCompleto}
              onChange={(v) => updateField('nombreCompleto', v)}
              required
              placeholder="Nombre y apellidos"
            />
            <LabeledInput
              label="Alias (si se conoce)"
              name="alias"
              value={data.alias}
              onChange={(v) => updateField('alias', v)}
              placeholder="Apodos o nombres conocidos"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledInput
              label="Identificación (DNI/ID)"
              name="identificacion"
              value={data.identificacion}
              onChange={(v) => updateField('identificacion', v)}
              placeholder="Número de documento"
            />
            <LabeledInput
              label="Fecha de Nacimiento"
              name="fechaNacimiento"
              type="date"
              value={data.fechaNacimiento}
              onChange={(v) => updateField('fechaNacimiento', v)}
            />
            <LabeledInput
              label="Nacionalidad"
              name="nacionalidad"
              value={data.nacionalidad}
              onChange={(v) => updateField('nacionalidad', v)}
              placeholder="País de origen"
            />
          </div>
          <LabeledInput
            label="Último Domicilio Conocido"
            name="ultimoDomicilio"
            value={data.ultimoDomicilio}
            onChange={(v) => updateField('ultimoDomicilio', v)}
            placeholder="Dirección completa"
          />
        </div>
      </div>

      {/* III. MOTIVO Y HECHOS */}
      <div>
        <SectionHeader number="III" title="Motivo y Hechos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="motivoHechos"
            value={data.motivoHechos}
            onChange={(v) => updateField('motivoHechos', v)}
            required
            rows={6}
            placeholder="Describa los hechos que motivan la solicitud de orden de detención..."
          />
        </div>
      </div>

      {/* IV. DELITOS IMPUTADOS */}
      <div>
        <SectionHeader number="IV" title="Delitos Imputados" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <DelitosTable
            delitos={data.delitos}
            onChange={(v) => updateField('delitos', v)}
          />
        </div>
      </div>

      {/* V. MEDIDAS SOLICITADAS */}
      <div>
        <SectionHeader number="V" title="Medidas Solicitadas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.detencionDisposicion}
              onChange={(e) => updateField('detencionDisposicion', e.target.checked)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs text-[#1c2537]">Detención y puesta a disposición del tribunal</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.allanamientoLocalizacion}
              onChange={(e) => updateField('allanamientoLocalizacion', e.target.checked)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs text-[#1c2537]">Autorización de allanamiento para localización (opcional)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.alertasUnidades}
              onChange={(e) => updateField('alertasUnidades', e.target.checked)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs text-[#1c2537]">Emisión de alertas a unidades policiales (opcional)</span>
          </label>
        </div>
      </div>

      {/* VI. PRUEBAS Y EVIDENCIAS */}
      <div>
        <SectionHeader number="VI" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection
            pruebas={data.pruebas}
            onChange={(v) => updateField('pruebas', v)}
            tiposPrueba={tiposPruebaBuscaCaptura}
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

      {/* RESOLUCIÓN JUDICIAL */}
      <ResolucionJudicial
        resolucion={data.resolucion}
        onResolucionChange={(v) => updateField('resolucion', v)}
        condiciones={data.condicionesResolucion}
        onCondicionesChange={(v) => updateField('condicionesResolucion', v)}
        fecha={data.fechaEjecucion}
        fechaName="fechaEjecucion"
        onFechaChange={(v) => updateField('fechaEjecucion', v)}
        hora={data.horaEjecucion}
        horaName="horaEjecucion"
        onHoraChange={(v) => updateField('horaEjecucion', v)}
        showLugar={false}
      />
    </div>
  );
}
