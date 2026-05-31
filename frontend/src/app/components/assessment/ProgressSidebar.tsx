import React from 'react';

export default function ProgressSidebar({
  phases,
  progress,
  onJumpTo,
}: {
  phases: { id: string; code: string; title: string }[];
  progress: Record<string, { answered: number; total: number; percent: number }>;
  onJumpTo: (id: string) => void;
}) {
  return (
    <aside className="w-64 bg-gray-900 text-gray-200 p-4 rounded">
      <h4 className="text-sm font-semibold mb-3">Progreso</h4>
      <ul className="space-y-3">
        {phases.map((p) => {
          const s = progress[p.id] || { answered: 0, total: 0, percent: 0 };
          return (
            <li key={p.id} className="cursor-pointer" onClick={() => onJumpTo(p.id)}>
              <div className="flex justify-between text-sm mb-1">
                <span>{p.code}</span>
                <span>{Math.round(s.percent)}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${s.percent}%` }} className="h-2 bg-emerald-500" />
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
