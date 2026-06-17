<<<<<<< HEAD
interface CardProps {
  title: string;
  titleColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}

export default function Card({ title, titleColor, borderColor, children }: CardProps) {
  return (
    <div className={`bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] overflow-hidden transition-colors ${borderColor || ''}`}>
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <h3 className={`text-sm font-semibold ${titleColor || 'text-[#1A1D26] dark:text-[#E4E7EE]'}`}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
=======
interface CardProps {
  title: string;
  titleColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}

export default function Card({ title, titleColor, borderColor, children }: CardProps) {
  return (
    <div className={`bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] overflow-hidden transition-colors ${borderColor || ''}`}>
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <h3 className={`text-sm font-semibold ${titleColor || 'text-[#1A1D26] dark:text-[#E4E7EE]'}`}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
>>>>>>> Chat-bot
