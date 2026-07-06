interface CardProps {
  title: string;
  titleColor?: string;
  borderColor?: string;
  className?: string;
  children: React.ReactNode;
}

export default function Card({ title, titleColor, borderColor, className, children }: CardProps) {
  return (
    <div className={`bg-[#0B1116] rounded-[10px] shadow-sm border border-[#2A2E3D] overflow-hidden transition-colors ${borderColor || ''} ${className || ''}`}>
      <div className="px-5 py-4 border-b border-[#2A2E3D]">
        <h3 className={`text-sm font-semibold ${titleColor || 'text-white/90'}`}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
