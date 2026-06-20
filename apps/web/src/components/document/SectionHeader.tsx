'use client';

interface SectionHeaderProps {
  number: string;
  title: string;
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div className="bg-[#1c2537] text-white py-2 px-4 font-bold text-sm uppercase tracking-wide print:bg-[#1c2537] print:text-white print:-webkit-print-color-adjust-exact print:print-color-adjust-exact">
      {number}. {title}
    </div>
  );
}
