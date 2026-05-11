import React, { useEffect, useMemo, useState } from 'react';
import data from '../../../data/example-data.json';
import PhaseSelector from './PhaseSelector';
import QuestionCard from './QuestionCard';
import ProgressSidebar from './ProgressSidebar';
import useAutosave from '../../hooks/useAutosave';
import { loadProgressLocal, saveProgressLocal } from '../../lib/storage';

type Phase = any;

export default function AssessmentPage() {
  const phases: Phase[] = (data as any).phases || [];
  const [currentPhaseId, setCurrentPhaseId] = useState<string>(phases[0]?.id || '');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await loadProgressLocal();
      if (stored) {
        setAnswers(stored.answers || {});
        setCurrentPhaseId(stored.currentPhaseId || phases[0]?.id || '');
        setCurrentQuestionIdx(stored.currentQuestionIdx || 0);
        setLastSaved(stored.lastSaved || null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPhase = useMemo(() => phases.find((p) => p.id === currentPhaseId) || phases[0], [phases, currentPhaseId]);
  const questions = currentPhase?.questions || [];
  const question = questions[currentQuestionIdx] || null;

  const setAnswerValue = (questionId: string, value: any) => {
    setAnswers((s) => ({ ...s, [questionId]: { ...(s[questionId] || {}), value, updatedAt: new Date().toISOString() } }));
  };

  const addFiles = (questionId: string, files: File[]) => {
    const metas = files.map((f) => ({ id: `${Date.now()}-${f.name}`, name: f.name, size: f.size }));
    setAnswers((s) => {
      const prev = s[questionId] || { attachments: [] };
      return { ...s, [questionId]: { ...prev, attachments: [...(prev.attachments || []), ...metas], updatedAt: new Date().toISOString() } };
    });
  };

  const removeFile = (questionId: string, id: string) => {
    setAnswers((s) => {
      const prev = s[questionId] || { attachments: [] };
      return { ...s, [questionId]: { ...prev, attachments: (prev.attachments || []).filter((a: any) => a.id !== id) } };
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
