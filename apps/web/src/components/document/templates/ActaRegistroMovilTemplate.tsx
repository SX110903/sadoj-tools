'use client';

import type { ActaRegistroMovilFormData, PersonaAfectada, ObjetoIncautado } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { Plus, Trash2 } from 'lucide-react';
import { SignatureBlock } from '../SignatureBlock';

interface ActaRegistroMovilTemplateProps {
  data: ActaRegistroMovilFormData;
  updateField: <K extends keyof ActaRegistroMovilFormData>(field: K, value: ActaRegistroMovilFormData[K]) => void;
}

const agenciasOptions = [
  'LSPD - Los Santos Police Department',
  'LSSD - Los Santos Sheriff Department',
  'SASPS - San Andreas State Park Service',
  'FIB - Federal Investigation Bureau',
  'USMS - United States Marshal Service',
  'SANG - San Andreas National Guard',
  'USSS - United States Secret Service',
];

export function ActaRegistroMovilTemplate({ data, updateField }: ActaRegistroMovilTemplateProps) {
  const handleAddPersona = () => {
    updateField('personasRegistradas', [...data.personasRegistradas, { nombre: '', identificacion: '', relacion: '', observaciones: '' }]);
  };

  const handleRemovePersona = (index: number) => {
    updateField('personasRegistradas', data.personasRegistradas.filter((_, i) => i !== index));
  };

  const handlePersonaChange = (index: number, field: keyof PersonaAfectada, value: string) => {
    const updated = [...data.personasRegistradas];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    updateField('personasRegistradas', updated);
  };

  const handleAddObjeto = () => {
    const newNum = (data.objetosIncautados.length + 1).toString();
    updateField('objetosIncautados', [...data.objetosIncautados, { numero: newNum, descripcion: '', cantidad: '', ubicacionEncontrada: '', estado: '' }]);
  };

  const handleRemoveObjeto = (index: number) => {
    updateField('objetosIncautados', data.objetosIncautados.filter((_, i) => i !== index));
  };

  const handleObjetoChange = (index: number, field: keyof ObjetoIncautado, value: string) => {
    const updated = [...data.objetosIncautados];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    updateField('objetosIncautados', updated);
  };

  const handleAgenciaChange = (agencia: string, checked: boolean) => {
    if (checked) {
      updateField('agenciasParticipantes', [...data.agenciasParticipantes, agencia]);
    } else {
      updateField('agenciasParticipantes', data.agenciasParticipantes.filter(a => a !== agencia));
    }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado del Acta */}
      <div className="border-2 border-[#1c2537] p-3 bg-[#1c2537]/5">
        <p className="text-xs font-bold text-[#1c2537] text-center uppercase tracking-wide">
          Acta de Registro Móvil / Vehicular - Documento Interno
        </p>
      </div>

      {/* I. DATOS GENERALES */}
      <div>
        <SectionHeader number="I" title="Datos Generales" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <LabeledInput
              label="Hora"
              name="hora"
              type="time"
              value={data.hora}
              onChange={(v) => updateField('hora', v)}
              required
            />
          </div>
          <LabeledInput
            label="Ubicación"
            name="ubicacion"
            value={data.ubicacion}
            onChange={(v) => updateField('ubicacion', v)}
            required
          />
          <LabeledInput
            label="Motivo del Registro"
            name="motivoRegistro"
            value={data.motivoRegistro}
            onChange={(v) => updateField('motivoRegistro', v)}
          />
        </div>
      </div>

      {/* II. DATOS DEL VEHÍCULO */}
      <div>
        <SectionHeader number="II" title="Datos del Vehículo" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledInput
              label="Tipo de Vehículo"
              name="tipoVehiculo"
              value={data.tipoVehiculo}
              onChange={(v) => updateField('tipoVehiculo', v)}
            />
            <LabeledInput
              label="Placas"
              name="placas"
              value={data.placas}
              onChange={(v) => updateField('placas', v)}
            />
            <LabeledInput
              label="Color"
              name="color"
              value={data.color}
              onChange={(v) => updateField('color', v)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Marca"
              name="marca"
              value={data.marca}
              onChange={(v) => updateField('marca', v)}
            />
            <LabeledInput
              label="Modelo"
              name="modelo"
              value={data.modelo}
              onChange={(v) => updateField('modelo', v)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Propietario del Vehículo"
              name="propietarioVehiculo"
              value={data.propietarioVehiculo}
              onChange={(v) => updateField('propietarioVehiculo', v)}
            />
            <LabeledInput
              label="Conductor / Identificación"
              name="conductorIdentificacion"
              value={data.conductorIdentificacion}
              onChange={(v) => updateField('conductorIdentificacion', v)}
            />
          </div>
        </div>
      </div>

      {/* III. AGENCIAS PARTICIPANTES */}
      <div>
        <SectionHeader number="III" title="Agencias Participantes" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {agenciasOptions.map((agencia) => (
              <label key={agencia} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.agenciasParticipantes.includes(agencia)}
                  onChange={(e) => handleAgenciaChange(agencia, e.target.checked)}
                  className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">{agencia}</span>
              </label>
            ))}
          </div>
          <LabeledTextarea
            label="Funcionarios Participantes"
            name="funcionariosParticipantes"
            value={data.funcionariosParticipantes}
            onChange={(v) => updateField('funcionariosParticipantes', v)}
            rows={3}
            placeholder="Nombre, placa y agencia de cada funcionario participante..."
          />
        </div>
      </div>

      {/* IV. PERSONAS REGISTRADAS */}
      <div>
        <SectionHeader number="IV" title="Personas Registradas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          {data.personasRegistradas.map((persona, index) => (
            <div key={index} className="border border-[#1c2537]/30 p-3 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c2537]">Persona #{index + 1}</span>
                {data.personasRegistradas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePersona(index)}
                    className="print:hidden text-[#1c2537] hover:text-[#111827] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={persona.nombre}
                  onChange={(e) => handlePersonaChange(index, 'nombre', e.target.value)}
                  placeholder="Nombre completo"
                  className="border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537]"
                />
                <input
                  type="text"
                  value={persona.identificacion}
                  onChange={(e) => handlePersonaChange(index, 'identificacion', e.target.value)}
                  placeholder="Identificación"
                  className="border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537]"
                />
                <input
                  type="text"
                  value={persona.relacion}
                  onChange={(e) => handlePersonaChange(index, 'relacion', e.target.value)}
                  placeholder="Relación (conductor, pasajero, etc.)"
                  className="border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537]"
                />
                <input
                  type="text"
                  value={persona.observaciones}
                  onChange={(e) => handlePersonaChange(index, 'observaciones', e.target.value)}
                  placeholder="Observaciones"
                  className="border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537]"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPersona}
            className="print:hidden flex items-center gap-2 px-3 py-1.5 border border-[#1c2537] text-[#1c2537] hover:bg-[#1c2537]/5 transition-colors text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Persona
          </button>
        </div>
      </div>

      {/* V. OBJETOS INCAUTADOS */}
      <div>
        <SectionHeader number="V" title="Objetos Incautados" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#1c2537] text-white">
                <th className="border border-[#1c2537] px-2 py-2 text-center font-bold w-10">N°</th>
                <th className="border border-[#1c2537] px-2 py-2 text-center font-bold">DESCRIPCIÓN</th>
                <th className="border border-[#1c2537] px-2 py-2 text-center font-bold w-20">CANTIDAD</th>
                <th className="border border-[#1c2537] px-2 py-2 text-center font-bold">UBICACIÓN</th>
                <th className="border border-[#1c2537] px-2 py-2 text-center font-bold w-24">ESTADO</th>
                <th className="print:hidden border border-[#1c2537] px-2 py-2 text-center font-bold w-10"></th>
              </tr>
            </thead>
            <tbody>
              {data.objetosIncautados.map((objeto, index) => (
                <tr key={index}>
                  <td className="border border-[#1c2537]/30 px-2 py-1 text-center font-bold text-[#1c2537] bg-[#f5f5dc]/30">
                    {index + 1}
                  </td>
                  <td className="border border-[#1c2537]/30 p-0 bg-white">
                    <input
                      type="text"
                      value={objeto.descripcion}
                      onChange={(e) => handleObjetoChange(index, 'descripcion', e.target.value)}
                      className="w-full px-2 py-1.5 border-0 text-xs text-[#1c2537]"
                    />
                  </td>
                  <td className="border border-[#1c2537]/30 p-0 bg-white">
                    <input
                      type="text"
                      value={objeto.cantidad}
                      onChange={(e) => handleObjetoChange(index, 'cantidad', e.target.value)}
                      className="w-full px-2 py-1.5 border-0 text-xs text-[#1c2537] text-center"
                    />
                  </td>
                  <td className="border border-[#1c2537]/30 p-0 bg-white">
                    <input
                      type="text"
                      value={objeto.ubicacionEncontrada}
                      onChange={(e) => handleObjetoChange(index, 'ubicacionEncontrada', e.target.value)}
                      className="w-full px-2 py-1.5 border-0 text-xs text-[#1c2537]"
                    />
                  </td>
                  <td className="border border-[#1c2537]/30 p-0 bg-white">
                    <input
                      type="text"
                      value={objeto.estado}
                      onChange={(e) => handleObjetoChange(index, 'estado', e.target.value)}
                      className="w-full px-2 py-1.5 border-0 text-xs text-[#1c2537]"
                    />
                  </td>
                  <td className="print:hidden border border-[#1c2537]/30 p-1 bg-white text-center">
                    {data.objetosIncautados.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObjeto(index)}
                        className="text-[#1c2537] hover:text-[#111827]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print:hidden p-3">
            <button
              type="button"
              onClick={handleAddObjeto}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#1c2537] text-[#1c2537] hover:bg-[#1c2537]/5 transition-colors text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Objeto
            </button>
          </div>
        </div>
      </div>

      {/* VI. DESCRIPCIÓN DEL PROCEDIMIENTO */}
      <div>
        <SectionHeader number="VI" title="Descripción del Procedimiento" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="descripcionProcedimiento"
            value={data.descripcionProcedimiento}
            onChange={(v) => updateField('descripcionProcedimiento', v)}
            rows={6}
            placeholder="Describa detalladamente cómo se desarrolló el registro, desde la detención del vehículo hasta la finalización..."
          />
        </div>
      </div>

      {/* VII. OBSERVACIONES */}
      <div>
        <SectionHeader number="VII" title="Observaciones" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="observaciones"
            value={data.observaciones}
            onChange={(v) => updateField('observaciones', v)}
            rows={4}
            placeholder="Observaciones adicionales, incidencias, actitud de las personas, etc."
          />
        </div>
      </div>

      {/* VIII. FIRMAS */}
      <div>
        <SectionHeader number="VIII" title="Cierre y Firmas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Funcionario Responsable"
              name="firmaResponsable"
              value={data.firmaResponsable}
              onChange={(v) => updateField('firmaResponsable', v)}
            />
            <LabeledInput
              label="Testigos"
              name="testigos"
              value={data.testigos}
              onChange={(v) => updateField('testigos', v)}
            />
          </div>
        </div>
      </div>

      <SignatureBlock
        signatures={[
          { label: 'Funcionario Responsable', value: data.firmaResponsable || undefined },
          { label: 'Conductor / Propietario' },
          { label: 'Testigo' },
        ]}
        columns={3}
      />
    </div>
  );
}
