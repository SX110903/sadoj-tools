'use client';

import type { ActaSolicitudInformacionFormData, InformacionRecibida } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { Plus, Trash2 } from 'lucide-react';
import { SignatureBlock } from '../SignatureBlock';

interface Props {
  data: ActaSolicitudInformacionFormData;
  updateField: <K extends keyof ActaSolicitudInformacionFormData>(field: K, value: ActaSolicitudInformacionFormData[K]) => void;
}

export function ActaSolicitudInformacionTemplate({ data, updateField }: Props) {
  const addInfo = () => {
    const n = (data.informacionRecibida || []).length + 1;
    updateField('informacionRecibida', [...(data.informacionRecibida || []), { numero: String(n), tipo: '', descripcion: '', fuenteEntidad: '', fechaRecepcion: '', formato: '' }]);
  };

  const removeInfo = (index: number) => {
    const arr = data.informacionRecibida || [];
    if (arr.length > 1) {
      updateField('informacionRecibida', arr.filter((_, i) => i !== index).map((r, i) => ({ ...r, numero: String(i + 1) })));
    }
  };

  const updateInfo = (index: number, field: keyof InformacionRecibida, value: string) => {
    const updated = [...(data.informacionRecibida || [])];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    updateField('informacionRecibida', updated);
  };

  return (
    <div className="space-y-4">
      {/* I. DATOS DEL ACTA */}
      <div>
        <SectionHeader number="I" title="Datos del Acta" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Numero de Causa" name="numeroCausa" value={data.numeroCausa} onChange={(v) => updateField('numeroCausa', v)} required />
            <LabeledInput label="Fecha del Acta" name="fecha" type="date" value={data.fecha} onChange={(v) => updateField('fecha', v)} required />
          </div>
        </div>
      </div>

      {/* II. ORDEN JUDICIAL */}
      <div>
        <SectionHeader number="II" title="Orden Judicial Asociada" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="No. Orden Judicial" name="ordenJudicial" value={data.ordenJudicial} onChange={(v) => updateField('ordenJudicial', v)} required />
            <LabeledInput label="Fecha de la Orden" name="fechaOrden" type="date" value={data.fechaOrden} onChange={(v) => updateField('fechaOrden', v)} />
          </div>
        </div>
      </div>

      {/* III. ENTIDAD QUE RESPONDE */}
      <div>
        <SectionHeader number="III" title="Entidad que Proporciona la Informacion" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Entidad" name="entidadQueResponde" value={data.entidadQueResponde} onChange={(v) => updateField('entidadQueResponde', v)} required />
            <LabeledInput label="Persona de Contacto" name="personaContacto" value={data.personaContacto} onChange={(v) => updateField('personaContacto', v)} />
          </div>
        </div>
      </div>

      {/* IV. INFORMACION SOLICITADA */}
      <div>
        <SectionHeader number="IV" title="Informacion que fue Solicitada" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="informacionSolicitada" value={data.informacionSolicitada} onChange={(v) => updateField('informacionSolicitada', v)} rows={4} required placeholder="Descripcion de la informacion que fue solicitada mediante la orden judicial..." />
        </div>
      </div>

      {/* V. INFORMACION RECIBIDA */}
      <div>
        <SectionHeader number="V" title="Informacion Recibida" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          {(data.informacionRecibida || []).map((info, i) => (
            <div key={i} className="border border-[#1c2537]/30 p-3 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c2537]">Informacion #{info.numero}</span>
                {(data.informacionRecibida || []).length > 1 && (
                  <button type="button" onClick={() => removeInfo(i)} className="text-[#1c2537] hover:text-[#111827] p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Tipo</label>
                  <select value={info.tipo} onChange={(e) => updateInfo(i, 'tipo', e.target.value)} className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs bg-white">
                    <option value="">Seleccionar</option>
                    <option value="Documento">Documento</option>
                    <option value="Registro digital">Registro digital</option>
                    <option value="Informe">Informe</option>
                    <option value="Certificacion">Certificacion</option>
                    <option value="Base de datos">Base de datos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Fecha Recepcion</label>
                  <input type="date" value={info.fechaRecepcion} onChange={(e) => updateInfo(i, 'fechaRecepcion', e.target.value)} className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Formato</label>
                  <input type="text" value={info.formato} onChange={(e) => updateInfo(i, 'formato', e.target.value)} placeholder="PDF, fisico..." className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Descripcion</label>
                  <input type="text" value={info.descripcion} onChange={(e) => updateInfo(i, 'descripcion', e.target.value)} placeholder="Descripcion del contenido" className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Fuente / Entidad</label>
                  <input type="text" value={info.fuenteEntidad} onChange={(e) => updateInfo(i, 'fuenteEntidad', e.target.value)} placeholder="Entidad que proporciono" className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addInfo} className="flex items-center gap-2 px-3 py-1.5 border border-[#1c2537] text-[#1c2537] hover:bg-[#1c2537]/5 transition-colors text-xs font-bold print:hidden">
            <Plus className="w-3.5 h-3.5" /> Agregar informacion
          </button>
        </div>
      </div>

      {/* VI. RESUMEN */}
      <div>
        <SectionHeader number="VI" title="Resumen de Hallazgos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="resumenHallazgos" value={data.resumenHallazgos} onChange={(v) => updateField('resumenHallazgos', v)} rows={6} placeholder="Resumen de la informacion obtenida y hallazgos relevantes para la investigacion..." />
        </div>
      </div>

      {/* VII. CADENA DE CUSTODIA */}
      <div>
        <SectionHeader number="VII" title="Cadena de Custodia" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="cadenaCustodia" value={data.cadenaCustodia} onChange={(v) => updateField('cadenaCustodia', v)} rows={3} placeholder="Descripcion de como se ha gestionado la documentacion recibida..." />
        </div>
      </div>

      {/* VIII. OBSERVACIONES */}
      <div>
        <SectionHeader number="VIII" title="Observaciones" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="observaciones" value={data.observaciones} onChange={(v) => updateField('observaciones', v)} rows={4} placeholder="Observaciones adicionales..." />
        </div>
      </div>

      {/* FIRMA */}
      <SignatureBlock
        signatures={[
          { label: 'Funcionario Responsable', editable: true, value: data.firmaResponsable, onChange: (v) => updateField('firmaResponsable', v) },
        ]}
        columns={1}
      />
    </div>
  );
}
