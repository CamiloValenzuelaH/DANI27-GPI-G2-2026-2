import React, { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import UploadModal from '../uploader/UploadModal';
import type { UploadItem } from '../uploader/UploadModal';

const DEFAULT_VISIBLE_ATTACHMENTS = 5;

type UploadedHistoryItem = {
  id: string;
  name: string;
  size: number;
  controlId?: string;
  controlName?: string;
  confidence?: number;
  uploadedAt: string;
};

export type AssessmentAttachment = {
  id: string;
  name: string;
  size: number;
  uploadedAt?: string;
  uploadReference?: string;
  controlId?: string;
  controlName?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  source?: 'manual' | 'advanced';
  removed?: boolean;
};

export default function EvidenceAttachment({
  questionId,
  attachments = [],
  onAdd,
  onUploadComplete,
  onRemove,
}: {
  questionId: string;
  attachments?: AssessmentAttachment[];
  onAdd: (files: File[]) => void;
  onUploadComplete?: (items: AssessmentAttachment[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const historyKey = `evidence-upload-history:${questionId}`;
  const [history, setHistory] = useState<UploadedHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onAdd(files);
  }, [onAdd]);

  const persistHistory = useCallback((nextHistoryItems: UploadedHistoryItem[]) => {
    if (nextHistoryItems.length === 0) {
      return;
    }

    const merged = [...nextHistoryItems, ...history].slice(0, 25);
    try {
      localStorage.setItem(historyKey, JSON.stringify(merged));
    } catch {
      // ignore storage failures
    }
    setHistory(merged);
  }, [history, historyKey]);

  const handleUploaderComplete = useCallback((items: UploadItem[]) => {
    const completed = items.filter((item) => item.status === 'completed');

    const completedAttachments: AssessmentAttachment[] = completed.map((item) => ({
      id: item.id,
      name: item.file.name,
      size: item.file.size,
      uploadedAt: new Date().toISOString(),
      uploadReference: item.uploadReference || item.id,
      controlId: item.classification?.controlId,
      controlName: item.classification?.controlName,
      confidence: item.classification?.confidence,
      metadata: {
        name: item.metadata?.name,
        control_id: item.metadata?.control_id,
        type: item.metadata?.type,
        valid_until: item.metadata?.valid_until,
      },
      source: 'advanced',
    }));

    const nextHistoryItems: UploadedHistoryItem[] = completedAttachments.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      controlId: item.controlId,
      controlName: item.controlName,
      confidence: item.confidence,
      uploadedAt: item.uploadedAt ?? new Date().toISOString(),
    }));

    persistHistory(nextHistoryItems);

    if (completedAttachments.length > 0) {
      onUploadComplete?.(completedAttachments);
      window.dispatchEvent(
        new CustomEvent('assessment:evidence-uploaded', {
          detail: { questionId, attachments: completedAttachments },
        }),
      );
    }

    setShowUploader(false);
  }, [onUploadComplete, persistHistory, questionId]);

  const hasAttachmentOverflow = attachments.length > DEFAULT_VISIBLE_ATTACHMENTS;
  const visibleAttachments = showAllAttachments ? attachments : attachments.slice(0, DEFAULT_VISIBLE_ATTACHMENTS);
  const hiddenAttachmentCount = Math.max(attachments.length - DEFAULT_VISIBLE_ATTACHMENTS, 0);

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-700 rounded-md p-4 text-sm text-gray-300 bg-gray-800"
      >
        <div className="flex items-center justify-between">
          <div>Arrastra y suelta evidencias aquí, o</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="ml-4 px-3 py-1 bg-indigo-600 rounded text-white text-sm"
              title="Seleccionar rápido: abre el selector de archivos para subir sin entrar al modo avanzado"
              aria-label="Seleccionar archivos rápido"
            >
              Seleccionar (rápido)
            </button>
            <button
              onClick={() => setShowUploader(true)}
              className="ml-2 px-3 py-1 bg-cyan-600 rounded text-white text-sm"
              type="button"
            >
              Uploader avanzado
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            if (files.length) onAdd(files);
          }}
        />
      </div>

      <ul className="mt-3 space-y-2">
        {visibleAttachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between bg-gray-900 p-2 rounded">
            {a.removed ? (
              <>
                <span className="text-sm text-gray-400">Archivo eliminado</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-xs text-cyan-300"
                  >
                    Reemplazar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm">
                  {a.name} · {(a.size / 1024).toFixed(1)} KB
                  {a.controlId ? ` · ${a.controlId}` : ''}
                </span>
                <button
                  onClick={() => onRemove(a.id)}
                  title="Eliminar archivo"
                  className="ml-3 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-red-400 hover:bg-white/5 hover:text-red-300 pointer-events-auto"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {hasAttachmentOverflow && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
            onClick={() => setShowAllAttachments((prev) => !prev)}
          >
            {showAllAttachments ? 'Ver menos' : `Ver ${hiddenAttachmentCount} más`}
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-3 rounded-md border border-gray-700 bg-gray-900 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-400">Últimas cargas</p>
          <ul className="mt-2 space-y-2">
            {history.slice(0, 5).map((item) => (
              <li key={`${item.id}-${item.uploadedAt}`} className="rounded bg-gray-800 p-2 text-xs text-gray-200">
                <div className="font-medium text-gray-100">{item.name}</div>
                <div className="text-gray-400">{(item.size / 1024).toFixed(1)} KB · {new Date(item.uploadedAt).toLocaleTimeString()}</div>
                {item.controlId && (
                  <div className="text-cyan-300">
                    {item.controlId}
                    {item.controlName ? ` · ${item.controlName}` : ''}
                    {typeof item.confidence === 'number' ? ` · ${Math.round(item.confidence * 100)}%` : ''}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <UploadModal open={showUploader} onOpenChange={setShowUploader} onComplete={handleUploaderComplete} questionId={questionId} />
    </div>
  );
}
