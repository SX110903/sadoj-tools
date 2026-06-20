'use client';

import type { PleaBargainFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { DelitosTable } from '../DelitosTable';
import { FundamentoLegal } from '../FundamentoLegal';
import { SignatureBlock } from '../SignatureBlock';

interface Props {
  data: PleaBargainFormData;
  onChange: (data: PleaBargainFormData) => void;
}

export function PleaBargainTemplate({ data, onChange }: Props) {
  const updateField = <K extends keyof PleaBargainFormData>(field: K, value: PleaBargainFormData[K]) => {
    onChange(((current: PleaBargainFormData) => ({ ...current, [field]: value })) as unknown as PleaBargainFormData);
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
          <LabeledInput label="Fiscal Actuante" name="fiscalSolicitante" value={data.fiscalSolicitante} onChange={(v) => updateField('fiscalSolicitante', v)} required />
          <LabeledInput label="Tribunal" name="tribunalDestinatario" value={data.tribunalDestinatario} onChange={(v) => updateField('tribunalDestinatario', v)} required />
        </div>
      </div>

      {/* II. DATOS DEL ACUSADO */}
      <div>
        <SectionHeader number="II" title="Datos del Acusado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Nombre Completo" name="nombreAcusado" value={data.nombreAcusado} onChange={(v) => updateField('nombreAcusado', v)} required />
            <LabeledInput label="Identificacion" name="identificacionAcusado" value={data.identificacionAcusado} onChange={(v) => updateField('identificacionAcusado', v)} />
            <LabeledInput label="Domicilio" name="domicilioAcusado" value={data.domicilioAcusado} onChange={(v) => updateField('domicilioAcusado', v)} />
            <LabeledInput label="Abogado Defensor" name="abogadoDefensor" value={data.abogadoDefensor} onChange={(v) => updateField('abogadoDefensor', v)} required />
          </div>
        </div>
      </div>

      {/* III. DELITOS ORIGINALES */}
      <div>
        <SectionHeader number="III" title="Cargos Originales" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <DelitosTable delitos={data.delitosOriginales} onChange={(v) => updateField('delitosOriginales', v)} />
        </div>
      </div>

      {/* IV. DELITOS ACORDADOS */}
      <div>
        <SectionHeader number="IV" title="Cargos Acordados (Conformidad)" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <DelitosTable delitos={data.delitosAcordados} onChange={(v) => updateField('delitosAcordados', v)} />
        </div>
      </div>

      {/* V. HECHOS RECONOCIDOS */}
      <div>
        <SectionHeader number="V" title="Hechos Reconocidos por el Acusado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="hechoReconocido" value={data.hechoReconocido} onChange={(v) => updateField('hechoReconocido', v)} required rows={6} placeholder="El acusado reconoce libre y voluntariamente los siguientes hechos:&#10;&#10;PRIMERO: ...&#10;SEGUNDO: ..." />
        </div>
      </div>

      {/* VI. PENAS */}
      <div>
        <SectionHeader number="VI" title="Penas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledTextarea label="Pena Original Solicitada" name="penaOriginal" value={data.penaOriginal} onChange={(v) => updateField('penaOriginal', v)} rows={3} placeholder="Descripcion de la pena que se hubiera solicitado en juicio..." />
          <LabeledTextarea label="Pena Acordada" name="penaAcordada" value={data.penaAcordada} onChange={(v) => updateField('penaAcordada', v)} rows={3} required placeholder="Descripcion de la pena acordada en el plea bargain..." />
        </div>
      </div>

      {/* VII. CONDICIONES DEL ACUERDO */}
      <div>
        <SectionHeader number="VII" title="Condiciones del Acuerdo" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledTextarea label="Condiciones Generales" name="condicionesAcuerdo" value={data.condicionesAcuerdo} onChange={(v) => updateField('condicionesAcuerdo', v)} rows={4} required placeholder="1. El acusado se declara culpable de los cargos acordados&#10;2. Se retiran los cargos indicados en la seccion III&#10;3. ..." />
          <LabeledTextarea label="Reparacion del Dano" name="reparacionDano" value={data.reparacionDano} onChange={(v) => updateField('reparacionDano', v)} rows={3} placeholder="Monto o tipo de reparacion acordada a favor de la victima..." />
          <LabeledTextarea label="Compromisos del Acusado" name="compromisosAcusado" value={data.compromisosAcusado} onChange={(v) => updateField('compromisosAcusado', v)} rows={3} placeholder="Compromisos que asume el acusado: comparecencias, servicios comunitarios, rehabilitacion..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Plazo para Cumplir Condiciones" name="plazoCondiciones" value={data.plazoCondiciones} onChange={(v) => updateField('plazoCondiciones', v)} placeholder="Ej: 12 meses" />
            <LabeledInput label="Fecha del Acuerdo" name="fechaAcuerdo" type="date" value={data.fechaAcuerdo} onChange={(v) => updateField('fechaAcuerdo', v)} required />
          </div>
        </div>
      </div>

      {/* VIII. CONSECUENCIAS */}
      <div>
        <SectionHeader number="VIII" title="Consecuencias por Incumplimiento" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="consecuenciasIncumplimiento" value={data.consecuenciasIncumplimiento} onChange={(v) => updateField('consecuenciasIncumplimiento', v)} rows={4} placeholder="En caso de incumplimiento de las condiciones del presente acuerdo:&#10;1. Se reanudara el proceso penal por los cargos originales&#10;2. Se revocara el acuerdo de conformidad&#10;3. ..." />
        </div>
      </div>

      {/* IX. DECLARACIONES Y FIRMAS */}
      <div>
        <SectionHeader number="IX" title="Declaraciones y Consentimiento" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <p className="text-xs text-[#1c2537] leading-relaxed">
            Las partes abajo firmantes declaran que han llegado al presente acuerdo de conformidad de manera libre, voluntaria e informada.
            El acusado manifiesta haber sido debidamente asesorado por su abogado defensor sobre las consecuencias del presente acuerdo y renuncia a su derecho a juicio oral.
          </p>
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.firmaFiscal} onChange={(e) => updateField('firmaFiscal', e.target.checked)} className="w-4 h-4 accent-[#1c2537]" />
              <span className="text-xs font-bold text-[#1c2537]">Fiscal actuante conforme con el acuerdo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.firmaDefensor} onChange={(e) => updateField('firmaDefensor', e.target.checked)} className="w-4 h-4 accent-[#1c2537]" />
              <span className="text-xs font-bold text-[#1c2537]">Abogado defensor conforme con el acuerdo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.firmaAcusado} onChange={(e) => updateField('firmaAcusado', e.target.checked)} className="w-4 h-4 accent-[#1c2537]" />
              <span className="text-xs font-bold text-[#1c2537]">Acusado acepta los terminos del acuerdo</span>
            </label>
          </div>
        </div>
      </div>

      {/* FIRMAS */}
      <SignatureBlock
        showPlaceDate
        lugar={data.lugarFirma}
        onLugarChange={(v) => updateField('lugarFirma', v)}
        fecha={data.fechaFirma}
        onFechaChange={(v) => updateField('fechaFirma', v)}
        signatures={[
          { label: 'Fiscal Actuante', value: data.fiscalSolicitante || undefined },
          { label: 'Abogado Defensor', value: data.abogadoDefensor || undefined },
          { label: 'Acusado', value: data.nombreAcusado || undefined },
        ]}
        columns={3}
      />
      <div className="mt-8">
        <SignatureBlock
          signatures={[
            { label: 'Juez', value: '[Sello y firma del Juez]' },
          ]}
          columns={1}
        />
      </div>
    </div>
  );
}
