import React, { useEffect, useMemo, useState } from 'react';
import { getPhases, getPhaseQuestions, postAnswer } from '../../../api/assessment';
import PhaseSelector from './PhaseSelector';
import QuestionCard from './QuestionCard';
import ProgressSidebar from './ProgressSidebar';
import useAutosave from '../../hooks/useAutosave';
import { loadProgressLocal, saveProgressLocal } from '../../lib/storage';
import type { AssessmentAttachment } from './EvidenceAttachment';

type Phase = any;

export default function AssessmentPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhaseId, setCurrentPhaseId] = useState<string>('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await loadProgressLocal();
      if (stored) {
        setAnswers(stored.answers || {});
        setCurrentPhaseId(stored.currentPhaseId || '');
        setCurrentQuestionIdx(stored.currentQuestionIdx || 0);
        setLastSaved(stored.lastSaved || null);
      }

      // fetch phases from API
      try {
        const remote = await getPhases()
        // map to expected shape (id as string)
        const mapped = remote.map((p) => ({ ...p, id: String(p.id), questions: [] }))
        setPhases(mapped)
        if (!stored) setCurrentPhaseId(mapped[0]?.id || '')
      } catch (err) {
        // keep empty phases on error
        // console.error(err)
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
  const question = questions[currentQuestionIdx] || null;

  // fetch questions when phase changes
  useEffect(() => {
    (async () => {
      if (!currentPhaseId) return
      try {
        const qs = await getPhaseQuestions(currentPhaseId)
        setPhases((prev) => prev.map((p) => (p.id === currentPhaseId ? { ...p, questions: qs.map((q) => ({ ...q, id: String(q.id) })) } : p)))
      } catch (err) {
        // ignore
      }
    })()
  }, [currentPhaseId])

  const setAnswerValue = (questionId: string, value: any) => {
    setAnswers((s) => ({ ...s, [questionId]: { ...(s[questionId] || {}), value, updatedAt: new Date().toISOString() } }));

    // send to backend (fire-and-forget)
    try {
      const questionIdNumber = Number(questionId)
      postAnswer({ question_id: questionIdNumber, answer: value?.value ?? value, notes: value?.notes })
    } catch (err) {
      // ignore
    }
  };

  const addFiles = (questionId: string, files: File[]) => {
    const metas: AssessmentAttachment[] = files.map((f, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 10)}-${f.name}`,
      name: f.name,
      size: f.size,
      source: 'manual',
    }));
    setAnswers((s) => {
      const prev = s[questionId] || { attachments: [] };
      return { ...s, [questionId]: { ...prev, attachments: [...(prev.attachments || []), ...metas], updatedAt: new Date().toISOString() } };
    });
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

  const saveNow = async () => {
    const payload = { answers, currentPhaseId, currentQuestionIdx, lastSaved: new Date().toISOString() };
    await saveProgressLocal(payload);
    setLastSaved(payload.lastSaved);
  };

  useAutosave(saveNow, 2000, [answers, currentPhaseId, currentQuestionIdx]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <main>
          <PhaseSelector phases={phases} currentPhaseId={currentPhaseId} onSelect={(id) => { setCurrentPhaseId(id); setCurrentQuestionIdx(0); }} />

          <div className="mt-6">
            {question ? (
              <QuestionCard
                question={question}
                answer={answers[question.id]}
                onAnswer={(v) => setAnswerValue(question.id, v)}
                onAddFiles={(files) => addFiles(question.id, files)}
                onUploadComplete={(items) => addUploadedEvidence(question.id, items)}
                onRemoveFile={(id) => removeFile(question.id, id)}
              />
            ) : (
              <div className="text-gray-400">No hay preguntas en esta fase.</div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentQuestionIdx((i) => Math.max(0, i - 1))}
              className="px-4 py-2 bg-gray-800 rounded"
            >
              Anterior
            </button>
            <div className="text-sm text-gray-400">{lastSaved ? `Guardado: ${new Date(lastSaved).toLocaleTimeString()}` : 'Sin guardar aún'}</div>
            <button
              onClick={() => setCurrentQuestionIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="px-4 py-2 bg-indigo-600 rounded text-white"
            >
              Siguiente
            </button>
          </div>
        </main>

        <ProgressSidebar phases={phases} progress={progress} onJumpTo={(id) => { setCurrentPhaseId(id); setCurrentQuestionIdx(0); }} />
      </div>
    </div>
  );
}
