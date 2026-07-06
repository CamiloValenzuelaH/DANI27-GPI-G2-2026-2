import React from 'react';
import { useIntl } from 'react-intl';

export default function ProgressSidebar({
  phases,
  progress,
  onJumpTo,
}: {
  phases: { id: string; code: string; title: string }[];
  progress: Record<string, { answered: number; total: number; percent: number }>;
  onJumpTo: (id: string) => void;
}) {
  const intl = useIntl();
  return (
    <aside className="w-full rounded bg-gray-900 p-3 text-gray-200 lg:sticky lg:top-4 lg:w-64 lg:self-start lg:p-4">
      <h4 className="mb-3 text-xs font-semibold sm:text-sm">
        {intl.formatMessage({ id: 'assessment.progressTitle', defaultMessage: 'Progress' })}
      </h4>
      <ul className="space-y-2 sm:space-y-3">
        {phases.map((p) => {
          const s = progress[p.id] || { answered: 0, total: 0, percent: 0 };
          return (
            <li key={p.id} className="cursor-pointer" onClick={() => onJumpTo(p.id)}>
              <div className="mb-1 flex justify-between text-xs sm:text-sm">
                <span>{p.code}</span>
                <span>{Math.round(s.percent)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800 sm:h-2">
                <div style={{ width: `${s.percent}%` }} className="h-1.5 bg-emerald-500 sm:h-2" />
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
