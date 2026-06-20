'use client';

interface LabeledTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function LabeledTextarea({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 4,
  className = '',
}: LabeledTextareaProps) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-bold text-[#1c2537]">
          {label}
          {required && <span className="text-[#1c2537] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-[#1c2537]/30 bg-white px-3 py-2 text-sm text-[#1c2537] focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:border-[#1c2537] resize-none print:hidden"
        required={required}
      />
      {/* Print-only div that shows full text without overflow */}
      <div
        className="print-companion hidden print:block w-full border border-[#1c2537]/30 bg-white px-3 py-2 text-sm text-[#1c2537] whitespace-pre-wrap break-words min-h-[2em]"
      >
        {value || '\u00A0'}
      </div>
    </div>
  );
}
