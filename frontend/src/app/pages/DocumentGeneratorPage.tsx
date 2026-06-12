import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
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

type EditorTab = 'view' | 'edit' | 'generate' | 'upload'

export default function DocumentGeneratorPage() {
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

  // ── Upload ───────────────────────────────────────────────────────
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadContent, setUploadContent] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  // ── Generación IA ────────────────────────────────────────────────
  const [generateTitle, setGenerateTitle] = useState('Nuevo documento ISO 27001')
  const [generateDescription, setGenerateDescription] = useState(
    'Genera un documento obligatorio de ISO 27001 con soporte de IA.',
  )
  const [generateAudience, setGenerateAudience] = useState('Equipo de seguridad')
  const [generateLanguage, setGenerateLanguage] = useState('es')
  const [generateTone, setGenerateTone] = useState('formal')
  const [generateSections, setGenerateSections] = useState('')
  const [generateControlRefs, setGenerateControlRefs] = useState('')
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [generationJobId, setGenerationJobId] = useState<string | null>(null)
  const [generatedDocumentText, setGeneratedDocumentText] = useState('')
  const [generatedDocumentTitle, setGeneratedDocumentTitle] = useState('')

  // ── UI ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<EditorTab>('view')
  // Contenido editable en el editor (independiente del original)
  const [editorContent, setEditorContent] = useState('')

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

  // ── Carga de documentos ──────────────────────────────────────────
  const loadDocumentList = useCallback(async () => {
    setIsLoadingDocs(true)
    setLoadError(null)
    try {
      const docs = await listDocuments()
      setUploadedDocuments(docs)
    } catch {
      setLoadError('No se pudieron cargar los documentos. Intenta recargar la página.')
    } finally {
      setIsLoadingDocs(false)
    }
  }, [])

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
      setLoadError('No se pudo cargar el documento seleccionado.')
      setActiveDocument(null)
    } finally {
      setIsLoadingDocument(false)
    }
  }, [selectedDocumentId, uploadedDocuments, selectedStaticDocument])

  useEffect(() => { loadDocumentList() }, [loadDocumentList])
  useEffect(() => { loadSelectedDocument() }, [loadSelectedDocument])

  // ── Handlers ─────────────────────────────────────────────────────
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
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
      alert('No se pudo eliminar el documento.');
    }
  };

  const handleSelectDocument = (documentId: string) => {
    navigate(`/documents?docId=${documentId}`)
    setActiveTab('view')
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
      setUploadError('Debes seleccionar un archivo o escribir el contenido.')
      return
    }
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', uploadTitle.trim() || (uploadFile?.name ?? 'Documento cargado'))
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim())
      if (uploadFile) {
        formData.append('file', uploadFile)
      } else {
        formData.append('content', uploadContent.trim())
      }
      const response = await uploadDocument(formData)
      setUploadSuccess('Documento subido correctamente.')
      setUploadTitle('')
      setUploadDescription('')
      setUploadContent('')
      setUploadFile(null)
      setUploadedDocuments((prev) => [...prev, { 
        documentId: response.documentId,
        title: response.title,
        description: uploadDescription.trim() || 'Documento Cargado',
      }])
      navigate(`/documents?docId=${response.documentId}`)
      setActiveTab('view')
    } catch {
      setUploadError('Error al subir el documento. Intenta de nuevo.')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleGenerateDocument = async () => {
    setGenerateError(null)
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationMessage('Iniciando generación...')
    setGeneratedDocumentText('')
    setGeneratedDocumentTitle(generateTitle)

    try {
      const payload = {
        title: generateTitle.trim() || 'Documento ISO 27001',
        description: generateDescription.trim(),
        targetAudience: generateAudience.trim(),
        language: generateLanguage,
        tone: generateTone,
        sections: generateSections
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
          setGenerationMessage('Generación completada')
          loadDocumentList()
        },
        (error) => {
          setIsGenerating(false)
          setGenerateError(error.message)
          setGenerationMessage('Error en la generación')
        },
      )
    } catch {
      setGenerateError('No se pudo iniciar la generación. Revisa la configuración.')
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
        description: generateDescription.trim() || 'Documento generado con IA'
      }]);
      
      setGeneratedDocumentText('');
      setGeneratedDocumentTitle('');
      

      navigate(`/documents?docId=${saved.documentId}`);
      setActiveTab('view');
    } catch (error) {
      alert('Error al subir el documento generado.');
    }
  };

  // ── Tab config ────────────────────────────────────────────────────
  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'view', label: 'Vista' },
    { id: 'edit', label: 'Editor' },
    { id: 'generate', label: 'Generar con IA' },
    { id: 'upload', label: 'Subir' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Document Generator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crea, edita y gestiona documentos ISO 27001 con asistencia de IA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar — lista de documentos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm self-start">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Documentos
          </h2>
          {isLoadingDocs ? (
            <div className="text-sm text-slate-400">Cargando...</div>
          ) : (
            <div className="space-y-1.5">
              {allDocuments.map((doc) => (
                <div key={doc.documentId} className="relative group w-full">
                  <button
                    type="button"
                    onClick={() => handleSelectDocument(doc.documentId)}
                    className={`w-full rounded-xl border p-3 text-left transition pr-10 ${
                      selectedDocumentId === doc.documentId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-800 line-clamp-1">{doc.title}</div>
                    {doc.description && (
                      <div className="mt-0.5 text-xs text-slate-500 line-clamp-2">{doc.description}</div>
                    )}
                  </button>

                  {/* Botón de eliminar (Se oculta para los estáticos que empiezan con doc-) */}
                  {!doc.documentId.startsWith('doc-') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que se seleccione el documento al hacer clic en eliminar
                        handleDeleteDocument(doc.documentId);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar documento"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className="mt-4 w-full rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            + Generar con IA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            + Subir documento
          </button>
        </div>

        {/* Panel principal con tabs */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Vista */}
          {activeTab === 'view' && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedDocument?.title ?? 'Sin documento'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: {selectedDocument?.documentId ?? 'N/A'} · ISO 27001
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    disabled={!selectedDocument}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                    disabled={!selectedDocument}
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-40"
                  >
                    Abrir asistente
                  </button>
                </div>
              </div>
              <div className="px-8 py-6 max-h-[600px] overflow-y-auto">
                {isLoadingDocument ? (
                  <div className="text-sm text-slate-400">Cargando documento...</div>
                ) : selectedDocument?.documentText ? (
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-7">
                    {selectedDocument.documentText}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    Selecciona un documento para ver su contenido.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Editor enriquecido — DANI-FE-029 */}
          {activeTab === 'edit' && (
            <DocumentEditor
              title={generatedDocumentTitle || selectedDocument?.title || 'Documento sin título'}
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Generar documento con IA</h3>
                <p className="text-sm text-slate-500 mt-1">
                  El agente LLM generará un documento ISO 27001 completo sección por sección.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                  <input
                    value={generateTitle}
                    onChange={(e) => setGenerateTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título del documento"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <input
                    value={generateDescription}
                    onChange={(e) => setGenerateDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contexto del documento"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Audiencia</label>
                  <input
                    value={generateAudience}
                    onChange={(e) => setGenerateAudience(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Equipo destinatario"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
                    <select
                      value={generateLanguage}
                      onChange={(e) => setGenerateLanguage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tono</label>
                    <select
                      value={generateTone}
                      onChange={(e) => setGenerateTone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="formal">Formal</option>
                      <option value="informal">Informal</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Secciones <span className="text-slate-400">(opcional)</span>
                  </label>
                  <textarea
                    value={generateSections}
                    onChange={(e) => setGenerateSections(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Separadas por comas o saltos de línea"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Controles ISO <span className="text-slate-400">(opcional)</span>
                  </label>
                  <textarea
                    value={generateControlRefs}
                    onChange={(e) => setGenerateControlRefs(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. A.5.1, A.6.1.2"
                  />
                </div>
              </div>

              {/* Progreso */}
              {isGenerating && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{generationMessage}</span>
                    <span className="font-semibold text-slate-800">{generationProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  {generationJobId && (
                    <div className="text-xs text-slate-400">Job ID: {generationJobId}</div>
                  )}
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
                  {isGenerating ? 'Generando...' : 'Generar documento'}
                </button>
                
                {/* Estos botones SOLO aparecen cuando la IA termina de generar el texto */}
                {generatedDocumentText && !isGenerating && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                    >
                      Abrir en editor →
                    </button>

                    {/* NUEVO BOTÓN: Subir a la plataforma */}
                    <button
                      type="button"
                      onClick={() => handleUploadGenerated(generatedDocumentTitle, generatedDocumentText)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
                    >
                      Subir documento generado
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab: Subir */}
          {activeTab === 'upload' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Subir documento</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Sube un archivo o pega el contenido directamente.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                  <input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título del documento"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <input
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Resumen breve"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Archivo</label>
                  <input
                    type="file"
                    accept=".txt,.md,.json,.docx,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contenido alternativo
                  </label>
                  <textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pega aquí el contenido si no subes un archivo"
                  />
                </div>
                {uploadError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {uploadSuccess}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleUploadDocument}
                  disabled={uploadLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {uploadLoading ? 'Subiendo...' : 'Subir documento'}
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
