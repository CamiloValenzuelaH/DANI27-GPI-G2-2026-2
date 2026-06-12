"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, CloudUpload, FileText, RefreshCw, X } from "lucide-react";

import { storage } from "../../../api/client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { cn } from "../ui/utils";

const MAX_FILES = 20;
const MAX_RETRIES = 3;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"];
const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);
const ACCEPTED_LABEL = "PDF, DOCX, XLSX, PNG, JPG";

// Use VITE_API_URL as the base URL directly without manipulation
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Build endpoint URLs by appending to the base URL
const EVIDENCE_UPLOAD_URL = `${API_BASE_URL}/api/evidences`;
const VALIDATION_EXTERNAL_URL = `${API_BASE_URL}/api/validate/external`;

type UploadStatus = "queued" | "uploading" | "classifying" | "completed" | "failed";

export interface EvidenceMetadata {
  name: string;
  control_id: string;
  clause_ref: string;
  type: string;
  valid_until: string;
}

export interface ClassificationPreview {
  controlId: string;
  controlName?: string;
  confidence?: number;
  rationale?: string;
  raw: unknown;
}

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  retryCount: number;
  error?: string;
  uploadReference?: string;
  classification?: ClassificationPreview;
  metadata: EvidenceMetadata;
}

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (items: UploadItem[]) => void;
  questionId?: string;
}

interface FileDropZoneProps {
  disabled?: boolean;
  fileCount: number;
  onFilesSelected: (files: File[]) => void;
}

interface FileListProps {
  files: UploadItem[];
  onRemove?: (id: string) => void;
}

interface AIClassificationPreviewProps {
  fileName: string;
  classification?: ClassificationPreview;
  status: UploadStatus;
  error?: string;
}

interface MetadataFormProps {
  metadata: EvidenceMetadata;
  disabled?: boolean;
  onChange: (metadata: EvidenceMetadata) => void;
}

interface UploadProgressProps {
  progress: number;
  status: UploadStatus;
  attempts: number;
  error?: string;
  onRetry?: () => void;
}

const emptyMetadata = (fileName: string): EvidenceMetadata => ({
  name: fileName.replace(/\.[^.]+$/, ""),
  control_id: "",
  clause_ref: "",
  type: "",
  valid_until: "",
});

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const isAcceptedFile = (file: File): boolean => {
  const lowerName = file.name.toLowerCase();

  return (
    ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension)) ||
    ACCEPTED_MIME_TYPES.has(file.type)
  );
};

const dedupeFiles = (files: File[]): File[] => {
  const seen = new Set<string>();

  return files.filter((file) => {
    const key = `${file.name}-${file.size}-${file.lastModified}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim() ? value : undefined;
};

const getNumber = (value: unknown): number | undefined => {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};
const readEvidenceReference = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of ["evidence_id", "id", "file_id", "uuid", "file_path", "path", "url"] as const) {
    const direct = getString(record[key]);
    if (direct) {
      return direct;
    }
  }

  for (const key of ["data", "result", "payload"] as const) {
    const nested = readEvidenceReference(record[key]);
    if (nested) {
      return nested;
    }
  }

  return undefined;
};

const readClassificationPreview = (value: unknown): ClassificationPreview => {
  if (typeof value === "string") {
    return { controlId: value, raw: value };
  }

  if (!value || typeof value !== "object") {
    return { controlId: "ISO 27001", raw: value };
  }

  const record = value as Record<string, unknown>;
  const controlId =
    getString(record.control_id) ??
    getString(record.controlId) ??
    getString(record.control) ??
    getString(record.iso_control) ??
    getString(record.suggested_control) ??
    getString(record.suggestion) ??
    getString(record.title) ??
    "ISO 27001";

  return {
    controlId,
    controlName:
      getString(record.control_name) ??
      getString(record.controlName) ??
      getString(record.name) ??
      getString(record.reason) ??
      getString(record.justification),
    confidence: getNumber(record.confidence) ?? getNumber(record.score) ?? getNumber(record.probability),
    rationale:
      getString(record.rationale) ??
      getString(record.explanation) ??
      getString(record.message) ??
      getString(record.detail),
    raw: value,
  };
};

const deriveClauseFromControl = (controlId: string): string => {
  const match = controlId.match(/A\.[0-9]+(?:\.[0-9]+){0,2}/);
  return match?.[0] ?? "";
};

const enqueueExternalValidationJob = async (file: File): Promise<unknown> => {
  const token = storage.getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(VALIDATION_EXTERNAL_URL, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const requestWithAuth = async (url: string, init: RequestInit): Promise<Response> => {
  const token = storage.getToken();
  const headers = new Headers(init.headers ?? undefined);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    headers,
  });
};

const uploadFile = (
  item: UploadItem,
  onProgress: (progress: number) => void,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = storage.getToken();
    const formData = new FormData();
    const metadata = item.metadata;

    formData.append("file", item.file);
    formData.append("name", metadata.name || item.file.name);
    if (metadata.type?.trim()) {
      formData.append("type", metadata.type.trim().toUpperCase());
    }
    if (metadata.control_id?.trim()) {
      formData.append("control_id", metadata.control_id.trim());
    }
    const clauseRef = metadata.clause_ref?.trim() || deriveClauseFromControl(metadata.control_id || "");
    if (clauseRef) {
      formData.append("clause_ref", clauseRef);
    }

    xhr.open("POST", EVIDENCE_UPLOAD_URL);
    xhr.responseType = "text";

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      const responseText = xhr.responseText || "";

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(responseText || `Upload failed with status ${xhr.status}`));
        return;
      }

      if (!responseText.trim()) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(responseText));
      } catch {
        resolve(responseText);
      }
    };

    xhr.onerror = () => reject(new Error("No se pudo subir el archivo"));
    xhr.onabort = () => reject(new Error("La subida fue cancelada"));
    xhr.send(formData);
  });

const retryAsync = async <T,>(task: () => Promise<T>, attempts = MAX_RETRIES): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 350 * attempt);
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Error desconocido al procesar el archivo");
};

function FileDropZone({ disabled = false, fileCount, onFilesSelected }: FileDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFiles = React.useCallback(
    (files: File[]) => {
      if (!files.length || disabled) {
        return;
      }

      const accepted = dedupeFiles(files).filter(isAcceptedFile);
      const remainingSlots = Math.max(MAX_FILES - fileCount, 0);
      const slice = accepted.slice(0, remainingSlots);

      if (slice.length > 0) {
        onFilesSelected(slice);
      }
    },
    [disabled, fileCount, onFilesSelected],
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-slate-950/90 p-5 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition",
        isDragging && "border-cyan-400/70 bg-cyan-400/10",
        disabled && "opacity-60",
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_40%)]" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
            <CloudUpload className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-wide uppercase text-cyan-200">Carga masiva</p>
            <h3 className="text-lg font-semibold">Arrastra los archivos o selecciónalos manualmente</h3>
            <p className="text-sm text-slate-300">Acepta hasta {MAX_FILES} archivos simultáneos. Formatos permitidos: {ACCEPTED_LABEL}.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            disabled={disabled || fileCount >= MAX_FILES}
            onClick={() => inputRef.current?.click()}
            title="Seleccionar rápido: abre el selector de archivos para una carga rápida sin editar metadatos"
            aria-label="Seleccionar archivos rápido"
          >
            Seleccionar (rápido)
          </Button>
          <span className="text-xs text-slate-400">{fileCount}/{MAX_FILES} cargados</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
          onChange={(event) => {
            const files = event.target.files ? Array.from(event.target.files) : [];
            event.target.value = "";
            handleFiles(files);
          }}
        />
      </div>
    </div>
  );
}

function FileList({ files, onRemove }: FileListProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Archivos seleccionados</p>
          <p className="text-xs text-slate-400">Nombre, tamaño y estado en tiempo real</p>
        </div>
        <Badge variant="outline" className="border-white/10 text-slate-200">
          {files.length} archivo{files.length === 1 ? "" : "s"}
        </Badge>
      </div>
      <Separator className="bg-white/10" />
      <ul className="divide-y divide-white/10">
        {files.length === 0 ? (
          <li className="px-4 py-5 text-sm text-slate-400">Todavía no has agregado archivos.</li>
        ) : (
          files.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-slate-400" />
                  <p className="truncate text-sm font-medium text-slate-100">{item.file.name}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">{formatBytes(item.file.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                {onRemove && item.status !== 'uploading' && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function AIClassificationPreview({ fileName, classification, status, error }: AIClassificationPreviewProps) {
  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">AI Classification Preview</p>
          <h4 className="mt-1 text-sm font-medium text-slate-100">{fileName}</h4>
        </div>
        <Badge variant="outline" className="border-cyan-400/20 text-cyan-200">
          {status === "completed" ? "Clasificado" : status === "classifying" ? "Clasificando" : "Pendiente"}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 text-sm text-slate-200">
        <p>
          <span className="text-slate-400">Sugerencia ISO:</span>{" "}
          <span className="font-medium">{classification?.controlId ?? "Esperando respuesta del backend"}</span>
        </p>
        {classification?.controlName && (
          <p>
            <span className="text-slate-400">Detalle:</span> {classification.controlName}
          </p>
        )}
        {typeof classification?.confidence === "number" && (
          <p>
            <span className="text-slate-400">Confianza:</span> {Math.round(classification.confidence * 100)}%
          </p>
        )}
        {classification?.rationale && <p className="text-slate-300">{classification.rationale}</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>
    </div>
  );
}

function MetadataForm({ metadata, disabled = false, onChange }: MetadataFormProps) {
  const update = (patch: Partial<EvidenceMetadata>) => {
    onChange({ ...metadata, ...patch });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Metadata editable</p>
          <p className="text-xs text-slate-400">Actualiza nombre, control_id, tipo y fecha de validez</p>
        </div>
        <Badge variant="outline" className="border-white/10 text-slate-300">
          Inline
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Nombre</span>
          <Input
            value={metadata.name}
            disabled={disabled}
            onChange={(event) => update({ name: event.target.value })}
            placeholder="Nombre del archivo"
            className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">control_id</span>
          <Input
            value={metadata.control_id}
            disabled={disabled}
            onChange={(event) => update({ control_id: event.target.value })}
            placeholder="ISO 27001 A.5.1"
            className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">clause_ref</span>
          <Input
            value={metadata.clause_ref}
            disabled={disabled}
            onChange={(event) => update({ clause_ref: event.target.value })}
            placeholder="A.5.1"
            className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Tipo</span>
          <Input
            value={metadata.type}
            disabled={disabled}
            onChange={(event) => update({ type: event.target.value })}
            placeholder="POLICY, PROCEDURE, INSTRUCTION, CONTROL, RECORD"
            className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Fecha de validez</span>
          <Input
            type="date"
            value={metadata.valid_until}
            disabled={disabled}
            onChange={(event) => update({ valid_until: event.target.value })}
            className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
          />
        </label>
      </div>
    </div>
  );
}

function UploadProgress({ progress, status, attempts, error, onRetry }: UploadProgressProps) {
  const isFailed = status === "failed";
  const isActive = status === "uploading" || status === "classifying";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-100">Progreso</p>
          <p className="text-xs text-slate-400">
            {statusLabel(status)} · intento {Math.min(attempts, MAX_RETRIES)}/{MAX_RETRIES}
          </p>
        </div>
        {isFailed && onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        )}
      </div>

      <Progress value={status === "completed" ? 100 : progress} className="mt-3 bg-white/10" />

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>{isActive ? `${progress}% completado` : status === "completed" ? "Procesamiento finalizado" : "En espera"}</span>
        {isFailed && <span className="text-rose-300">{error ?? "Error inesperado"}</span>}
      </div>
    </div>
  );
}

function statusBadgeVariant(status: UploadStatus): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "uploading":
    case "classifying":
      return "outline";
    default:
      return "secondary";
  }
}

function statusLabel(status: UploadStatus): string {
  switch (status) {
    case "queued":
      return "En cola";
    case "uploading":
      return "Subiendo";
    case "classifying":
      return "Clasificando";
    case "completed":
      return "Completado";
    case "failed":
      return "Fallido";
    default:
      return status;
  }
}

export function UploadModal({ open, onOpenChange, onComplete, questionId }: UploadModalProps) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!open || !questionId) return;

    try {
      const historyKey = `evidence-upload-history:${questionId}`;
      const raw = localStorage.getItem(historyKey);
      const previous = raw ? JSON.parse(raw) : [];

      if (Array.isArray(previous) && previous.length > 0) {
        const fromHistory: UploadItem[] = previous
          .filter((h) => h && h.name)
          .map((h) => {
              const fileName = String(h.name || "unknown");
              const size = typeof h.size === "number" ? h.size : 0;
              const uploadRef = String(h.id || h.uploadReference || fileName + "-hist");

              // Create a lightweight File placeholder so UI can show name/size
              const placeholderFile = new File([new Uint8Array(0)], fileName, { type: "application/octet-stream" });

              const item: UploadItem = {
                id: createId(),
                file: placeholderFile,
                status: "completed",
                progress: 100,
                retryCount: 0,
                uploadReference: uploadRef,
                classification: {
                  controlId: h.controlId || h.control_id || h.control || "ISO 27001",
                  controlName: h.controlName || h.control_name,
                  confidence: typeof h.confidence === "number" ? h.confidence : undefined,
                  raw: h,
                },
                metadata: {
                  name: fileName.replace(/\.[^.]+$/, ""),
                  control_id: h.control_id || "",
                  clause_ref: h.clause_ref || "",
                  type: h.type || "",
                  valid_until: h.valid_until || "",
                },
              };

              return item;
            })
            .slice(0, MAX_FILES);

        if (fromHistory.length > 0) {
          setItems(fromHistory);
        }
      }
    } catch {
      // ignore storage parse errors
    }
  }, [open, questionId]);

  // If there is no explicit per-question history, fallback to attachments stored
  // inside the global `assessment-progress-v1` so users see previously uploaded
  // files even if the dedicated history key was never written.
  React.useEffect(() => {
    if (!open || !questionId) return;

    try {
      const historyKey = `evidence-upload-history:${questionId}`;
      const raw = localStorage.getItem(historyKey);

      if (raw) return; // already handled by previous effect

      const progressRaw = localStorage.getItem('assessment-progress-v1');
      if (!progressRaw) return;

      const progress = JSON.parse(progressRaw);
      const answers = progress?.answers || {};
      const q = answers[questionId];
      if (!q || !Array.isArray(q.attachments) || q.attachments.length === 0) return;

      const fromProgress: UploadItem[] = q.attachments
        .filter((a: any) => a && a.name)
        .map((a: any) => {
            const fileName = String(a.name || 'unknown');
            const size = typeof a.size === 'number' ? a.size : 0;
            const uploadRef = String(a.uploadReference || a.id || fileName + '-progress');

            const placeholderFile = new File([new Uint8Array(0)], fileName, { type: 'application/octet-stream' });

            const item: UploadItem = {
              id: createId(),
              file: placeholderFile,
              status: 'completed',
              progress: 100,
              retryCount: 0,
              uploadReference: uploadRef,
              classification: {
                controlId: a.controlId || a.control_id || 'ISO 27001',
                controlName: a.controlName || a.control_name,
                confidence: typeof a.confidence === 'number' ? a.confidence : undefined,
                raw: a,
              },
              metadata: {
                name: (a.metadata && a.metadata.name) || fileName.replace(/\.[^.]+$/, ''),
                control_id: a.metadata?.control_id || '',
                clause_ref: a.metadata?.clause_ref || '',
                type: a.metadata?.type || a.type || '',
                valid_until: a.metadata?.valid_until || '',
              },
            };

        return item;
      })
      .slice(0, MAX_FILES);

      if (fromProgress.length > 0) {
        setItems(fromProgress);
      }
    } catch {
      // ignore
    }
  }, [open, questionId]);

  const queuedCount = React.useMemo(() => items.filter((item) => item.status === "queued" || item.status === "failed").length, [items]);
  const completedCount = React.useMemo(() => items.filter((item) => item.status === "completed").length, [items]);

  const addFiles = React.useCallback(
    (files: File[]) => {
      setGlobalError(null);
      setItems((current) => {
        const availableSlots = Math.max(MAX_FILES - current.length, 0);
        const accepted = dedupeFiles(files).filter(isAcceptedFile).slice(0, availableSlots);

        if (accepted.length === 0) {
          if (files.length > 0) {
            setGlobalError(`Solo se admiten archivos ${ACCEPTED_LABEL}.`);
          }
          return current;
        }

        return [
          ...current,
          ...accepted.map((file) => ({
            id: createId(),
            file,
            status: "queued" as UploadStatus,
            progress: 0,
            retryCount: 0,
            metadata: emptyMetadata(file.name),
          })),
        ];
      });
    },
    [],
  );

  const updateItem = React.useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const processItem = React.useCallback(
    async (item: UploadItem): Promise<UploadItem> => {
      const uploadResult = await retryAsync(async () => {
        updateItem(item.id, { status: "uploading", progress: 0, error: undefined, retryCount: item.retryCount + 1 });

        const response = await uploadFile(item, (progress) => {
          updateItem(item.id, { progress: Math.min(progress, 99) });
        });

        const reference = readEvidenceReference(response) ?? item.file.name;
        updateItem(item.id, { progress: 100, uploadReference: reference });
        return response;
      });

      updateItem(item.id, { status: "classifying" });
      const validationResult = await retryAsync(async () => enqueueExternalValidationJob(item.file));
      const classificationResult = readClassificationPreview(validationResult ?? uploadResult);

      updateItem(item.id, {
        status: "completed",
        progress: 100,
        classification: classificationResult,
        error: undefined,
        uploadReference: readEvidenceReference(uploadResult) ?? item.file.name,
      });

      const completedItem: UploadItem = {
        ...item,
        status: "completed",
        progress: 100,
        classification: classificationResult,
        error: undefined,
        uploadReference: readEvidenceReference(uploadResult) ?? item.file.name,
      };

      return completedItem;
    },
    [updateItem],
  );

  const handleUpload = React.useCallback(async () => {
    const pending = items.filter((item) => item.status === "queued" || item.status === "failed");

    if (pending.length === 0) {
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);

    const results = await Promise.allSettled(pending.map((item) => processItem(item)));
    const failed = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;

    if (failed) {
      const message = failed.reason instanceof Error ? failed.reason.message : "No se pudo completar la carga";

      setGlobalError(message);
      setItems((current) =>
        current.map((item) =>
          item.status === "uploading" || item.status === "classifying"
            ? { ...item, status: "failed", error: message }
            : item,
        ),
      );
    }

    setIsProcessing(false);

    const completedItems = results
      .filter((result): result is PromiseFulfilledResult<UploadItem> => result.status === "fulfilled")
      .map((result) => result.value);

    if (questionId && completedItems.length > 0) {
      const historyKey = `evidence-upload-history:${questionId}`;
      const nextHistoryItems = completedItems.map((item) => ({
        id: item.uploadReference || item.id,
        name: item.file.name,
        size: item.file.size,
        controlId: item.classification?.controlId,
        controlName: item.classification?.controlName,
        confidence: item.classification?.confidence,
        uploadedAt: new Date().toISOString(),
      }));

      try {
        const raw = localStorage.getItem(historyKey);
        const previous = raw ? JSON.parse(raw) : [];
        const merged = [...nextHistoryItems, ...(Array.isArray(previous) ? previous : [])].slice(0, 25);
        localStorage.setItem(historyKey, JSON.stringify(merged));
      } catch {
        // ignore storage failures
      }

      window.dispatchEvent(
        new CustomEvent('assessment:evidence-uploaded', {
          detail: {
            questionId,
            attachments: completedItems.map((item) => ({
              id: item.uploadReference || item.id,
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
                clause_ref: item.metadata?.clause_ref,
                type: item.metadata?.type,
                valid_until: item.metadata?.valid_until,
              },
              source: 'advanced' as const,
            })),
          },
        }),
      );
    }

    if (completedItems.length > 0) {
      onComplete?.(completedItems);
    }
  }, [items, onComplete, processItem, questionId]);

  const retryItem = React.useCallback(
    async (id: string) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      setGlobalError(null);
      setIsProcessing(true);

      try {
        await processItem(item);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo reintentar el archivo";
        updateItem(id, { status: "failed", error: message });
      } finally {
        setIsProcessing(false);
      }
    },
    [items, processItem, updateItem],
  );

  const handleClose = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isProcessing) {
        return;
      }

      onOpenChange(nextOpen);
    },
    [isProcessing, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="fixed inset-0 z-50 m-0 flex h-screen w-screen flex-col overflow-hidden border-none bg-slate-950 p-0 text-slate-50 shadow-none !left-0 !top-0 !max-w-none !rounded-none !translate-x-0 !translate-y-0">
        <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(15,23,42,0.4))] px-6 py-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-50">Upload Evidence</DialogTitle>
            <DialogDescription className="max-w-3xl text-sm text-slate-300">
              Flujo DANI-FE-022: carga por archivo en taxonomía ISO y edición inline de metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <Badge variant="outline" className="border-white/10 text-slate-200">Máximo {MAX_FILES} archivos</Badge>
            <Badge variant="outline" className="border-white/10 text-slate-200">Formatos {ACCEPTED_LABEL}</Badge>
            <Badge variant="outline" className="border-white/10 text-slate-200">POST /api/evidences</Badge>
            <Badge variant="outline" className="border-white/10 text-slate-200">POST /api/validate/external</Badge>
          </div>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[360px_1fr]">
          <aside className="min-h-0 border-b border-white/10 bg-slate-950/95 p-6 lg:border-b-0 lg:border-r lg:overflow-hidden">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <FileDropZone disabled={isProcessing} fileCount={items.length} onFilesSelected={addFiles} />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Estado general</p>
                    <p className="text-xs text-slate-400">Resumen de la cola actual</p>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-slate-200">
                    {completedCount}/{items.length || 0} listos
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Pendientes</p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">{queuedCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">Completados</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">{completedCount}</p>
                  </div>
                </div>

                {globalError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{globalError}</span>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <FileList files={items} onRemove={isProcessing ? undefined : removeItem} />
              </div>
            </div>
          </aside>

          <section className="min-h-0 overflow-hidden bg-slate-950 px-6 py-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="flex min-h-[36vh] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20">
                      <FileText className="size-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-100">No hay archivos aún</h3>
                    <p className="mt-2 max-w-md text-sm text-slate-400">
                      Agrega hasta {MAX_FILES} archivos y luego ejecuta la carga para obtener la sugerencia de control ISO.
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-slate-400" />
                            <h4 className="text-base font-semibold text-slate-50">{item.file.name}</h4>
                          </div>
                          <p className="text-sm text-slate-400">{formatBytes(item.file.size)} · {statusLabel(item.status)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                          <Badge variant="outline" className="border-white/10 text-slate-300">
                            {item.file.type || "mime desconocido"}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                          <AIClassificationPreview
                            fileName={item.file.name}
                            classification={item.classification}
                            status={item.status}
                            error={item.error}
                          />
                          <UploadProgress
                            progress={item.progress}
                            status={item.status}
                            attempts={item.retryCount}
                            error={item.error}
                            onRetry={item.status === "failed" ? () => retryItem(item.id) : undefined}
                          />
                        </div>

                        <MetadataForm
                          metadata={item.metadata}
                          disabled={isProcessing}
                          onChange={(metadata) => updateItem(item.id, { metadata })}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </section>
        </div>

        <DialogFooter className="relative z-20 shrink-0 border-t border-white/10 bg-slate-950 px-6 py-4 sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="size-4 text-emerald-300" />
            <span>Cada subida crea o actualiza la evidencia documental en la taxonomía ISO.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" onClick={() => handleClose(false)} disabled={isProcessing}>
              Cerrar
            </Button>
            <Button
              type="button"
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={handleUpload}
              disabled={isProcessing || queuedCount === 0}
            >
              <RefreshCw className={cn("size-4", isProcessing && "animate-spin")} />
              {isProcessing ? "Procesando" : queuedCount > 0 ? `Subir ${queuedCount} archivo${queuedCount === 1 ? "" : "s"}` : "Sin archivos pendientes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UploadModal;
export { AIClassificationPreview, FileDropZone, FileList, MetadataForm, UploadProgress };