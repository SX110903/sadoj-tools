'use client';

interface FundamentoLegalProps {
  texto: string;
  onChange?: (value: string) => void;
  editable?: boolean;
}

export function FundamentoLegal({ texto, onChange, editable = true }: FundamentoLegalProps) {
  return (
    <div className="border-2 border-[#1c2537] rounded mb-6 avoid-break">
      <div className="bg-[#f5f5dc]/30 p-3">
        <span className="text-xs font-bold text-[#1c2537] uppercase tracking-wide">
          Fundamento Legal:{' '}
        </span>
        {editable ? (
          <>
            <input
              type="text"
              value={texto}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-full mt-1 text-xs text-[#1c2537] bg-transparent border-none focus:outline-none focus:ring-0 print:hidden"
              placeholder="Art. 28 de la Constitución de San Andreas, garantizando los derechos del Art. 11.3 y Art. 19 (asistencia letrada y proceso justo)."
            />
            <div className="print-companion hidden print:block w-full mt-1 text-xs text-[#1c2537] break-words whitespace-pre-wrap">
              {texto || '\u00A0'}
            </div>
          </>
        ) : (
          <span className="text-xs text-[#1c2537]">{texto}</span>
        )}
      </div>
    </div>
  );
}
