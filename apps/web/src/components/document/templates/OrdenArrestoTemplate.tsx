'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { OrdenArrestoFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { DelitosTable } from '../DelitosTable';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const tiposPrueba = [
  'Testimonio de testigos',
  'Video de vigilancia',
  'Informe policial',
  'Evidencia forense',
  'Documentos',
  'Evidencia digital',
];

interface Props {
  data: OrdenArrestoFormData;
  onChange: (data: OrdenArrestoFormData) => void;
}

export function OrdenArrestoTemplate({ data, onChange }: Props) {
  const updateField = <K extends keyof OrdenArrestoFormData>(field: K, value: OrdenArrestoFormData[K]) => {
    onChange(((current: OrdenArrestoFormData) => ({ ...current, [field]: value })) as unknown as OrdenArrestoFormData);
  };

  // Parse motivoHechos as multiple paragraphs separated by \n---\n
  const SEPARATOR = '\n---\n';
  const paragraphs = (data.motivoHechos || '').split(SEPARATOR);
  
  const updateParagraph = (index: number, value: string) => {
    const updated = [...paragraphs];
    updated[index] = value;
    updateField('motivoHechos', updated.join(SEPARATOR));
  };

  const addParagraph = () => {
    updateField('motivoHechos', data.motivoHechos + SEPARATOR);
  };

  const removeParagraph = (index: number) => {
    if (paragraphs.length <= 1) return;
    const updated = paragraphs.filter((_, i) => i !== index);
    updateField('motivoHechos', updated.join(SEPARATOR));
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

      {/* II. DATOS DEL SUJETO */}
      <div>
        <SectionHeader number="II" title="Datos del Sujeto a Arrestar" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Nombre Completo" name="nombreCompleto" value={data.nombreCompleto} onChange={(v) => updateField('nombreCompleto', v)} required placeholder="Nombre y apellidos" />
            <LabeledInput label="Alias / Apodo" name="alias" value={data.alias} onChange={(v) => updateField('alias', v)} placeholder="Si aplica" />
            <LabeledInput label="Identificacion" name="identificacion" value={data.identificacion} onChange={(v) => updateField('identificacion', v)} placeholder="DNI / Pasaporte" />
            <LabeledInput label="Fecha de Nacimiento" name="fechaNacimiento" type="date" value={data.fechaNacimiento} onChange={(v) => updateField('fechaNacimiento', v)} />
            <LabeledInput label="Nacionalidad" name="nacionalidad" value={data.nacionalidad} onChange={(v) => updateField('nacionalidad', v)} />
            <LabeledInput label="Ultimo Domicilio Conocido" name="ultimoDomicilio" value={data.ultimoDomicilio} onChange={(v) => updateField('ultimoDomicilio', v)} />
          </div>
          <LabeledTextarea label="Descripcion Fisica" name="descripcionFisica" value={data.descripcionFisica} onChange={(v) => updateField('descripcionFisica', v)} rows={3} placeholder="Altura, complexion, color de cabello, tatuajes, marcas distintivas..." />
        </div>
      </div>

      {/* III. CALIFICACION JURIDICA */}
      <div>
        <SectionHeader number="III" title="Calificacion Juridica" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <DelitosTable delitos={data.delitos} onChange={(v) => updateField('delitos', v)} />
        </div>
      </div>

      {/* IV. HECHOS - Dynamic paragraphs */}
      <div>
        <SectionHeader number="IV" title="Relacion de Hechos / Motivo del Arresto" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          {paragraphs.map((paragraph, index) => (
            <div key={index} className="relative group">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-[#1c2537]/50 mt-2.5 min-w-[20px]">{index + 1}.</span>
                <div className="flex-1">
                  <textarea
                    value={paragraph}
                    onChange={(e) => updateParagraph(index, e.target.value)}
                    rows={4}
                    className="w-full border border-[#1c2537]/30 bg-white px-3 py-2 text-sm text-[#1c2537] focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:border-[#1c2537] resize-y print:hidden"
                    placeholder={index === 0 ? "Descripcion detallada de los hechos que fundamentan la solicitud de arresto..." : "Continuar con la descripcion de los hechos..."}
                  />
                  {/* Print-only div */}
                  <div className="hidden print:block w-full border border-[#1c2537]/30 bg-white px-3 py-2 text-sm text-[#1c2537] whitespace-pre-wrap break-words min-h-[2em]">
                    {paragraph || '\u00A0'}
                  </div>
                </div>
                {paragraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParagraph(index)}
                    className="mt-2 p-1 text-[#1c2537]/60 hover:text-[#1c2537] transition-colors print:hidden"
                    aria-label="Eliminar parrafo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addParagraph}
            className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-[#1c2537]/40 text-[#1c2537]/70 hover:border-[#1c2537] hover:text-[#1c2537] hover:bg-[#1c2537]/5 transition-all text-xs font-bold print:hidden"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar parrafo
          </button>
        </div>
      </div>

      {/* V. MOTIVOS DE LA DETENCION */}
      <div>
        <SectionHeader number="V" title="Motivos que Justifican la Detencion" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={data.peligroFuga} onChange={(e) => updateField('peligroFuga', e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#1c2537]" />
            <div>
              <span className="text-xs font-bold text-[#1c2537]">Peligro de fuga</span>
              <p className="text-xs text-[#1c2537]/70">El sujeto presenta indicios de querer sustraerse a la accion de la justicia</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={data.peligroReiteracion} onChange={(e) => updateField('peligroReiteracion', e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#1c2537]" />
            <div>
              <span className="text-xs font-bold text-[#1c2537]">Peligro de reiteracion delictiva</span>
              <p className="text-xs text-[#1c2537]/70">Riesgo fundado de que cometa nuevos delitos</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={data.destruccionPruebas} onChange={(e) => updateField('destruccionPruebas', e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#1c2537]" />
            <div>
              <span className="text-xs font-bold text-[#1c2537]">Destruccion de pruebas</span>
              <p className="text-xs text-[#1c2537]/70">Riesgo de que destruya, altere u oculte pruebas relevantes</p>
            </div>
          </label>
          <LabeledTextarea label="Otro motivo (si aplica)" name="otroMotivo" value={data.otroMotivo} onChange={(v) => updateField('otroMotivo', v)} rows={2} placeholder="Especifique otro motivo..." />
        </div>
      </div>

      {/* VI. PRUEBAS */}
      <div>
        <SectionHeader number="VI" title="Pruebas y Evidencias Adjuntas" />
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
        fecha={data.fechaEjecucion}
        fechaName="fechaEjecucion"
        onFechaChange={(v) => updateField('fechaEjecucion', v)}
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
          { label: 'Juez Autorizante', value: '[Sello y firma del Juez]' },
        ]}
        columns={2}
      />
    </div>
  );
}
