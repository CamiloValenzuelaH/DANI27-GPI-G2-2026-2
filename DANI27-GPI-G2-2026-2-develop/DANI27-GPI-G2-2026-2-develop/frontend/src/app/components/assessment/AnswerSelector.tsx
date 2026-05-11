import React from 'react';

type Value = 'yes' | 'partial' | 'no' | 'na' | undefined;

export default function AnswerSelector({
  value,
  onChange,
}: {
  value?: Value;
  onChange: (v: Value) => void;
}) {
  const options: { key: Value; label: string; accent?: string }[] = [
    { key: 'yes', label: 'Yes', accent: 'bg-emerald-600' },
    { key: 'partial', label: 'Partial', accent: 'bg-yellow-500' },
    { key: 'no', label: 'No', accent: 'bg-red-600' },
    { key: 'na', label: 'N/A', accent: 'bg-slate-600' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(value === o.key ? undefined : o.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors ${{
            true: 'text-white',
          }[String(true)]} ${value === o.key ? `ring-2 ring-white ${o.accent}` : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
