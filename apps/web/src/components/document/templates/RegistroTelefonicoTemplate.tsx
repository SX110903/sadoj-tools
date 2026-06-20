'use client';

import type { RegistroTelefonicoFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { CheckboxGroup } from '../CheckboxGroup';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const tiposPruebaRegistroTelefonico = [
  'Registros de llamadas',
  'Mensajes de texto',
  'Capturas de pantalla',
  'Informe técnico',
  'Datos de geolocalización',
  'Documentos relacionados',
];

interface RegistroTelefonicoTemplateProps {
  data: RegistroTelefonicoFormData;
  onChange: (data: RegistroTelefonicoFormData) => void;
}

const tipoMedidaOptions = [
  { value: 'registros-llamadas', label: 'Registros de llamadas (entrantes/salientes)' },
  { value: 'geolocalizacion', label: 'Datos de geolocalización' },
  { value: 'mensajes', label: 'Contenido de mensajes (si aplica)' },
  { value: 'metadatos', label: 'Metadatos de comunicaciones' },
];

export function RegistroTelefonicoTemplate({ data, onChange }: RegistroTelefonicoTemplateProps) {
  const updateField = <K extends keyof RegistroTelefonicoFormData>(
    field: K,
    value: RegistroTelefonicoFormData[K]
  ) => {
    onChange(((current: RegistroTelefonicoFormData) => ({ ...current, [field]: value })) as unknown as RegistroTelefonicoFormData);
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

      {/* II. LÍNEA/S OBJETIVO */}
      <div>
        <SectionHeader number="II" title="Línea/s Objetivo" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledTextarea
            label="Número(s) de Teléfono"
            name="numerosTelefono"
            value={data.numerosTelefono}
            onChange={(v) => updateField('numerosTelefono', v)}
            required
            rows={2}
            placeholder="Ingrese los números de teléfono (uno por línea)&#10;+1 555-123-4567&#10;+1 555-987-6543"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Operador / Compañía (si se conoce)"
              name="operador"
              value={data.operador}
              onChange={(v) => updateField('operador', v)}
              placeholder="Nombre de la compañía telefónica"
            />
            <LabeledInput
              label="Titular (si se conoce)"
              name="titular"
              value={data.titular}
              onChange={(v) => updateField('titular', v)}
              placeholder="Nombre del titular de la línea"
            />
          </div>
        </div>
      </div>

      {/* III. ALCANCE DE LA MEDIDA */}
      <div>
        <SectionHeader number="III" title="Alcance de la Medida" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1c2537] mb-2 block">
              Tipo de información solicitada:
            </label>
            <CheckboxGroup
              options={tipoMedidaOptions}
              selectedValues={data.tipoMedida}
              onChange={(v) => updateField('tipoMedida', v)}
              columns={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Fecha Desde"
              name="fechaDesde"
              type="date"
              value={data.fechaDesde}
              onChange={(v) => updateField('fechaDesde', v)}
              required
            />
            <LabeledInput
              label="Fecha Hasta"
              name="fechaHasta"
              type="date"
              value={data.fechaHasta}
              onChange={(v) => updateField('fechaHasta', v)}
              required
            />
          </div>
        </div>
      </div>

      {/* IV. JUSTIFICACIÓN Y NECESIDAD */}
      <div>
        <SectionHeader number="IV" title="Justificación y Necesidad" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="justificacion"
            value={data.justificacion}
            onChange={(v) => updateField('justificacion', v)}
            required
            rows={6}
            placeholder="Exponga los motivos que justifican la necesidad de acceder a los registros telefónicos..."
          />
        </div>
      </div>

      {/* V. CADENA DE CUSTODIA Y RESGUARDO */}
      <div>
        <SectionHeader number="V" title="Cadena de Custodia y Resguardo" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.cadenaCustodia}
              onChange={(e) => updateField('cadenaCustodia', e.target.checked)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs text-[#1c2537]">
              Solicito que se garantice la cadena de custodia de la información obtenida
            </span>
          </label>
          {data.cadenaCustodia && (
            <LabeledTextarea
              label="Detalles de resguardo"
              name="detallesCustodia"
              value={data.detallesCustodia}
              onChange={(v) => updateField('detallesCustodia', v)}
              rows={2}
              placeholder="Especifique las medidas de resguardo solicitadas..."
            />
          )}
        </div>
      </div>

      {/* VI. PRUEBAS Y EVIDENCIAS */}
      <div>
        <SectionHeader number="VI" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection
            pruebas={data.pruebas}
            onChange={(v) => updateField('pruebas', v)}
            tiposPrueba={tiposPruebaRegistroTelefonico}
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
        fecha={data.fechaDesde}
        fechaName="fechaDesde"
        onFechaChange={(v) => updateField('fechaDesde', v)}
        showHora={false}
        showLugar={false}
        showVigencia={true}
        vigencia={data.vigencia}
        vigenciaName="vigencia"
        onVigenciaChange={(v) => updateField('vigencia', v)}
      />
    </div>
  );
}
