'use client';

import type { Delito } from '../../types/documents';

const GRAVEDAD_OPTIONS = ['Leve', 'Menos grave', 'Grave', 'Muy grave'];

interface DelitosTableProps {
  delitos: Delito[];
  onChange: (delitos: Delito[]) => void;
}

export function DelitosTable({ delitos, onChange }: DelitosTableProps) {
  const handleChange = (index: number, field: keyof Delito, value: string) => {
    const updated = [...delitos];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    onChange(updated);
  };

  const addRow = () => {
    onChange([...delitos, { numero: '', tipificacion: '', delito: '', gravedad: '' }]);
  };

  const removeRow = (index: number) => {
    onChange(delitos.filter((_, i) => i !== index));
  };

  return (
    <div className="delitos-table overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#1c2537] text-white">
            <th className="border border-[#1c2537] px-3 py-2 text-center font-bold text-xs w-12">N°</th>
            <th className="border border-[#1c2537] px-3 py-2 text-center font-bold text-xs">TIPIFICACIÓN</th>
            <th className="border border-[#1c2537] px-3 py-2 text-center font-bold text-xs">DELITO</th>
            <th className="border border-[#1c2537] px-3 py-2 text-center font-bold text-xs w-32">GRAVEDAD</th>
            <th className="delitos-action border border-[#1c2537] px-3 py-2 text-center font-bold text-xs w-10 print:hidden"></th>
          </tr>
        </thead>
        <tbody>
          {delitos.map((delito, index) => (
            <tr key={index} className={index % 2 !== 0 ? 'bg-[#f5f5dc]/10' : ''}>
              <td className="border border-[#1c2537]/30 px-3 py-2 text-center font-bold text-[#1c2537] bg-[#f5f5dc]/30">
                {index + 1}
              </td>
              <td className="border border-[#1c2537]/30 p-0 bg-white">
                <input
                  type="text"
                  value={delito.tipificacion}
                  onChange={(e) => handleChange(index, 'tipificacion', e.target.value)}
                  className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:ring-inset text-[#1c2537] print:hidden"
                />
                <span className="print-companion hidden print:block px-3 py-2 text-[#1c2537]">{delito.tipificacion || ' '}</span>
              </td>
              <td className="border border-[#1c2537]/30 p-0 bg-white">
                <input
                  type="text"
                  value={delito.delito}
                  onChange={(e) => handleChange(index, 'delito', e.target.value)}
                  className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:ring-inset text-[#1c2537] print:hidden"
                />
                <span className="print-companion hidden print:block px-3 py-2 text-[#1c2537]">{delito.delito || ' '}</span>
              </td>
              <td className="border border-[#1c2537]/30 p-0 bg-white">
                <select
                  value={delito.gravedad}
                  onChange={(e) => handleChange(index, 'gravedad', e.target.value)}
                  className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:ring-inset text-[#1c2537] bg-white print:hidden"
                >
                  <option value="">—</option>
                  {GRAVEDAD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className="print-companion hidden print:block px-3 py-2 text-[#1c2537]">{delito.gravedad || ' '}</span>
              </td>
              <td className="delitos-action border border-[#1c2537]/30 p-0 bg-white text-center print:hidden">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="w-full px-3 py-2 text-[#1c2537] hover:bg-slate-50 hover:text-slate-900 font-bold transition-colors"
                  title="Eliminar fila"
                  aria-label="Eliminar delito"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="delitos-action mt-2 px-4 py-1.5 bg-[#1c2537] text-white text-xs font-bold hover:bg-[#111827] transition-colors print:hidden"
      >
        + Añadir delito
      </button>
    </div>
  );
}
