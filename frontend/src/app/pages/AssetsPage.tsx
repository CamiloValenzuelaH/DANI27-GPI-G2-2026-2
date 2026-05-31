import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { assetsApi, CreateAssetRequest } from '../../api/assets'
import { Asset } from '../../api/types'
import { parseFastApiError } from '../../api/errors'

const ASSET_TYPES = ['hardware', 'software', 'data', 'service', 'people', 'facility']

const CIA_OPTIONS = [
  { value: 1, label: '1 — Low' },
  { value: 2, label: '2 — Medium' },
  { value: 3, label: '3 — High' },
]

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  low:      { bg: 'bg-[#1DB954]/15', text: 'text-[#1DB954]',  dot: 'bg-[#1DB954]'  },
  medium:   { bg: 'bg-[#F5A623]/15', text: 'text-[#F5A623]',  dot: 'bg-[#F5A623]'  },
  high:     { bg: 'bg-[#E5484D]/15', text: 'text-[#E5484D]',  dot: 'bg-[#E5484D]'  },
  critical: { bg: 'bg-[#8B5CF6]/15', text: 'text-[#B794F6]',  dot: 'bg-[#B794F6]'  },
}

const TYPE_ICONS: Record<string, string> = {
  hardware: '🖥️',
  software: '💿',
  data:     '🗄️',
  service:  '☁️',
  people:   '👤',
  facility: '🏢',
}

export default function AssetsPage() {
  const intl = useIntl()
  const [assets, setAssets] = useState<Asset[]>([])
  const [summary, setSummary] = useState<{ total: number; by_level: Record<string, number> } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAssetRequest>({
    defaultValues: { confidentiality: 1, integrity: 1, availability: 1 },
  })

  const load = async () => {
    setIsLoading(true)
    try {
      const [list, sum] = await Promise.all([assetsApi.list(), assetsApi.summary()])
      setAssets(list)
      setSummary(sum)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingAsset(null)
    reset({ confidentiality: 1, integrity: 1, availability: 1 })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset)
    reset({
      name: asset.name,
      description: asset.description ?? undefined,
      asset_type: asset.asset_type,
      location: asset.location ?? undefined,
      confidentiality: asset.confidentiality,
      integrity: asset.integrity,
      availability: asset.availability,
      clause_ref: asset.clause_ref ?? undefined,
    })
    setError(null)
    setShowForm(true)
  }

  const onSubmit = async (data: CreateAssetRequest) => {
    setError(null)
    setSubmitting(true)
    try {
      if (editingAsset) {
        await assetsApi.update(editingAsset.id, data)
      } else {
        await assetsApi.create(data)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(parseFastApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    try {
      await assetsApi.remove(id)
      await load()
    } catch (err) {
      alert(parseFastApiError(err))
    }
  }

  const filtered = assets.filter(a => {
    if (filterLevel !== 'all' && a.criticality_level !== filterLevel) return false
    if (filterType !== 'all' && a.asset_type !== filterType) return false
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Asset Inventory</h1>
          <p className="text-sm text-white/40 mt-0.5">ISO 27001 C-I-A classification</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#4F6EF7] hover:bg-[#4060E0] text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New asset
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['critical', 'high', 'medium', 'low'] as const).map(level => {
            const s = LEVEL_STYLES[level]
            const count = summary.by_level[level] ?? 0
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  filterLevel === level
                    ? `${s.bg} border-current ${s.text}`
                    : 'bg-[#1A1D28] border-[#2A2E3D] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={`text-xs font-semibold capitalize ${filterLevel === level ? s.text : 'text-white/50'}`}>
                    {level}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${filterLevel === level ? s.text : 'text-white'}`}>
                  {count}
                </div>
                <div className="text-xs text-white/30 mt-0.5">assets</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/40">Filter by type:</span>
        {['all', ...ASSET_TYPES].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
              filterType === t
                ? 'bg-[#4F6EF7] text-white'
                : 'bg-[#1A1D28] border border-[#2A2E3D] text-white/50 hover:text-white'
            }`}
          >
            {t === 'all' ? 'All types' : `${TYPE_ICONS[t]} ${t}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#4F6EF7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="text-2xl">🗂️</div>
            <p className="text-white/40 text-sm">No assets found</p>
            {assets.length === 0 && (
              <button onClick={openCreate} className="text-[#4F6EF7] text-sm hover:underline">
                Add your first asset
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2E3D]">
                  {['Asset', 'Type', 'C', 'I', 'A', 'Score', 'Level', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/30 ${
                        i >= 2 && i <= 6 ? 'text-center' : i === 8 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset, i) => {
                  const ls = LEVEL_STYLES[asset.criticality_level] ?? LEVEL_STYLES.low
                  return (
                    <tr
                      key={asset.id}
                      className={`border-b border-[#2A2E3D]/40 hover:bg-white/[0.03] transition-colors ${
                        i % 2 !== 0 ? 'bg-white/[0.01]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{asset.name}</div>
                        {asset.description && (
                          <div className="text-xs text-white/30 truncate max-w-[180px] mt-0.5">
                            {asset.description}
                          </div>
                        )}
                        {asset.clause_ref && (
                          <div className="text-[10px] text-[#4F6EF7]/70 mt-0.5">{asset.clause_ref}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-white/60 text-xs capitalize">
                          <span>{TYPE_ICONS[asset.asset_type] ?? '📦'}</span>
                          {asset.asset_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CIABadge value={asset.confidentiality} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CIABadge value={asset.integrity} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CIABadge value={asset.availability} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-white/70 text-xs">{asset.criticality_score}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${ls.bg} ${ls.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ls.dot}`} />
                          {asset.criticality_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] capitalize ${
                          asset.status === 'active'
                            ? 'bg-[#1DB954]/15 text-[#1DB954]'
                            : 'bg-white/5 text-white/30'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(asset)}
                            className="text-xs text-white/40 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="text-xs text-[#E5484D]/50 hover:text-[#E5484D] transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-[#2A2E3D] text-xs text-white/30">
              {filtered.length} of {assets.length} assets
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] max-h-[90vh] overflow-y-auto bg-[#13151F] border border-[#2A2E3D] rounded-2xl shadow-2xl z-50">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-[#2A2E3D] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {editingAsset ? 'Edit asset' : 'New asset'}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {editingAsset ? 'Update classification and metadata' : 'Register a new information asset'}
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/30 hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Name *</label>
                <input
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder="e.g. Production database server"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-[#E5484D]">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Description</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
                  placeholder="Brief description of this asset..."
                  {...register('description')}
                />
              </div>

              {/* Type + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Asset type *</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...register('asset_type', { required: 'Type is required' })}
                  >
                    <option value="">Select type...</option>
                    {ASSET_TYPES.map(t => (
                      <option key={t} value={t} className="capitalize bg-[#1A1D28]">
                        {TYPE_ICONS[t]} {t}
                      </option>
                    ))}
                  </select>
                  {errors.asset_type && <p className="text-xs text-[#E5484D]">{errors.asset_type.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Location</label>
                  <input
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    placeholder="e.g. AWS us-east-1"
                    {...register('location')}
                  />
                </div>
              </div>

              {/* C-I-A */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50">C-I-A Classification</label>
                  <span className="text-[10px] text-white/25">1 = Low · 2 = Medium · 3 = High</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { field: 'confidentiality', label: 'Confidentiality', short: 'C' },
                      { field: 'integrity',        label: 'Integrity',       short: 'I' },
                      { field: 'availability',     label: 'Availability',    short: 'A' },
                    ] as const
                  ).map(({ field, label, short }) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-xs text-white/30">
                        <span className="font-bold text-white/60">{short}</span> — {label}
                      </label>
                      <select
                        className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                        {...register(field, { valueAsNumber: true })}
                      >
                        {CIA_OPTIONS.map(o => (
                          <option key={o.value} value={o.value} className="bg-[#1A1D28]">
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/25">
                  Score = C×0.4 + I×0.35 + A×0.25 — calculated automatically
                </p>
              </div>

              {/* ISO clause */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">ISO clause reference</label>
                <input
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder="e.g. A.8.1.1"
                  {...register('clause_ref')}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-[#E5484D]/10 border border-[#E5484D]/20 px-4 py-3 text-sm text-[#E5484D]">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#4F6EF7] hover:bg-[#4060E0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting
                    ? 'Saving...'
                    : editingAsset ? 'Save changes' : 'Create asset'
                  }
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

function CIABadge({ value }: { value: number }) {
  const styles = {
    1: 'bg-[#1DB954]/10 text-[#1DB954]',
    2: 'bg-[#F5A623]/10 text-[#F5A623]',
    3: 'bg-[#E5484D]/10 text-[#E5484D]',
  }
  return (
    <span className={`inline-block w-6 h-6 rounded text-xs font-bold leading-6 text-center ${styles[value as 1|2|3] ?? styles[1]}`}>
      {value}
    </span>
  )
}