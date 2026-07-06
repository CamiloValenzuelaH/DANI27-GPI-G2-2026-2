import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { usePreferences } from '../components/AppShell'
import Card from '../components/common/Card'
import {
  createCapa,
  getCapas,
  getCapaSummary,
  updateCapa,
  type CAPAResponse,
  type CAPASummaryResponse,
  type CAPAPriority,
  type CAPAStatus,
} from '../../api/capas'
import { getGapsSummary, getPhases } from '../../api/assessment'
import ValidationHistory from '../components/ValidationHistory'

type GapPhase = {
  id: string
  name: string
  answered: number
  total: number
  unanswered: number
  critical_questions: number
  critical_answered: number
  critical_unanswered: number
  percent: number
}

type GapsSummary = {
  total_questions: number
  critical_unanswered: number
  answered: number
  overall_progress: number
  per_phase: Record<string, Omit<GapPhase, 'id' | 'name'>>
}

function formatDate(dateStr: string | undefined, locale: string) {
  if (!dateStr) return '—'

  try {
    return new Intl.DateTimeFormat(locale || 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function isOverdue(capa: CAPAResponse) {
  if (!capa.due_date) return false
  if (capa.status === 'resolved' || capa.status === 'closed') return false

  const dueDate = new Date(capa.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return dueDate < today
}

export default function FindingsPage() {
  const intl = useIntl()
  const { darkMode } = usePreferences()

  const priorityLabels: Record<string, string> = {
    critical: intl.formatMessage({ id: 'findings.priority.critical', defaultMessage: 'Critical' }),
    high: intl.formatMessage({ id: 'findings.priority.high', defaultMessage: 'High' }),
    medium: intl.formatMessage({ id: 'findings.priority.medium', defaultMessage: 'Medium' }),
    low: intl.formatMessage({ id: 'findings.priority.low', defaultMessage: 'Low' }),
  }

  const statusLabels: Record<string, string> = {
    open: intl.formatMessage({ id: 'findings.status.open', defaultMessage: 'Open' }),
    inProgress: intl.formatMessage({ id: 'findings.status.inProgress', defaultMessage: 'In Progress' }),
    resolved: intl.formatMessage({ id: 'findings.status.resolved', defaultMessage: 'Resolved' }),
    closed: intl.formatMessage({ id: 'findings.status.closed', defaultMessage: 'Closed' }),
  }

  const sourceLabels: Record<string, string> = {
    internal_audit: intl.formatMessage({ id: 'findings.source.internalAudit', defaultMessage: 'Internal Audit' }),
    external_audit: intl.formatMessage({ id: 'findings.source.externalAudit', defaultMessage: 'External Audit' }),
    incident: intl.formatMessage({ id: 'findings.source.incident', defaultMessage: 'Incident' }),
    management_review: intl.formatMessage({ id: 'findings.source.managementReview', defaultMessage: 'Management Review' }),
  }

  const statusOptions: Array<{ value: CAPAStatus | ''; label: string }> = [
    { value: '', label: intl.formatMessage({ id: 'findings.filter.allStatuses', defaultMessage: 'All statuses' }) },
    { value: 'open', label: statusLabels.open },
    { value: 'inProgress', label: statusLabels.inProgress },
    { value: 'resolved', label: statusLabels.resolved },
    { value: 'closed', label: statusLabels.closed },
  ]

  const priorityOptions: Array<{ value: CAPAPriority | ''; label: string }> = [
    { value: '', label: intl.formatMessage({ id: 'findings.filter.allPriorities', defaultMessage: 'All priorities' }) },
    { value: 'critical', label: priorityLabels.critical },
    { value: 'high', label: priorityLabels.high },
    { value: 'medium', label: priorityLabels.medium },
    { value: 'low', label: priorityLabels.low },
  ]

  const [capas, setCapas] = useState<CAPAResponse[]>([])
  const [summary, setSummary] = useState<CAPASummaryResponse | null>(null)
  const [gapSummary, setGapSummary] = useState<GapsSummary | null>(null)
  const [phases, setPhases] = useState<Array<{ id: string; name: string }>>([])
  const [capasLoading, setCapasLoading] = useState(true)
  const [gapsLoading, setGapsLoading] = useState(true)
  const [capasError, setCapasError] = useState<string | null>(null)
  const [gapsError, setGapsError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCapaId, setEditingCapaId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<CAPAStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<CAPAPriority | ''>('')
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'high' as CAPAPriority,
    source: 'internal_audit' as const,
    due_date: '',
    progress: '0',
    control_id: '',
  })

  const loadCapas = async () => {
    setCapasLoading(true)
    setCapasError(null)

    try {
      const [capasData, summaryData] = await Promise.all([getCapas({ limit: 50 }), getCapaSummary()])
      setCapas(capasData)
      setSummary(summaryData)
    } catch (err) {
      setCapasError(intl.formatMessage({ id: 'findings.capaLoadError', defaultMessage: 'Could not load CAPA data. Please try again.' }))
      console.error('CAPA load error:', err)
    } finally {
      setCapasLoading(false)
    }
  }

  const loadGaps = async () => {
    setGapsLoading(true)
    setGapsError(null)

    try {
      const [gapSummaryData, phasesData] = await Promise.all([getGapsSummary(), getPhases()])
      setGapSummary(gapSummaryData)
      setPhases(phasesData)
    } catch (err) {
      setGapsError(intl.formatMessage({ id: 'findings.gapsLoadError', defaultMessage: 'Could not load findings data. Please try again.' }))
      console.error('Gaps load error:', err)
    } finally {
      setGapsLoading(false)
    }
  }

  useEffect(() => {
    void loadCapas()
    void loadGaps()
  }, [intl])

  const openCount = summary?.by_status?.open ?? capas.filter((capa) => capa.status === 'open').length
  const overdueCount = summary?.overdue_count ?? capas.filter(isOverdue).length
  const closedCount = summary?.by_status?.closed ?? capas.filter((capa) => capa.status === 'closed').length
  const priorityCounts = summary?.by_priority ?? capas.reduce((acc, capa) => {
    acc[capa.priority] = (acc[capa.priority] ?? 0) + 1
    return acc
  }, {} as Record<CAPAPriority, number>)
  const totalCapas = summary?.total ?? capas.length

  const filteredCapas = useMemo(() => capas.filter((capa) => {
    if (statusFilter && capa.status !== statusFilter) return false
    if (priorityFilter && capa.priority !== priorityFilter) return false
    return true
  }), [capas, statusFilter, priorityFilter])

  const displayedCapas = filteredCapas.slice(0, 12)

  const phaseList = useMemo(() => {
    if (!gapSummary) return []

    return Object.entries(gapSummary.per_phase)
      .map(([id, values], index) => {
        const phaseMeta = phases.find((item) => item.id === id)
        return {
          id,
          name: phaseMeta?.name ?? intl.formatMessage({ id: 'findings.phaseFallback', defaultMessage: 'Phase {index}' }, { index: index + 1 }),
          ...values,
        }
      })
      .sort((a, b) => b.critical_unanswered - a.critical_unanswered || b.unanswered - a.unanswered)
  }, [gapSummary, phases, intl])

  const totalQuestions = gapSummary?.total_questions ?? 0
  const answeredQuestions = gapSummary?.answered ?? 0
  const criticalUnanswered = gapSummary?.critical_unanswered ?? 0
  const progress = gapSummary?.overall_progress ?? 0

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const startEdit = (capa: CAPAResponse) => {
    setEditingCapaId(capa.id)
    setCreateError(null)
    setForm({
      title: capa.title,
      description: capa.description ?? '',
      priority: capa.priority,
      source: capa.source,
      due_date: capa.due_date ? capa.due_date.slice(0, 10) : '',
      progress: String(capa.progress ?? 0),
      control_id: capa.control_id ?? '',
    })
  }

  const resetForm = () => {
    setEditingCapaId(null)
    setForm({
      title: '',
      description: '',
      priority: 'high',
      source: 'internal_audit',
      due_date: '',
      progress: '0',
      control_id: '',
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setCreateError(intl.formatMessage({ id: 'findings.createTitleRequired', defaultMessage: 'Title is required to create a CAPA.' }))
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority as CAPAPriority,
        source: form.source as any,
        due_date: form.due_date || undefined,
        progress: Number(form.progress) || 0,
        control_id: form.control_id || undefined,
      }

      if (editingCapaId) {
        await updateCapa(editingCapaId, {
          ...payload,
          status: 'open',
        })
      } else {
        await createCapa({
          ...payload,
          status: 'open',
        })
      }

      resetForm()
      await loadCapas()
    } catch (err) {
      console.error('CAPA save error:', err)
      setCreateError(intl.formatMessage({ id: 'findings.createError', defaultMessage: 'Could not create CAPA. Please review the fields and try again.' }))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="rounded-3xl border border-slate-700 bg-[#111827] p-6 shadow-[0_15px_45px_-25px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{intl.formatMessage({ id: 'findings.title', defaultMessage: 'CAPA Tracker' })}</h1>
            <p className="text-sm mt-1 text-white/50">{intl.formatMessage({ id: 'findings.subtitle', defaultMessage: 'Manage corrective actions, priorities, and due dates from one workspace.' })}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-[#0B1221] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-[#111827] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
            <div className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-3">{intl.formatMessage({ id: 'findings.kpi.total', defaultMessage: 'Total CAPAs' })}</div>
            <div className="text-4xl font-semibold text-white">{totalCapas}</div>
            <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.kpi.totalHelp', defaultMessage: 'Includes all registered CAPAs' })}</div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111827] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
            <div className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-3">{intl.formatMessage({ id: 'findings.kpi.open', defaultMessage: 'Open CAPAs' })}</div>
            <div className="text-4xl font-semibold text-[#E5484D]">{openCount}</div>
            <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.kpi.openHelp', defaultMessage: 'Actions currently in progress' })}</div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111827] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
            <div className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-3">{intl.formatMessage({ id: 'findings.kpi.overdue', defaultMessage: 'Overdue' })}</div>
            <div className="text-4xl font-semibold text-[#F5A623]">{overdueCount}</div>
            <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.kpi.overdueHelp', defaultMessage: 'Past due CAPAs pending completion' })}</div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111827] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.18)]">
            <div className="text-xs uppercase tracking-[0.25em] text-[#94A3B8] mb-3">{intl.formatMessage({ id: 'findings.kpi.closed', defaultMessage: 'Closed' })}</div>
            <div className="text-4xl font-semibold text-[#1DB954]">{closedCount}</div>
            <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.kpi.closedHelp', defaultMessage: 'Completed CAPAs' })}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-[#0B1221] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold mb-2 uppercase tracking-[0.24em] text-[#94A3B8]">{intl.formatMessage({ id: 'findings.filter.status', defaultMessage: 'Filter by status' })}</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as CAPAStatus | '')}
                className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#111827] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-2 uppercase tracking-[0.24em] text-[#94A3B8]">{intl.formatMessage({ id: 'findings.filter.priority', defaultMessage: 'Filter by priority' })}</label>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as CAPAPriority | '')}
                className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#111827] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white/70 shadow-sm">
            {intl.formatMessage(
              { id: 'findings.showing', defaultMessage: 'Showing {shown} of {total} CAPAs' },
              { shown: filteredCapas.length, total: totalCapas },
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <Card title={intl.formatMessage({ id: 'findings.openCorrectiveActions', defaultMessage: 'Open Corrective Actions' })}>
          {capasLoading ? (
            <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.loadingCapas', defaultMessage: 'Loading CAPAs...' })}</div>
          ) : capasError ? (
            <div className="text-sm text-rose-300 mb-4">{capasError}</div>
          ) : capas.length === 0 ? (
            <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.emptyCapas', defaultMessage: 'No CAPAs registered yet. Create a new CAPA to begin.' })}</div>
          ) : filteredCapas.length === 0 ? (
            <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.emptyFiltered', defaultMessage: 'No matching CAPAs. Adjust filters to see results.' })}</div>
          ) : (
            <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-[#0A1223] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-3 text-xs text-white">
                <thead className="bg-[#0F172A] text-left text-[11px] uppercase tracking-[0.22em] text-[#8B95A1]">
                  <tr>
                    <th className="py-4 px-4">{intl.formatMessage({ id: 'findings.table.capa', defaultMessage: 'CAPA' })}</th>
                    <th className="py-4 px-4">{intl.formatMessage({ id: 'findings.table.status', defaultMessage: 'Status' })}</th>
                    <th className="py-4 px-4">{intl.formatMessage({ id: 'findings.table.priority', defaultMessage: 'Priority' })}</th>
                    <th className="py-4 px-4">{intl.formatMessage({ id: 'findings.table.dueDate', defaultMessage: 'Due Date' })}</th>
                    <th className="py-4 px-4">{intl.formatMessage({ id: 'findings.table.progress', defaultMessage: 'Progress' })}</th>
                    <th className="py-4 px-4">{intl.formatMessage({ id: 'findings.table.overdue', defaultMessage: 'Overdue' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCapas.map((capa) => {
                    const overdue = isOverdue(capa)
                    const expanded = expandedRows.includes(capa.id)

                    return (
                      <Fragment key={capa.id}>
                        <tr
                          className={`group cursor-pointer transition duration-200 ${overdue ? 'bg-[#2C1518] ring-1 ring-rose-500/20' : 'bg-[#111827]'} hover:-translate-y-0.5 hover:bg-[#1A2032]`}
                          onClick={() => {
                            setExpandedRows((prev) =>
                              prev.includes(capa.id)
                                ? prev.filter((id) => id !== capa.id)
                                : [...prev, capa.id],
                            )
                          }}
                        >
                          <td className="py-4 px-4 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{capa.title}</span>
                              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94A3B8]">{expanded ? '▼' : '▶'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#7DB6FF]">{statusLabels[capa.status]}</td>
                          <td className="py-4 px-4 text-sm">
                            <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-sm text-white/80">{priorityLabels[capa.priority]}</span>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#A3B5D1]">{formatDate(capa.due_date, intl.locale)}</td>
                          <td className="py-4 px-4 text-sm text-[#A3B5D1]">{capa.progress}%</td>
                          <td className="py-4 px-4 text-sm">
                            {overdue ? (
                              <span className="inline-flex rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-300">
                                {intl.formatMessage({ id: 'findings.overdue', defaultMessage: 'Overdue' })}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                                {intl.formatMessage({ id: 'findings.onTime', defaultMessage: 'On time' })}
                              </span>
                            )}
                          </td>
                        </tr>

                        {expanded ? (
                          <tr className="bg-[#111827] shadow-inner">
                            <td colSpan={6} className="px-4 py-4 text-sm text-[#CBD5E1]">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7B8DAF]">{intl.formatMessage({ id: 'findings.description', defaultMessage: 'Description' })}</div>
                                  <div className="mt-2 text-sm text-white">{capa.description ?? intl.formatMessage({ id: 'findings.noDescription', defaultMessage: 'No description available.' })}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7B8DAF]">{intl.formatMessage({ id: 'findings.controlOwner', defaultMessage: 'Control / Owner' })}</div>
                                  <div className="mt-2 text-sm text-white">{capa.control_id ?? intl.formatMessage({ id: 'findings.unassigned', defaultMessage: 'Unassigned' })} · {capa.assigned_to ?? intl.formatMessage({ id: 'findings.noOwner', defaultMessage: 'No owner' })}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7B8DAF]">{intl.formatMessage({ id: 'findings.source', defaultMessage: 'Source' })}</div>
                                  <div className="mt-2 text-sm text-white">{sourceLabels[capa.source]}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7B8DAF]">{intl.formatMessage({ id: 'findings.createdUpdated', defaultMessage: 'Created / Updated' })}</div>
                                  <div className="mt-2 text-sm text-white">{formatDate(capa.created_at, intl.locale)} · {formatDate(capa.updated_at, intl.locale)}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="rounded-[28px] border border-white/10 bg-[#0A1223] shadow-[0_24px_65px_rgba(0,0,0,0.22)] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 bg-[#080F1E]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#A6B0D2]">
              {editingCapaId ? intl.formatMessage({ id: 'findings.edit.title', defaultMessage: 'Edit CAPA' }) : intl.formatMessage({ id: 'findings.create.title', defaultMessage: 'Create new CAPA' })}
            </h3>
            <p className="mt-2 text-sm text-[#BFC9E0]">{intl.formatMessage({ id: 'findings.create.subtitle', defaultMessage: 'Quickly register a corrective action and keep data synchronized.' })}</p>
          </div>
          <form className="space-y-4 p-6" onSubmit={handleSubmit}>
            {createError ? <div className="text-sm text-rose-300">{createError}</div> : null}
            <div>
              <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldTitle', defaultMessage: 'Title' })}</label>
              <input
                value={form.title}
                onChange={(event) => handleFormChange('title', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                placeholder={intl.formatMessage({ id: 'findings.create.titlePlaceholder', defaultMessage: 'e.g. Review access control evidence' })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldDescription', defaultMessage: 'Description' })}</label>
              <textarea
                value={form.description}
                onChange={(event) => handleFormChange('description', event.target.value)}
                className="w-full min-h-[110px] rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                placeholder={intl.formatMessage({ id: 'findings.create.descriptionPlaceholder', defaultMessage: 'Describe the required corrective action' })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldPriority', defaultMessage: 'Priority' })}</label>
                <select
                  value={form.priority}
                  onChange={(event) => handleFormChange('priority', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                >
                  <option value="critical">{priorityLabels.critical}</option>
                  <option value="high">{priorityLabels.high}</option>
                  <option value="medium">{priorityLabels.medium}</option>
                  <option value="low">{priorityLabels.low}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldSource', defaultMessage: 'Source' })}</label>
                <select
                  value={form.source}
                  onChange={(event) => handleFormChange('source', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                >
                  <option value="internal_audit">{sourceLabels.internal_audit}</option>
                  <option value="external_audit">{sourceLabels.external_audit}</option>
                  <option value="incident">{sourceLabels.incident}</option>
                  <option value="management_review">{sourceLabels.management_review}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldDueDate', defaultMessage: 'Due Date' })}</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => handleFormChange('due_date', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldProgress', defaultMessage: 'Progress' })}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(event) => handleFormChange('progress', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-[#A6B0D2]">{intl.formatMessage({ id: 'findings.create.fieldControlId', defaultMessage: 'Control ID' })}</label>
              <input
                value={form.control_id}
                onChange={(event) => handleFormChange('control_id', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20"
                placeholder={intl.formatMessage({ id: 'findings.optional', defaultMessage: 'Optional' })}
              />
            </div>
            <div className="flex gap-3">
              {editingCapaId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {intl.formatMessage({ id: 'findings.cancelEdit', defaultMessage: 'Cancel edit' })}
                </button>
              ) : null}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-2xl bg-gradient-to-r from-[#4F6EF7] to-[#6D8DFF] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-[#4F6EF7]/20 transition hover:from-[#3B5DE5] hover:to-[#5D7AF3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating
                  ? intl.formatMessage({ id: 'findings.creating', defaultMessage: 'Creating...' })
                  : editingCapaId
                    ? intl.formatMessage({ id: 'findings.saveAction', defaultMessage: 'Save changes' })
                    : intl.formatMessage({ id: 'findings.createAction', defaultMessage: 'Create CAPA' })}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <Card title={intl.formatMessage({ id: 'findings.priorityBreakdown', defaultMessage: 'Priority Breakdown' })}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(priorityLabels).map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                <div className="text-xs text-[#94A3B8] uppercase tracking-wide mb-2">{label}</div>
                <div className="text-3xl font-semibold text-white">{priorityCounts[key] ?? 0}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={intl.formatMessage({ id: 'findings.gapFindings', defaultMessage: 'Gap Analysis Findings' })}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
              <div className="text-sm text-[#94A3B8] uppercase tracking-wide mb-2">{intl.formatMessage({ id: 'findings.totalGaps', defaultMessage: 'Total gaps' })}</div>
              <div className="text-3xl font-semibold text-white">{totalQuestions}</div>
              <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.totalGapsHelp', defaultMessage: 'Gap analysis questions' })}</div>
            </div>
            <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
              <div className="text-sm text-[#94A3B8] uppercase tracking-wide mb-2">{intl.formatMessage({ id: 'findings.unanswered', defaultMessage: 'Unanswered' })}</div>
              <div className="text-3xl font-semibold text-[#E5484D]">{totalQuestions - answeredQuestions}</div>
              <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.unansweredHelp', defaultMessage: 'Includes critical gaps' })}</div>
            </div>
            <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
              <div className="text-sm text-[#94A3B8] uppercase tracking-wide mb-2">{intl.formatMessage({ id: 'findings.progress', defaultMessage: 'Progress' })}</div>
              <div className="text-3xl font-semibold text-[#1DB954]">{progress}%</div>
              <div className="text-xs text-white/50 mt-2">{intl.formatMessage({ id: 'findings.progressHelp', defaultMessage: 'Gap analysis completion' })}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <Card title={intl.formatMessage({ id: 'findings.validationFindings', defaultMessage: 'Validation findings' })}>
          <div className="text-sm text-[#94A3B8] mb-4">{intl.formatMessage({ id: 'findings.validationFindingsHelp', defaultMessage: 'Review findings generated by granular document validation in recent history.' })}</div>
          <ValidationHistory />
        </Card>

        <div className="space-y-6">
          <Card title={intl.formatMessage({ id: 'findings.criticalGaps', defaultMessage: 'Critical gaps' })}>
            {gapsLoading ? (
              <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.loadingGaps', defaultMessage: 'Loading gaps...' })}</div>
            ) : gapsError ? (
              <div className="text-sm text-rose-300">{gapsError}</div>
            ) : phaseList.length === 0 ? (
              <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.noGaps', defaultMessage: 'No gaps found at this moment.' })}</div>
            ) : (
              <div className="space-y-3">
                {phaseList.slice(0, 5).map((phase) => (
                  <div key={phase.id} className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{phase.name}</div>
                        <div className="text-xs text-[#94A3B8] mt-1">
                          {intl.formatMessage(
                            { id: 'findings.phaseSummary', defaultMessage: '{unanswered} unanswered gaps · {critical} critical' },
                            { unanswered: phase.unanswered, critical: phase.critical_unanswered },
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#FBBF24]">{phase.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={intl.formatMessage({ id: 'findings.indicators', defaultMessage: 'Findings indicators' })}>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.openCriticalGaps', defaultMessage: 'Open critical gaps' })}</div>
                <div className="text-2xl font-semibold text-[#E5484D]">{criticalUnanswered}</div>
              </div>
              <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                <div className="text-sm text-[#94A3B8]">{intl.formatMessage({ id: 'findings.answeredQuestions', defaultMessage: 'Answered questions' })}</div>
                <div className="text-2xl font-semibold text-[#1DB954]">{answeredQuestions}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
