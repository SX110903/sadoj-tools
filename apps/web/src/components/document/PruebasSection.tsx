'use client';

import { Plus, Trash2, Link, ImageIcon, Video } from 'lucide-react';

export interface Prueba {
  tipo: string;
  descripcion: string;
  enlace: string;
}

interface PruebasSectionProps {
  pruebas: Prueba[];
  onChange: (pruebas: Prueba[]) => void;
  tiposPrueba: string[];
}

export function PruebasSection({ pruebas = [], onChange, tiposPrueba }: PruebasSectionProps) {
  // Ensure pruebas is always an array
  const safePruebas = pruebas || [];
  
  const handleAdd = () => {
    onChange([...safePruebas, { tipo: '', descripcion: '', enlace: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(safePruebas.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Prueba, value: string) => {
    const updated = [...safePruebas];
    const current = updated[index];
    if (current === undefined) return;
    updated[index] = { ...current, [field]: value };
    onChange(updated);
  };

  const getIconForTipo = (tipo: string) => {
    if (tipo.toLowerCase().includes('video')) return <Video className="w-4 h-4" />;
    if (tipo.toLowerCase().includes('imagen') || tipo.toLowerCase().includes('foto')) return <ImageIcon className="w-4 h-4" />;
    return <Link className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Tipos de prueba checkboxes */}
      <div>
        <label className="text-xs font-bold text-[#1c2537] mb-2 block">Tipos de Pruebas a Presentar:</label>
        <div className="flex flex-wrap gap-4">
          {tiposPrueba.map((tipo) => (
            <label key={tipo} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={safePruebas.some(p => p.tipo === tipo)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...safePruebas, { tipo, descripcion: '', enlace: '' }]);
                  } else {
                    onChange(safePruebas.filter(p => p.tipo !== tipo));
                  }
                }}
                className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
              />
              <span className="text-xs text-[#1c2537]">{tipo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Lista de pruebas */}
      {safePruebas.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#1c2537] block">Detalle de Pruebas:</label>
          {safePruebas.map((prueba, index) => (
            <div key={index} className="border border-[#1c2537]/30 p-3 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIconForTipo(prueba.tipo)}
                  <span className="text-xs font-bold text-[#1c2537]">{prueba.tipo || `Prueba ${index + 1}`}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="print:hidden text-[#1c2537] hover:text-[#111827] p-1"
                  title="Eliminar prueba"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#1c2537] block mb-1">Tipo:</label>
                  <select
                    value={prueba.tipo}
                    onChange={(e) => handleChange(index, 'tipo', e.target.value)}
                    className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposPrueba.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#1c2537] block mb-1">Enlace/URL:</label>
                  <input
                    type="url"
                    value={prueba.enlace}
                    onChange={(e) => handleChange(index, 'enlace', e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[#1c2537] block mb-1">Descripción:</label>
                <input
                  type="text"
                  value={prueba.descripcion}
                  onChange={(e) => handleChange(index, 'descripcion', e.target.value)}
                  placeholder="Descripción de la prueba..."
                  className="w-full border border-[#1c2537]/30 px-2 py-1.5 text-xs text-[#1c2537] focus:outline-none focus:ring-1 focus:ring-[#1c2537]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        className="print:hidden flex items-center gap-2 px-3 py-1.5 border border-[#1c2537] text-[#1c2537] hover:bg-[#1c2537]/5 transition-colors text-xs font-bold"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar Prueba
      </button>
    </div>
  );
}
