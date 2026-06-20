'use client';

import type { AllanamientoFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const tiposPruebaAllanamiento = [
  'Video de vigilancia',
  'Fotografías del lugar',
  'Informe policial',
  'Testimonios',
  'Documentos',
  'Evidencia digital',
];

interface AllanamientoTemplateProps {
  data: AllanamientoFormData;
  onChange: (data: AllanamientoFormData) => void;
}

export function AllanamientoTemplate({ data, onChange }: AllanamientoTemplateProps) {
  const updateField = <K extends keyof AllanamientoFormData>(
    field: K,
    value: AllanamientoFormData[K]
  ) => {
    onChange(((current: AllanamientoFormData) => ({ ...current, [field]: value })) as unknown as AllanamientoFormData);
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

      {/* II. LUGAR A ALLANAR */}
      <div>
        <SectionHeader number="II" title="Lugar a Allanar" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledInput
            label="Dirección Completa"
            name="direccionCompleta"
            value={data.direccionCompleta}
            onChange={(v) => updateField('direccionCompleta', v)}
            required
            placeholder="Calle, número, piso, ciudad, código postal"
          />
          <LabeledTextarea
            label="Referencia / Descripción del Inmueble"
            name="referenciaInmueble"
            value={data.referenciaInmueble}
            onChange={(v) => updateField('referenciaInmueble', v)}
            rows={2}
            placeholder="Características del inmueble, puntos de referencia, accesos..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Propietario / Responsable (si se conoce)"
              name="propietario"
              value={data.propietario}
              onChange={(v) => updateField('propietario', v)}
              placeholder="Nombre del propietario"
            />
            <LabeledInput
              label="Ocupantes (si se conoce)"
              name="ocupantes"
              value={data.ocupantes}
              onChange={(v) => updateField('ocupantes', v)}
              placeholder="Personas que habitan el inmueble"
            />
          </div>
        </div>
      </div>

      {/* III. OBJETO DEL ALLANAMIENTO */}
      <div>
        <SectionHeader number="III" title="Objeto del Allanamiento" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="objetoBusqueda"
            value={data.objetoBusqueda}
            onChange={(v) => updateField('objetoBusqueda', v)}
            required
            rows={4}
            placeholder="• Armas de fuego y municiones&#10;• Documentación relacionada con...&#10;• Dispositivos electrónicos (computadores, teléfonos)&#10;• Sustancias ilícitas..."
          />
        </div>
      </div>

      {/* IV. FUNDAMENTOS Y JUSTIFICACIÓN */}
      <div>
        <SectionHeader number="IV" title="Fundamentos y Justificación" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="justificacion"
            value={data.justificacion}
            onChange={(v) => updateField('justificacion', v)}
            required
            rows={6}
            placeholder="Exponga los indicios y fundamentos que justifican la necesidad del allanamiento..."
          />
        </div>
      </div>

      {/* V. DILIGENCIAS SOLICITADAS */}
      <div>
        <SectionHeader number="V" title="Diligencias Solicitadas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <LabeledInput
            label="Horario Sugerido / Urgencia"
            name="horarioSugerido"
            value={data.horarioSugerido}
            onChange={(v) => updateField('horarioSugerido', v)}
            placeholder=""
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1c2537] block">Medidas especiales solicitadas:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.usoFuerza}
                  onChange={(e) => updateField('usoFuerza', e.target.checked)}
                  className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">Autorización para uso de fuerza en caso de resistencia</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.presenciaCerrajero}
                  onChange={(e) => updateField('presenciaCerrajero', e.target.checked)}
                  className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">Presencia de cerrajero para apertura del inmueble</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.cadenaCustodia}
                  onChange={(e) => updateField('cadenaCustodia', e.target.checked)}
                  className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">Garantizar cadena de custodia de elementos incautados</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* VI. PRUEBAS Y EVIDENCIAS */}
      <div>
        <SectionHeader number="VI" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection
            pruebas={data.pruebas}
            onChange={(v) => updateField('pruebas', v)}
            tiposPrueba={tiposPruebaAllanamiento}
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
        lugar={data.lugarEjecucion}
        lugarName="lugarEjecucion"
        onLugarChange={(v) => updateField('lugarEjecucion', v)}
      />
    </div>
  );
}
