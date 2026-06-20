'use client';

import type { CitacionFiscalFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { SignatureBlock } from '../SignatureBlock';
import { Plus, Trash2 } from 'lucide-react';

const condicionesCitado = ['Testigo', 'Imputado', 'Perito', 'Informante'];

interface CitacionFiscalTemplateProps {
  data: CitacionFiscalFormData;
  onChange: (data: CitacionFiscalFormData) => void;
}

export function CitacionFiscalTemplate({ data, onChange }: CitacionFiscalTemplateProps) {
  const updateField = <K extends keyof CitacionFiscalFormData>(field: K, value: CitacionFiscalFormData[K]) => {
    onChange(((current: CitacionFiscalFormData) => ({ ...current, [field]: value })) as unknown as CitacionFiscalFormData);
  };

  const safeDocumentos = data.documentosRequeridos || [];

  const addDocumento = () => {
    updateField('documentosRequeridos', [...safeDocumentos, { descripcion: '' }]);
  };
  const updateDocumento = (index: number, value: string) => {
    const arr = [...safeDocumentos];
    arr[index] = { descripcion: value };
    updateField('documentosRequeridos', arr);
  };
  const removeDocumento = (index: number) => {
    updateField('documentosRequeridos', safeDocumentos.filter((_, i) => i !== index));
  };

  const condicion = data.condicionCitado || '_______________';
  const expediente = data.numeroExpediente || 'SADOJ-____-_____';

  return (
    <div className="space-y-4">

      {/* Datos del expediente y fiscal */}
      <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput
            label="Número de Expediente"
            name="numeroExpediente"
            value={data.numeroExpediente}
            onChange={(v) => updateField('numeroExpediente', v)}
            placeholder="SADOJ-2024-0001"
            required
          />
          <LabeledInput
            label="Fecha de Emisión"
            name="fechaEmision"
            type="date"
            value={data.fechaEmision}
            onChange={(v) => updateField('fechaEmision', v)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput
            label="Fiscal a Cargo"
            name="nombreFiscal"
            value={data.nombreFiscal}
            onChange={(v) => updateField('nombreFiscal', v)}
            placeholder="Nombre completo del fiscal"
            required
          />
          <LabeledInput
            label="Cargo del Fiscal"
            name="cargoFiscal"
            value={data.cargoFiscal}
            onChange={(v) => updateField('cargoFiscal', v)}
            placeholder="Fiscal Instructor / Fiscal Jefe..."
            required
          />
        </div>
      </div>

      {/* I. AUTORIDAD EMISORA */}
      <div>
        <SectionHeader number="I" title="Autoridad Emisora" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-2">
          <p className="text-sm text-gray-800 leading-relaxed">
            El <strong>Departamento de Justicia del Estado de San Andreas (SADOJ)</strong>, a través
            del Ministerio Fiscal y en virtud de las facultades conferidas por el{' '}
            <strong>Art. 28 de la Constitución del Estado de San Andreas</strong>, que otorga al
            Ministerio Fiscal la potestad de dirigir la investigación penal, practicar diligencias y
            citar a toda persona cuya comparecencia resulte necesaria para el esclarecimiento de los
            hechos objeto de investigación,
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">
            <strong>EMITE</strong> la presente Citación Fiscal, con plena validez legal en el
            territorio del Estado de San Andreas, en el marco del expediente número{' '}
            <span className="font-semibold text-[#1c2537]">{expediente}</span>.
          </p>
        </div>
      </div>

      {/* II. CITADO */}
      <div>
        <SectionHeader number="II" title="Citado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Nombre Completo del Citado"
              name="nombreCitado"
              value={data.nombreCitado}
              onChange={(v) => updateField('nombreCitado', v)}
              placeholder="Nombre y apellidos completos"
              required
            />
            <LabeledInput
              label="Número de Identificación"
              name="identificacionCitado"
              value={data.identificacionCitado}
              onChange={(v) => updateField('identificacionCitado', v)}
              placeholder="DNI / Pasaporte / ID"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Cargo / Institución (opcional)"
              name="cargoInstitucionCitado"
              value={data.cargoInstitucionCitado}
              onChange={(v) => updateField('cargoInstitucionCitado', v)}
              placeholder="Si aplica"
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="condicionCitado" className="text-xs font-bold text-[#1c2537]">
                Condición del Citado <span className="text-[#1c2537]">*</span>
              </label>
              <select
                id="condicionCitado"
                value={data.condicionCitado}
                onChange={(e) => updateField('condicionCitado', e.target.value)}
                className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:border-[#1c2537] print:hidden"
              >
                <option value="">Seleccionar condición...</option>
                {condicionesCitado.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="print-companion hidden print:block w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm">
                {data.condicionCitado || ' '}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* III. OBJETO DE LA CITACIÓN */}
      <div>
        <SectionHeader number="III" title="Objeto de la Citación" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <p className="text-sm text-gray-800 print:hidden">
            <span className="font-semibold text-[#1c2537]">Condición procesal:</span>{' '}
            <span className={data.condicionCitado ? 'font-bold text-[#1c2537]' : 'text-gray-400 italic'}>
              {data.condicionCitado || '(seleccione condición en el apartado II)'}
            </span>
          </p>
          <div className="hidden print:block text-sm text-gray-800">
            <span className="font-semibold">Condición procesal: </span>
            <strong>{condicion}</strong>
          </div>
          <LabeledTextarea
            label="Descripción del Hecho Investigado"
            name="descripcionHecho"
            value={data.descripcionHecho}
            onChange={(v) => updateField('descripcionHecho', v)}
            required
            rows={5}
            placeholder="Describa los hechos objeto de investigación que motivan la presente citación..."
          />
        </div>
      </div>

      {/* IV. FECHA, HORA Y LUGAR DE COMPARECENCIA */}
      <div>
        <SectionHeader number="IV" title="Fecha, Hora y Lugar de Comparecencia" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledInput
              label="Fecha de Comparecencia"
              name="fechaComparecencia"
              type="date"
              value={data.fechaComparecencia}
              onChange={(v) => updateField('fechaComparecencia', v)}
              required
            />
            <LabeledInput
              label="Hora"
              name="horaComparecencia"
              type="time"
              value={data.horaComparecencia}
              onChange={(v) => updateField('horaComparecencia', v)}
              required
            />
            <LabeledInput
              label="Lugar"
              name="lugarComparecencia"
              value={data.lugarComparecencia}
              onChange={(v) => updateField('lugarComparecencia', v)}
              placeholder="Sede del SADOJ, sala..."
              required
            />
          </div>
          <div className="mt-1 p-3 border-l-4 border-[#1c2537] bg-[#f5f5dc]/30">
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong className="text-[#1c2537]">AVISO:</strong> La inasistencia injustificada a la
              presente citación será considerada <strong>obstrucción a la justicia</strong>, conforme
              a la legislación procesal del Estado de San Andreas, y facultará al Ministerio Fiscal
              para adoptar las medidas coercitivas correspondientes ante la Corte de Los Santos.
            </p>
          </div>
        </div>
      </div>

      {/* V. DOCUMENTACIÓN REQUERIDA */}
      <div>
        <SectionHeader number="V" title="Documentación Requerida" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-2">
          {safeDocumentos.length === 0 ? (
            <>
              <p className="text-xs text-[#1c2537]/60 italic print:hidden">
                No se ha especificado documentación requerida. Use el botón para añadir documentos.
              </p>
              <p className="hidden print:block text-sm text-gray-500 italic">
                Ninguna documentación adicional requerida.
              </p>
            </>
          ) : (
            <ul className="space-y-2">
              {safeDocumentos.map((doc, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sm font-bold text-[#1c2537] w-6 flex-shrink-0 pt-1.5">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={doc.descripcion}
                      onChange={(e) => updateDocumento(i, e.target.value)}
                      placeholder="Descripción del documento requerido"
                      className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537] print:hidden"
                    />
                    <div className="print-companion hidden print:block w-full text-sm px-2 py-1 border-b border-gray-300">
                      {doc.descripcion || ' '}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocumento(i)}
                    className="text-slate-600 hover:text-slate-900 p-1 print:hidden flex-shrink-0"
                    aria-label="Eliminar documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={addDocumento}
            className="flex items-center gap-2 text-sm text-[#1c2537] hover:text-[#111827] font-medium print:hidden"
          >
            <Plus className="w-4 h-4" /> Añadir documento requerido
          </button>
        </div>
      </div>

      {/* VI. DERECHOS DEL CITADO */}
      <div>
        <SectionHeader number="VI" title="Derechos del Citado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-2">
          <p className="text-sm text-gray-800 leading-relaxed">
            En virtud del <strong>Art. 19 de la Constitución del Estado de San Andreas</strong>,
            se informa al citado de los siguientes derechos:
          </p>
          <ul className="space-y-1.5 ml-2">
            <li className="text-sm text-gray-800 flex gap-2">
              <span className="font-bold text-[#8b9db5] flex-shrink-0">—</span>
              <span>
                <strong>Derecho a letrado:</strong> el citado tiene derecho a estar asistido por un
                abogado defensor de su elección durante la comparecencia.
              </span>
            </li>
            <li className="text-sm text-gray-800 flex gap-2">
              <span className="font-bold text-[#8b9db5] flex-shrink-0">—</span>
              <span>
                <strong>Derecho al silencio:</strong> el citado no está obligado a declarar contra
                sí mismo ni a confesarse culpable de los hechos que se le atribuyan.
              </span>
            </li>
            <li className="text-sm text-gray-800 flex gap-2">
              <span className="font-bold text-[#8b9db5] flex-shrink-0">—</span>
              <span>
                <strong>Derecho a no autoincriminarse:</strong> ninguna declaración efectuada bajo
                coacción o presión tendrá validez procesal.
              </span>
            </li>
          </ul>
          <p className="text-sm text-gray-700 italic mt-1">
            La titularidad de estos derechos <strong>no exime al citado de la obligación de
            comparecer</strong> en la fecha, hora y lugar indicados en la presente citación.
          </p>
        </div>
      </div>

      {/* VII. ADVERTENCIA LEGAL */}
      <div>
        <SectionHeader number="VII" title="Advertencia Legal" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-2">
          <p className="text-sm text-gray-800 leading-relaxed">
            El incumplimiento de la presente citación sin causa justificada debidamente acreditada
            faculta al Ministerio Fiscal para:
          </p>
          <ul className="space-y-1.5 ml-2">
            <li className="text-sm text-gray-800 flex gap-2">
              <span className="font-bold text-[#8b9db5] flex-shrink-0">—</span>
              <span>
                Solicitar <strong>medidas coercitivas</strong> ante la Corte de Los Santos,
                incluyendo la conducción forzosa del citado mediante mandamiento judicial.
              </span>
            </li>
            <li className="text-sm text-gray-800 flex gap-2">
              <span className="font-bold text-[#8b9db5] flex-shrink-0">—</span>
              <span>
                Iniciar <strong>actuaciones por desacato</strong> al mandato fiscal, conforme al
                ordenamiento jurídico procesal vigente del Estado de San Andreas.
              </span>
            </li>
            <li className="text-sm text-gray-800 flex gap-2">
              <span className="font-bold text-[#8b9db5] flex-shrink-0">—</span>
              <span>
                Considerar la inasistencia como <strong>indicio en el marco de la
                investigación</strong>, a efectos de valoración probatoria ante el tribunal
                competente.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Firma */}
      <SignatureBlock
        showPlaceDate
        lugar={data.lugarFirma}
        onLugarChange={(v) => updateField('lugarFirma', v)}
        fecha={data.fechaFirma}
        onFechaChange={(v) => updateField('fechaFirma', v)}
        signatures={[
          {
            label: data.cargoFiscal || 'Fiscal a Cargo',
            value: data.nombreFiscal || '[Nombre del Fiscal]',
          },
        ]}
        columns={1}
      />

      {/* Pie institucional */}
      <div className="text-center pt-2 border-t border-[#8b9db5]/40">
        <p className="text-xs font-bold text-[#1c2537] uppercase tracking-widest">
          Departamento de Justicia — Fiscalía del Estado de San Andreas
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {expediente} &middot; {data.fechaEmision || '____-__-__'}
        </p>
      </div>
    </div>
  );
}
