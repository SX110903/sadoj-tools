'use client';

interface CheckboxOption {
  value: string;
  label: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  inputValues?: Record<string, string>;
  onInputChange?: (key: string, value: string) => void;
  columns?: number;
}

export function CheckboxGroup({
  options,
  selectedValues,
  onChange,
  inputValues = {},
  onInputChange,
  columns = 2,
}: CheckboxGroupProps) {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div 
      className="flex flex-wrap gap-x-4 gap-y-2"
      style={columns > 1 ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            id={option.value}
            checked={selectedValues.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
            className="w-3.5 h-3.5 text-[#1c2537] border-[#1c2537]/50 focus:ring-[#1c2537] accent-[#1c2537]"
          />
          <label htmlFor={option.value} className="text-xs text-[#1c2537]">
            {option.label}
          </label>
          {option.hasInput && selectedValues.includes(option.value) && onInputChange && (
            <input
              type="text"
              value={inputValues[option.value] || ''}
              onChange={(e) => onInputChange(option.value, e.target.value)}
              placeholder={option.inputPlaceholder}
              className="border border-[#1c2537]/30 px-2 py-0.5 text-xs flex-1 max-w-[150px] text-[#1c2537]"
            />
          )}
        </div>
      ))}
    </div>
  );
}
