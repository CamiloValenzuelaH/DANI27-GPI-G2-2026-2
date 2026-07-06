import { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { Folder, FileText, CheckCircle2, Download, Loader2 } from 'lucide-react'
import {
  createAuditRoomBinder,
  downloadAuditRoomBinder,
  getAuditRoomBinderStatus,
  getAuditRoomFolderEvidences,
  getAuditRoomFolders,
  type AuditRoomEvidenceItem,
  type AuditRoomFolderResponse,
} from '../../api/auditRoom'
import { formatDateTime } from '../lib/date'
import { usePreferences } from './AppShell'

export default function AuditRoomPanel() {
  const intl = useIntl()
  const [folders, setFolders] = useState<AuditRoomFolderResponse[]>([])
  const [selectedFolder, setSelectedFolder] = useState<AuditRoomFolderResponse | null>(null)
  const [evidences, setEvidences] = useState<AuditRoomEvidenceItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAllEvidences, setShowAllEvidences] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingEvidences, setLoadingEvidences] = useState(false)
  const [isGeneratingBinder, setIsGeneratingBinder] = useState(false)
  const [binderJobId, setBinderJobId] = useState<string | null>(null)
  const [binderStatus, setBinderStatus] = useState<string | null>(null)
  const [binderProgress, setBinderProgress] = useState<number>(0)
  const [binderMessage, setBinderMessage] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadFolders = async () => {
      setLoadingFolders(true)
      setError(null)
      try {
        const data = await getAuditRoomFolders()
        if (!active) return
        setFolders(data)
      } catch (err) {
        if (!active) return
        setError(intl.formatMessage({ id: 'auditRoom.error.loadFolders', defaultMessage: 'Could not load Audit Room folders.' }))
      } finally {
        if (active) setLoadingFolders(false)
      }
    }
    void loadFolders()
    return () => {
      active = false
    }
  }, [intl])

  const loadFolderEvidences = async (folder: AuditRoomFolderResponse) => {
    setSelectedFolder(folder)
    setEvidences([])
    setSelectedIds([])
    setShowAllEvidences(false)
    setError(null)
    setLoadingEvidences(true)
    try {
      const items = await getAuditRoomFolderEvidences(folder.control_ref_prefix)
      setEvidences(items)
    } catch (err) {
      console.error(err)
      setError(intl.formatMessage({ id: 'auditRoom.error.loadEvidences', defaultMessage: 'Could not load folder evidences.' }))
    } finally {
      setLoadingEvidences(false)
    }
  }

  const toggleEvidence = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]
    )
  }

  const startBinderGeneration = async () => {
    if (selectedIds.length === 0) {
      setError(intl.formatMessage({ id: 'auditRoom.error.selectEvidence', defaultMessage: 'Select at least one evidence to generate the binder.' }))
      return
    }

    setError(null)
    setIsGeneratingBinder(true)
    setBinderJobId(null)
    setBinderStatus('queued')
    setBinderProgress(0)
    setBinderMessage(intl.formatMessage({ id: 'auditRoom.binderQueued', defaultMessage: 'Binder queued' }))
    setDownloadUrl(null)

    try {
      const title = selectedFolder ? `Binder - ${selectedFolder.label}` : intl.formatMessage({ id: 'auditRoom.binderTitle', defaultMessage: 'Audit Room Binder' })
      const description = selectedFolder
        ? intl.formatMessage({ id: 'auditRoom.binderDescriptionFolder', defaultMessage: 'Generated from folder {folder}' }, { folder: selectedFolder.label })
        : intl.formatMessage({ id: 'auditRoom.binderDescription', defaultMessage: 'Binder generated from Audit Room' })

      const { job_id } = await createAuditRoomBinder({
        title,
        description,
        selected_evidence_ids: selectedIds,
      })

      setBinderJobId(job_id)
    } catch (err) {
      console.error(err)
      setError(intl.formatMessage({ id: 'auditRoom.error.startBinder', defaultMessage: 'Could not start binder generation.' }))
    } finally {
      setIsGeneratingBinder(false)
    }
  }

  useEffect(() => {
    if (!binderJobId) return
    let active = true

    const pollStatus = async () => {
      try {
        const status = await getAuditRoomBinderStatus(binderJobId)
        if (!active) return
        setBinderStatus(status.status)
        setDownloadUrl(status.download_url ?? null)
        if (status.status !== 'completed' && status.status !== 'failed') {
          setTimeout(pollStatus, 1500)
        }
      } catch (err) {
        if (!active) return
        console.error(err)
        setError(intl.formatMessage({ id: 'auditRoom.error.statusBinder', defaultMessage: 'Error fetching binder status.' }))
      }
    }

    void pollStatus()
    return () => {
      active = false
    }
  }, [binderJobId])

  const handleDownloadBinder = async () => {
    if (!downloadUrl) return
    setDownloadError(null)
    setIsDownloading(true)

    try {
      const blob = await downloadAuditRoomBinder(downloadUrl)
      const blobUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `AuditRoomBinder_${binderJobId ?? 'download'}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error(err)
      setDownloadError(intl.formatMessage({ id: 'auditRoom.error.downloadBinder', defaultMessage: 'Could not download binder. Please try again.' }))
    } finally {
      setIsDownloading(false)
    }
  }

  const { dateFormat, language } = usePreferences()
  const selectedCount = selectedIds.length
  const visibleEvidences = showAllEvidences ? evidences : evidences.slice(0, 5)
  const hasMoreEvidences = evidences.length > 5

  return (
    <div className="bg-[#1A1D28] border border-[#2A2E3D] rounded-xl p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{intl.formatMessage({ id: 'auditRoom.title', defaultMessage: 'Audit Room' })}</h2>
            <p className="text-gray-400 mt-1">{intl.formatMessage({ id: 'auditRoom.subtitle', defaultMessage: 'Explore Annex A folders and generate binders from selected evidences.' })}</p>
          </div>
          <div className="rounded-full bg-[#111827] px-4 py-2 text-sm text-gray-300">
            {intl.formatMessage({ id: 'auditRoom.selectedCount', defaultMessage: '{count} selected evidence(s)' }, { count: selectedCount })}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-[#452121] px-4 py-3 text-sm text-[#F8B4B4]">{error}</div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#2A2E3D] bg-[#111827] p-4">
            <div className="text-sm uppercase tracking-[0.18em] text-[#7C3AED] font-semibold mb-3">{intl.formatMessage({ id: 'auditRoom.folders', defaultMessage: 'Folders' })}</div>
            {loadingFolders ? (
              <div className="py-10 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'auditRoom.loadingFolders', defaultMessage: 'Loading folders...' })}</div>
            ) : (
              <div className="space-y-3">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => void loadFolderEvidences(folder)}
                    className={`w-full text-left rounded-3xl p-4 transition ${
                      selectedFolder?.id === folder.id
                        ? 'border border-[#4F6EF7] bg-[#0F1729]'
                        : 'border border-[#2A2E3D] bg-[#111827] hover:border-[#4F6EF7]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{folder.label}</div>
                          <div className="text-xs text-gray-400">{intl.formatMessage({ id: 'auditRoom.folderEvidenceCount', defaultMessage: '{count} evidences' }, { count: folder.item_count })}</div>
                      </div>
                      <Folder className="h-5 w-5 text-[#8B5CF6]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#2A2E3D] bg-[#111827] p-4">
            <div className="text-sm uppercase tracking-[0.18em] text-[#7C3AED] font-semibold mb-3">{intl.formatMessage({ id: 'auditRoom.binderStatus', defaultMessage: 'Binder status' })}</div>
            <div className="space-y-2 text-sm text-gray-300">
              <div>{intl.formatMessage({ id: 'auditRoom.statusLabel', defaultMessage: 'Status:' })} <span className="font-semibold text-white">{binderStatus ?? intl.formatMessage({ id: 'auditRoom.notStarted', defaultMessage: 'Not started' })}</span></div>
              {binderStatus && binderStatus !== 'completed' && binderStatus !== 'failed' ? (
                <div className="rounded-full bg-white/10 px-3 py-2 text-xs text-[#D1D5DB]">
                  {intl.formatMessage({ id: 'auditRoom.progressLabel', defaultMessage: 'Progress:' })} {binderProgress}% {binderMessage ? `· ${binderMessage}` : ''}
                </div>
              ) : binderMessage ? (
                <div className="rounded-full bg-white/10 px-3 py-2 text-xs text-[#D1D5DB]">{binderMessage}</div>
              ) : null}
              {downloadUrl ? (
                <button
                  type="button"
                  onClick={handleDownloadBinder}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#149047] disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isDownloading
                    ? intl.formatMessage({ id: 'auditRoom.downloading', defaultMessage: 'Downloading...' })
                    : intl.formatMessage({ id: 'auditRoom.downloadPdf', defaultMessage: 'Download binder PDF' })}
                </button>
              ) : (
                <div className="text-gray-500">{intl.formatMessage({ id: 'auditRoom.generatedWhenFinished', defaultMessage: 'It will be generated once the process finishes.' })}</div>
              )}
              {downloadError ? (
                <div className="mt-2 text-sm text-[#F8B4B4]">{downloadError}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#2A2E3D] bg-[#111827] p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-[#7C3AED] font-semibold">{intl.formatMessage({ id: 'auditRoom.evidencesLabel', defaultMessage: 'Evidences' })}</div>
                <div className="text-xs text-gray-400">{intl.formatMessage({ id: 'auditRoom.selectFolderHint', defaultMessage: 'Select a folder to view items.' })}</div>
              </div>
              <div className="text-xs text-gray-500">
                {selectedFolder ? selectedFolder.label : intl.formatMessage({ id: 'auditRoom.noFolderSelected', defaultMessage: 'No folder selected' })}
              </div>
            </div>

            {selectedFolder ? (
              loadingEvidences ? (
                <div className="py-10 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'auditRoom.loadingEvidences', defaultMessage: 'Loading evidences...' })}</div>
              ) : evidences.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#2A2E3D] bg-[#0F1119] p-6 text-center text-sm text-gray-400">
                  {intl.formatMessage({ id: 'auditRoom.noEvidencesInFolder', defaultMessage: 'No evidences available in this folder.' })}
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleEvidences.map((item) => {
                    const selected = selectedIds.includes(item.id)
                    const itemMeta = [item.clause_ref, item.type, item.created_at ? formatDateTime(item.created_at, dateFormat, language) : null]
                      .filter(Boolean)
                      .join(' · ')

                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleEvidence(item.id)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          selected ? 'border-[#4F6EF7] bg-[#0F1729]' : 'border-[#2A2E3D] bg-[#111827] hover:border-[#4F6EF7]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{item.name}</div>
                            <div className="text-xs text-gray-400">{itemMeta}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selected ? <CheckCircle2 className="h-4 w-4 text-[#4F6EF7]" /> : <FileText className="h-4 w-4 text-gray-500" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                  {hasMoreEvidences ? (
                    <button
                      type="button"
                      onClick={() => setShowAllEvidences((current) => !current)}
                      className="w-full rounded-3xl border border-[#2A2E3D] bg-[#111827] px-4 py-3 text-sm font-semibold text-[#D1D5DB] transition hover:border-[#4F6EF7] hover:text-white"
                    >
                      {showAllEvidences
                        ? intl.formatMessage({ id: 'auditRoom.showLess', defaultMessage: 'Ver menos' })
                        : intl.formatMessage({ id: 'auditRoom.showMore', defaultMessage: 'Ver más' })}
                    </button>
                  ) : null}
                </div>
              )
            ) : (
              <div className="rounded-3xl border border-dashed border-[#2A2E3D] bg-[#0F1119] p-6 text-center text-sm text-gray-400">
                {intl.formatMessage({ id: 'auditRoom.selectFolderToView', defaultMessage: 'Select a folder to view evidences.' })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#2A2E3D] bg-[#111827] p-4 flex flex-col gap-3">
            <button
              onClick={startBinderGeneration}
              disabled={isGeneratingBinder || selectedIds.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3B5EEB] disabled:opacity-50"
            >
              {isGeneratingBinder
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {intl.formatMessage({ id: 'auditRoom.generatingBinder', defaultMessage: 'Generating binder...' })}</>
                : intl.formatMessage({ id: 'auditRoom.generateBinder', defaultMessage: 'Generate binder' })}
            </button>
            <p className="text-xs text-gray-400">{intl.formatMessage({ id: 'auditRoom.createBinderHint', defaultMessage: 'Select items to create a binder PDF from Audit Room.' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
