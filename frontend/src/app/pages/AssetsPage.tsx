import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { usePreferences } from '../components/AppShell'
import { assetsApi, CreateAssetRequest } from '../../api/assets'
import { Asset } from '../../api/types'
import { parseFastApiError } from '../../api/errors'

const ASSET_TYPES = ['hardware', 'software', 'data', 'service', 'people', 'facility']

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
  const { darkMode } = usePreferences()
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

  const getAssetTypeLabel = (type: string) => intl.formatMessage({ id: `assets.type.${type}`, defaultMessage: type })
  const getLevelLabel = (level: string) => intl.formatMessage({ id: `assets.level.${level}`, defaultMessage: level })
  const getStatusLabel = (status: string) => intl.formatMessage({ id: `assets.status.${status}`, defaultMessage: status })
  const ciaOptions = [
    { value: 1, label: intl.formatMessage({ id: 'assets.cia.low', defaultMessage: '1 — Low' }) },
    { value: 2, label: intl.formatMessage({ id: 'assets.cia.medium', defaultMessage: '2 — Medium' }) },
    { value: 3, label: intl.formatMessage({ id: 'assets.cia.high', defaultMessage: '3 — High' }) },
  ]

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
    if (!confirm(intl.formatMessage({ id: 'assets.confirmDelete', defaultMessage: 'Delete this asset?' }))) return
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
      <div className="rounded-3xl border border-slate-700 bg-[#111827] p-6 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">{intl.formatMessage({ id: 'menu.assets' })}</h1>
            <p className="text-sm mt-0.5 text-white/50">{intl.formatMessage({ id: 'assets.subtitle', defaultMessage: 'ISO 27001 C-I-A classification' })}</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#4F6EF7] hover:bg-[#4060E0] text-white text-sm font-medium rounded-lg transition-colors"
          >
            {intl.formatMessage({ id: 'assets.newAsset', defaultMessage: '+ New asset' })}
          </button>
        </div>
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
                    {getLevelLabel(level)}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${filterLevel === level ? s.text : 'text-white'}`}>
                  {count}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{intl.formatMessage({ id: 'assets.assetsLabel', defaultMessage: 'assets' })}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/40">{intl.formatMessage({ id: 'assets.filterByType', defaultMessage: 'Filter by type:' })}</span>
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
            {t === 'all' ? intl.formatMessage({ id: 'assets.allTypes', defaultMessage: 'All types' }) : `${TYPE_ICONS[t]} ${getAssetTypeLabel(t)}`}
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
            <p className="text-white/40 text-sm">{intl.formatMessage({ id: 'assets.noneFound', defaultMessage: 'No assets found' })}</p>
            {assets.length === 0 && (
              <button onClick={openCreate} className="text-[#4F6EF7] text-sm hover:underline">
                {intl.formatMessage({ id: 'assets.addFirst', defaultMessage: 'Add your first asset' })}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2E3D]">
                  {[
                    intl.formatMessage({ id: 'assets.table.asset', defaultMessage: 'Asset' }),
                    intl.formatMessage({ id: 'assets.table.type', defaultMessage: 'Type' }),
                    'C',
                    'I',
                    'A',
                    intl.formatMessage({ id: 'assets.table.score', defaultMessage: 'Score' }),
                    intl.formatMessage({ id: 'assets.table.level', defaultMessage: 'Level' }),
                    intl.formatMessage({ id: 'assets.table.status', defaultMessage: 'Status' }),
                    '',
                  ].map((h, i) => (
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
                          {getAssetTypeLabel(asset.asset_type)}
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
                          {getLevelLabel(asset.criticality_level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] capitalize ${
                          asset.status === 'active'
                            ? 'bg-[#1DB954]/15 text-[#1DB954]'
                            : 'bg-white/5 text-white/30'
                        }`}>
                          {getStatusLabel(asset.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(asset)}
                            className="text-xs text-white/40 hover:text-white transition-colors"
                          >
                            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="text-xs text-[#E5484D]/50 hover:text-[#E5484D] transition-colors"
                          >
                            {intl.formatMessage({ id: 'evidence.delete', defaultMessage: 'Delete' })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-[#2A2E3D] text-xs text-white/30">
              {intl.formatMessage({ id: 'assets.countSummary', defaultMessage: '{filtered} of {total} assets' }, { filtered: filtered.length, total: assets.length })}
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
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
            <div className="w-full max-w-[540px] max-h-[calc(100vh-4rem)] overflow-y-auto bg-[#13151F] border border-[#2A2E3D] rounded-t-3xl shadow-2xl sm:rounded-2xl sm:mt-0">

              {/* Modal header */}
              <div className="px-6 py-4 border-b border-[#2A2E3D] flex items-center justify-between sticky top-0 bg-[#13151F]">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {editingAsset
                      ? intl.formatMessage({ id: 'assets.editAsset', defaultMessage: 'Edit asset' })
                      : intl.formatMessage({ id: 'assets.newAssetTitle', defaultMessage: 'New asset' })}
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    {editingAsset
                      ? intl.formatMessage({ id: 'assets.editSubtitle', defaultMessage: 'Update classification and metadata' })
                      : intl.formatMessage({ id: 'assets.newSubtitle', defaultMessage: 'Register a new information asset' })}
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
                <label className="text-xs font-medium text-white/50">{intl.formatMessage({ id: 'assets.field.name', defaultMessage: 'Name *' })}</label>
                <input
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder={intl.formatMessage({ id: 'assets.placeholder.name', defaultMessage: 'e.g. Production database server' })}
                  {...register('name', { required: intl.formatMessage({ id: 'assets.validation.nameRequired', defaultMessage: 'Name is required' }) })}
                />
                {errors.name && <p className="text-xs text-[#E5484D]">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">{intl.formatMessage({ id: 'assets.field.description', defaultMessage: 'Description' })}</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
                  placeholder={intl.formatMessage({ id: 'assets.placeholder.description', defaultMessage: 'Brief description of this asset...' })}
                  {...register('description')}
                />
              </div>

              {/* Type + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">{intl.formatMessage({ id: 'assets.field.type', defaultMessage: 'Asset type *' })}</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...register('asset_type', { required: intl.formatMessage({ id: 'assets.validation.typeRequired', defaultMessage: 'Type is required' }) })}
                  >
                    <option value="">{intl.formatMessage({ id: 'assets.selectType', defaultMessage: 'Select type...' })}</option>
                    {ASSET_TYPES.map(t => (
                      <option key={t} value={t} className="capitalize bg-[#1A1D28]">
                        {TYPE_ICONS[t]} {getAssetTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                  {errors.asset_type && <p className="text-xs text-[#E5484D]">{errors.asset_type.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">{intl.formatMessage({ id: 'assets.field.location', defaultMessage: 'Location' })}</label>
                  <input
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    placeholder={intl.formatMessage({ id: 'assets.placeholder.location', defaultMessage: 'e.g. AWS us-east-1' })}
                    {...register('location')}
                  />
                </div>
              </div>

              {/* C-I-A */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50">{intl.formatMessage({ id: 'assets.field.cia', defaultMessage: 'C-I-A Classification' })}</label>
                  <span className="text-[10px] text-white/25">{intl.formatMessage({ id: 'assets.ciaScale', defaultMessage: '1 = Low · 2 = Medium · 3 = High' })}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { field: 'confidentiality', label: intl.formatMessage({ id: 'assets.cia.confidentiality', defaultMessage: 'Confidentiality' }), short: 'C' },
                      { field: 'integrity',        label: intl.formatMessage({ id: 'assets.cia.integrity', defaultMessage: 'Integrity' }), short: 'I' },
                      { field: 'availability',     label: intl.formatMessage({ id: 'assets.cia.availability', defaultMessage: 'Availability' }), short: 'A' },
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
                        {ciaOptions.map(o => (
                          <option key={o.value} value={o.value} className="bg-[#1A1D28]">
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/25">
                  {intl.formatMessage({ id: 'assets.ciaScoreHint', defaultMessage: 'Score = C×0.4 + I×0.35 + A×0.25 — calculated automatically' })}
                </p>
              </div>

              {/* ISO clause */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">{intl.formatMessage({ id: 'assets.field.isoClause', defaultMessage: 'ISO clause reference' })}</label>
                <input
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder={intl.formatMessage({ id: 'assets.placeholder.isoClause', defaultMessage: 'e.g. A.8.1.1' })}
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
                  {intl.formatMessage({ id: 'risks.cancelButton', defaultMessage: 'Cancel' })}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#4F6EF7] hover:bg-[#4060E0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting
                    ? intl.formatMessage({ id: 'common.saving', defaultMessage: 'Saving...' })
                    : editingAsset
                      ? intl.formatMessage({ id: 'assets.saveChanges', defaultMessage: 'Save changes' })
                      : intl.formatMessage({ id: 'assets.createAsset', defaultMessage: 'Create asset' })
                  }
                </button>
              </div>
            </form>
          </div>
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