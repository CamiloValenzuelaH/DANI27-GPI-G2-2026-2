import React from 'react';

export default function PhaseSelector({
  phases,
  currentPhaseId,
  onSelect,
}: {
  phases: { id: string; code: string; title: string }[];
  currentPhaseId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-auto pb-2">
      {phases.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`px-3 py-2 rounded-md text-sm ${currentPhaseId === p.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
        >
          {p.code} — {p.title}
        </button>
      ))}
    </div>
  );
}
