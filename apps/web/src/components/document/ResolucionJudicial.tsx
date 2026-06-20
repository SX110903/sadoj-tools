'use client';

import { LabeledInput } from './LabeledInput';

interface ResolucionJudicialProps {
  resolucion: string;
  onResolucionChange: (value: string) => void;
  condiciones: string;
  onCondicionesChange: (value: string) => void;
  condicionesName?: string;
  fecha: string;
  onFechaChange: (value: string) => void;
  fechaName?: string;
  hora?: string;
  onHoraChange?: (value: string) => void;
  horaName?: string;
  lugar?: string;
  onLugarChange?: (value: string) => void;
  lugarName?: string;
  showHora?: boolean;
  showLugar?: boolean;
  vigencia?: string;
  onVigenciaChange?: (value: string) => void;
  vigenciaName?: string;
  showVigencia?: boolean;
}

export function ResolucionJudicial({
  resolucion,
  onResolucionChange,
  condiciones,
  onCondicionesChange,
  condicionesName = 'condicionesResolucion',
  fecha,
  onFechaChange,
  fechaName = 'fechaResolucion',
  hora,
  onHoraChange,
  horaName = 'horaResolucion',
  lugar,
  onLugarChange,
  lugarName = 'lugarResolucion',
  showHora = true,
  showLugar = true,
  vigencia,
  onVigenciaChange,
  vigenciaName = 'vigenciaResolucion',
  showVigencia = false,
}: ResolucionJudicialProps) {
  return (
    <div className="border-2 border-[#1c2537] p-4 bg-[#f5f5dc]/20 mt-6">
      <h4 className="text-center font-bold text-[#1c2537] uppercase text-xs mb-4 tracking-wide">
        Resolución Judicial (Uso Exclusivo del Tribunal)
      </h4>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="resolucion"
              value="autorizar"
              checked={resolucion === 'autorizar'}
              onChange={(e) => onResolucionChange(e.target.value)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs font-bold text-[#1c2537]">Autorizar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="resolucion"
              value="denegar"
              checked={resolucion === 'denegar'}
              onChange={(e) => onResolucionChange(e.target.value)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs font-bold text-[#1c2537]">Denegar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="resolucion"
              value="autorizar-condiciones"
              checked={resolucion === 'autorizar-condiciones'}
              onChange={(e) => onResolucionChange(e.target.value)}
              className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
            />
            <span className="text-xs font-bold text-[#1c2537]">Autorizar con condiciones</span>
          </label>
        </div>

        {resolucion === 'autorizar-condiciones' && (
          <div>
            <label className="text-xs font-bold text-[#1c2537]">Condiciones:</label>
            <textarea
              name={condicionesName}
              value={condiciones}
              onChange={(e) => onCondicionesChange(e.target.value)}
              className="w-full border border-[#1c2537]/30 px-3 py-2 text-sm mt-1 resize-none text-[#1c2537] print:hidden"
              rows={2}
              placeholder="Especifique las condiciones..."
            />
            <div className="print-companion hidden print:block w-full border border-[#1c2537]/30 px-3 py-2 text-sm mt-1 text-[#1c2537] whitespace-pre-wrap break-words min-h-[2em]">
              {condiciones || '\u00A0'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LabeledInput
            label="Fecha"
            name={fechaName}
            type="date"
            value={fecha}
            onChange={onFechaChange}
            inline={false}
          />
          {showHora && onHoraChange && (
            <LabeledInput
              label="Hora"
              name={horaName}
              type="time"
              value={hora || ''}
              onChange={onHoraChange}
              inline={false}
            />
          )}
          {showLugar && onLugarChange && (
            <LabeledInput
              label="Lugar"
              name={lugarName}
              value={lugar || ''}
              onChange={onLugarChange}
              placeholder=""
              inline={false}
            />
          )}
          {showVigencia && onVigenciaChange && (
            <LabeledInput
              label="Vigencia"
              name={vigenciaName}
              value={vigencia || ''}
              onChange={onVigenciaChange}
              placeholder=""
              inline={false}
            />
          )}
        </div>

        <div className="border-t border-[#1c2537]/30 pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
            <div className="text-center">
              <div className="h-20" />
              <div className="border-b-2 border-[#1c2537] w-full mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1c2537] uppercase tracking-wide">Juez</p>
              <p className="text-xs text-[#1c2537]/50 mt-0.5">[Nombre y firma]</p>
            </div>
            <div className="text-center">
              <div className="h-20" />
              <div className="border-b-2 border-[#1c2537] w-full mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1c2537] uppercase tracking-wide">Fecha y Sello</p>
              <p className="text-xs text-[#1c2537]/50 mt-0.5">[Sello del Tribunal]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
