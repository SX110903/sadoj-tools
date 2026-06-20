'use client';

import type { InterrogatorioFormData } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { CheckboxGroup } from '../CheckboxGroup';
import { DelitosTable } from '../DelitosTable';
import { ResolucionJudicial } from '../ResolucionJudicial';
import { FundamentoLegal } from '../FundamentoLegal';
import { PruebasSection } from '../PruebasSection';
import { SignatureBlock } from '../SignatureBlock';

const tiposPruebaInterrogatorio = [
  'Video de interrogatorio',
  'Audio de interrogatorio',
  'Fotografías',
  'Documentos',
  'Informe policial',
  'Evidencia digital',
];

interface InterrogatorioTemplateProps {
  data: InterrogatorioFormData;
  onChange: (data: InterrogatorioFormData) => void;
}

const condicionProcesalOptions = [
  { value: 'imputado', label: 'Imputado' },
  { value: 'testigo', label: 'Testigo' },
  { value: 'investigado', label: 'Investigado' },
];

const situacionActualOptions = [
  { value: 'libertad', label: 'En libertad' },
  { value: 'detenido', label: 'Detenido' },
  { value: 'prision-preventiva', label: 'Prisión preventiva' },
  { value: 'custodia-policial', label: 'Custodia policial' },
];

const condicionesOptions = [
  { value: 'abogado-defensor', label: 'Presencia de abogado defensor (obligatorio para imputados)' },
  { value: 'grabacion-audiovisual', label: 'Grabación audiovisual del interrogatorio' },
  { value: 'interprete', label: 'Presencia de intérprete – Idioma:', hasInput: true, inputPlaceholder: 'Especifique idioma' },
  { value: 'dependencias-policiales', label: 'Interrogatorio en dependencias policiales' },
  { value: 'sede-judicial', label: 'Interrogatorio en sede judicial' },
  { value: 'otra-condicion', label: 'Otra condición:', hasInput: true, inputPlaceholder: 'Especifique' },
];

export function InterrogatorioTemplate({ data, onChange }: InterrogatorioTemplateProps) {
  const updateField = <K extends keyof InterrogatorioFormData>(
    field: K,
    value: InterrogatorioFormData[K]
  ) => {
    onChange(((current: InterrogatorioFormData) => ({ ...current, [field]: value })) as unknown as InterrogatorioFormData);
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

      {/* II. PERSONA A INTERROGAR */}
      <div>
        <SectionHeader number="II" title="Persona a Interrogar" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledInput
            label="Nombre Completo"
            name="nombreCompleto"
            value={data.nombreCompleto}
            onChange={(v) => updateField('nombreCompleto', v)}
            required
            placeholder=""
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              label="Fecha Nacimiento"
              name="fechaNacimiento"
              type="date"
              value={data.fechaNacimiento}
              onChange={(v) => updateField('fechaNacimiento', v)}
            />
            <LabeledInput
              label="Domicilio"
              name="domicilio"
              value={data.domicilio}
              onChange={(v) => updateField('domicilio', v)}
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1c2537] mb-2 block">Condición Procesal:</label>
              <CheckboxGroup
                options={condicionProcesalOptions}
                selectedValues={data.condicionProcesal}
                onChange={(v) => updateField('condicionProcesal', v)}
                columns={3}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1c2537] mb-2 block">Situación Actual:</label>
              <CheckboxGroup
                options={situacionActualOptions}
                selectedValues={data.situacionActual}
                onChange={(v) => updateField('situacionActual', v)}
                columns={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* III. DELITOS BAJO INVESTIGACIÓN */}
      <div>
        <SectionHeader number="III" title="Delitos Bajo Investigación" />
        <div className="bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <DelitosTable
            delitos={data.delitos}
            onChange={(v) => updateField('delitos', v)}
          />
        </div>
      </div>

      {/* IV. JUSTIFICACIÓN DEL INTERROGATORIO */}
      <div>
        <SectionHeader number="IV" title="Justificación del Interrogatorio" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="justificacion"
            value={data.justificacion}
            onChange={(v) => updateField('justificacion', v)}
            required
            rows={6}
            placeholder="Exponga los motivos que justifican la necesidad del interrogatorio, indicando la relación del interrogado con los hechos investigados y la información que se espera obtener..."
          />
        </div>
      </div>

      {/* V. TEMAS PRINCIPALES A ABORDAR */}
      <div>
        <SectionHeader number="V" title="Temas Principales a Abordar" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <LabeledTextarea
            label=""
            name="temasAbordar"
            value={data.temasAbordar}
            onChange={(v) => updateField('temasAbordar', v)}
            rows={4}
            placeholder="1. Circunstancias de tiempo y lugar de los hechos&#10;2. Relación con otros implicados&#10;3. ..."
          />
        </div>
      </div>

      {/* VI. CONDICIONES SOLICITADAS */}
      <div>
        <SectionHeader number="VI" title="Condiciones Solicitadas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <CheckboxGroup
            options={condicionesOptions}
            selectedValues={data.condiciones}
            onChange={(v) => updateField('condiciones', v)}
            inputValues={{
              interprete: data.idiomaInterprete,
              'otra-condicion': data.otraCondicion,
            }}
            onInputChange={(key, value) => {
              if (key === 'interprete') updateField('idiomaInterprete', value);
              if (key === 'otra-condicion') updateField('otraCondicion', value);
            }}
            columns={1}
          />
        </div>
      </div>

      {/* VII. PRUEBAS Y EVIDENCIAS */}
      <div>
        <SectionHeader number="VII" title="Pruebas y Evidencias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30">
          <PruebasSection
            pruebas={data.pruebas}
            onChange={(v) => updateField('pruebas', v)}
            tiposPrueba={tiposPruebaInterrogatorio}
          />
        </div>
      </div>

      {/* VIII. SOLICITUD */}
      <div>
        <SectionHeader number="VIII" title="Solicitud" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          <p className="text-sm text-[#1c2537] leading-relaxed">
            Por lo anteriormente expuesto, esta Fiscalía <strong>SOLICITA</strong> al Tribunal competente 
            que se <strong>AUTORICE</strong> la práctica del interrogatorio de la persona arriba identificada, 
            bajo las condiciones señaladas, con el objeto de esclarecer los hechos objeto de la investigación 
            penal en curso.
          </p>
          <p className="text-sm text-[#1c2537] leading-relaxed">
            Es justicia que pido en{' '}
            <input
              type="text"
              value={data.lugarFirma}
              onChange={(e) => updateField('lugarFirma', e.target.value)}
              className="border-b border-[#1c2537] bg-transparent px-2 py-1 w-40 text-center text-[#1c2537]"
              placeholder="Ciudad"
            />
            , a{' '}
            <input
              type="date"
              value={data.fechaFirma}
              onChange={(e) => updateField('fechaFirma', e.target.value)}
              className="border-b border-[#1c2537] bg-transparent px-2 py-1 text-[#1c2537]"
            />
          </p>
        </div>
      </div>

      {/* FIRMA */}
      <SignatureBlock
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
        fecha={data.fechaInterrogatorio}
        fechaName="fechaInterrogatorio"
        onFechaChange={(v) => updateField('fechaInterrogatorio', v)}
        hora={data.horaInterrogatorio}
        horaName="horaInterrogatorio"
        onHoraChange={(v) => updateField('horaInterrogatorio', v)}
        lugar={data.lugarInterrogatorio}
        lugarName="lugarInterrogatorio"
        onLugarChange={(v) => updateField('lugarInterrogatorio', v)}
      />
    </div>
  );
}
