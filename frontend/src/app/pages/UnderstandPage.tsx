import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { useIntl } from 'react-intl'
import ActionButton from '../components/common/ActionButton'
import Card from '../components/common/Card';
import { translations } from '../types';
import { CriticalGapItem, getCriticalGaps, getGapsSummary, getPhases } from '../../api/assessment';
import phaseTemplates from '../config/phaseTemplates'
import { getGapActions } from '../../api/assessment'
import Toast from '../utils/toast'

type PerPhase = {
  answered: number
  total: number
  unanswered: number
  critical_questions: number
  critical_answered: number
  critical_unanswered: number
  percent: number
}

export default function UnderstandPage({ t, onNavigate }: { t?: typeof translations['en']; onNavigate?: (route: string) => void }) {
  const navigate = useNavigate()
  const intl = useIntl()
  t = t || translations['en']
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any | null>(null)
  const [criticalGaps, setCriticalGaps] = useState<CriticalGapItem[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [data, phasesList, criticalItems] = await Promise.all([getGapsSummary(), getPhases(), getCriticalGaps()])
        if (mounted) {
          setSummary(data)
          setPhases(phasesList || [])
          setCriticalGaps(criticalItems || [])
        }
      } catch (err) {
        console.error('Failed to load gaps summary or phases', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const [phases, setPhases] = React.useState<Array<{ id: string; name: string; code?: string; sort_order?: number }>>([])

  const criticalGapsByPhase = React.useMemo(() => {
    const grouped: Record<string, CriticalGapItem[]> = {}
    for (const item of criticalGaps) {
      const key = String(item.phase_id)
      grouped[key] = grouped[key] || []
      grouped[key].push(item)
    }
    return grouped
  }, [criticalGaps])

  const criticalReasonLabel = (reason: CriticalGapItem['open_reason']) => {
    if (reason === 'answered_no') return intl.formatMessage({ id: 'understand.reason.no', defaultMessage: 'Respondida como NO' })
    if (reason === 'answered_partial') return intl.formatMessage({ id: 'understand.reason.partial', defaultMessage: 'Respondida como PARCIAL' })
    return intl.formatMessage({ id: 'understand.reason.unanswered', defaultMessage: 'Sin responder' })
  }

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({})

  const togglePhaseExpanded = (phaseId: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }))
  }

  const ANNEX_A_PHASE_CODES = ['phase-4']

  const isAnnexAPhase = (phase: { id: string; name?: string; code?: string; sort_order?: number }) => {
    const normalizedCode = (phase.code || '').toLowerCase()
    const normalizedName = (phase.name || '').toLowerCase()
    return (
      ANNEX_A_PHASE_CODES.includes(normalizedCode) ||
      normalizedName.includes('annex a') ||
      normalizedName.includes('anexo a')
    )
  }

  const formatClauseRefLabel = (clauseRef?: string) => {
    if (!clauseRef) return ''
    if (clauseRef.startsWith('A.')) {
      return intl.formatMessage({ id: 'understand.controlLabel', defaultMessage: 'Control {value}' }, { value: clauseRef })
    }
    return intl.formatMessage({ id: 'understand.clauseLabel', defaultMessage: 'Clause {value}' }, { value: clauseRef })
  }

  function GapCard({ gap }: { gap: CriticalGapItem }) {
    return (
      <div className="rounded-xl border border-[#4A1F22] bg-[#2A1518] p-3 mb-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#FFB4B8] mb-1">
            {criticalReasonLabel(gap.open_reason)} {gap.clause_ref ? `· ${formatClauseRefLabel(gap.clause_ref)}` : ''}
          </div>
          {gap.has_evidence ? (
            <div className="text-xs text-[#A7F3D0] mt-0 font-semibold">{intl.formatMessage({ id: 'understand.linkedEvidence', defaultMessage: 'Evidencia vinculada detectada' })}</div>
          ) : (
            <div className="text-xs text-[#FDE7E9] mt-0">{intl.formatMessage({ id: 'understand.noEvidence', defaultMessage: 'Sin evidencia' })}</div>
          )}
        </div>

        <div className="text-xs text-[#FDE7E9] mt-1"><span className="font-semibold">{intl.formatMessage({ id: 'understand.missing', defaultMessage: 'Falta:' })}</span> {gap.missing_requirement}</div>
        {gap.suggested_evidence && (
          <div className="text-xs text-[#FDE7E9] mt-1"><span className="font-semibold">{intl.formatMessage({ id: 'understand.suggestedEvidence', defaultMessage: 'Evidencia sugerida:' })}</span> {gap.suggested_evidence}</div>
        )}
      </div>
    )
  }

  // build a list of phase entries from per_phase for display, ordered by critical_unanswered then unanswered
  const phaseList = React.useMemo(() => {
    if (!summary?.per_phase) return []
    return Object.entries(summary.per_phase)
      .map(([id, v], idx) => {
        const phaseMeta = phases.find((x) => String(x.id) === String(id))
        const tpl = phaseTemplates[String(id)]
        const readableName = phaseMeta?.name || tpl?.title || intl.formatMessage({ id: 'understand.phaseFallback', defaultMessage: 'Phase {index}' }, { index: idx + 1 })
        return {
          id,
          name: readableName,
          rawName: phaseMeta?.name ?? null,
          is_annex_a: isAnnexAPhase({ id, name: readableName, sort_order: phaseMeta?.sort_order }),
          ...(v as PerPhase),
        }
      })
      .sort((a, b) => (b.critical_unanswered || 0) - (a.critical_unanswered || 0) || (b.unanswered || 0) - (a.unanswered || 0))
  }, [summary, phases])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 rounded-[28px] border border-[#122033] bg-[#0F1729] p-8 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{intl.formatMessage({ id: 'understand.gapAnalysis', defaultMessage: t.gapAnalysis })}</h1>
            <div className="text-sm text-white/60 mt-2">{intl.formatMessage({ id: 'understand.actionHint', defaultMessage: 'Click "Create documentation" to start a guided flow where AI generates the recommended document to close these gaps.' })}</div>
          </div>
          <div className="text-sm text-white/60">{intl.formatMessage({ id: 'understand.frameworkSummary', defaultMessage: 'Framework status summary' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111318] rounded-[10px] p-[18px] shadow-sm border border-[#2A2E3D] transition-colors">
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{t.totalGaps}</div>
          <div className={`text-[28px] font-bold text-[#E4E7EE]`}>{summary ? summary.total_questions : '—'}</div>
          <div className="text-[11px] text-[#9AA3B4] mt-1">{t.acrossFrameworks}</div>
        </div>
        <div className="bg-[#111318] rounded-[10px] p-[18px] shadow-sm border border-[#2A2E3D] transition-colors">
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{t.criticalGaps}</div>
          <div className={`text-[28px] font-bold text-[#FCA5A5]`}>{summary ? summary.critical_unanswered : '—'}</div>
          <div className="text-[11px] text-[#9AA3B4] mt-1">{t.requireAction}</div>
        </div>
        <div className="bg-[#111318] rounded-[10px] p-[18px] shadow-sm border border-[#2A2E3D] transition-colors">
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{t.gapsClosed}</div>
          <div className={`text-[28px] font-bold text-[#1DB954]`}>{summary ? `${summary.answered} / ${summary.total_questions}` : '—'}</div>
          <div className="text-[11px] text-[#9AA3B4] mt-1">{summary ? `${summary.overall_progress}% ${t.progress}` : t.progress}</div>
        </div>
      </div>

      <Card title={t.gapAnalysis} className="bg-[#0B1116] border border-[#1F2933]">
        {loading && <div className="text-sm text-[#5F6B7A]">{intl.formatMessage({ id: 'understand.loading', defaultMessage: 'Cargando...' })}</div>}
        {!loading && phaseList.length === 0 && <div className="text-sm text-[#5F6B7A]">{intl.formatMessage({ id: 'understand.empty', defaultMessage: 'No hay brechas para mostrar.' })}</div>}

        {!loading && phaseList.length > 0 && (
          <div className="space-y-3">
            {phaseList.map((p) => (
              <div key={p.id} className="bg-[#111318] p-4 rounded-xl border border-[#22262D] shadow-sm transition-colors">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-[#E4E7EE]">{p.name}</div>
                      {p.is_annex_a && (
                        <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1E3A8A] text-[#BFDBFE]">
                          {intl.formatMessage({ id: 'understand.annexALabel', defaultMessage: 'Annex A ISO 27001 Controls' })}
                        </div>
                      )}
                      {p.critical_unanswered > 0 && (
                        <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#3B1F22] text-[#FFB4B8]">{p.critical_unanswered} críticas</div>
                      )}
                    </div>

                    <div className="text-xs text-[#6B7584] dark:text-[#9AA3B4]">
                      {intl.formatMessage(
                        { id: 'understand.phaseGapsSummary', defaultMessage: '{unanswered} unanswered gaps — {critical} critical' },
                        { unanswered: p.unanswered, critical: p.critical_unanswered },
                      )}
                    </div>
                    <div className="text-xxs text-[#7F8B98] max-w-2xl">{intl.formatMessage({ id: 'understand.actionHint', defaultMessage: 'Click "Create documentation" to start a guided flow where AI generates the recommended document to close these gaps.' })}</div>

                    {(criticalGapsByPhase[p.id] || []).length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-[#B91C1C]">{intl.formatMessage({ id: 'understand.criticalIntro', defaultMessage: 'Qué te falta en brechas críticas:' })}</div>

                        {(criticalGapsByPhase[p.id] || []).slice(0, 3).map((gap) => (
                          <GapCard key={gap.question_id} gap={gap} />
                        ))}

                        {((criticalGapsByPhase[p.id] || []).length > 3) && (
                          <div className="mt-2">
                            <button
                              className="text-xs text-[#9AA3B4]"
                              onClick={() => togglePhaseExpanded(p.id)}
                            >
                              {expandedPhases[p.id]
                                ? intl.formatMessage({ id: 'common.viewLess', defaultMessage: 'Ver menos' })
                                : intl.formatMessage({ id: 'common.viewMore', defaultMessage: 'Ver más' })}
                            </button>
                          </div>
                        )}

                        {expandedPhases[p.id] && (criticalGapsByPhase[p.id] || []).slice(3).map((gap) => (
                          <GapCard key={gap.question_id} gap={gap} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
                    <ActionButton
                      label={intl.formatMessage({ id: 'understand.createDocumentation', defaultMessage: 'Create documentation' })}
                      onClick={async () => {
                        try {
                          try {
                            const actions = await getGapActions(p.id)
                            if (!actions.can_create_document && p.unanswered === 0) {
                              Toast.info(intl.formatMessage({ id: 'understand.toast.noOpenGaps', defaultMessage: 'There are no unanswered gaps in this phase, but you can still create documentation.' }))
                            }
                          } catch (err) {
                            console.warn('Could not validate action', err)
                          }

                          if (onNavigate) {
                            onNavigate(`documents?create=${p.id}`)
                          } else {
                            navigate(`/documents?create=${p.id}`)
                          }
                        } catch (err) {
                          Toast.error(intl.formatMessage({ id: 'understand.toast.navigationError', defaultMessage: 'Navigation error' }))
                          console.error(err)
                        }
                      }}
                      variant="primary"
                    />

                    <ActionButton
                      label={intl.formatMessage({ id: 'understand.modifyDocumentation', defaultMessage: 'Modify documentation' })}
                      onClick={async () => {
                        try {
                          if (onNavigate) {
                            onNavigate(`documents?edit=${p.id}`)
                          } else {
                            navigate(`/documents?edit=${p.id}`)
                          }
                        } catch (err) {
                          Toast.error(intl.formatMessage({ id: 'understand.toast.navigationError', defaultMessage: 'Navigation error' }))
                          console.error(err)
                        }
                      }}
                      variant="secondary"
                    />

                    <ActionButton
                      label={intl.formatMessage({ id: 'understand.auditFinding', defaultMessage: 'Audit finding' })}
                      onClick={async () => {
                        try {
                          if (onNavigate) {
                            onNavigate(`audit?phase=${p.id}`)
                          } else {
                            navigate(`/audit?phase=${p.id}`)
                          }
                        } catch (err) {
                          Toast.error(intl.formatMessage({ id: 'understand.toast.navigationError', defaultMessage: 'Navigation error' }))
                          console.error(err)
                        }
                      }}
                      variant={p.critical_unanswered > 0 ? 'danger' : 'secondary'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
