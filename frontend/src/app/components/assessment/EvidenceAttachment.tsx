import React, { useCallback, useRef } from 'react';

export default function EvidenceAttachment({
  attachments = [],
  onAdd,
  onRemove,
}: {
  attachments?: { id: string; name: string; size: number }[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onAdd(files);
  }, [onAdd]);

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-700 rounded-md p-4 text-sm text-gray-300 bg-gray-800"
      >
        <div className="flex items-center justify-between">
          <div>Arrastra y suelta evidencias aquí, o</div>
          <button
            onClick={() => inputRef.current?.click()}
            className="ml-4 px-3 py-1 bg-indigo-600 rounded text-white text-sm"
          >
            Seleccionar
          </button>
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
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between bg-gray-900 p-2 rounded">
            <span className="text-sm">{a.name} · {(a.size / 1024).toFixed(1)} KB</span>
            <button onClick={() => onRemove(a.id)} className="text-xs text-red-400">Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
