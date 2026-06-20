'use client';

import type { ActaRegistroTelefonicoFormData, RegistroObtenido } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { Plus, Trash2 } from 'lucide-react';
import { SignatureBlock } from '../SignatureBlock';

const agenciasOptions = [
  'LSPD - Los Santos Police Department',
  'LSSD - Los Santos Sheriff Department',
  'SASPS - San Andreas State Park Service',
  'FIB - Federal Investigation Bureau',
  'USMS - United States Marshal Service',
  'SANG - San Andreas National Guard',
  'USSS - United States Secret Service',
];

const tiposInformacion = [
  'Registro de llamadas entrantes/salientes',
  'Mensajes de texto (SMS/MMS)',
  'Datos de geolocalizacion',
  'Registros de datos moviles',
  'Informacion de IMEI/IMSI',
  'Historial de navegacion',
  'Aplicaciones de mensajeria',
  'Correos electronicos',
  'Contactos almacenados',
  'Fotografias y multimedia',
];

interface Props {
  data: ActaRegistroTelefonicoFormData;
  updateField: <K extends keyof ActaRegistroTelefonicoFormData>(field: K, value: ActaRegistroTelefonicoFormData[K]) => void;
}

export function ActaRegistroTelefonicoTemplate({ data, updateField }: Props) {
  const registros = data.registrosObtenidos || [];

  const addRegistro = () => {
    const n = registros.length + 1;
    updateField('registrosObtenidos', [...registros, { numero: String(n), fecha: '', hora: '', tipo: '', origen: '', destino: '', duracion: '', observaciones: '' }]);
  };

  const removeRegistro = (index: number) => {
    if (registros.length > 1) {
      updateField('registrosObtenidos', registros.filter((_, i) => i !== index).map((r, i) => ({ ...r, numero: String(i + 1) })));
    }
  };

  const updateRegistro = (index: number, field: keyof RegistroObtenido, value: string) => {
    const updated = [...registros];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    updateField('registrosObtenidos', updated);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="border-2 border-[#1c2537] p-3 bg-[#1c2537]/5">
        <p className="text-xs font-bold text-[#1c2537] text-center uppercase tracking-wide">
          Acta de Registro Telefonico - Documento Interno Post-Ejecucion
        </p>
      </div>

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
        <SectionHeader number="II" title="Orden Judicial que Autoriza" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="No. Orden Judicial" name="ordenJudicial" value={data.ordenJudicial} onChange={(v) => updateField('ordenJudicial', v)} required />
            <LabeledInput label="Fecha de la Orden" name="fechaOrden" type="date" value={data.fechaOrden} onChange={(v) => updateField('fechaOrden', v)} required />
          </div>
          <LabeledInput label="Juzgado Emisor" name="juzgadoEmisor" value={data.juzgadoEmisor} onChange={(v) => updateField('juzgadoEmisor', v)} required />
        </div>
      </div>

      {/* III. DATOS DEL TELEFONO */}
      <div>
        <SectionHeader number="III" title="Datos del Telefono Registrado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Numeros Telefonicos" name="numerosTelefonicos" value={data.numerosTelefonicos} onChange={(v) => updateField('numerosTelefonicos', v)} required placeholder="555-1234, 555-5678" />
            <LabeledInput label="Operador / Compania" name="operadorTelefono" value={data.operadorTelefono} onChange={(v) => updateField('operadorTelefono', v)} />
          </div>
          <LabeledInput label="Titular de la Linea" name="titularLinea" value={data.titularLinea} onChange={(v) => updateField('titularLinea', v)} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Periodo Desde" name="periodoDesde" type="date" value={data.periodoDesde} onChange={(v) => updateField('periodoDesde', v)} />
            <LabeledInput label="Periodo Hasta" name="periodoHasta" type="date" value={data.periodoHasta} onChange={(v) => updateField('periodoHasta', v)} />
          </div>
        </div>
      </div>

      {/* IV. TIPO DE INFORMACION OBTENIDA */}
      <div>
        <SectionHeader number="IV" title="Tipo de Informacion Obtenida" />
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
                  className="w-3.5 h-3.5 accent-[#1c2537] shrink-0"
                />
                <span className="text-xs text-[#1c2537]">{tipo}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* V. AGENCIAS PARTICIPANTES */}
      <div>
        <SectionHeader number="V" title="Agencias Participantes" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {agenciasOptions.map((ag) => (
              <label key={ag} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.agenciasParticipantes || []).includes(ag)}
                  onChange={(e) => {
                    const current = data.agenciasParticipantes || [];
                    if (e.target.checked) {
                      updateField('agenciasParticipantes', [...current, ag]);
                    } else {
                      updateField('agenciasParticipantes', current.filter((a: string) => a !== ag));
                    }
                  }}
                  className="w-3.5 h-3.5 accent-[#1c2537] shrink-0"
                />
                <span className="text-xs text-[#1c2537]">{ag}</span>
              </label>
            ))}
          </div>
          <LabeledInput label="Funcionario Responsable" name="funcionarioResponsable" value={data.funcionarioResponsable} onChange={(v) => updateField('funcionarioResponsable', v)} required placeholder="Nombre, rango y placa" />
        </div>
      </div>

      {/* VI. REGISTROS OBTENIDOS - Card layout instead of table for better fit */}
      <div>
        <SectionHeader number="VI" title="Registros Obtenidos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          {registros.map((reg, i) => (
            <div key={i} className="border border-[#1c2537]/30 p-3 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c2537]">Registro #{reg.numero}</span>
                {registros.length > 1 && (
                  <button type="button" onClick={() => removeRegistro(i)} className="text-[#1c2537] hover:text-[#111827] p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Fecha</label>
                  <input type="date" value={reg.fecha} onChange={(e) => updateRegistro(i, 'fecha', e.target.value)} className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Hora</label>
                  <input type="time" value={reg.hora} onChange={(e) => updateRegistro(i, 'hora', e.target.value)} className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Tipo</label>
                  <select value={reg.tipo} onChange={(e) => updateRegistro(i, 'tipo', e.target.value)} className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs bg-white">
                    <option value="">Seleccionar</option>
                    <option value="Llamada entrante">Llamada entrante</option>
                    <option value="Llamada saliente">Llamada saliente</option>
                    <option value="SMS entrante">SMS entrante</option>
                    <option value="SMS saliente">SMS saliente</option>
                    <option value="Datos moviles">Datos moviles</option>
                    <option value="Geolocalizacion">Geolocalizacion</option>
                    <option value="Mensaje app">Mensaje app</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Duracion</label>
                  <input type="text" value={reg.duracion} onChange={(e) => updateRegistro(i, 'duracion', e.target.value)} placeholder="00:00" className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Origen</label>
                  <input type="text" value={reg.origen} onChange={(e) => updateRegistro(i, 'origen', e.target.value)} placeholder="Numero / contacto origen" className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Destino</label>
                  <input type="text" value={reg.destino} onChange={(e) => updateRegistro(i, 'destino', e.target.value)} placeholder="Numero / contacto destino" className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-[#1c2537]/70 uppercase">Observaciones</label>
                <input type="text" value={reg.observaciones} onChange={(e) => updateRegistro(i, 'observaciones', e.target.value)} placeholder="Notas adicionales" className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs" />
              </div>
            </div>
          ))}
          <button type="button" onClick={addRegistro} className="flex items-center gap-2 px-3 py-1.5 border border-[#1c2537] text-[#1c2537] hover:bg-[#1c2537]/5 transition-colors text-xs font-bold print:hidden">
            <Plus className="w-3.5 h-3.5" /> Agregar registro
          </button>
        </div>
      </div>

      {/* VII. RESUMEN Y HALLAZGOS */}
      <div>
        <SectionHeader number="VII" title="Resumen de Hallazgos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="resumenHallazgos" value={data.resumenHallazgos} onChange={(v) => updateField('resumenHallazgos', v)} rows={6} placeholder="Resumen de los hallazgos relevantes encontrados en los registros telefonicos..." />
        </div>
      </div>

      {/* VIII. CADENA DE CUSTODIA */}
      <div>
        <SectionHeader number="VIII" title="Cadena de Custodia" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea label="" name="cadenaCustodia" value={data.cadenaCustodia} onChange={(v) => updateField('cadenaCustodia', v)} rows={4} placeholder="Descripcion de como se ha mantenido la cadena de custodia de la informacion obtenida..." />
        </div>
      </div>

      {/* IX. OBSERVACIONES */}
      <div>
        <SectionHeader number="IX" title="Observaciones" />
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
