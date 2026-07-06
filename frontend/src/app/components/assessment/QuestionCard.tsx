import React from 'react';
import { useIntl } from 'react-intl';
import { questionTranslations } from '../../i18n/questionTranslations';
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
  const intl = useIntl();
  const attachments = answer?.attachments || [];
  const hasValidAttachments = attachments.some((a) => !a.removed);
  const isCriticalYesWithoutEvidence = question.is_critical && answer?.value === 'yes' && !hasValidAttachments;
  const locale = (intl.locale as string) || 'es';
  const localizedText = (questionTranslations[locale] && questionTranslations[locale][question.text]) || question.text;
  
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-4 shadow-md sm:px-5 sm:py-5">
      {question.clause_ref && (
        <div className="mb-2 font-mono text-[10px] sm:text-xs text-indigo-400 break-words">Control: {question.clause_ref}</div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-sm font-semibold leading-snug text-gray-100 sm:text-base lg:text-lg break-words">
          {localizedText}
        </h3>
        {question.is_critical && (
          <span className="inline-flex w-fit rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white sm:ml-4 sm:text-xs">
            {intl.formatMessage({ id: 'assessment.criticalBadge', defaultMessage: 'CRÍTICO' })}
          </span>
        )}
      </div>

      {isCriticalYesWithoutEvidence && (
        <div className="mt-3 rounded border border-red-700 bg-red-900 p-3 text-xs leading-relaxed text-red-100 sm:mt-4 sm:text-sm">
          {intl.formatMessage({ id: 'assessment.criticalWarning', defaultMessage: '⚠️ Preguntas críticas respondidas como "SÍ" requieren adjuntar documentación de evidencia.' })}
        </div>
      )}

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
