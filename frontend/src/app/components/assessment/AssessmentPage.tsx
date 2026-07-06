import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { getPhases, getPhaseQuestions, postAnswer } from '../../../api/assessment';
import { evidencesApi } from '../../../api/evidences';
import PhaseSelector from './PhaseSelector';
import QuestionCard from './QuestionCard';
import ProgressSidebar from './ProgressSidebar';
import Toast from '../Toast';
import useAutosave from '../../hooks/useAutosave';
import { loadProgressLocal, saveProgressLocal } from '../../lib/storage';
import { usePreferences } from '../AppShell';
import { formatDateTime } from '../../lib/date';
import type { AssessmentAttachment } from './EvidenceAttachment';

type Phase = any;

export default function AssessmentPage() {
  const intl = useIntl();
  const { dateFormat, language } = usePreferences();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhaseId, setCurrentPhaseId] = useState<string>('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await loadProgressLocal();
      if (stored) {
        setAnswers(stored.answers || {});
        setCurrentPhaseId(stored.currentPhaseId || '');
        setCurrentQuestionIdx(stored.currentQuestionIdx || 0);
        setLastSaved(stored.lastSaved || null);
      }

      try {
        const remote = await getPhases();
        const mapped = remote
          .map((p) => ({ ...p, id: String(p.id), questions: [] }))
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const firstPhaseId = mapped[0]?.id || '';
        const initialPhaseId = stored?.currentPhaseId && mapped.some((p) => p.id === String(stored.currentPhaseId))
          ? String(stored.currentPhaseId)
          : firstPhaseId;

        const initialQuestionIdx = typeof stored?.currentQuestionIdx === 'number' ? stored.currentQuestionIdx : 0;
        setPhases(mapped);
        setCurrentPhaseId(initialPhaseId);
        setCurrentQuestionIdx(initialQuestionIdx);

        if (!initialPhaseId) {
          setIsLoading(false);
        }
      } catch (err) {
        // keep empty phases on error
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEvidenceUploaded = (event: Event) => {
      const customEvent = event as CustomEvent<{ questionId?: string; attachments?: AssessmentAttachment[] }>;
      const questionId = customEvent.detail?.questionId;
      const uploadedAttachments = customEvent.detail?.attachments || [];

      if (!questionId || uploadedAttachments.length === 0) {
        return;
      }

      addUploadedEvidence(questionId, uploadedAttachments);
    };

    window.addEventListener('assessment:evidence-uploaded', handleEvidenceUploaded as EventListener);

    return () => {
      window.removeEventListener('assessment:evidence-uploaded', handleEvidenceUploaded as EventListener);
    };
  }, []);

  const currentPhase = useMemo(() => phases.find((p) => p.id === currentPhaseId) || phases[0], [phases, currentPhaseId]);
  const questions = currentPhase?.questions || [];

  // fetch questions when phase changes
  useEffect(() => {
    if (!currentPhaseId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setCurrentQuestionIdx(0);
    (async () => {
      try {
        const qs = await getPhaseQuestions(currentPhaseId);
        setPhases((prev) =>
          prev.map((p) =>
            p.id === currentPhaseId ? { ...p, questions: qs.map((q) => ({ ...q, id: String(q.id) })) } : p
          )
        );
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentPhaseId]);

  const setAnswerValue = (questionId: string, value: any) => {
    const answer = typeof value === 'string' ? value : value?.value
    
    // Find the question to check if it's critical
    const question = currentPhase?.questions?.find((q: any) => q.id === questionId);
    
    // Validate: critical questions answered "yes" need evidence
      if (question?.is_critical && answer === 'yes') {
      const attachments = answers[questionId]?.attachments || [];
      const hasValidAttachments = attachments.some((a: any) => !a.removed);
      
      if (!hasValidAttachments) {
        setToast({
          message: intl.formatMessage({ id: 'assessment.criticalNoEvidenceToast', defaultMessage: 'Preguntas críticas respondidas como Sí requieren adjuntar evidencia' }),
          type: 'error'
        });
        return;
      }
    }
    
    setAnswers((s) => ({ ...s, [questionId]: { ...(s[questionId] || {}), value, updatedAt: new Date().toISOString() } }));

    if (answer === undefined || answer === null || answer === '') {
      return
    }

    const payload = { question_id: questionId, answer, notes: value?.notes }
    postAnswer(payload).catch((err) => {
      console.error('Could not save assessment answer', payload, err)
      if (err?.response?.data) {
        console.error('Assessment API error data:', err.response.data)
        setToast({
          message: err.response.data.detail || 'Error al guardar la respuesta',
          type: 'error'
        });
      }
    })
  };

  const addFiles = async (questionId: string, files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const uploadResults = await Promise.allSettled(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('question_id', questionId);
        formData.append('name', file.name);

        const response = await evidencesApi.upload(formData);
        const evidenceId = response.evidence_id || response.id;

        return {
          id: evidenceId,
          name: response.original_file_name || response.name || file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadReference: evidenceId,
          metadata: {
            name: response.name,
            control_id: response.control_id,
            clause_ref: response.clause_ref,
            type: response.type,
            valid_until: '',
          },
          source: 'manual' as const,
        };
      }),
    );

    const completedAttachments = uploadResults
      .filter((result): result is PromiseFulfilledResult<AssessmentAttachment> => result.status === 'fulfilled')
      .map((result) => result.value);

    const failed = uploadResults.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
    const failedCount = failed.length;
    const failedMessage = failed
      .map((result) => {
        if (result.reason instanceof Error) {
          return result.reason.message
        }
        if (typeof result.reason === 'string') {
          return result.reason
        }
        return 'Error desconocido al subir el archivo'
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(' | ')

    if (completedAttachments.length > 0) {
      addUploadedEvidence(questionId, completedAttachments);
      window.dispatchEvent(
        new CustomEvent('assessment:evidence-uploaded', {
          detail: { questionId, attachments: completedAttachments },
        }),
      );
    }

    if (failedCount > 0) {
      setToast({
        message:
          failedCount === files.length
            ? `No se pudieron subir los archivos. ${failedMessage || 'Intenta nuevamente.'}`
            : `Se subieron ${completedAttachments.length} de ${files.length} archivos. ${failedMessage}`,
        type: 'error',
      });
    }
  };

  const addUploadedEvidence = (questionId: string, items: AssessmentAttachment[]) => {
    setAnswers((s) => {
      const prev = s[questionId] || { attachments: [] };
      const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
      const nextAttachments = [...existing];

      items.forEach((item) => {
        const idx = nextAttachments.findIndex((attachment: AssessmentAttachment) => attachment.id === item.id);
        if (idx >= 0) {
          nextAttachments[idx] = { ...nextAttachments[idx], ...item };
        } else {
          nextAttachments.push(item);
        }
      });

      return {
        ...s,
        [questionId]: {
          ...prev,
          attachments: nextAttachments,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const removeFile = (questionId: string, id: string) => {
    setAnswers((s) => {
      const prev = s[questionId] || { attachments: [] };
      const attachments = (prev.attachments || []).map((a: any) =>
        a.id === id
          ? { ...a, removed: true, name: 'Archivo eliminado', size: 0, uploadedAt: new Date().toISOString() }
          : a,
      );
      return { ...s, [questionId]: { ...prev, attachments } };
    });
  };

  const progress = useMemo(() => {
    const res: Record<string, any> = {};
    phases.forEach((p) => {
      const total = p.questions?.length || 0;
      const answered = p.questions?.filter((q: any) => answers[q.id]?.value).length || 0;
      const percent = total ? (answered / total) * 100 : 0;
      res[p.id] = { answered, total, percent };
    });
    return res;
  }, [phases, answers]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => answer?.value !== undefined && answer?.value !== null && answer?.value !== '').length,
    [answers]
  );

  const totalQuestionCount = useMemo(
    () => phases.reduce((sum, phase) => sum + (phase.questions?.length || 0), 0),
    [phases]
  );

  const saveNow = async () => {
    const payload = { answers, currentPhaseId, currentQuestionIdx, lastSaved: new Date().toISOString() };
    await saveProgressLocal(payload);
    setLastSaved(payload.lastSaved);
  };

  useAutosave(saveNow, 2000, [answers, currentPhaseId, currentQuestionIdx]);

  return (
    <div className="overflow-x-hidden min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-gray-100 px-3 py-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6">
        <main className="min-w-0">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <PhaseSelector phases={phases} currentPhaseId={currentPhaseId} onSelect={(id) => { setCurrentPhaseId(id); setCurrentQuestionIdx(0); }} />
            <div className="self-start rounded-xl bg-gray-900 border border-gray-800 px-3 py-2 text-xs sm:text-sm text-gray-300 xl:self-auto">
              <span className="font-medium text-white">{intl.formatMessage({ id: 'assessment.responded', defaultMessage: 'Respondido' })}</span>{' '}
              {answeredCount} / {totalQuestionCount}
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="text-gray-400">{intl.formatMessage({ id: 'assessment.loadingQuestions', defaultMessage: 'Cargando preguntas...' })}</div>
            ) : questions.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm text-gray-300 leading-relaxed">
                  {intl.formatMessage({ id: 'assessment.viewByPhase', defaultMessage: 'Vista por fase: responde todas las preguntas en esta columna para evitar perder el contexto.' })}
                </div>
                {questions.map((q: any, index: number) => (
                  <div key={q.id} className="space-y-2 sm:space-y-3">
                    <div className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">
                      {intl.formatMessage({ id: 'assessment.questionLabel', defaultMessage: 'Pregunta' })} {index + 1} de {questions.length}
                    </div>
                    <QuestionCard
                      question={q}
                      answer={answers[q.id]}
                      onAnswer={(v) => setAnswerValue(q.id, v)}
                      onAddFiles={(files) => addFiles(q.id, files)}
                      onUploadComplete={(items) => addUploadedEvidence(q.id, items)}
                      onRemoveFile={(id) => removeFile(q.id, id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">{intl.formatMessage({ id: 'assessment.noQuestions', defaultMessage: 'No questions in this phase.' })}</div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="text-sm text-gray-400">
              {lastSaved
                ? `${intl.formatMessage({ id: 'assessment.save.savedPrefix', defaultMessage: 'Saved:' })} ${formatDateTime(lastSaved, dateFormat, language)}`
                : intl.formatMessage({ id: 'assessment.save.notSaved', defaultMessage: 'Not saved yet' })}
            </div>
          </div>
        </main>

        <ProgressSidebar phases={phases} progress={progress} onJumpTo={(id) => { setCurrentPhaseId(id); setCurrentQuestionIdx(0); }} />
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          durationMs={4000}
        />
      )}
    </div>
  );
}
