import { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import Card from '../components/common/Card'
import { usePreferences } from '../components/AppShell'
import { evidencesApi, EvidenceTaxonomyGroup, EvidenceTaxonomyItem } from '../../api/evidences'
import UploadModal from '../components/uploader/UploadModal'

const FRESHNESS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  fresh: 'default',
  expiring: 'secondary',
  expired: 'destructive',
}

function evidenceFilterMatch(item: EvidenceTaxonomyItem, filter?: string) {
  const query = (filter ?? '').toLowerCase()
  return (
    (item.name ?? '').toLowerCase().includes(query) ||
    (item.control_id ?? '').toLowerCase().includes(query) ||
    (item.clause_ref ?? '').toLowerCase().includes(query)
  )
}

interface EvidencePageProps {
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
}

export default function EvidencePage({ searchQuery = '', onSearchQueryChange = () => {} }: EvidencePageProps) {
  const intl = useIntl()
  const [searchParams] = useSearchParams()
  const [groups, setGroups] = useState<EvidenceTaxonomyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(searchQuery || searchParams.get('q') || '')
  const [selectedType] = useState('all')
  const [showUploader, setShowUploader] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { darkMode } = usePreferences()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await evidencesApi.list()
        if (!mounted) return
        setGroups(data)
      } catch (err) {
        setError(intl.formatMessage({ id: 'evidence.loadError', defaultMessage: 'Could not load evidence. Please try again.' }))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [intl])

  useEffect(() => {
    const queryParam = searchParams.get('q') ?? ''
    setSearch(searchQuery || queryParam)
  }, [searchQuery, searchParams])

  const typeLabels: Record<string, string> = {
    POLICY: intl.formatMessage({ id: 'evidence.type.policy', defaultMessage: 'Policy' }),
    PROCEDURE: intl.formatMessage({ id: 'evidence.type.procedure', defaultMessage: 'Procedure' }),
    INSTRUCTION: intl.formatMessage({ id: 'evidence.type.instruction', defaultMessage: 'Instruction' }),
    CONTROL: intl.formatMessage({ id: 'evidence.type.control', defaultMessage: 'Control' }),
    RECORD: intl.formatMessage({ id: 'evidence.type.record', defaultMessage: 'Record' }),
  }

  const freshnessLabel = (status: string) => {
    if (status === 'fresh') return intl.formatMessage({ id: 'evidence.freshness.fresh', defaultMessage: 'Fresh' })
    if (status === 'expiring') return intl.formatMessage({ id: 'evidence.freshness.expiring', defaultMessage: 'Expiring Soon' })
    return intl.formatMessage({ id: 'evidence.freshness.expired', defaultMessage: 'Expired' })
  }

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        evidences: group.evidences.filter((item) => {
          const typeMatches = selectedType === 'all' || group.type === selectedType
          return typeMatches && evidenceFilterMatch(item, search)
        }),
      }))
      .filter((group) => group.evidences.length > 0)
  }, [groups, search, selectedType])

  const totalItems = groups.reduce((sum, group) => sum + group.evidences.length, 0)
  const matchedItems = filteredGroups.reduce((sum, group) => sum + group.evidences.length, 0)

  const removeEvidenceFromGroups = (targetId: string) => {
    setGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          evidences: group.evidences.filter((item) => item.id !== targetId),
        }))
        .filter((group) => group.evidences.length > 0),
    )
  }

  const handleDeleteEvidence = async (item: EvidenceTaxonomyItem) => {
    const confirmed = window.confirm(
      intl.formatMessage(
        { id: 'evidence.confirmDelete', defaultMessage: 'Delete evidence "{name}"? This action cannot be undone.' },
        { name: item.name },
      ),
    )
    if (!confirmed) return

    setDeletingId(item.id)
    setError(null)
    try {
      await evidencesApi.remove(item.id)
      removeEvidenceFromGroups(item.id)
    } catch {
      setError(intl.formatMessage({ id: 'evidence.deleteError', defaultMessage: 'Could not delete evidence. Please try again.' }))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="rounded-3xl border border-slate-700 bg-[#111827] p-6 shadow-[0_15px_45px_-25px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{intl.formatMessage({ id: 'evidence.title', defaultMessage: 'Evidence Center' })}</h1>
            <p className="text-sm mt-1 text-white/50">{intl.formatMessage({ id: 'evidence.subtitle', defaultMessage: 'Organize your evidence by type and ISO 27001 control.' })}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowUploader(true)}>
              {intl.formatMessage({ id: 'evidence.uploadAction', defaultMessage: '+ Upload Evidence' })}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">{intl.formatMessage({ id: 'evidence.kpi.totalItems', defaultMessage: 'Total evidence items' })}</div>
          <div className="text-3xl font-semibold text-white">{totalItems}</div>
          <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'evidence.kpi.totalItemsHelp', defaultMessage: 'Organized by evidence taxonomy' })}</div>
        </div>
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">{intl.formatMessage({ id: 'evidence.kpi.filteredItems', defaultMessage: 'Filtered items' })}</div>
          <div className="text-3xl font-semibold text-white">{matchedItems}</div>
          <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'evidence.kpi.filteredItemsHelp', defaultMessage: 'Search and type filters applied' })}</div>
        </div>
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">{intl.formatMessage({ id: 'evidence.kpi.types', defaultMessage: 'Evidence types' })}</div>
          <div className="text-3xl font-semibold text-white">{groups.length}</div>
          <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'evidence.kpi.typesHelp', defaultMessage: 'Grouped by taxonomy' })}</div>
        </div>
      </div>

      <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(event) => {
              const value = event.target.value
              setSearch(value)
              onSearchQueryChange(value)
            }}
            placeholder={intl.formatMessage({ id: 'evidence.searchPlaceholder', defaultMessage: 'Search evidence, control, clause...' })}
            className="min-w-[240px] rounded-lg border border-[#2A2E3D] bg-[#0F1720] px-4 py-2 text-sm text-white outline-none focus:border-[#4F6EF7]"
          />
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="rounded-lg border border-[#2A2E3D] bg-[#0F1720] px-4 py-2 text-sm text-white outline-none"
          >
            <option value="all">{intl.formatMessage({ id: 'evidence.allTypes', defaultMessage: 'All evidence types' })}</option>
            {groups.map((group) => (
              <option key={group.type} value={group.type}>{typeLabels[group.type] ?? group.type}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-white/50">
          {intl.formatMessage(
            { id: 'evidence.showing', defaultMessage: 'Showing {matched} of {total} evidence items' },
            { matched: matchedItems, total: totalItems },
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-12 text-center text-white/60">
          {intl.formatMessage({ id: 'evidence.loading', defaultMessage: 'Loading evidence...' })}
        </div>
      ) : error ? (
        <div className="bg-[#601A14] rounded-xl border border-[#7F1D1D] p-8 text-white">
          {error}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-12 text-center text-white/60">
          {intl.formatMessage({ id: 'evidence.empty', defaultMessage: 'No evidence matches your filters.' })}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <Card key={group.type} title={`${typeLabels[group.type] ?? group.type} (${group.evidences.length})`}>
              <div className="grid gap-4">
                {group.evidences.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-white/50 uppercase tracking-[0.2em]">{item.control_id}</p>
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="text-sm text-white/50">{item.clause_ref}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={FRESHNESS_VARIANTS[item.freshness_status] ?? 'default'}>
                          {freshnessLabel(item.freshness_status)}
                        </Badge>
                        {item.validity_days != null && (
                          <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-100">
                            {intl.formatMessage({ id: 'evidence.validityDays', defaultMessage: '{days} days' }, { days: item.validity_days })}
                          </Badge>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteEvidence(item)}
                        >
                          {deletingId === item.id
                            ? intl.formatMessage({ id: 'evidence.deleting', defaultMessage: 'Deleting...' })
                            : intl.formatMessage({ id: 'evidence.delete', defaultMessage: 'Delete' })}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <UploadModal open={showUploader} onOpenChange={setShowUploader} />
    </div>
  )
}
