'use client';

import type { ChangeEvent, FormEvent } from 'react';

interface LabeledInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  inline?: boolean;
}

export function LabeledInput({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder,
  className = '',
  inline = false,
}: LabeledInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  const handleInput = (event: FormEvent<HTMLInputElement>): void => {
    if (type === 'date' || type === 'time') {
      onChange(event.currentTarget.value);
    }
  };

  if (inline && label) {
    return (
      <div className={`flex items-center gap-2 min-w-0 ${className}`}>
        <label htmlFor={name} className="text-xs font-bold text-[#1c2537] whitespace-nowrap shrink-0">
          {label}:
          {required && <span className="text-[#1c2537] ml-0.5">*</span>}
        </label>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onInput={handleInput}
          placeholder={placeholder}
          className="flex-1 min-w-0 border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:border-[#1c2537] print:hidden"
          required={required}
        />
        <div className="print-companion hidden print:block flex-1 min-w-0 border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm break-words">
          {value || '\u00A0'}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-bold text-[#1c2537]">
          {label}
          {required && <span className="text-[#1c2537] ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onInput={handleInput}
        placeholder={placeholder}
        className="w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c2537] focus:border-[#1c2537] print:hidden"
        required={required}
      />
      <div className="print-companion hidden print:block w-full border border-[#1c2537]/30 bg-white px-2 py-1.5 text-sm break-words">
        {value || '\u00A0'}
      </div>
    </div>
  );
}
