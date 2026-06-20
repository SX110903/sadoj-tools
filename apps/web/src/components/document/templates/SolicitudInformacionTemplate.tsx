'use client';

import type { SolicitudInformacionFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const tiposInformacion = [
  'Registros bancarios / financieros',
  'Historial medico',
  'Registros de vehiculos',
  'Registros de propiedad inmobiliaria',
  'Antecedentes penales',
  'Informacion migratoria',
  'Registros laborales',
  'Registros de telecomunicaciones',
  'Registros de armas',
  'Informacion fiscal / tributaria',
  'Registros de seguridad social',
  'Historial de viajes',
];

const tiposPrueba = [
  'Informe policial',
  'Declaracion de testigos',
  'Documentos previos',
  'Evidencia digital',
  'Otros informes',
];

interface Props {
  data: SolicitudInformacionFormData;
  onChange: (data: SolicitudInformacionFormData) => void;
}

export function SolicitudInformacionTemplate({ data, onChange }: Props) {
  const updateField = <K extends keyof SolicitudInformacionFormData>(field: K, value: SolicitudInformacionFormData[K]) => {
    onChange(((current: SolicitudInformacionFormData) => ({ ...current, [field]: value })) as unknown as SolicitudInformacionFormData);
  };

  return (
    <div className="space-y-4">
      <FundamentoLegal texto={data.fundamentoLegal} onChange={(v) => updateField('fundamentoLegal', v)} />

      {/* I. DATOS DEL PROCESO */}
      <div>
        <SectionHeader number="I" title="Datos del Proceso" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Numero de Causa" name="numeroCausa" value={data.numeroCausa} onChange={(v) => updateField('numeroCausa', v)} required />
            <LabeledInput label="Fecha" name="fecha" type="date" value={data.fecha} onChange={(v) => updateField('fecha', v)} required />
          </div>
          <LabeledInput label="Fiscal Solicitante" name="fiscalSolicitante" value={data.fiscalSolicitante} onChange={(v) => updateField('fiscalSolicitante', v)} required />
          <LabeledInput label="Tribunal Destinatario" name="tribunalDestinatario" value={data.tribunalDestinatario} onChange={(v) => updateField('tribunalDestinatario', v)} required />
        </div>
      </div>

      {/* II. ENTIDAD DESTINATARIA */}
      <div>
        <SectionHeader number="II" title="Entidad a la que se Solicita" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Entidad / Institucion" name="entidadDestinataria" value={data.entidadDestinataria} onChange={(v) => updateField('entidadDestinataria', v)} required placeholder="Nombre de la entidad" />
            <LabeledInput label="Persona de Contacto" name="personaContacto" value={data.personaContacto} onChange={(v) => updateField('personaContacto', v)} placeholder="Si aplica" />
          </div>
        </div>
      </div>

      {/* III. PERSONA INVESTIGADA */}
      <div>
        <SectionHeader number="III" title="Persona Investigada" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Nombre Completo" name="personaInvestigada" value={data.personaInvestigada} onChange={(v) => updateField('personaInvestigada', v)} required />
            <LabeledInput label="Identificacion" name="identificacionPersona" value={data.identificacionPersona} onChange={(v) => updateField('identificacionPersona', v)} placeholder="DNI / Pasaporte" />
          </div>
        </div>
      </div>

      {/* IV. TIPO DE INFORMACION */}
      <div>
        <SectionHeader number="IV" title="Tipo de Informacion Solicitada" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tiposInformacion.map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.tipoInformacion || []).includes(tipo)}
                  onChange={(e) => {
                    const current = data.tipoInformacion || [];
                    if (e.target.checked) {
                      updateField('tipoInformacion', [...current, tipo]);
                    } else {
                      updateField('tipoInformacion', current.filter((t: string) => t !== tipo));
                    }
                  }}
                  className="w-3.5 h-3.5 accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">{tipo}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* V. PERIODO Y ENTREGA */}
      <div>
        <SectionHeader number="V" title="Periodo y Condiciones de Entrega" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Periodo Desde" name="periodoDesde" type="date" value={data.periodoDesde} onChange={(v) => updateField('periodoDesde', v)} />
            <LabeledInput label="Periodo Hasta" name="periodoHasta" type="date" value={data.periodoHasta} onChange={(v) => updateField('periodoHasta', v)} />
            <LabeledInput label="Plazo de Entrega" name="plazoEntrega" value={data.plazoEntrega} onChange={(v) => updateField('plazoEntrega', v)} placeholder="Ej: 5 dias habiles" />
            <LabeledInput label="Formato de Entrega" name="formatoEntrega" value={data.formatoEntrega} onChange={(v) => updateField('formatoEntrega', v)} placeholder="Ej: Digital (PDF), fisico" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input type="checkbox" checked={data.confidencialidad} onChange={(e) => updateField('confidencialidad', e.target.checked)} className="w-4 h-4 accent-[#1c2537]" />
            <span className="text-xs font-bold text-[#1c2537]">La informacion solicitada tiene caracter CONFIDENCIAL y de uso exclusivo para la investigacion</span>
          </label>
        </div>
      </div>

      {/* VI. JUSTIFICACION */}
      <div>
        <SectionHeader number="VI" title="Justificacion de la Solicitud" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="justificacion" value={data.justificacion} onChange={(v) => updateField('justificacion', v)} required rows={6} placeholder="Exposicion detallada de los motivos por los cuales se requiere la informacion y su relevancia para la investigacion..." />
        </div>
      </div>

      {/* VII. PRUEBAS */}
      <div>
        <SectionHeader number="VII" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection pruebas={data.pruebas} onChange={(v) => updateField('pruebas', v)} tiposPrueba={tiposPrueba} />
        </div>
      </div>

      {/* RESOLUCION JUDICIAL */}
      <ResolucionJudicial
        resolucion={data.resolucion}
        condiciones={data.condicionesResolucion}
        onResolucionChange={(v) => updateField('resolucion', v)}
        onCondicionesChange={(v) => updateField('condicionesResolucion', v)}
        fecha={data.fecha}
        fechaName="fecha"
        onFechaChange={(v) => updateField('fecha', v)}
        showHora={false}
        showLugar={false}
      />

      {/* FIRMA */}
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
    </div>
  );
}
