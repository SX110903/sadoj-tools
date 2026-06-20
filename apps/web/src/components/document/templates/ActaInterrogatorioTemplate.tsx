'use client';

import type { ActaInterrogatorioFormData, PreguntaRespuesta } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { Plus, Trash2 } from 'lucide-react';
import { SignatureBlock } from '../SignatureBlock';

interface ActaInterrogatorioTemplateProps {
  data: ActaInterrogatorioFormData;
  updateField: <K extends keyof ActaInterrogatorioFormData>(field: K, value: ActaInterrogatorioFormData[K]) => void;
}

export function ActaInterrogatorioTemplate({ data, updateField }: ActaInterrogatorioTemplateProps) {
  const handleAddPregunta = () => {
    updateField('preguntasRespuestas', [...data.preguntasRespuestas, { pregunta: '', respuesta: '' }]);
  };

  const handleRemovePregunta = (index: number) => {
    updateField('preguntasRespuestas', data.preguntasRespuestas.filter((_, i) => i !== index));
  };

  const handlePreguntaChange = (index: number, field: keyof PreguntaRespuesta, value: string) => {
    const updated = [...data.preguntasRespuestas];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    updateField('preguntasRespuestas', updated);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado del Acta */}
      <div className="border-2 border-[#1c2537] p-3 bg-[#1c2537]/5">
        <p className="text-xs font-bold text-[#1c2537] text-center uppercase tracking-wide">
          Acta de Interrogatorio - Documento Interno
        </p>
      </div>

      {/* I. DATOS GENERALES */}
      <div>
        <SectionHeader number="I" title="Datos Generales" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Número de Causa"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Hora"
              name="hora"
              type="time"
              value={data.hora}
              onChange={(v) => updateField('hora', v)}
              required
            />
            <LabeledInput
              label="Lugar"
              name="lugar"
              value={data.lugar}
              onChange={(v) => updateField('lugar', v)}
              required
            />
          </div>
          <LabeledInput
            label="Fiscal Actuante"
            name="fiscalActuante"
            value={data.fiscalActuante}
            onChange={(v) => updateField('fiscalActuante', v)}
            required
          />
        </div>
      </div>

      {/* II. DATOS DEL INTERROGADO */}
      <div>
        <SectionHeader number="II" title="Datos del Interrogado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledInput
            label="Nombre Completo"
            name="nombreInterrogado"
            value={data.nombreInterrogado}
            onChange={(v) => updateField('nombreInterrogado', v)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Identificación"
              name="identificacion"
              value={data.identificacion}
              onChange={(v) => updateField('identificacion', v)}
            />
            <LabeledInput
              label="Condición Procesal"
              name="condicionProcesal"
              value={data.condicionProcesal}
              onChange={(v) => updateField('condicionProcesal', v)}
            />
          </div>
          <LabeledInput
            label="Domicilio"
            name="domicilio"
            value={data.domicilio}
            onChange={(v) => updateField('domicilio', v)}
          />
          <LabeledInput
            label="Abogado Defensor"
            name="abogadoDefensor"
            value={data.abogadoDefensor}
            onChange={(v) => updateField('abogadoDefensor', v)}
          />
        </div>
      </div>

      {/* III. FUNCIONARIOS PRESENTES */}
      <div>
        <SectionHeader number="III" title="Funcionarios Presentes" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="funcionariosPresentes"
            value={data.funcionariosPresentes}
            onChange={(v) => updateField('funcionariosPresentes', v)}
            rows={3}
            placeholder="Nombre, cargo y agencia de cada funcionario presente..."
          />
        </div>
      </div>

      {/* IV. DESARROLLO DEL INTERROGATORIO */}
      <div>
        <SectionHeader number="IV" title="Desarrollo del Interrogatorio" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          {data.preguntasRespuestas.map((pr, index) => (
            <div key={index} className="border border-[#1c2537]/30 p-3 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c2537]">Pregunta/Respuesta #{index + 1}</span>
                {data.preguntasRespuestas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePregunta(index)}
                    className="print:hidden text-[#1c2537] hover:text-[#111827] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-[#1c2537] block mb-1">Pregunta:</label>
                <textarea
                  value={pr.pregunta}
                  onChange={(e) => handlePreguntaChange(index, 'pregunta', e.target.value)}
                  className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] resize-none print:hidden"
                  rows={2}
                  placeholder="Escriba la pregunta formulada..."
                />
                <div className="print-companion hidden print:block w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] whitespace-pre-wrap break-words min-h-[1.5em]">
                  {pr.pregunta || '\u00A0'}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#1c2537] block mb-1">Respuesta:</label>
                <textarea
                  value={pr.respuesta}
                  onChange={(e) => handlePreguntaChange(index, 'respuesta', e.target.value)}
                  className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] resize-none print:hidden"
                  rows={3}
                  placeholder="Escriba la respuesta del interrogado..."
                />
                <div className="print-companion hidden print:block w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] whitespace-pre-wrap break-words min-h-[1.5em]">
                  {pr.respuesta || '\u00A0'}
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddPregunta}
            className="print:hidden flex items-center gap-2 px-3 py-1.5 border border-[#1c2537] text-[#1c2537] hover:bg-[#1c2537]/5 transition-colors text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Pregunta/Respuesta
          </button>
        </div>
      </div>

      {/* V. OBSERVACIONES */}
      <div>
        <SectionHeader number="V" title="Observaciones" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="observaciones"
            value={data.observaciones}
            onChange={(v) => updateField('observaciones', v)}
            rows={4}
            placeholder="Observaciones adicionales sobre el desarrollo del interrogatorio, actitud del interrogado, incidencias, etc."
          />
        </div>
      </div>

      {/* VI. CIERRE Y FIRMAS */}
      <div>
        <SectionHeader number="VI" title="Cierre y Firmas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.firmaInterrogado}
                onChange={(e) => updateField('firmaInterrogado', e.target.checked)}
                className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
              />
              <span className="text-xs text-[#1c2537]">El interrogado firma el acta</span>
            </label>
          </div>
          
          {!data.firmaInterrogado && (
            <LabeledInput
              label="Motivo de no firma"
              name="motivoNoFirma"
              value={data.motivoNoFirma}
              onChange={(v) => updateField('motivoNoFirma', v)}
              placeholder="Indique el motivo por el cual no firma..."
            />
          )}

        </div>
      </div>

      {/* FIRMAS */}
      <SignatureBlock
        signatures={[
          { label: 'Interrogado', value: data.nombreInterrogado || undefined },
          { label: 'Abogado Defensor', value: data.abogadoDefensor || undefined },
          { label: 'Fiscal Actuante', value: data.fiscalActuante || undefined },
        ]}
        columns={3}
      />
    </div>
  );
}
