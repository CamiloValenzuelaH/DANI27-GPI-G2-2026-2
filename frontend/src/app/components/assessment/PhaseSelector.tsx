import React from 'react';
import { useIntl } from 'react-intl';

export default function PhaseSelector({
  phases,
  currentPhaseId,
  onSelect,
}: {
  phases: { id: string; code: string; name: string; sort_order: number }[];
  currentPhaseId?: string;
  onSelect: (id: string) => void;
}) {
  const intl = useIntl();
  return (
    <nav className="relative z-10">
      <div className="flex flex-wrap gap-2 pb-2 -mx-1 px-1">
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            role="tab"
            aria-selected={currentPhaseId === p.id}
            className={`flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-[11px] font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:px-4 sm:text-sm ${
              currentPhaseId === p.id
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700/80'
            }`}
          >
            <span className="shrink-0 text-[10px] opacity-80 sm:text-xs">
              {intl.formatMessage({ id: 'assessment.phaseLabel', defaultMessage: 'Phase {order}' }, { order: p.sort_order })}
            </span>
            <span className="hidden min-w-0 truncate sm:inline-block">— {intl.formatMessage({ id: `phase.${p.sort_order}`, defaultMessage: p.name })}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
