'use client';

import { useState } from 'react';

interface SignatureEntry {
  label: string;
  name?: string;
  value?: string | undefined;
  onChange?: (value: string) => void;
  editable?: boolean;
}

interface SignatureBlockProps {
  showPlaceDate?: boolean;
  lugar?: string;
  onLugarChange?: (value: string) => void;
  fecha?: string;
  onFechaChange?: (value: string) => void;
  signatures: SignatureEntry[];
  columns?: 1 | 2 | 3;
}

/* ── Typed signature field ── */
function TypedSignature({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const displayValue = value || '';

  return (
    <div className="relative h-24 flex items-end justify-center">
      {/* Handwritten preview (always visible when there's text) */}
      {displayValue && !focused && (
        <span
          className="absolute inset-0 flex items-center justify-center text-[#1c2537] select-none pointer-events-none"
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: displayValue.length > 20 ? '1.75rem' : '2.25rem',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}
        >
          {displayValue}
        </span>
      )}

      {/* Input field */}
      {onChange ? (
        <input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`print:hidden absolute inset-0 w-full h-full text-center bg-transparent outline-none transition-all duration-200 ${
            focused
              ? 'text-[#1c2537] text-lg'
              : displayValue
                ? 'text-transparent'
                : 'text-[#1c2537]/30 text-sm italic'
          }`}
          style={
            focused
              ? { fontFamily: 'var(--font-caveat), cursive', fontSize: '1.5rem' }
              : undefined
          }
          placeholder={placeholder || 'Escriba su firma...'}
        />
      ) : displayValue ? (
        <span
          className="absolute inset-0 flex items-center justify-center text-[#1c2537]"
          style={{
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: displayValue.length > 20 ? '1.75rem' : '2.25rem',
            letterSpacing: '0.02em',
          }}
        >
          {displayValue}
        </span>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center text-[#1c2537]/25">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          <span className="text-[9px] italic mt-1">Pendiente de firma</span>
        </span>
      )}
    </div>
  );
}

/* ── Main component ── */
export function SignatureBlock({
  showPlaceDate = false,
  lugar,
  onLugarChange,
  fecha,
  onFechaChange,
  signatures,
  columns = 3,
}: SignatureBlockProps) {
  const [localSignatures, setLocalSignatures] = useState<Record<number, string>>({});

  const gridClass =
    columns === 1
      ? 'grid grid-cols-1 gap-16 max-w-sm mx-auto'
      : columns === 2
        ? 'grid grid-cols-1 md:grid-cols-2 gap-12'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10';

  return (
    <div className="mt-8 avoid-break">
      {/* Decorative top border */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#8b9db5]/60" />
        <div className="w-2 h-2 rotate-45 border border-[#8b9db5]/60" />
        <div className="flex-1 h-px bg-[#8b9db5]/60" />
      </div>

      {showPlaceDate && onLugarChange && onFechaChange && (
        <div className="mb-8 text-center">
          <p className="text-sm text-[#1c2537] leading-relaxed italic">
            {'Es justicia que pido en '}
            <input
              type="text"
              value={lugar || ''}
              onChange={(e) => onLugarChange(e.target.value)}
              className="border-b-2 border-[#8b9db5] bg-transparent px-2 py-1 w-44 text-center text-sm text-[#1c2537] font-semibold focus:outline-none focus:border-[#1c2537] transition-colors"
              placeholder="Ciudad"
            />
            {', a '}
            <input
              type="date"
              value={fecha || ''}
              onChange={(e) => onFechaChange(e.target.value)}
              className="border-b-2 border-[#8b9db5] bg-transparent px-2 py-1 text-sm text-[#1c2537] font-semibold focus:outline-none focus:border-[#1c2537] transition-colors"
            />
          </p>
        </div>
      )}

      <div className={`pt-4 ${gridClass}`}>
        {signatures.map((sig, i) => {
          const isPlaceholder =
            !sig.value ||
            sig.value === '[Nombre del Fiscal]' ||
            sig.value === '[Sello y firma del Juez]' ||
            sig.value === '[Nombre y firma]';

          const signatureText = localSignatures[i] ?? (isPlaceholder ? '' : sig.value || '');
          const hasSignature = signatureText.length > 0;

          return (
            <div key={i} className={`text-center ${columns === 1 ? 'w-full max-w-xs mx-auto' : ''}`}>
              {/* Typed signature area */}
              <TypedSignature
                value={signatureText}
                onChange={(v) => setLocalSignatures((prev) => ({ ...prev, [i]: v }))}
                placeholder="Escriba su firma..."
              />

              {/* Signature line with decorative ends */}
              <div className="relative mt-1 mb-3">
                <div className="flex items-center">
                  <div className="w-3 h-px bg-[#8b9db5]" />
                  <div className={`flex-1 h-[2px] transition-colors duration-300 ${
                    hasSignature ? 'bg-[#1c2537]' : 'bg-[#1c2537]/40'
                  }`} />
                  <div className="w-3 h-px bg-[#8b9db5]" />
                </div>
              </div>

              {/* Label */}
              <p className="text-[11px] font-bold text-[#1c2537] uppercase tracking-widest">{sig.label}</p>

              {/* Name / value */}
              {sig.editable && sig.onChange ? (
                <input
                  type="text"
                  value={sig.value || ''}
                  onChange={(e) => sig.onChange?.(e.target.value)}
                  className="text-center text-xs text-[#1c2537]/70 border-b border-transparent hover:border-[#8b9db5]/50 focus:border-[#8b9db5] bg-transparent px-2 py-1 outline-none w-full mt-1 transition-colors"
                  placeholder="Nombre y cargo"
                />
              ) : !isPlaceholder ? (
                <p className="text-xs text-[#1c2537]/60 mt-1 font-medium">{sig.value}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Bottom decorative element */}
      <div className="flex items-center gap-3 mt-8">
        <div className="flex-1 h-px bg-[#8b9db5]/40" />
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rotate-45 bg-[#8b9db5]/40" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#1c2537]/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#8b9db5]/40" />
        </div>
        <div className="flex-1 h-px bg-[#8b9db5]/40" />
      </div>
    </div>
  );
}
