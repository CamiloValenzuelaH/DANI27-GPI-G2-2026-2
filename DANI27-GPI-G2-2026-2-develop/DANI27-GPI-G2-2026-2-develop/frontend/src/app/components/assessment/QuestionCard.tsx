import React from 'react';
import AnswerSelector from './AnswerSelector';
import EvidenceAttachment from './EvidenceAttachment';

export default function QuestionCard({
  question,
  answer,
  onAnswer,
  onAddFiles,
  onRemoveFile,
}: {
  question: { id: string; text: string; critical?: boolean };
  answer?: { value?: string; attachments?: any[] };
  onAnswer: (v: 'yes' | 'partial' | 'no' | 'na') => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
}) {
  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg shadow-md">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">{question.text}</h3>
        {question.critical && (
          <span className="ml-4 text-xs bg-red-600 text-white px-2 py-1 rounded">CRITICAL</span>
        )}
      </div>

      <div className="mt-4">
        <AnswerSelector value={answer?.value as any} onChange={(v) => onAnswer(v as any)} />
      </div>

      <div className="mt-4">
        <EvidenceAttachment attachments={answer?.attachments || []} onAdd={onAddFiles} onRemove={onRemoveFile} />
      </div>
    </div>
  );
}
