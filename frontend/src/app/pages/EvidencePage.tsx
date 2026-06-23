import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import Card from '../components/common/Card'
import { evidencesApi, EvidenceTaxonomyGroup, EvidenceTaxonomyItem } from '../../api/evidences'
import UploadModal from '../components/uploader/UploadModal'

const TYPE_LABELS: Record<string, string> = {
  POLICY: 'Policy',
  PROCEDURE: 'Procedure',
  INSTRUCTION: 'Instruction',
  CONTROL: 'Control',
  RECORD: 'Record',
}

const FRESHNESS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  fresh: 'default',
  expiring: 'secondary',
  expired: 'destructive',
}

function freshnessLabel(status: string) {
  return status === 'fresh' ? 'Fresh' : status === 'expiring' ? 'Expiring Soon' : 'Expired'
}

function evidenceFilterMatch(item: EvidenceTaxonomyItem, filter: string) {
  const query = filter.toLowerCase()
  return (
    item.name.toLowerCase().includes(query) ||
    item.control_id.toLowerCase().includes(query) ||
    item.clause_ref.toLowerCase().includes(query)
  )
}

export default function EvidencePage() {
  const [groups, setGroups] = useState<EvidenceTaxonomyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showUploader, setShowUploader] = useState(false)

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
        setError('No se pudo cargar la evidencia. Intenta recargar.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Evidence Center</h1>
          <p className="text-sm text-white/50 mt-1">Organiza tu evidencia por tipo y control ISO 27001.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowUploader(true)}>
            + Upload Evidence
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">Total evidence items</div>
          <div className="text-3xl font-semibold text-white">{totalItems}</div>
          <div className="text-xs text-white/50 mt-2">Organized by evidence taxonomy</div>
        </div>
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">Filtered items</div>
          <div className="text-3xl font-semibold text-white">{matchedItems}</div>
          <div className="text-xs text-white/50 mt-2">Search and type filters applied</div>
        </div>
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">Evidence types</div>
          <div className="text-3xl font-semibold text-white">{groups.length}</div>
          <div className="text-xs text-white/50 mt-2">Grouped by taxonomy</div>
        </div>
      </div>

      <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search evidence, control, clause..."
            className="min-w-[240px] rounded-lg border border-[#2A2E3D] bg-[#0F1720] px-4 py-2 text-sm text-white outline-none focus:border-[#4F6EF7]"
          />
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="rounded-lg border border-[#2A2E3D] bg-[#0F1720] px-4 py-2 text-sm text-white outline-none"
          >
            <option value="all">All evidence types</option>
            {groups.map((group) => (
              <option key={group.type} value={group.type}>{TYPE_LABELS[group.type] ?? group.type}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-white/50">Showing {matchedItems} of {totalItems} evidence items</div>
      </div>

      {isLoading ? (
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-12 text-center text-white/60">
          Loading evidence...
        </div>
      ) : error ? (
        <div className="bg-[#601A14] rounded-xl border border-[#7F1D1D] p-8 text-white">
          {error}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-12 text-center text-white/60">
          No evidence matches your filters.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <Card key={group.type} title={`${TYPE_LABELS[group.type] ?? group.type} (${group.evidences.length})`}>
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
                          <Badge variant="outline">{item.validity_days} days</Badge>
                        )}
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
