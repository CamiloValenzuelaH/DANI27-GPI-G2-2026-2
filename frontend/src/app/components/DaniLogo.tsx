import logoUrl from '../../assets/dani-logo.png';

interface DaniLogoProps {
  size?: number;
  showText?: boolean;
}

export default function DaniLogo({ size = 72, showText = true }: DaniLogoProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 shadow-sm"
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt="DANI logo"
          className="h-full w-full object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-semibold tracking-tight text-slate-900">DANI</span>
          <span className="text-[11px] uppercase tracking-[0.32em] text-slate-500">
            ISO27001 Compliance
          </span>
        </div>
      )}
    </div>
  );
}