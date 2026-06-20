interface DocumentHeaderProps {
  title: string;
}

export function DocumentHeader({ title }: DocumentHeaderProps): JSX.Element {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-[#1c2537]">
        <div className="w-16 h-16 relative flex-shrink-0">
          <img src="/logo.webp" alt="Sello de SADOJ Fiscalía" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#1c2537] uppercase tracking-wide">
            Departamento de Justicia de San Andreas
          </h1>
          <h2 className="text-sm font-semibold text-[#1c2537] uppercase tracking-wide">
            Fiscalía General
          </h2>
        </div>
      </div>

      <div className="py-4">
        <h3 className="text-center text-lg font-bold text-[#1c2537] uppercase tracking-wider">
          {title}
        </h3>
      </div>
    </div>
  );
}
