import React from 'react';
import { useIntl } from 'react-intl';

type Value = 'yes' | 'partial' | 'no' | 'na' | undefined;

export default function AnswerSelector({
  value,
  onChange,
}: {
  value?: Value;
  onChange: (v: Value) => void;
}) {
  const intl = useIntl();
  const options: { key: Value; label: string; accent?: string }[] = [
    { key: 'yes', label: intl.formatMessage({ id: 'answer.yes', defaultMessage: 'Yes' }), accent: 'bg-emerald-600' },
    { key: 'partial', label: intl.formatMessage({ id: 'answer.partial', defaultMessage: 'Partial' }), accent: 'bg-yellow-500' },
    { key: 'no', label: intl.formatMessage({ id: 'answer.no', defaultMessage: 'No' }), accent: 'bg-red-600' },
    { key: 'na', label: intl.formatMessage({ id: 'answer.na', defaultMessage: 'N/A' }), accent: 'bg-slate-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-2 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-colors sm:px-4 sm:text-sm ${{
            true: 'text-white',
          }[String(true)]} ${value === o.key ? `ring-2 ring-white ${o.accent}` : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
