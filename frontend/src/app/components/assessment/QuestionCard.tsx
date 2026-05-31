import React from 'react';
import AnswerSelector from './AnswerSelector';
import EvidenceAttachment, { type AssessmentAttachment } from './EvidenceAttachment';

export default function QuestionCard({
  question,
  answer,
  onAnswer,
  onAddFiles,
  onUploadComplete,
  onRemoveFile,
}: {
  question: { id: string; text: string; clause_ref?: string; is_critical?: boolean };
  answer?: { value?: string; attachments?: AssessmentAttachment[] };
  onAnswer: (v: 'yes' | 'partial' | 'no' | 'na') => void;
  onAddFiles: (files: File[]) => void;
  onUploadComplete: (items: AssessmentAttachment[]) => void;
  onRemoveFile: (id: string) => void;
}) {
  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg shadow-md">
      {question.clause_ref && (
        <div className="text-xs text-indigo-400 mb-2 font-mono">Control: {question.clause_ref}</div>
      )}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">{question.text}</h3>
        {question.is_critical && (
          <span className="ml-4 text-xs bg-red-600 text-white px-2 py-1 rounded">CRÍTICO</span>
        )}
      </div>

      <div className="mt-4">
        <AnswerSelector value={answer?.value as any} onChange={(v) => onAnswer(v as any)} />
      </div>

      <div className="mt-4">
        <EvidenceAttachment
          key={question.id}
          questionId={question.id}
          attachments={answer?.attachments || []}
          onAdd={onAddFiles}
          onUploadComplete={onUploadComplete}
          onRemove={onRemoveFile}
        />
      </div>
    </div>
  );
}
