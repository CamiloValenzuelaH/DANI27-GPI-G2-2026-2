import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DocumentDetailResponse,
  DocumentMetadata,
  getDocument,
  listDocuments,
  uploadDocument,
  generateDocument,
  deleteDocument,
  streamDocumentGenerationEvents,
  updateDocument,
} from '../../api/documents'
import {
  generateReport,
  getReportStatus,
  getReportTemplates,
  listReports,
  deleteReport,
  ReportFormat,
  ReportStatusResponse,
  ReportTemplate,
  ReportTemplateResponse,
} from '../../api/reports'
import DocumentEditor from '../components/DocumentEditor'

const staticDocuments = [
  {
    id: 'doc-001',
    title: 'Política de Seguridad de la Información',
    summary: 'Marco de gobernanza y controles para ISO 27001.',
    content:
      'Esta política define la protección de activos de información mediante controles de acceso, clasificación de datos, gestión de incidentes y revisión periódica. Se alinea con los requisitos del estándar ISO 27001:2022, en particular los apartados de liderazgo, planificación y operación.',
  },
  {
    id: 'doc-002',
    title: 'Procedimiento de Gestión de Incidentes',
    summary: 'Instrucciones para detección, respuesta y cierre de incidentes de seguridad.',
    content:
      'Este procedimiento establece los pasos para identificar, registrar, evaluar, notificar y resolver incidentes de seguridad de la información. Incluye roles y responsabilidades, comunicación con stakeholders y retroalimentación para mejora continua.',
  },
]

type EditorTab = 'view' | 'edit' | 'generate' | 'report' | 'upload'

type ReportHistoryItem = {
  job_id: string
  report_title?: string
  report_template?: string
  report_format?: string
  status: string
  created_at?: string
  file_path?: string | null
  download_url?: string
}

export default function DocumentGeneratorPage() {
  const intl = useIntl()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const selectedDocumentId = params.get('docId') || staticDocuments[0].id

  // ── Documentos ──────────────────────────────────────────────────
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentMetadata[]>([])
  const [activeDocument, setActiveDocument] = useState<DocumentDetailResponse | null>(null)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllDocuments, setShowAllDocuments] = useState(false)

  // ── Upload ───────────────────────────────────────────────────────
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadContent, setUploadContent] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  // ── Generación IA ────────────────────────────────────────────────
  const [generateTitle, setGenerateTitle] = useState(intl.formatMessage({ id: 'documents.generate.defaultTitle', defaultMessage: 'New ISO 27001 document' }))
  const [generateDescription, setGenerateDescription] = useState(
    intl.formatMessage({ id: 'documents.generate.defaultDescription', defaultMessage: 'Generate a mandatory ISO 27001 document with AI support.' }),
  )
  const [generateAudience, setGenerateAudience] = useState(intl.formatMessage({ id: 'documents.generate.defaultAudience', defaultMessage: 'Security team' }))
  const [generateLanguage, setGenerateLanguage] = useState('es')
  const [generateTone, setGenerateTone] = useState('formal')
  const [generateType, setGenerateType] = useState<'policy' | 'report' | 'procedure' | 'general'>('policy')
  const [generateSections, setGenerateSections] = useState('')
  const [generateControlRefs, setGenerateControlRefs] = useState('')
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [generationJobId, setGenerationJobId] = useState<string | null>(null)
  const [generatedDocumentText, setGeneratedDocumentText] = useState('')
  const [generatedDocumentTitle, setGeneratedDocumentTitle] = useState('')

  const [reportTemplates, setReportTemplates] = useState<ReportTemplateResponse[]>([])
  const [selectedReportTemplate, setSelectedReportTemplate] = useState<ReportTemplate>('soa')
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf')
  const [reportTitle, setReportTitle] = useState(intl.formatMessage({ id: 'documents.report.defaultTitle', defaultMessage: 'Compliance report' }))
  const [reportDescription, setReportDescription] = useState(intl.formatMessage({ id: 'documents.report.defaultDescription', defaultMessage: 'Status summary and compliance gaps.' }))
  const [reportJobId, setReportJobId] = useState<string | null>(null)
  const [reportStatus, setReportStatus] = useState<ReportStatusResponse | null>(null)
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([])
  const [reportSearchQuery, setReportSearchQuery] = useState('')
  const [showAllReports, setShowAllReports] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [exportStartTime, setExportStartTime] = useState<number | null>(null)
  const [isReportPolling, setIsReportPolling] = useState(false)
  const reportPollingRef = useRef<number | null>(null)

  const filteredReportHistory = useMemo(() => {
    const normalizedQuery = reportSearchQuery.trim().toLowerCase()

    return [...reportHistory]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .filter((entry) =>
        entry.report_title?.toLowerCase().includes(normalizedQuery) ||
        entry.report_template?.toLowerCase().includes(normalizedQuery),
      )
  }, [reportHistory, reportSearchQuery])

  const visibleReportHistory = showAllReports ? filteredReportHistory : filteredReportHistory.slice(0, 5)

  // ── UI ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<EditorTab>('view')
  // Contenido editable en el editor (independiente del original)
  const [editorContent, setEditorContent] = useState('')

  // ── Exportación ──────────────────────────────────────────────────
  const [exportTemplate, setExportTemplate] = useState('SOA')
  const [exportFormat, setExportFormat] = useState('PDF')
  const [isExporting, setIsExporting] = useState(false)

  // ── Computed ──────────────────────────────────────────────────────
  const allDocuments = useMemo(
    () => [
      ...staticDocuments.map((doc) => ({
        documentId: doc.id,
        title: doc.title,
        description: doc.summary,
      })),
      ...uploadedDocuments,
    ],
    [uploadedDocuments],
  )

  const selectedStaticDocument = useMemo(
    () => staticDocuments.find((doc) => doc.id === selectedDocumentId),
    [selectedDocumentId],
  )

  const selectedDocument = useMemo(() => {
    if (activeDocument) return activeDocument
    if (selectedStaticDocument) {
      return {
        documentId: selectedStaticDocument.id,
        title: selectedStaticDocument.title,
        description: selectedStaticDocument.summary,
        documentText: selectedStaticDocument.content,
      }
    }
    return null
  }, [activeDocument, selectedStaticDocument])

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const list = allDocuments
      .map((doc) => ({
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString(),
      }))
      .filter((doc) =>
        doc.title.toLowerCase().includes(normalizedQuery) ||
        (doc.description ?? '').toLowerCase().includes(normalizedQuery),
      )

    return showAllDocuments ? list : list.slice(0, 5)
  }, [allDocuments, searchQuery, showAllDocuments])

  const documentCount = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return allDocuments.filter((doc) =>
      doc.title.toLowerCase().includes(normalizedQuery) ||
      (doc.description ?? '').toLowerCase().includes(normalizedQuery),
    ).length
  }, [allDocuments, searchQuery])

  // ── Carga de documentos ──────────────────────────────────────────
  const loadDocumentList = useCallback(async () => {
    setIsLoadingDocs(true)
    setLoadError(null)
    try {
      const docs = await listDocuments()
      setUploadedDocuments(docs)
    } catch {
      setLoadError(intl.formatMessage({ id: 'documents.error.loadList', defaultMessage: 'Could not load documents. Try reloading the page.' }))
    } finally {
      setIsLoadingDocs(false)
    }
  }, [intl])

  const loadSelectedDocument = useCallback(async () => {
    setIsLoadingDocument(true)
    setLoadError(null)
    try {
      if (selectedStaticDocument) {
        const doc = {
          documentId: selectedStaticDocument.id,
          title: selectedStaticDocument.title,
          description: selectedStaticDocument.summary,
          documentText: selectedStaticDocument.content,
        }
        setActiveDocument(doc)
        setEditorContent(doc.documentText || '')
        return
      }
      const uploaded = uploadedDocuments.find((doc) => doc.documentId === selectedDocumentId)
      if (selectedDocumentId) {
        const doc = await getDocument(selectedDocumentId)
        setActiveDocument(doc)
        setEditorContent(doc.documentText || '')
        return
      }
      setActiveDocument(null)
    } catch {
      setLoadError(intl.formatMessage({ id: 'documents.error.loadSelected', defaultMessage: 'Could not load the selected document.' }))
      setActiveDocument(null)
    } finally {
      setIsLoadingDocument(false)
    }
  }, [selectedDocumentId, uploadedDocuments, selectedStaticDocument, intl])

  const loadReportHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const reports = await listReports()
      setReportHistory(reports)
    } catch (error) {
      console.error('Error loading report history', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => { loadDocumentList() }, [loadDocumentList])
  useEffect(() => { loadSelectedDocument() }, [loadSelectedDocument])

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await getReportTemplates()
        setReportTemplates(response.templates)
        if (response.templates.length > 0) {
          setSelectedReportTemplate(response.templates[0].id)
        }
      } catch (error) {
        console.error('Error loading report templates', error)
      }
    }

    loadTemplates()
  }, [])

  useEffect(() => {
    loadReportHistory()
  }, [loadReportHistory])

  useEffect(() => {
    if (!reportJobId || !isReportPolling) return

    const pollStatus = async () => {
      try {
        if (exportStartTime && Date.now() - exportStartTime >= 300000) {
          if (reportPollingRef.current) {
            window.clearInterval(reportPollingRef.current)
            reportPollingRef.current = null
          }
          setReportError(intl.formatMessage({ id: 'documents.report.error.timeout', defaultMessage: 'Report generation took too long. Please try again.' }))
          setIsReportPolling(false)
          setIsGeneratingReport(false)
          setExportStartTime(null)
          return
        }

        const status = await getReportStatus(reportJobId)
        setReportStatus(status)
        if (status.status === 'completed') {
          await loadReportHistory()
        }
        if (status.status === 'completed' || status.status === 'failed') {
          setIsReportPolling(false)
          setIsGeneratingReport(false)
          setExportStartTime(null)
          if (reportPollingRef.current) {
            window.clearInterval(reportPollingRef.current)
            reportPollingRef.current = null
          }
        }
      } catch (error) {
        console.error('Error polling report status', error)
        setReportError(intl.formatMessage({ id: 'documents.report.error.status', defaultMessage: 'Could not retrieve report status. Please try again.' }))
        setIsReportPolling(false)
        setIsGeneratingReport(false)
        setExportStartTime(null)
        if (reportPollingRef.current) {
          window.clearInterval(reportPollingRef.current)
          reportPollingRef.current = null
        }
      }
    }

    pollStatus()
    const intervalId = window.setInterval(pollStatus, 3000)
    reportPollingRef.current = intervalId

    return () => {
      if (reportPollingRef.current) {
        window.clearInterval(reportPollingRef.current)
        reportPollingRef.current = null
      }
    }
  }, [reportJobId, isReportPolling, intl, exportStartTime, reportTitle, selectedReportTemplate, reportFormat, loadDocumentList])

  // ── Handlers ─────────────────────────────────────────────────────
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm(intl.formatMessage({ id: 'documents.confirmDelete', defaultMessage: 'Are you sure you want to delete this document?' }))) return;
    try {
      await deleteDocument(docId);
      setUploadedDocuments(prev => prev.filter(d => d.documentId !== docId));
      
      if (selectedDocumentId === docId) {
        navigate('/documents');
        setActiveDocument(null);
        setEditorContent('');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(intl.formatMessage({ id: 'documents.error.delete', defaultMessage: 'Could not delete document.' }));
    }
  };

  const handleDeleteReport = async (jobId: string) => {
    if (!window.confirm(intl.formatMessage({ id: 'documents.report.confirmDelete', defaultMessage: 'Are you sure you want to delete this report?' }))) return;
    try {
      await deleteReport(jobId)
      await loadReportHistory()
    } catch (error) {
      console.error('Error deleting report', error)
    }
  }

  const handleSelectDocument = (documentId: string) => {
    navigate(`/documents?docId=${documentId}`)
    setActiveTab('view')
  }

  const handleGenerateReport = async () => {
    if (!selectedDocument?.documentId) {
      setReportError(intl.formatMessage({ id: 'documents.report.error.selectFirst', defaultMessage: 'Please select a document from the sidebar first.' }));
      return;
    }

    setReportError(null)
    setExportStartTime(Date.now())
    setIsGeneratingReport(true)
    setReportStatus(null)
    setReportJobId(null)

    try {
      const payload = {
        documentId: selectedDocument.documentId,
        title: reportTitle.trim() || intl.formatMessage({ id: 'documents.report.defaultTitle', defaultMessage: 'Compliance report' }),
        description: reportDescription.trim(),
        template: selectedReportTemplate,
        format: reportFormat,
      }

      const job = await generateReport(payload)
      setReportJobId(job.job_id)
      setIsReportPolling(true)
      setReportStatus({
        job_id: job.job_id,
        status: 'queued',
        progress: 0,
      })
    } catch (error: any) {
      console.error('Error generating report', error)
      setReportError(error?.response?.data?.detail ?? intl.formatMessage({ id: 'documents.report.error.start', defaultMessage: 'Could not start report generation.' }))
      setIsGeneratingReport(false)
    }
  }

  const handleDownloadReport = () => {
    if (!reportStatus?.download_url) return
    window.location.href = reportStatus.download_url
  }

  const handleGenerateAnotherReport = () => {
    setReportJobId(null)
    setReportStatus(null)
    setReportError(null)
    setIsGeneratingReport(false)
    setExportStartTime(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setUploadFile(file)
    if (file) {
      setUploadContent('')
      setUploadTitle(file.name)
    }
  }

  const handleUploadDocument = async () => {
    setUploadError(null)
    setUploadSuccess(null)
    if (!uploadFile && !uploadContent.trim()) {
      setUploadError(intl.formatMessage({ id: 'documents.upload.error.missingInput', defaultMessage: 'You must select a file or enter content.' }))
      return
    }
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', uploadTitle.trim() || (uploadFile?.name ?? intl.formatMessage({ id: 'documents.upload.defaultTitle', defaultMessage: 'Uploaded document' })))
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim())
      if (uploadFile) {
        formData.append('file', uploadFile)
      } else {
        formData.append('content', uploadContent.trim())
      }
      const response = await uploadDocument(formData)
      setUploadSuccess(intl.formatMessage({ id: 'documents.upload.success', defaultMessage: 'Document uploaded successfully.' }))
      setUploadTitle('')
      setUploadDescription('')
      setUploadContent('')
      setUploadFile(null)
      setUploadedDocuments((prev) => [...prev, { 
        documentId: response.documentId,
        title: response.title,
        description: uploadDescription.trim() || intl.formatMessage({ id: 'documents.upload.defaultDescription', defaultMessage: 'Uploaded document' }),
      }])
      navigate(`/documents?docId=${response.documentId}`)
      setActiveTab('view')
    } catch {
      setUploadError(intl.formatMessage({ id: 'documents.upload.error.generic', defaultMessage: 'Error uploading document. Please try again.' }))
    } finally {
      setUploadLoading(false)
    }
  }

  const handleGenerateDocument = async () => {
    setGenerateError(null)
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationMessage(intl.formatMessage({ id: 'documents.generate.starting', defaultMessage: 'Starting generation...' }))
    setGeneratedDocumentText('')
    setGeneratedDocumentTitle(generateTitle)

    try {
      const payload = {
        title: generateTitle.trim() || intl.formatMessage({ id: 'documents.generate.fallbackTitle', defaultMessage: 'ISO 27001 document' }),
        description: generateDescription.trim(),
        targetAudience: generateAudience.trim(),
        language: generateLanguage,
        tone: generateTone,        type: generateType,        sections: generateSections
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
        controlRefs: generateControlRefs
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
      }

      const job = await generateDocument(payload)
      setGenerationJobId(job.job_id)

      await streamDocumentGenerationEvents(
        job.job_id,
        async (event) => {
          const data = event.data as any
          if (typeof data.progress === 'number') setGenerationProgress(data.progress)
          if (typeof data.message === 'string') setGenerationMessage(data.message)
          if (event.event === 'document_complete' || event.event === 'done') {
          const text = String(data.document_text ?? '')
          const docTitle = String(data.document_title ?? payload.title)
          setGeneratedDocumentText(text)
          setGeneratedDocumentTitle(docTitle)
          setEditorContent(text)
          setGenerationProgress(100)
          if (event.event === 'document_complete' || event.event === 'done') {
          const text = String(data.document_text ?? '')
          const docTitle = String(data.document_title ?? payload.title)
          setGeneratedDocumentText(text)
          setGeneratedDocumentTitle(docTitle)
          setEditorContent(text)
          setGenerationProgress(100)

          setActiveTab('edit')
        }
      }
        },
        () => {
          setIsGenerating(false)
          setGenerationMessage(intl.formatMessage({ id: 'documents.generate.completed', defaultMessage: 'Generation completed' }))
          loadDocumentList()
        },
        (error) => {
          setIsGenerating(false)
          setGenerateError(error.message)
          setGenerationMessage(intl.formatMessage({ id: 'documents.generate.errorStatus', defaultMessage: 'Generation error' }))
        },
      )
    } catch {
      setGenerateError(intl.formatMessage({ id: 'documents.generate.errorStart', defaultMessage: 'Could not start generation. Check configuration.' }))
      setIsGenerating(false)
    }
  } 

  const handleUploadGenerated = async (title: string, content: string) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      const saved = await uploadDocument(formData);
      
      setUploadedDocuments(prev => [...prev, {
        documentId: saved.documentId,
        title: saved.title,
        description: generateDescription.trim() || intl.formatMessage({ id: 'documents.generate.defaultUploadedDescription', defaultMessage: 'AI-generated document' })
      }]);
      
      setGeneratedDocumentText('');
      setGeneratedDocumentTitle('');
      

      navigate(`/documents?docId=${saved.documentId}`);
      setActiveTab('view');
    } catch (error) {
      alert(intl.formatMessage({ id: 'documents.generate.uploadError', defaultMessage: 'Error uploading generated document.' }));
    }
  };

  // ── Tab config ────────────────────────────────────────────────────
  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'view', label: intl.formatMessage({ id: 'documents.tab.view', defaultMessage: 'View' }) },
    { id: 'edit', label: intl.formatMessage({ id: 'documents.tab.edit', defaultMessage: 'Editor' }) },
    { id: 'generate', label: intl.formatMessage({ id: 'documents.tab.generate', defaultMessage: 'Generate with AI' }) },
    { id: 'report', label: intl.formatMessage({ id: 'documents.tab.report', defaultMessage: 'Export report' }) },
    { id: 'upload', label: intl.formatMessage({ id: 'documents.tab.upload', defaultMessage: 'Upload' }) },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 rounded-[28px] border border-[#1f2a45] bg-gradient-to-r from-[#08111f] via-[#0a1528] to-[#0c192f] p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
        <h1 className="text-4xl font-semibold text-white tracking-tight">{intl.formatMessage({ id: 'documents.title', defaultMessage: 'Document Generator' })}</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300">{intl.formatMessage({ id: 'documents.hero.subtitle', defaultMessage: 'Create, edit, and manage ISO 27001 documents with AI assistance in a clearer professional flow.' })}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Sidebar — lista de documentos */}
        <div className="rounded-[28px] border border-[#2A2E3D] bg-[#09101c] p-4 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.75)] self-start">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-[0.24em]">{intl.formatMessage({ id: 'menu.documents', defaultMessage: 'Documents' })}</h2>
              <p className="text-xs text-slate-400 mt-1">{intl.formatMessage({ id: 'documents.sidebar.quickAccess', defaultMessage: 'Quick access to your saved documents.' })}</p>
            </div>
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{documentCount}</span>
          </div>
          {isLoadingDocs ? (
            <div className="text-sm text-slate-400">{intl.formatMessage({ id: 'understand.loading', defaultMessage: 'Loading...' })}</div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#2A2E3D] bg-[#0B1116] px-3 py-2">
                <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-2.85z" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={intl.formatMessage({ id: 'documents.sidebar.searchPlaceholder', defaultMessage: 'Search documents' })}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                {visibleDocuments.map((doc) => (
                  <div key={doc.documentId} className="relative group w-full">
                    <button
                      type="button"
                      onClick={() => handleSelectDocument(doc.documentId)}
                      className={`w-full rounded-xl border p-3 text-left transition pr-10 ${
                        selectedDocumentId === doc.documentId
                          ? 'border-blue-500 bg-blue-800/60 text-white'
                          : 'border-[#1F2933] bg-[#0B1116] hover:border-[#2A2E3D] hover:bg-[#0F1729] text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium line-clamp-1">{doc.title}</div>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                          {new Date(doc.createdAt ?? new Date().toISOString()).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      {doc.description && (
                        <div className="mt-1 text-xs text-white/60 line-clamp-2">{doc.description}</div>
                      )}
                    </button>

                    {!doc.documentId.startsWith('doc-') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.documentId);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        title={intl.formatMessage({ id: 'documents.deleteDocument', defaultMessage: 'Delete document' })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {documentCount > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllDocuments((prev) => !prev)}
                  className="mt-4 w-full rounded-xl border border-[#2A2E3D] bg-[#0B1116] px-3 py-2 text-sm font-medium text-white hover:bg-[#0F1729] transition"
                >
                  {showAllDocuments
                    ? intl.formatMessage({ id: 'documents.viewLess', defaultMessage: 'View less' })
                    : intl.formatMessage({ id: 'documents.viewMoreCount', defaultMessage: 'View more ({count} more)' }, { count: documentCount - 5 })}
                </button>
              )}
            </>
          )}
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500"
            >
              {intl.formatMessage({ id: 'documents.action.generateAi', defaultMessage: '+ Generate with AI' })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="w-full rounded-2xl border border-[#2A2E3D] bg-[#08121f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f172c] transition"
            >
              {intl.formatMessage({ id: 'documents.action.exportReport', defaultMessage: '+ Export report' })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="w-full rounded-2xl border border-[#2A2E3D] bg-[#0b1320] px-4 py-3 text-sm font-semibold text-white hover:bg-[#121a2a] transition"
            >
              {intl.formatMessage({ id: 'documents.action.uploadDocument', defaultMessage: '+ Upload document' })}
            </button>
          </div>
        </div>

        {/* Panel principal con tabs */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 rounded-[24px] border border-[#202d46] bg-[#08131f] p-1.5 w-full overflow-x-auto shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex min-w-max gap-2 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm shadow-blue-500/20'
                    : 'text-slate-300/60 hover:text-white hover:bg-[#0f172c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            </div>
          </div>

          {/* Tab: Vista */}
          {activeTab === 'view' && (
            <div className="rounded-[28px] border border-[#1f2a45] bg-[#08121f] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.85)] overflow-hidden">
              <div className="flex flex-col gap-4 px-4 sm:px-6 py-5 border-b border-[#16213a] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400/80">{intl.formatMessage({ id: 'documents.viewLabel', defaultMessage: 'Document view' })}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{selectedDocument?.title ?? intl.formatMessage({ id: 'documents.noDocumentSelected', defaultMessage: 'No document selected' })}</h2>
                  <p className="text-sm text-slate-400 mt-1">ID: {selectedDocument?.documentId ?? 'N/A'} · ISO 27001</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    disabled={!selectedDocument}
                    className="rounded-2xl border border-[#2A2E3D] bg-[#0f172c] px-4 py-2 text-sm font-medium text-white hover:bg-[#16203c] transition disabled:opacity-40"
                  >
                    {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                    disabled={!selectedDocument}
                    className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:from-sky-400 hover:to-cyan-400 transition disabled:opacity-40"
                  >
                    {intl.formatMessage({ id: 'documents.openAssistant', defaultMessage: 'Open assistant' })}
                  </button>
                </div>
              </div>
              <div className="px-4 sm:px-8 py-8 overflow-y-auto lg:max-h-[600px] text-white">
                {isLoadingDocument ? (
                  <div className="text-sm text-slate-400">{intl.formatMessage({ id: 'documents.loadingDocument', defaultMessage: 'Loading document...' })}</div>
                ) : selectedDocument?.documentText ? (
                  <div className="prose prose-sm max-w-full text-white whitespace-pre-line leading-8">{selectedDocument.documentText}</div>
                ) : (
                  <div className="text-sm text-slate-400">{intl.formatMessage({ id: 'documents.selectToView', defaultMessage: 'Select a document to view its content.' })}</div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Editor enriquecido — DANI-FE-029 */}
          {activeTab === 'edit' && (
            <DocumentEditor
              title={generatedDocumentTitle || selectedDocument?.title || intl.formatMessage({ id: 'documents.untitled', defaultMessage: 'Untitled document' })}
              content={editorContent || selectedDocument?.documentText || ''}
              onChange={setEditorContent}
              
              onUpload={handleUploadGenerated}
              onSave={async (title, content) => {
                const isStatic = selectedDocument?.documentId?.startsWith('doc-')
                if (selectedDocument?.documentId && !isStatic) {
                await updateDocument(selectedDocument.documentId, title, content)
                }
              }}
              />
          )}

          {/* Tab: Generar con IA */}
          {activeTab === 'generate' && (
            <div className="rounded-2xl border border-[#2A2E3D] bg-[#111318] p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{intl.formatMessage({ id: 'documents.generate.title', defaultMessage: 'Generate document with AI' })}</h3>
                <p className="text-sm text-white/60 mt-1">{intl.formatMessage({ id: 'documents.generate.subtitle', defaultMessage: 'The LLM agent will generate a full ISO 27001 document section by section.' })}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.title', defaultMessage: 'Title' })}</label>
                  <input
                    value={generateTitle}
                    onChange={(e) => setGenerateTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={intl.formatMessage({ id: 'documents.placeholder.title', defaultMessage: 'Document title' })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.description', defaultMessage: 'Description' })}</label>
                  <input
                    value={generateDescription}
                    onChange={(e) => setGenerateDescription(e.target.value)}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={intl.formatMessage({ id: 'documents.placeholder.context', defaultMessage: 'Document context' })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.audience', defaultMessage: 'Audience' })}</label>
                  <input
                    value={generateAudience}
                    onChange={(e) => setGenerateAudience(e.target.value)}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={intl.formatMessage({ id: 'documents.placeholder.audience', defaultMessage: 'Target team' })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.language', defaultMessage: 'Language' })}</label>
                    <select
                      value={generateLanguage}
                      onChange={(e) => setGenerateLanguage(e.target.value)}
                      className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="es">{intl.formatMessage({ id: 'language.es', defaultMessage: 'Spanish' })}</option>
                      <option value="en">{intl.formatMessage({ id: 'language.en', defaultMessage: 'English' })}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.tone', defaultMessage: 'Tone' })}</label>
                    <select
                      value={generateTone}
                      onChange={(e) => setGenerateTone(e.target.value)}
                      className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="formal">{intl.formatMessage({ id: 'documents.tone.formal', defaultMessage: 'Formal' })}</option>
                      <option value="informal">{intl.formatMessage({ id: 'documents.tone.informal', defaultMessage: 'Informal' })}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.type', defaultMessage: 'Type' })}</label>
                    <select
                      value={generateType}
                      onChange={(e) => setGenerateType(e.target.value as 'policy' | 'report' | 'procedure' | 'general')}
                      className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="policy">{intl.formatMessage({ id: 'documents.type.policy', defaultMessage: 'Policy' })}</option>
                      <option value="report">{intl.formatMessage({ id: 'documents.type.report', defaultMessage: 'Report' })}</option>
                      <option value="procedure">{intl.formatMessage({ id: 'documents.type.procedure', defaultMessage: 'Procedure' })}</option>
                      <option value="general">{intl.formatMessage({ id: 'documents.type.general', defaultMessage: 'General' })}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.sections', defaultMessage: 'Sections' })} <span className="text-white/60">({intl.formatMessage({ id: 'common.optional', defaultMessage: 'optional' })})</span></label>
                  <textarea
                    value={generateSections}
                    onChange={(e) => setGenerateSections(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={intl.formatMessage({ id: 'documents.placeholder.sections', defaultMessage: 'Separated by commas or line breaks' })}
                  />
                </div>
              </div>

              {/* Progreso */}
              {isGenerating && (
                <div className="rounded-xl bg-[#0F1729] border border-[#2A2E3D] p-4 space-y-2 text-white/90">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{generationMessage}</span>
                    <span className="font-semibold text-white">{generationProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#111318] overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${generationProgress}%` }} />
                  </div>
                  {generationJobId && <div className="text-xs text-white/60">{intl.formatMessage({ id: 'documents.jobId', defaultMessage: 'Job ID:' })} {generationJobId}</div>}
                </div>
              )}

              {generateError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {generateError}
                </div>
              )}

              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                >
                  {isGenerating
                    ? intl.formatMessage({ id: 'documents.generate.generating', defaultMessage: 'Generating...' })
                    : intl.formatMessage({ id: 'documents.generate.button', defaultMessage: 'Generate document' })}
                </button>
                
                {/* Estos botones SOLO aparecen cuando la IA termina de generar el texto */}
                {generatedDocumentText && !isGenerating && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                    >
                      {intl.formatMessage({ id: 'documents.openInEditor', defaultMessage: 'Open in editor' })} →
                    </button>

                    {/* NUEVO BOTÓN: Subir a la plataforma */}
                    <button
                      type="button"
                      onClick={() => handleUploadGenerated(generatedDocumentTitle, generatedDocumentText)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
                    >
                      {intl.formatMessage({ id: 'documents.uploadGenerated', defaultMessage: 'Upload generated document' })}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab: Exportar reporte */}
          {activeTab === 'report' && (
            <div className="rounded-2xl border border-[#2A2E3D] bg-[#111318] p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{intl.formatMessage({ id: 'documents.report.title', defaultMessage: 'Export report' })}</h3>
                <p className="text-sm text-white/60 mt-1">{intl.formatMessage({ id: 'documents.report.subtitle', defaultMessage: 'Generate a downloadable report based on the currently selected document.' })}</p>
              </div>

              <div className="rounded-xl border border-blue-800 bg-[#071826] p-4 flex items-center gap-3 text-white/90">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{intl.formatMessage({ id: 'documents.report.documentToExport', defaultMessage: 'Document to export:' })}</p>
                  <p className="text-sm text-white/80">{selectedDocument?.title || intl.formatMessage({ id: 'documents.report.noneSelected', defaultMessage: 'No document selected in the sidebar' })}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.report.fieldTitle', defaultMessage: 'Report title' })}</label>
                  <input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    disabled={!selectedDocument}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder={intl.formatMessage({ id: 'documents.report.fieldTitle', defaultMessage: 'Report title' })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.description', defaultMessage: 'Description' })}</label>
                  <input
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    disabled={!selectedDocument}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder={intl.formatMessage({ id: 'documents.report.placeholderDescription', defaultMessage: 'E.g. Executive summary of ISO control status for management review' })}
                  />
                  <p className="mt-2 text-sm text-white/60">{intl.formatMessage({ id: 'documents.report.descriptionHint', defaultMessage: 'This text will appear as subtitle in the generated report header.' })}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.report.template', defaultMessage: 'Template' })}</label>
                  <select
                    value={selectedReportTemplate}
                    onChange={(e) => setSelectedReportTemplate(e.target.value as ReportTemplate)}
                    disabled={!selectedDocument}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {reportTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.report.format', defaultMessage: 'Format' })}</label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                    disabled={!selectedDocument}
                    className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="pdf">PDF</option>
                    <option value="xlsx">XLSX</option>
                    <option value="docx">DOCX</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>

              {reportError && (
                <div className="rounded-xl border border-red-700 bg-[#3B1717] px-4 py-3 text-sm text-red-300">{reportError}</div>
              )}

              {reportStatus && (
                <div className="rounded-xl border border-[#2A2E3D] bg-[#0F1729] p-4 space-y-3 text-white/90">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/60">{intl.formatMessage({ id: 'documents.report.status', defaultMessage: 'Report status' })}</p>
                      <p className="text-lg font-semibold text-white">{reportStatus.status.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">{reportStatus.progress}%</span>
                  </div>
                  {reportStatus.message && <p className="text-sm text-white/80">{reportStatus.message}</p>}
                  <div className="h-2 w-full rounded-full bg-[#111318] shadow-inner overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${reportStatus.progress}%` }} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {reportStatus.download_url && (
                      <button type="button" onClick={handleDownloadReport} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">{intl.formatMessage({ id: 'documents.report.download', defaultMessage: 'Download report' })}</button>
                    )}
                    <button type="button" onClick={handleGenerateAnotherReport} className="rounded-xl border border-[#2A2E3D] bg-[#111318] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F1729] transition">{intl.formatMessage({ id: 'documents.report.generateAnother', defaultMessage: 'Generate another' })}</button>
                  </div>
                </div>
              )}

              {filteredReportHistory.length > 0 && (
                <div className="border-t border-[#2A2E3D] pt-6 mt-6 space-y-4 text-white/90">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-white/60">{intl.formatMessage({ id: 'documents.report.recent', defaultMessage: 'Recent reports' })}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2 rounded-2xl border border-[#2A2E3D] bg-[#0B1116] px-3 py-2">
                        <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-2.85z" />
                        </svg>
                        <input
                          type="search"
                          value={reportSearchQuery}
                          onChange={(e) => setReportSearchQuery(e.target.value)}
                          placeholder={intl.formatMessage({ id: 'documents.report.searchPlaceholder', defaultMessage: 'Search reports' })}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {filteredReportHistory.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllReports((prev) => !prev)}
                          className="rounded-xl border border-[#2A2E3D] bg-[#111318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F1729] transition"
                        >
                          {showAllReports ? 'Ver menos' : 'Ver más'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {visibleReportHistory.map((entry) => {
                      const formattedDate = entry.created_at
                        ? new Date(entry.created_at).toLocaleString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''

                      const statusClasses =
                        entry.status === 'completed'
                          ? 'bg-emerald-500 text-emerald-900'
                          : entry.status === 'failed'
                          ? 'bg-red-500 text-red-900'
                          : 'bg-yellow-500 text-yellow-900'

                      return (
                        <div key={entry.job_id} className="rounded-xl border border-[#2A2E3D] bg-[#0F1729] p-4 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">{entry.report_title}</p>
                              <p className="text-sm text-white/60">{entry.report_template}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className={`rounded-full px-2 py-1 font-semibold ${statusClasses}`}>
                                {entry.status}
                              </span>
                              <span className="text-white/60">{formattedDate}</span>
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
                            <div className="text-sm text-white/70">{entry.report_format?.toUpperCase()}</div>
                            {entry.download_url && (
                              <button
                                type="button"
                                onClick={() => window.open(entry.download_url, '_blank', 'noopener')}
                                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
                              >
                                {intl.formatMessage({ id: 'documents.report.download', defaultMessage: 'Download' })}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(entry.job_id)}
                              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
                            >
                              {intl.formatMessage({ id: 'documents.report.delete', defaultMessage: 'Delete' })}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <button type="button" onClick={handleGenerateReport} disabled={!selectedDocument || isGeneratingReport} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-950 transition disabled:opacity-50">{isGeneratingReport ? intl.formatMessage({ id: 'documents.report.generating', defaultMessage: 'Generating report...' }) : intl.formatMessage({ id: 'documents.report.startExport', defaultMessage: 'Start export' })}</button>
            </div>
          )}

          {/* Tab: Subir */}
          {activeTab === 'upload' && (
            <div className="rounded-2xl border border-[#2A2E3D] bg-[#111318] p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{intl.formatMessage({ id: 'documents.upload.title', defaultMessage: 'Upload document' })}</h3>
                <p className="text-sm text-white/60 mt-1">{intl.formatMessage({ id: 'documents.upload.subtitle', defaultMessage: 'Upload a file or paste content directly.' })}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.title', defaultMessage: 'Title' })}</label>
                    <input
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={intl.formatMessage({ id: 'documents.placeholder.title', defaultMessage: 'Document title' })}
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.field.description', defaultMessage: 'Description' })}</label>
                    <input
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={intl.formatMessage({ id: 'documents.upload.placeholderSummary', defaultMessage: 'Short summary' })}
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.upload.file', defaultMessage: 'File' })}</label>
                    <input
                      type="file"
                      accept=".txt,.md,.json,.docx,.pdf"
                      onChange={handleFileChange}
                      className="w-full text-sm text-white/60"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">{intl.formatMessage({ id: 'documents.upload.altContent', defaultMessage: 'Alternative content' })}</label>
                  <textarea
                      value={uploadContent}
                      onChange={(e) => setUploadContent(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-[#2A2E3D] px-3 py-2 text-sm bg-[#0B1116] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={intl.formatMessage({ id: 'documents.upload.altPlaceholder', defaultMessage: 'Paste content here if you do not upload a file' })}
                    />
                </div>
                  {uploadError && (
                    <div className="rounded-xl border border-red-700 bg-[#3B1717] px-4 py-3 text-sm text-red-300">
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="rounded-xl border border-green-700 bg-[#0B2F1C] px-4 py-3 text-sm text-green-300">
                      {uploadSuccess}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleUploadDocument}
                    disabled={uploadLoading}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {uploadLoading
                      ? intl.formatMessage({ id: 'documents.upload.uploading', defaultMessage: 'Uploading...' })
                      : intl.formatMessage({ id: 'documents.upload.button', defaultMessage: 'Upload document' })}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}
    </div>
  )
}
