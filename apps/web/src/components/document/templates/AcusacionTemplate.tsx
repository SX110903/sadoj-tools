'use client';

import type { AcusacionFormData, Acusado, MedioPrueba, Antecedente, Delito } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { Plus, Trash2 } from 'lucide-react';
import { SignatureBlock } from '../SignatureBlock';

const tiposPruebaAcusacion = [
  'Testimonio',
  'Documento',
  'Pericia',
  'Evidencia fisica',
  'Material audiovisual',
  'Informe forense',
];

const atenuantesOptions = [
  'Confesion espontanea del hecho',
  'Reparacion del dano a la victima',
  'Colaboracion con la investigacion',
  'Estado de necesidad incompleto',
  'Arrebato u obcecacion',
  'Minoria de edad (atenuante)',
  'Dilaciones indebidas',
  'Adiccion a sustancias (en tratamiento)',
  'Sin antecedentes penales',
];

const agravantesOptions = [
  'Reincidencia',
  'Abuso de superioridad',
  'Uso de disfraz, fraude o abuso de confianza',
  'Alevosía',
  'Ensanamiento',
  'Discriminacion',
  'Abuso de cargo publico',
  'Uso de arma de fuego',
  'Organizacion criminal / banda',
  'Nocturnidad',
  'Premeditacion',
];

interface AcusacionTemplateProps {
  data: AcusacionFormData;
  onChange: (data: AcusacionFormData) => void;
}

export function AcusacionTemplate({ data, onChange }: AcusacionTemplateProps) {
  const updateField = <K extends keyof AcusacionFormData>(field: K, value: AcusacionFormData[K]) => {
    onChange(((current: AcusacionFormData) => ({ ...current, [field]: value })) as unknown as AcusacionFormData);
  };

  // Acusados
  const addAcusado = () => {
    updateField('acusados', [...data.acusados, { nombre: '', identificacion: '', domicilio: '', defensor: '' }]);
  };
  const updateAcusado = (index: number, field: keyof Acusado, value: string) => {
    const arr = [...data.acusados];
    const current = arr[index];
    if (current === undefined) return;
    arr[index] = { ...current, [field]: value };
    updateField('acusados', arr);
  };
  const removeAcusado = (index: number) => {
    if (data.acusados.length > 1) updateField('acusados', data.acusados.filter((_, i) => i !== index));
  };

  // Delitos (expandable)
  const addDelito = () => {
    const n = data.delitos.length + 1;
    updateField('delitos', [...data.delitos, { numero: String(n), tipificacion: '', delito: '', gravedad: '' }]);
  };
  const updateDelito = (index: number, field: keyof Delito, value: string) => {
    const arr = [...data.delitos];
    const current = arr[index];
    if (current === undefined) return;
    arr[index] = { ...current, [field]: value };
    updateField('delitos', arr);
  };
  const removeDelito = (index: number) => {
    if (data.delitos.length > 1) {
      updateField('delitos', data.delitos.filter((_, i) => i !== index).map((d, i) => ({ ...d, numero: String(i + 1) })));
    }
  };

  // Medios de Prueba
  const addMedioPrueba = () => {
    updateField('mediosPrueba', [...data.mediosPrueba, { tipo: '', descripcion: '' }]);
  };
  const updateMedioPrueba = (index: number, field: keyof MedioPrueba, value: string) => {
    const arr = [...data.mediosPrueba];
    const current = arr[index];
    if (current === undefined) return;
    arr[index] = { ...current, [field]: value };
    updateField('mediosPrueba', arr);
  };
  const removeMedioPrueba = (index: number) => {
    if (data.mediosPrueba.length > 1) updateField('mediosPrueba', data.mediosPrueba.filter((_, i) => i !== index));
  };

  // Antecedentes
  const safeAntecedentes = data.antecedentes || [];
  const addAntecedente = () => {
    updateField('antecedentes', [...safeAntecedentes, { fecha: '', delito: '', tribunal: '', sentencia: '' }]);
  };
  const updateAntecedente = (index: number, field: keyof Antecedente, value: string) => {
    const arr = [...safeAntecedentes];
    const current = arr[index];
    if (current === undefined) return;
    arr[index] = { ...current, [field]: value };
    updateField('antecedentes', arr);
  };
  const removeAntecedente = (index: number) => {
    updateField('antecedentes', safeAntecedentes.filter((_, i) => i !== index));
  };

  const safeAtenuantes = data.atenuantes || [];
  const safeAgravantes = data.agravantes || [];

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

      {/* II. ACUSADO(S) */}
      <div>
        <SectionHeader number="II" title="Acusado(s)" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          {data.acusados.map((acusado, index) => (
            <div key={index} className="border border-gray-200 rounded p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Acusado {index + 1}</span>
                {data.acusados.length > 1 && (
                  <button type="button" onClick={() => removeAcusado(index)} className="text-slate-600 hover:text-slate-900 p-1 print:hidden" aria-label="Eliminar acusado">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LabeledInput label="Nombre Completo" name={`acusado-${index}-nombre`} value={acusado.nombre} onChange={(v) => updateAcusado(index, 'nombre', v)} required placeholder="Nombre y apellidos" />
                <LabeledInput label="Identificacion" name={`acusado-${index}-id`} value={acusado.identificacion} onChange={(v) => updateAcusado(index, 'identificacion', v)} placeholder="DNI / Pasaporte" />
                <LabeledInput label="Domicilio" name={`acusado-${index}-domicilio`} value={acusado.domicilio} onChange={(v) => updateAcusado(index, 'domicilio', v)} placeholder="Direccion completa" />
                <LabeledInput label="Defensor" name={`acusado-${index}-defensor`} value={acusado.defensor} onChange={(v) => updateAcusado(index, 'defensor', v)} placeholder="Nombre del abogado defensor" />
              </div>
            </div>
          ))}
          <button type="button" onClick={addAcusado} className="flex items-center gap-2 text-sm text-[#1c2537] hover:text-[#111827] font-medium print:hidden">
            <Plus className="w-4 h-4" /> Agregar acusado
          </button>
        </div>
      </div>

      {/* III. ANTECEDENTES PENALES */}
      <div>
        <SectionHeader number="III" title="Antecedentes Penales" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          {safeAntecedentes.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-[#1c2537]/60 mb-3">No se registran antecedentes penales o no se han agregado aun.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1c2537] text-white">
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Delito</th>
                    <th className="p-2 text-left">Tribunal</th>
                    <th className="p-2 text-left">Sentencia</th>
                    <th className="p-2 w-8 print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  {safeAntecedentes.map((ant, i) => (
                    <tr key={i} className="border-b border-[#8b9db5]/30">
                      <td className="p-1"><input type="date" value={ant.fecha} onChange={(e) => updateAntecedente(i, 'fecha', e.target.value)} className="w-full border border-gray-300 rounded px-1 py-1 text-xs" /></td>
                      <td className="p-1"><input type="text" value={ant.delito} onChange={(e) => updateAntecedente(i, 'delito', e.target.value)} placeholder="Delito" className="w-full border border-gray-300 rounded px-1 py-1 text-xs" /></td>
                      <td className="p-1"><input type="text" value={ant.tribunal} onChange={(e) => updateAntecedente(i, 'tribunal', e.target.value)} placeholder="Tribunal" className="w-full border border-gray-300 rounded px-1 py-1 text-xs" /></td>
                      <td className="p-1"><input type="text" value={ant.sentencia} onChange={(e) => updateAntecedente(i, 'sentencia', e.target.value)} placeholder="Sentencia" className="w-full border border-gray-300 rounded px-1 py-1 text-xs" /></td>
                      <td className="p-1 print:hidden">
                        <button type="button" onClick={() => removeAntecedente(i)} className="text-slate-600 hover:text-slate-900 p-0.5" aria-label="Eliminar">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 print:hidden">
            <button type="button" onClick={addAntecedente} className="flex items-center gap-2 text-sm text-[#1c2537] hover:text-[#111827] font-medium">
              <Plus className="w-4 h-4" /> Agregar antecedente
            </button>
          </div>
        </div>
      </div>

      {/* IV. RELACION DE HECHOS */}
      <div>
        <SectionHeader number="IV" title="Relacion de Hechos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="relacionHechos" value={data.relacionHechos} onChange={(v) => updateField('relacionHechos', v)} required rows={8} placeholder="PRIMERO: [Descripcion de los hechos]&#10;&#10;SEGUNDO: [Circunstancias de tiempo y lugar]&#10;&#10;TERCERO: [Participacion de los acusados]..." />
        </div>
      </div>

      {/* V. CALIFICACION JURIDICA (expandable) */}
      <div>
        <SectionHeader number="V" title="Calificacion Juridica" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1c2537] text-white">
                  <th className="p-2 text-left w-10">No.</th>
                  <th className="p-2 text-left">Tipificacion</th>
                  <th className="p-2 text-left">Delito</th>
                  <th className="p-2 text-left w-28">Gravedad</th>
                  <th className="p-2 w-8 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {data.delitos.map((delito, i) => (
                  <tr key={i} className="border-b border-[#8b9db5]/30">
                    <td className="p-1 text-center font-bold text-[#1c2537]">{delito.numero}</td>
                    <td className="p-1"><input type="text" value={delito.tipificacion} onChange={(e) => updateDelito(i, 'tipificacion', e.target.value)} placeholder="Art. ..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" /></td>
                    <td className="p-1"><input type="text" value={delito.delito} onChange={(e) => updateDelito(i, 'delito', e.target.value)} placeholder="Descripcion del delito" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" /></td>
                    <td className="p-1">
                      <select value={delito.gravedad} onChange={(e) => updateDelito(i, 'gravedad', e.target.value)} className="w-full border border-gray-300 rounded px-1 py-1.5 text-xs bg-white">
                        <option value="">Gravedad</option>
                        <option value="Falta">Falta</option>
                        <option value="Menos Grave">Menos Grave</option>
                        <option value="Grave">Grave</option>
                        <option value="Muy Grave">Muy Grave</option>
                      </select>
                    </td>
                    <td className="p-1 print:hidden">
                      {data.delitos.length > 1 && (
                        <button type="button" onClick={() => removeDelito(i)} className="text-slate-600 hover:text-slate-900 p-0.5" aria-label="Eliminar delito">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 print:hidden">
            <button type="button" onClick={addDelito} className="flex items-center gap-2 text-sm text-[#1c2537] hover:text-[#111827] font-medium">
              <Plus className="w-4 h-4" /> Agregar delito
            </button>
          </div>
        </div>
      </div>

      {/* VI. ATENUANTES Y AGRAVANTES */}
      <div>
        <SectionHeader number="VI" title="Circunstancias Modificativas de la Responsabilidad" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          {/* Atenuantes */}
          <div>
            <label className="text-xs font-bold text-[#006400] block mb-2 uppercase tracking-wide">Circunstancias Atenuantes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {atenuantesOptions.map((at) => (
                <label key={at} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safeAtenuantes.includes(at)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField('atenuantes', [...safeAtenuantes, at]);
                      } else {
                        updateField('atenuantes', safeAtenuantes.filter((a: string) => a !== at));
                      }
                    }}
                    className="w-3.5 h-3.5 accent-[#006400]"
                  />
                  <span className="text-xs text-[#1c2537]">{at}</span>
                </label>
              ))}
            </div>
            <LabeledTextarea label="Otros atenuantes (especificar)" name="otrosAtenuantes" value={data.otrosAtenuantes || ''} onChange={(v) => updateField('otrosAtenuantes', v)} rows={2} placeholder="Otras circunstancias atenuantes no listadas..." />
          </div>

          <div className="border-t border-[#8b9db5]/30 pt-4">
            <label className="text-xs font-bold text-[#1c2537] block mb-2 uppercase tracking-wide">Circunstancias Agravantes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {agravantesOptions.map((ag) => (
                <label key={ag} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safeAgravantes.includes(ag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField('agravantes', [...safeAgravantes, ag]);
                      } else {
                        updateField('agravantes', safeAgravantes.filter((a: string) => a !== ag));
                      }
                    }}
                    className="w-3.5 h-3.5 accent-[#1c2537]"
                  />
                  <span className="text-xs text-[#1c2537]">{ag}</span>
                </label>
              ))}
            </div>
            <LabeledTextarea label="Otros agravantes (especificar)" name="otrosAgravantes" value={data.otrosAgravantes || ''} onChange={(v) => updateField('otrosAgravantes', v)} rows={2} placeholder="Otras circunstancias agravantes no listadas..." />
          </div>
        </div>
      </div>

      {/* VII. MEDIOS DE PRUEBA */}
      <div>
        <SectionHeader number="VII" title="Medios de Prueba" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          {data.mediosPrueba.map((medio, index) => (
            <div key={index} className="flex gap-3 items-start">
              <span className="text-sm font-medium text-gray-500 pt-2 w-6">{index + 1}.</span>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={medio.tipo} onChange={(e) => updateMedioPrueba(index, 'tipo', e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c2537] focus:border-transparent bg-white">
                  <option value="">Tipo de prueba</option>
                  <option value="testigo">Testigo</option>
                  <option value="documento">Documento</option>
                  <option value="pericia">Pericia</option>
                  <option value="evidencia-fisica">Evidencia fisica</option>
                  <option value="audiovisual">Material audiovisual</option>
                  <option value="otro">Otro</option>
                </select>
                <input type="text" value={medio.descripcion} onChange={(e) => updateMedioPrueba(index, 'descripcion', e.target.value)} placeholder="Descripcion del medio de prueba" className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c2537] focus:border-transparent" />
              </div>
              {data.mediosPrueba.length > 1 && (
                <button type="button" onClick={() => removeMedioPrueba(index)} className="text-slate-600 hover:text-slate-900 p-2 print:hidden" aria-label="Eliminar medio de prueba">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addMedioPrueba} className="flex items-center gap-2 text-sm text-[#1c2537] hover:text-[#111827] font-medium print:hidden">
            <Plus className="w-4 h-4" /> Agregar medio de prueba
          </button>
        </div>
      </div>

      {/* VIII. PRUEBAS ADJUNTAS */}
      <div>
        <SectionHeader number="VIII" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection pruebas={data.pruebas} onChange={(v) => updateField('pruebas', v)} tiposPrueba={tiposPruebaAcusacion} />
        </div>
      </div>

      {/* IX. PETITORIO */}
      <div>
        <SectionHeader number="IX" title="Petitorio" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <LabeledTextarea label="" name="petitorio" value={data.petitorio} onChange={(v) => updateField('petitorio', v)} required rows={6} placeholder="Por lo expuesto, esta Fiscalia SOLICITA:&#10;&#10;1. Se condene al acusado a la pena de...&#10;2. Se mantengan las medidas cautelares de...&#10;3. Se ordene la reparacion del dano consistente en..." />
        </div>
      </div>

      {/* FIRMA */}
      <SignatureBlock
        showPlaceDate
        lugar={data.lugarFirma}
        onLugarChange={(v) => updateField('lugarFirma', v)}
        fecha={data.fechaFirma}
        onFechaChange={(v) => updateField('fechaFirma', v)}
        signatures={[
          { label: 'Fiscal Acusador', value: data.fiscalSolicitante || '[Nombre del Fiscal]' },
        ]}
        columns={1}
      />
    </div>
  );
}
