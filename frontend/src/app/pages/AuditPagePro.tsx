import { useEffect, useMemo, useState, useRef } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Upload, FileUp } from 'lucide-react';
import type { AuditValidationResponse, AuditChecklistItem } from '../../api/audit';
import { getAuditChecklist, saveAuditChecklist, validateAudit } from '../../api/audit';
import {
  enqueueExternalValidation,
  generateMissingForChunk,
  type ChunkValidationResult,
  type GenerateMissingResponse,
  type ValidationReportResponse,
} from '../../api/externalValidation';
import { useValidationJob } from '../contexts/ValidationJobContext';
import { usePreferences } from '../components/AppShell';
import { formatDateTime } from '../lib/date';
import { translations } from '../types';
import ValidationHistory from '../components/ValidationHistory';
import AuditRoomPanel from '../components/AuditRoomPanel';

export default function AuditPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, dateFormat } = usePreferences();
  const intl = {
    formatMessage: ({ id, defaultMessage }: { id: string; defaultMessage?: string }) => {
      const messages = translations[language] as Record<string, string>;
      return messages[id] ?? defaultMessage ?? id;
    },
  };
  const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });
  
  const [title, setTitle] = useState(t('audit.titlePlaceholder', 'Example: Physical Security Assessment'));
  const [description, setDescription] = useState(t('audit.descriptionPlaceholder', 'Brief description of the audit'));
  const [evidenceText, setEvidenceText] = useState(
    'We have 5 physical servers in the main meeting room. The servers are on the conference table and any visitor can see them.'
  );
  const [auditType, setAuditType] = useState<'security' | 'compliance' | 'operational' | 'financial'>('security');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  const [auditResponse, setAuditResponse] = useState<AuditValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File validation states
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [externalValidationJob, setExternalValidationJob] = useState<ValidationReportResponse | null>(null);
  const [externalValidationReport, setExternalValidationReport] = useState<ValidationReportResponse | null>(null);
  const [externalValidationError, setExternalValidationError] = useState<string | null>(null);
  const [missingGenerationLoadingByChunk, setMissingGenerationLoadingByChunk] = useState<Record<string, boolean>>({});
  const [missingGenerationErrorByChunk, setMissingGenerationErrorByChunk] = useState<Record<string, string>>({});
  const [missingGenerationResultByChunk, setMissingGenerationResultByChunk] = useState<Record<string, GenerateMissingResponse>>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [checklistItems, setChecklistItems] = useState<AuditChecklistItem[]>([]);
  const [checklistLoaded, setChecklistLoaded] = useState(false);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [checklistDirty, setChecklistDirty] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [lastChecklistSavedAt, setLastChecklistSavedAt] = useState<string | null>(null);

  const checklistCompletion = useMemo(() => {
    if (!checklistItems.length) return 0;
    const doneCount = checklistItems.filter(item => item.status === 'done').length;
    return Math.round((doneCount / checklistItems.length) * 100);
  }, [checklistItems]);

  const checklistSaveLabel = useMemo(() => {
    if (checklistSaving) return t('audit.checklistSaving', 'Saving...');
    if (checklistDirty) return t('audit.checklistDirty', 'Pending changes');
    if (lastChecklistSavedAt) {
      return `${t('audit.savedAt', 'Saved')} ${formatDateTime(lastChecklistSavedAt, dateFormat, language)}`;
    }
    return t('audit.noChanges', 'No changes');
  }, [checklistSaving, checklistDirty, lastChecklistSavedAt, t, dateFormat, language]);

  const getChecklistTitle = (item: AuditChecklistItem) => {
    return t(`audit.checklist.${item.control_code}`, item.title);
  };

  useEffect(() => {
    setTitle(t('audit.titlePlaceholder', 'Example: Physical Security Assessment'));
    setDescription(t('audit.descriptionPlaceholder', 'Brief description of the audit'));
    setEvidenceText(
      t(
        'audit.evidenceSeed',
        'We have 5 physical servers in the main meeting room. The servers are on the conference table and any visitor can see them.'
      )
    );
  }, [intl.locale]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAuditChecklist();
        if (!active) return;
        setChecklistItems(data.items);
        setLastChecklistSavedAt(data.updated_at);
      } catch (err) {
        if (!active) return;
        setChecklistError(t('audit.checklistLoadError', 'Could not load the checklist'));
      } finally {
        if (active) setChecklistLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!checklistLoaded || !checklistDirty) return;

    const timeout = setTimeout(async () => {
      try {
        setChecklistSaving(true);
        setChecklistError(null);
        const data = await saveAuditChecklist({ items: checklistItems });
        setChecklistItems(data.items);
        setLastChecklistSavedAt(data.updated_at);
        setChecklistDirty(false);
      } catch {
        setChecklistError(t('audit.checklistSaveError', 'Could not save the checklist'));
      } finally {
        setChecklistSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [checklistItems, checklistDirty, checklistLoaded]);

  const updateChecklistItem = (
    itemId: string,
    patch: Partial<Pick<AuditChecklistItem, 'status' | 'notes'>>
  ) => {
    setChecklistItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
    setChecklistDirty(true);
  };

  // validation SSE handled by ValidationJobContext
  const { activeJob, subscribe } = useValidationJob();

  useEffect(() => {
    if (!activeJob) {
      setExternalValidationJob(null);
      setExternalValidationReport(null);
      return;
    }

    const interim: ValidationReportResponse = {
      job_id: activeJob.jobId,
      status: activeJob.status,
      progress: activeJob.progress,
      message: (activeJob.result && (activeJob.result.message ?? undefined)) as any,
      total_chunks: (activeJob.result && (activeJob.result.total_chunks ?? 0)) as any,
      findings: (activeJob.result && (activeJob.result.findings ?? [])) as any,
    } as ValidationReportResponse;

    setExternalValidationJob(interim);
    if (activeJob.result) setExternalValidationReport(activeJob.result as ValidationReportResponse);
    else setExternalValidationReport(interim);
  }, [activeJob]);

  const forceSaveChecklist = async () => {
    try {
      setChecklistSaving(true);
      setChecklistError(null);
      const data = await saveAuditChecklist({ items: checklistItems });
      setChecklistItems(data.items);
      setLastChecklistSavedAt(data.updated_at);
      setChecklistDirty(false);
    } catch {
      setChecklistError(t('audit.checklistSaveError', 'Could not save the checklist'));
    } finally {
      setChecklistSaving(false);
    }
  };

  const onValidateAudit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await validateAudit({
        title,
        description,
        evidence_text: evidenceText,
        audit_type: auditType,
        priority
      });
      setAuditResponse(response);
    } catch (err) {
      setAuditResponse(null);
      if (err instanceof Error) {
        setErrorMessage(`${t('audit.validationError', 'Validation error')}: ${err.message}`);
      } else {
        setErrorMessage(t('audit.validationUnknownError', 'Unknown validation error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onValidateFile = async (file: File) => {
    if (!file) return;

    setIsValidatingFile(true);
    setFileError(null);
    setExternalValidationError(null);
    setExternalValidationJob(null);
    setExternalValidationReport(null);
    setMissingGenerationLoadingByChunk({});
    setMissingGenerationErrorByChunk({});
    setMissingGenerationResultByChunk({});
    // event subscription now handled by ValidationJobContext

    try {
      const job = await enqueueExternalValidation(file);
      const queuedState: ValidationReportResponse = {
        job_id: job.job_id,
        status: 'queued',
        progress: 0,
        message: t('audit.jobQueued', 'Job queued'),
        total_chunks: 0,
        findings: [],
      };
      setExternalValidationJob(queuedState);
      setExternalValidationReport(queuedState);

      try {
        // Use context to subscribe to SSE for this job
        await subscribe(job.job_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('audit.unknownError', 'Unknown error');
        setExternalValidationError(`${t('audit.granularValidationStartError', 'Could not start granular validation')}: ${message}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('audit.unknownError', 'Unknown error');
      setFileError(`${t('audit.fileValidationError', 'File validation error')}: ${errorMsg}`);
      setExternalValidationError(`${t('audit.granularValidationStartError', 'Could not start granular validation')}: ${errorMsg}`);
    } finally {
      setIsValidatingFile(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      onValidateFile(file);
    }
  };

  const onGenerateMissingForFinding = async (finding: ChunkValidationResult) => {
    const currentJobId = externalValidationReport?.job_id;
    const chunkId = finding.clause_ref;

    if (!currentJobId || !chunkId) {
      return;
    }

    setMissingGenerationLoadingByChunk((previous) => ({ ...previous, [chunkId]: true }));
    setMissingGenerationErrorByChunk((previous) => ({ ...previous, [chunkId]: '' }));

    try {
      const result = await generateMissingForChunk(currentJobId, chunkId);
      setMissingGenerationResultByChunk((previous) => ({ ...previous, [chunkId]: result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('audit.unknownError', 'Unknown error');
      setMissingGenerationErrorByChunk((previous) => ({ ...previous, [chunkId]: message }));
    } finally {
      setMissingGenerationLoadingByChunk((previous) => ({ ...previous, [chunkId]: false }));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'non_compliant': return 'text-red-600';
      case 'needs_review': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDocumentStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETO': return 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40';
      case 'INCOMPLETO': return 'bg-amber-600/25 text-amber-300 border-amber-500/40';
      case 'INEXISTENTE': return 'bg-rose-700/25 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-700/25 text-slate-300 border-slate-500/40';
    }
  };

  const getDocumentStatusLabel = (status?: string) => {
    if (status === 'COMPLETO' || status === 'INCOMPLETO' || status === 'INEXISTENTE') {
      return status;
    }
    return t('audit.statusUnknown', 'SIN ESTADO');
  };

  // Cleanup handled by ValidationJobContext

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Principal - Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="mb-8 rounded-3xl border border-slate-700 bg-[#111827] p-6 shadow-[0_15px_45px_-25px_rgba(0,0,0,0.7)]">
            <h1 className="text-3xl font-bold text-white mb-2">{t('audit.title', 'Compliance Audit')}</h1>
            <p className="text-slate-300">{t('audit.subtitle', 'Validate your evidence against ISO 27001 standards')}</p>
          </div>

          {/* Validación de Archivos con Agente */}
          <div className="bg-slate-900/95 border border-slate-800/80 shadow-xl rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-5 h-5 text-[#4F6EF7]" />
              <h2 className="text-lg font-bold text-white">{t('audit.fileValidatorTitle', 'Validate File with Agent')}</h2>
            </div>
            
            {/* File Drop Area */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onValidateFile(file);
              }}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.png,.xlsx,.xls"
            />
            
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[28px] p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-[#1DB954] bg-[#1DB954]/12 shadow-[0_20px_60px_-30px_rgba(29,185,84,0.55)] scale-105'
                  : 'border-[#4F6EF7] bg-slate-950/70 hover:bg-slate-950/90 hover:border-[#4F6EF7]/80'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragActive ? 'text-[#1DB954]' : 'text-[#4F6EF7]'}`} />
              <p className="text-white font-medium">{isDragActive ? t('audit.dropNow', 'Drop your file here') : t('audit.dropHint', 'Click or drag a file')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('audit.dropSubHint', 'PDF, Word, Excel, Text, Images (max 10MB)')}</p>
            </div>

            {isValidatingFile && (
              <div className="mt-4 p-4 bg-slate-950/90 rounded-2xl text-center border border-slate-800/80">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#4F6EF7] border-t-transparent"></div>
                <p className="text-white text-sm ml-2 inline">{t('audit.processing', 'Processing granular validation...')}</p>
              </div>
            )}

            {externalValidationJob && (
              <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg shadow-slate-950/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">{t('audit.jobId', 'Job ID')}</p>
                    <p className="text-white text-sm font-medium break-all">{externalValidationJob.job_id}</p>
                  </div>
                  <div className={`text-sm font-semibold ${getStatusColor(externalValidationJob.status)}`}>
                    {externalValidationJob.status.toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>{t('audit.progress', 'Progress')}</span>
                    <span>{externalValidationJob.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4F6EF7] to-[#1DB954] transition-all duration-300"
                      style={{ width: `${externalValidationJob.progress}%` }}
                    />
                  </div>
                </div>

                {externalValidationJob.message && (
                  <p className="text-gray-300 text-sm">{externalValidationJob.message}</p>
                )}
              </div>
            )}

            {fileError && (
              <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-600 text-sm">{fileError}</div>
              </div>
            )}

            {externalValidationError && (
              <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-600 text-sm">{externalValidationError}</div>
              </div>
            )}

            {externalValidationReport && externalValidationReport.status === 'completed' && (
              <div className="mt-4 space-y-3">
                <div className="bg-slate-950/90 p-4 rounded-3xl border border-slate-800/80 shadow-sm">
                  <p className="text-slate-400 text-sm mb-1">{t('audit.file', 'File')}</p>
                  <p className="text-white font-medium">{externalValidationReport.file_name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/90 p-4 rounded-3xl border border-slate-800/80 shadow-sm">
                    <p className="text-gray-400 text-sm mb-1">{t('audit.avgCompliance', 'Average compliance')}</p>
                    <p className={`text-2xl font-bold ${getComplianceScoreColor(externalValidationReport.overall_score ?? 0)}`}>
                      {externalValidationReport.overall_score ?? 0}%
                    </p>
                  </div>
                  <div className="bg-slate-950/90 p-4 rounded-3xl border border-slate-800/80 shadow-sm">
                    <p className="text-slate-400 text-sm mb-1">{t('audit.status', 'Status')}</p>
                    <p className={`font-medium ${getStatusColor(externalValidationReport.status)}`}>
                      {externalValidationReport.status === 'completed' ? `✓ ${t('audit.validationCompleted', 'Validation completed')}` : externalValidationReport.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-3xl border border-slate-800/80 shadow-sm">
                  <p className="text-slate-400 text-sm mb-2">{t('audit.summary', 'Summary')}</p>
                  <p className="text-white text-sm">{externalValidationReport.summary}</p>
                </div>

                {externalValidationReport.findings.length > 0 && (
                  <div className="bg-slate-950/90 p-4 rounded-3xl border border-slate-800/80 shadow-sm">
                    <p className="text-gray-400 text-sm mb-3">{t('audit.findingsByChunk', 'Findings by ISO chunk')}</p>
                    <div className="mb-4">
                      <p className="text-gray-400 text-xs mb-2">{t('audit.heatmapTitle', 'Mapa de calor por control')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {externalValidationReport.findings.map((finding, index) => (
                          <div
                            key={`${finding.clause_ref}-${index}`}
                            className={`border rounded-md px-2 py-1.5 text-xs ${getDocumentStatusColor(finding.document_status)}`}
                            title={`${finding.clause_ref} · ${finding.title} · ${getDocumentStatusLabel(finding.document_status)}`}
                          >
                            <div className="font-semibold truncate">{finding.clause_ref}</div>
                            <div className="opacity-90">{getDocumentStatusLabel(finding.document_status)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-950/90 rounded-2xl px-3 py-2 text-emerald-300 border border-emerald-500/30 shadow-sm">
                          {t('audit.completeCount', 'COMPLETO')}: {externalValidationReport.findings.filter((item) => item.document_status === 'COMPLETO').length}
                        </div>
                        <div className="bg-slate-950/90 rounded-2xl px-3 py-2 text-amber-300 border border-amber-500/30 shadow-sm">
                          {t('audit.incompleteCount', 'INCOMPLETO')}: {externalValidationReport.findings.filter((item) => item.document_status === 'INCOMPLETO').length}
                        </div>
                        <div className="bg-slate-950/90 rounded-2xl px-3 py-2 text-rose-300 border border-rose-500/30 shadow-sm">
                          {t('audit.missingCount', 'INEXISTENTE')}: {externalValidationReport.findings.filter((item) => item.document_status === 'INEXISTENTE').length}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {externalValidationReport.findings.map((finding, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              finding.observations.some((observation) => observation.severity === 'critical') ? 'bg-red-900 text-red-200' :
                              finding.observations.some((observation) => observation.severity === 'major') ? 'bg-orange-900 text-orange-200' :
                              'bg-yellow-900 text-yellow-200'
                            }`}>
                              {finding.clause_ref}
                            </span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-white font-medium">{finding.title}</p>
                                <span className={`text-[11px] px-2 py-0.5 rounded border ${getDocumentStatusColor(finding.document_status)}`}>
                                  {getDocumentStatusLabel(finding.document_status)}
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs mt-1">{t('audit.score', 'Score')}: {finding.compliance_score}% · {t('audit.relevance', 'Relevance')}: {Math.round((finding.relevance_score ?? 0) * 100)}%</p>
                              {(finding.missing_elements?.length ?? 0) > 0 && (
                                <div className="mt-2">
                                  <p className="text-rose-300 text-xs font-medium">{t('audit.missingElements', 'Elementos faltantes')}:</p>
                                  <ul className="mt-1 space-y-1 text-rose-200 text-xs list-disc list-inside">
                                    {finding.missing_elements?.map((missingElement, missingElementIndex) => (
                                      <li key={missingElementIndex}>{missingElement}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {finding.document_status === 'INCOMPLETO' && (finding.missing_elements?.length ?? 0) > 0 && (
                                <div className="mt-3 space-y-2">
                                  <button
                                    onClick={() => onGenerateMissingForFinding(finding)}
                                    disabled={Boolean(missingGenerationLoadingByChunk[finding.clause_ref])}
                                    className="px-3 py-1.5 rounded-md bg-[#4F6EF7] hover:bg-[#3D5AD7] disabled:opacity-60 text-white text-xs"
                                  >
                                    {missingGenerationLoadingByChunk[finding.clause_ref]
                                      ? t('audit.generatingMissing', 'Generando texto faltante...')
                                      : t('audit.generateMissing', 'Generar texto faltante')}
                                  </button>

                                  {missingGenerationErrorByChunk[finding.clause_ref] && (
                                    <p className="text-rose-300 text-xs">{missingGenerationErrorByChunk[finding.clause_ref]}</p>
                                  )}

                                  {missingGenerationResultByChunk[finding.clause_ref] && (
                                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-3 space-y-2 shadow-sm">
                                      <p className="text-xs text-gray-300">
                                        {t('audit.generatedValidation', 'Validación')}: {missingGenerationResultByChunk[finding.clause_ref].validation_passed ? 'OK' : 'Requiere revisión'} ·
                                        {' '}{t('audit.score', 'Score')}: {missingGenerationResultByChunk[finding.clause_ref].validation_score}% ·
                                        {' '}{t('audit.iterations', 'Intentos')}: {missingGenerationResultByChunk[finding.clause_ref].iterations}
                                      </p>
                                      {missingGenerationResultByChunk[finding.clause_ref].validation_feedback && (
                                        <p className="text-xs text-amber-300">{missingGenerationResultByChunk[finding.clause_ref].validation_feedback}</p>
                                      )}
                                      <textarea
                                        readOnly
                                        value={missingGenerationResultByChunk[finding.clause_ref].generated_text}
                                        rows={5}
                                        className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-md px-2 py-1.5 text-gray-200 text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              {finding.observations.length > 0 && (
                                <ul className="mt-2 space-y-1 text-gray-300 text-xs">
                                  {finding.observations.map((observation, observationIndex) => (
                                    <li key={observationIndex}>
                                      <span className="font-semibold uppercase">[{observation.severity}]</span> {observation.text}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {finding.suggestions.length > 0 && (
                                <p className="text-gray-400 text-xs mt-2">{t('audit.suggestions', 'Suggestions')}: {finding.suggestions.join(' · ')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {externalValidationReport && externalValidationReport.status === 'failed' && (
              <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400 text-sm">
                {externalValidationReport.error || t('audit.failed', 'Granular validation failed.')}
              </div>
            )}

            {/* Historial de validaciones: debajo del resultado actual de la validación */}
            <div className="mt-6">
              <hr className="border-t border-slate-800/80 my-6" />
              <ValidationHistory />
            </div>
          </div>

          {/* Audit Room */}
          <div className="bg-slate-900/95 border border-slate-800/80 shadow-xl rounded-3xl p-6 space-y-4 backdrop-blur-sm">
            <AuditRoomPanel />
          </div>

          {/* Formulario */}
          <div className="bg-slate-900/95 border border-slate-800/80 shadow-xl rounded-3xl p-6 space-y-4 backdrop-blur-sm">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('audit.titleField', 'Audit Title')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('audit.titlePlaceholder', 'Example: Physical Security Assessment')}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('audit.descriptionField', 'Description')}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('audit.descriptionPlaceholder', 'Brief description of the audit')}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('audit.typeField', 'Audit Type')}</label>
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value as any)}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent"
                >
                  <option value="security">{t('audit.type.security', 'Security')}</option>
                  <option value="compliance">{t('audit.type.compliance', 'Compliance')}</option>
                  <option value="operational">{t('audit.type.operational', 'Operational')}</option>
                  <option value="financial">{t('audit.type.financial', 'Financial')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('audit.priorityField', 'Priority')}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4F6EF7]"
                >
                  <option value="low">{t('audit.priority.low', 'Low')}</option>
                  <option value="medium">{t('audit.priority.medium', 'Medium')}</option>
                  <option value="high">{t('audit.priority.high', 'High')}</option>
                  <option value="critical">{t('audit.priority.critical', 'Critical')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('audit.evidenceField', 'Evidence')}</label>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder={t('audit.evidencePlaceholder', 'Describe the evidence to analyze...')}
                rows={6}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent"
              />
            </div>

            {errorMessage && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-600 text-sm">{errorMessage}</div>
              </div>
            )}

            <button
              onClick={onValidateAudit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#4F6EF7] to-[#1DB954] hover:from-[#3D5AD7] hover:to-[#17A05B] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl shadow-lg shadow-[#4F6EF7]/20 transition-all duration-200"
            >
              {isLoading ? t('audit.validatingButton', 'Validating...') : t('audit.validateButton', 'Validate Audit')}
            </button>
          </div>

          {/* Resultados */}
          {auditResponse && (
            <div className="bg-slate-900/95 border border-slate-800/80 shadow-xl rounded-3xl p-6 space-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl font-bold text-white">{t('audit.resultsTitle', 'Audit Results')}</h2>
                <div className={`text-4xl font-bold ${getComplianceScoreColor(auditResponse.overall_compliance_score)}`}>
                  {auditResponse.overall_compliance_score}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F1119] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">{t('audit.status', 'Status')}</p>
                  <p className={`text-lg font-semibold ${getStatusColor(auditResponse.status)}`}>
                    {auditResponse.status === 'compliant'
                      ? `✓ ${t('audit.statusCompliant', 'Compliant')}`
                      : auditResponse.status === 'non_compliant'
                        ? `✗ ${t('audit.statusNonCompliant', 'Non-compliant')}`
                        : `⚠ ${t('audit.statusNeedsReview', 'Needs review')}`}
                  </p>
                </div>
                <div className="bg-[#0F1119] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">{t('audit.findingsLabel', 'Findings')}</p>
                  <p className="text-lg font-semibold text-white">{auditResponse.findings.length}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3">{t('audit.detectedFindings', 'Detected Findings')}</h3>
                <div className="space-y-3">
                  {auditResponse.findings.map((finding, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(finding.severity)}`}>
                      <div className="font-semibold mb-1">{finding.issue}</div>
                      <div className="text-sm mb-2">{t('audit.severity', 'Severity')}: <span className="capitalize font-medium">{finding.severity}</span></div>
                      <div className="text-sm mb-2"><strong>{t('audit.recommendation', 'Recommendation')}:</strong> {finding.recommendation}</div>
                      <div className="text-sm"><strong>{t('audit.impact', 'Impact')}:</strong> {finding.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F1119] p-4 rounded-lg border border-[#2A2E3D]">
                <p className="text-gray-400 text-sm mb-2">{t('audit.agentNotes', 'Agent Notes')}</p>
                <p className="text-white text-sm">{auditResponse.agent_notes}</p>
              </div>
            </div>
          )}

          <div className="bg-slate-900/95 border border-slate-800/80 shadow-xl rounded-3xl p-6 space-y-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">{t('audit.checklistTitle', 'Pre-Audit Checklist')}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {t('audit.checklistSubtitle', 'Backend persistence with auto-save')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-300">{checklistCompletion}% {t('audit.completed', 'completed')}</div>
                <button
                  onClick={forceSaveChecklist}
                  disabled={checklistSaving || !checklistLoaded}
                  className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#4F6EF7] to-[#1DB954] hover:from-[#3D5AD7] hover:to-[#17A05B] disabled:opacity-50 text-white text-sm shadow-lg shadow-[#4F6EF7]/20"
                >
                  {t('audit.saveNow', 'Save now')}
                </button>
              </div>
            </div>

            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4F6EF7] to-[#1DB954] transition-all duration-300"
                style={{ width: `${checklistCompletion}%` }}
              />
            </div>

            <div className="text-xs text-gray-400">{checklistSaveLabel}</div>

            {checklistError && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-500 text-sm">
                {checklistError}
              </div>
            )}

            <div className="space-y-3">
              {checklistItems.map(item => (
                <div key={item.id} className="border border-slate-800 rounded-3xl p-4 bg-slate-950/90 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <label className="flex items-center gap-3 text-white">
                      <input
                        type="checkbox"
                        checked={item.status === 'done'}
                        onChange={(e) =>
                          updateChecklistItem(item.id, {
                            status: e.target.checked ? 'done' : 'pending',
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{item.control_code}</span>
                      <span className="text-gray-300">{getChecklistTitle(item)}</span>
                    </label>

                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateChecklistItem(item.id, {
                          status: e.target.value as AuditChecklistItem['status'],
                        })
                      }
                      className="bg-slate-950/90 border border-slate-800 rounded-2xl px-2 py-1 text-sm text-white"
                    >
                      <option value="pending">{t('audit.checklist.pending', 'Pending')}</option>
                      <option value="in_progress">{t('audit.checklist.inProgress', 'In progress')}</option>
                      <option value="done">{t('audit.checklist.done', 'Done')}</option>
                      <option value="blocked">{t('audit.checklist.blocked', 'Blocked')}</option>
                    </select>
                  </div>

                  <textarea
                    value={item.notes}
                    onChange={(e) => updateChecklistItem(item.id, { notes: e.target.value })}
                    placeholder={t('audit.checklistNotesPlaceholder', 'Evidence notes, observations, or blockers...')}
                    rows={2}
                    className="mt-3 w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
