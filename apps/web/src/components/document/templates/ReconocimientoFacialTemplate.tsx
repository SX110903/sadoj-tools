'use client';

import type { ReconocimientoFacialFormData, FotoAdjunta } from '../../../types/documents';
import { SectionHeader } from '../SectionHeader';
import { LabeledInput } from '../LabeledInput';
import { LabeledTextarea } from '../LabeledTextarea';
import { FundamentoLegal } from '../FundamentoLegal';
import { SignatureBlock } from '../SignatureBlock';
import { Trash2, ImageIcon, ShieldAlert } from 'lucide-react';
import { FileDropzone } from '../../files/FileDropzone';

const agenciasLEA = [
  'LSPD — Los Santos Police Department',
  'LSSD — Los Santos Sheriff Department',
  'FIB — Federal Investigation Bureau',
  'IAA — International Affairs Agency',
  'SASP — San Andreas State Police',
  'BCSO — Blaine County Sheriff Office',
  'USMS — US Marshal Service',
  'Otra agencia',
];

const tiposReconocimiento = [
  'Busqueda en base de datos biometrica',
  'Comparacion con testigos / victimas',
  'Cotejo con registro de detenidos',
  'Identificacion por camara de vigilancia',
  'Cotejo con fichero policial existente',
  'Reconocimiento en rueda de sospechosos',
  'Analisis pericial de imagen',
];

const basesDatosDisponibles = [
  'NCIC — National Crime Information Center',
  'Registro de Arrestados (LSPD/LSSD)',
  'Sistema Biometrico Estatal (SBS)',
  'Registro de Huellas Dactilares (AFIS)',
  'Base de Datos FIB — Personas Fichadas',
  'Registro de Conducir (DMV)',
  'Registro Penitenciario Estatal',
];

const nivelesClasificacion = [
  'USO INTERNO — Solo personal autorizado',
  'CONFIDENCIAL — Acceso restringido',
  'RESERVADO — Mando superior unicamente',
];

interface ReconocimientoFacialTemplateProps {
  data: ReconocimientoFacialFormData;
  onChange: (data: ReconocimientoFacialFormData) => void;
}

export function ReconocimientoFacialTemplate({ data, onChange }: ReconocimientoFacialTemplateProps) {
  const updateField = <K extends keyof ReconocimientoFacialFormData>(
    field: K,
    value: ReconocimientoFacialFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  // --- Checkbox helpers ---
  const toggleCheck = (field: 'tipoReconocimiento' | 'basesDatos', value: string) => {
    const arr: string[] = data[field] as string[];
    if (arr.includes(value)) {
      updateField(field, arr.filter((v) => v !== value) as ReconocimientoFacialFormData[typeof field]);
    } else {
      updateField(field, [...arr, value] as ReconocimientoFacialFormData[typeof field]);
    }
  };

  // --- Foto upload ---
  const handleFilesSelected = (files: File[]) => {
    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : null;
        if (dataUrl === null) return;
        const nuevaFoto: FotoAdjunta = {
          id: `foto-${Date.now()}-${index}`,
          nombre: file.name,
          dataUrl,
          descripcion: '',
          tipo: 'frontal',
        };
        updateField('fotos', [...(data.fotos || []), nuevaFoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  const updateFoto = (id: string, field: keyof FotoAdjunta, value: string) => {
    updateField(
      'fotos',
      (data.fotos || []).map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const removeFoto = (id: string) => {
    updateField('fotos', (data.fotos || []).filter((f) => f.id !== id));
  };

  const fotos = data.fotos || [];
  const tiposReconocimientoSel = data.tipoReconocimiento || [];
  const basesDatosSel = data.basesDatos || [];

  return (
    <div className="space-y-4">
      {/* Aviso interno */}
      <div className="flex items-start gap-3 p-3 bg-[#1c2537]/5 border-l-4 border-[#1c2537] rounded">
        <ShieldAlert className="w-4 h-4 text-[#1c2537] mt-0.5 shrink-0" />
        <p className="text-xs text-[#1c2537] font-medium">
          DOCUMENTO DE USO INTERNO — Solicitud confidencial dirigida a Agencia de Aplicacion de la Ley (LEA).
          La informacion contenida esta protegida bajo el Art. 28 de la Constitucion de San Andreas.
        </p>
      </div>

      <FundamentoLegal texto={data.fundamentoLegal} onChange={(v) => updateField('fundamentoLegal', v)} />

      {/* I. DATOS DEL PROCESO */}
      <div>
        <SectionHeader number="I" title="Datos del Proceso" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Numero de Causa" name="numeroCausa" value={data.numeroCausa} onChange={(v) => updateField('numeroCausa', v)} required />
            <LabeledInput label="Fecha de Solicitud" name="fecha" type="date" value={data.fecha} onChange={(v) => updateField('fecha', v)} required />
          </div>
          <LabeledInput label="Fiscal Solicitante" name="fiscalSolicitante" value={data.fiscalSolicitante} onChange={(v) => updateField('fiscalSolicitante', v)} required />
          <LabeledInput label="Tribunal / Referencia Judicial" name="tribunalDestinatario" value={data.tribunalDestinatario} onChange={(v) => updateField('tribunalDestinatario', v)} />
        </div>
      </div>

      {/* II. AGENCIA LEA DESTINATARIA */}
      <div>
        <SectionHeader number="II" title="Agencia LEA Destinataria" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div>
            <label className="text-xs font-bold text-[#1c2537] uppercase tracking-wide block mb-2">
              Agencia Receptora <span className="text-[#1c2537]">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {agenciasLEA.map((ag) => (
                <label key={ag} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[#1c2537]/5">
                  <input
                    type="radio"
                    name="agenciaDestinataria"
                    value={ag}
                    checked={data.agenciaDestinataria === ag}
                    onChange={() => updateField('agenciaDestinataria', ag)}
                    className="accent-[#1c2537]"
                  />
                  <span className="text-xs text-[#1c2537]">{ag}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <LabeledInput label="Unidad Especializada" name="unidadEspecializada" value={data.unidadEspecializada} onChange={(v) => updateField('unidadEspecializada', v)} placeholder="Ej: Unidad de Analisis Criminal" />
            <LabeledInput label="Oficial / Agente Receptor" name="oficialReceptor" value={data.oficialReceptor} onChange={(v) => updateField('oficialReceptor', v)} placeholder="Nombre del oficial de contacto" />
          </div>
        </div>
      </div>

      {/* III. DESCRIPCION DEL SUJETO */}
      <div>
        <SectionHeader number="III" title="Descripcion del Sujeto a Identificar" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput label="Nombre (si es conocido)" name="nombreConocido" value={data.nombreConocido} onChange={(v) => updateField('nombreConocido', v)} placeholder="Nombre completo o parcial" />
            <LabeledInput label="Alias / Apodo" name="aliasApodo" value={data.aliasApodo} onChange={(v) => updateField('aliasApodo', v)} placeholder="Nombre de calle, alias conocido" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LabeledInput label="Edad Aprox." name="edadAproximada" value={data.edadAproximada} onChange={(v) => updateField('edadAproximada', v)} placeholder="Ej: 25-35" />
            <div>
              <label className="text-xs font-bold text-[#1c2537] block mb-1">Sexo</label>
              <select
                value={data.sexo}
                onChange={(e) => updateField('sexo', e.target.value)}
                className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="No determinado">No determinado</option>
              </select>
            </div>
            <LabeledInput label="Estatura" name="estatura" value={data.estatura} onChange={(v) => updateField('estatura', v)} placeholder="Ej: 1.75m" />
            <div>
              <label className="text-xs font-bold text-[#1c2537] block mb-1">Complexion</label>
              <select
                value={data.complexion}
                onChange={(e) => updateField('complexion', e.target.value)}
                className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
              >
                <option value="">Seleccionar</option>
                <option value="Delgada">Delgada</option>
                <option value="Media">Media</option>
                <option value="Robusta">Robusta</option>
                <option value="Atletica">Atletica</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LabeledInput label="Color de Piel" name="colorPiel" value={data.colorPiel} onChange={(v) => updateField('colorPiel', v)} placeholder="Ej: Moreno claro" />
            <LabeledInput label="Color de Cabello" name="colorCabello" value={data.colorCabello} onChange={(v) => updateField('colorCabello', v)} placeholder="Ej: Negro, rubio..." />
            <LabeledInput label="Color de Ojos" name="colorOjos" value={data.colorOjos} onChange={(v) => updateField('colorOjos', v)} placeholder="Ej: Marrones, verdes..." />
          </div>
          <LabeledTextarea
            label="Rasgos Distintivos / Marcas / Tatuajes"
            name="rasgosDistintivos"
            value={data.rasgosDistintivos}
            onChange={(v) => updateField('rasgosDistintivos', v)}
            rows={3}
            placeholder="Cicatrices, tatuajes, lunares, protesis, caracteristicas faciales notables..."
          />
        </div>
      </div>

      {/* IV. FOTOGRAFIAS ADJUNTAS */}
      <div>
        <SectionHeader number="IV" title="Fotografias Adjuntas" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-4">
          {/* Upload area */}
          <div
            className="border-2 border-dashed border-[#1c2537]/40 rounded p-6 text-center cursor-pointer hover:border-[#1c2537] hover:bg-[#1c2537]/5 transition-colors print:hidden"
          >
            <FileDropzone
              accept="image/jpeg,image/png,image/webp,image/gif"
              allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
              files={[]}
              helperText="JPG, PNG, WebP o GIF. Máximo 10 MB. Puedes subir múltiples fotos."
              multiple
              onFilesSelected={handleFilesSelected}
            />
          </div>

          {/* Fotos grid */}
          {fotos.length === 0 ? (
            <div className="text-center py-4 print:hidden">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No se han adjuntado fotografias</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {fotos.map((foto) => (
                <div key={foto.id} className="w-full min-w-0 border border-[#1c2537]/20 rounded bg-white" style={{ display: 'block' }}>
                  {/* Imagen — aspect-ratio 4:3 estricto, overflow hidden */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#000', borderRadius: '4px 4px 0 0' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.dataUrl}
                      alt={foto.descripcion || foto.nombre}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() => removeFoto(foto.id)}
                      style={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}
                      className="bg-[#1c2537] text-white rounded-full p-1 hover:bg-[#111827] print:hidden"
                      aria-label="Eliminar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {/* Badge tipo */}
                    <span style={{ position: 'absolute', bottom: 4, left: 4, zIndex: 10 }} className="bg-[#1c2537] text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                      {foto.tipo.replace(/-/g, ' ')}
                    </span>
                  </div>
                  {/* Controles debajo — fuera del contenedor de imagen */}
                  <div className="p-2 space-y-1.5 print:hidden" style={{ display: 'block' }}>
                    <select
                      value={foto.tipo}
                      onChange={(e) => updateFoto(foto.id, 'tipo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
                    >
                      <option value="frontal">Vista Frontal</option>
                      <option value="lateral-derecho">Lateral Derecho</option>
                      <option value="lateral-izquierdo">Lateral Izquierdo</option>
                      <option value="camara-seguridad">Camara de Seguridad</option>
                      <option value="otro">Otro</option>
                    </select>
                    <input
                      type="text"
                      value={foto.descripcion}
                      onChange={(e) => updateFoto(foto.id, 'descripcion', e.target.value)}
                      placeholder="Descripcion / contexto..."
                      className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
                    />
                  </div>
                  {/* Print */}
                  <div className="hidden print:block p-2">
                    <p className="text-xs font-bold text-[#1c2537] uppercase">{foto.tipo.replace(/-/g, ' ')}</p>
                    {foto.descripcion && <p className="text-xs text-gray-600 mt-0.5">{foto.descripcion}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {fotos.length > 0 && (
            <p className="text-xs text-[#1c2537]/60 print:hidden">
              {fotos.length} fotografia{fotos.length !== 1 ? 's' : ''} adjunta{fotos.length !== 1 ? 's' : ''}. Las imagenes se incluyen en el documento al imprimir o exportar.
            </p>
          )}
        </div>
      </div>

      {/* V. CIRCUNSTANCIAS DE LOS HECHOS */}
      <div>
        <SectionHeader number="V" title="Circunstancias de los Hechos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledInput label="Lugar de los Hechos" name="lugarHechos" value={data.lugarHechos} onChange={(v) => updateField('lugarHechos', v)} placeholder="Direccion o zona" />
            <LabeledInput label="Fecha de los Hechos" name="fechaHechos" type="date" value={data.fechaHechos} onChange={(v) => updateField('fechaHechos', v)} />
            <LabeledInput label="Hora Aproximada" name="horaHechos" type="time" value={data.horaHechos} onChange={(v) => updateField('horaHechos', v)} />
          </div>
          <LabeledTextarea
            label="Descripcion de los Hechos"
            name="descripcionHechos"
            value={data.descripcionHechos}
            onChange={(v) => updateField('descripcionHechos', v)}
            rows={5}
            required
            placeholder="Descripcion detallada de los hechos que motivan la solicitud de reconocimiento facial..."
          />
        </div>
      </div>

      {/* VI. TIPO DE RECONOCIMIENTO */}
      <div>
        <SectionHeader number="VI" title="Tipo de Reconocimiento Solicitado" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tiposReconocimiento.map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[#1c2537]/5">
                <input
                  type="checkbox"
                  checked={tiposReconocimientoSel.includes(tipo)}
                  onChange={() => toggleCheck('tipoReconocimiento', tipo)}
                  className="w-3.5 h-3.5 accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">{tipo}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* VII. BASES DE DATOS A CONSULTAR */}
      <div>
        <SectionHeader number="VII" title="Bases de Datos a Consultar" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {basesDatosDisponibles.map((bd) => (
              <label key={bd} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[#1c2537]/5">
                <input
                  type="checkbox"
                  checked={basesDatosSel.includes(bd)}
                  onChange={() => toggleCheck('basesDatos', bd)}
                  className="w-3.5 h-3.5 accent-[#1c2537]"
                />
                <span className="text-xs text-[#1c2537]">{bd}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* VIII. JUSTIFICACION */}
      <div>
        <SectionHeader number="VIII" title="Justificacion y Fundamento" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <LabeledTextarea
            label="Justificacion de la Solicitud"
            name="justificacion"
            value={data.justificacion}
            onChange={(v) => updateField('justificacion', v)}
            rows={5}
            required
            placeholder="Exposicion de los motivos que justifican la solicitud de reconocimiento facial y su relevancia para la investigacion en curso..."
          />
          <LabeledTextarea
            label="Instrucciones Especificas a la LEA"
            name="instruccionesEspecificas"
            value={data.instruccionesEspecificas}
            onChange={(v) => updateField('instruccionesEspecificas', v)}
            rows={3}
            placeholder="Instrucciones particulares, formato de respuesta esperado, canal de comunicacion preferido..."
          />
        </div>
      </div>

      {/* IX. CONDICIONES Y PLAZOS */}
      <div>
        <SectionHeader number="IX" title="Condiciones y Plazos" />
        <div className="p-4 bg-[#f5f5dc]/20 border border-[#8b9db5]/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1c2537] block mb-1 uppercase tracking-wide">Prioridad</label>
              <select
                value={data.prioridad}
                onChange={(e) => updateField('prioridad', e.target.value)}
                className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
              >
                <option value="">Seleccionar</option>
                <option value="URGENTE — Menos de 24h">URGENTE — Menos de 24h</option>
                <option value="ALTA — 48 horas">ALTA — 48 horas</option>
                <option value="NORMAL — 5 dias habiles">NORMAL — 5 dias habiles</option>
                <option value="BAJA — Sin plazo perentorio">BAJA — Sin plazo perentorio</option>
              </select>
            </div>
            <LabeledInput
              label="Plazo de Respuesta Solicitado"
              name="plazoRespuesta"
              value={data.plazoRespuesta}
              onChange={(v) => updateField('plazoRespuesta', v)}
              placeholder="Ej: 48 horas, 5 dias..."
            />
            <div>
              <label className="text-xs font-bold text-[#1c2537] block mb-1 uppercase tracking-wide">Nivel de Clasificacion</label>
              <select
                value={data.nivelClasificacion}
                onChange={(e) => updateField('nivelClasificacion', e.target.value)}
                className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
              >
                <option value="">Seleccionar</option>
                {nivelesClasificacion.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
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
          { label: 'Fiscal Solicitante', value: data.fiscalSolicitante || '[Nombre del Fiscal]' },
        ]}
        columns={1}
      />
    </div>
  );
}
