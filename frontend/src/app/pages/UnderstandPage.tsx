import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/common/ActionButton'
import Card from '../components/common/Card';
import { translations } from '../types';
import { getGapsSummary, getPhases } from '../../api/assessment';
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
  t = t || translations['en']
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [data, phasesList] = await Promise.all([getGapsSummary(), getPhases()])
        if (mounted) {
          setSummary(data)
          setPhases(phasesList || [])
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

  const [phases, setPhases] = React.useState<Array<{ id: string; name: string }>>([])

  // build a list of phase entries from per_phase for display, ordered by critical_unanswered then unanswered
  const phaseList = React.useMemo(() => {
    if (!summary?.per_phase) return []
    return Object.entries(summary.per_phase)
      .map(([id, v], idx) => {
        const phaseMeta = phases.find((x) => String(x.id) === String(id))
        const tpl = phaseTemplates[String(id)]
        const readableName = phaseMeta?.name || tpl?.title || `Fase ${idx + 1}`
        return { id, name: readableName, rawName: phaseMeta?.name ?? null, ...(v as PerPhase) }
      })
      .sort((a, b) => (b.critical_unanswered || 0) - (a.critical_unanswered || 0) || (b.unanswered || 0) - (a.unanswered || 0))
  }, [summary, phases])

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[#1A1D26] dark:text-[#E4E7EE]">{t.gapAnalysis}</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-[18px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] transition-colors">
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{t.totalGaps}</div>
          <div className={`text-[28px] font-bold text-[#1A1D26] dark:text-[#E4E7EE]`}>{summary ? summary.total_questions : '—'}</div>
          <div className="text-[11px] text-[#5F6B7A] dark:text-[#9AA3B4] mt-1">{t.acrossFrameworks}</div>
        </div>
        <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-[18px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] transition-colors">
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{t.criticalGaps}</div>
          <div className={`text-[28px] font-bold text-[#E5484D]`}>{summary ? summary.critical_unanswered : '—'}</div>
          <div className="text-[11px] text-[#5F6B7A] dark:text-[#9AA3B4] mt-1">{t.requireAction}</div>
        </div>
        <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-[18px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] transition-colors">
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{t.gapsClosed}</div>
          <div className={`text-[28px] font-bold text-[#1DB954]`}>{summary ? `${summary.answered} / ${summary.total_questions}` : '—'}</div>
          <div className="text-[11px] text-[#5F6B7A] dark:text-[#9AA3B4] mt-1">{summary ? `${summary.overall_progress}% ${t.progress}` : t.progress}</div>
        </div>
      </div>

      <Card title={t.gapAnalysis}>
        {loading && <div className="text-sm text-[#5F6B7A]">Cargando...</div>}
        {!loading && phaseList.length === 0 && <div className="text-sm text-[#5F6B7A]">No hay brechas para mostrar.</div>}

        {!loading && phaseList.length > 0 && (
          <div className="space-y-3">
            {phaseList.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white dark:bg-[#0F1720] p-3 rounded-md border border-[#E6E9EE] dark:border-[#22262D]">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">{p.name}</div>
                    {/* critical badge */}
                    {p.critical_unanswered > 0 && (
                      <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E5484D] text-white">{p.critical_unanswered} críticas</div>
                    )}
                  </div>

                  <div className="text-xs text-[#6B7584] dark:text-[#9AA3B4]">{p.unanswered} brechas sin responder — {p.critical_unanswered} críticas</div>
                  <div className="text-xxs text-[#98A0AA] dark:text-[#7F8B98] mt-1">Al pulsar "Crear documentación" se inicia un proceso guiado donde la IA genera el documento recomendado para cerrar estas brechas.</div>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    label="Crear documentación"
                    onClick={async () => {
                      try {
                        // Validate action, but navigate regardless for better UX
                        try {
                          const actions = await getGapActions(p.id)
                          if (!actions.can_create_document && p.unanswered === 0) {
                            Toast.info(`No hay brechas sin responder en esta fase, pero puedes crear documentación igualmente.`)
                          }
                        } catch (err) {
                          // Continue anyway if validation fails
                          console.warn('Could not validate action', err)
                        }
                        
                        if (onNavigate) {
                          onNavigate(`documents?create=${p.id}`)
                        } else {
                          navigate(`/documents?create=${p.id}`)
                        }
                      } catch (err) {
                        Toast.error('Error al navegar')
                        console.error(err)
                      }
                    }}
                    variant="primary"
                  />

                  <ActionButton
                    label="Modificar documentación"
                    onClick={async () => {
                      try {
                        // Navigate to documents editor
                        if (onNavigate) {
                          onNavigate(`documents?edit=${p.id}`)
                        } else {
                          navigate(`/documents?edit=${p.id}`)
                        }
                      } catch (err) {
                        Toast.error('Error al navegar')
                        console.error(err)
                      }
                    }}
                    variant="secondary"
                  />

                  <ActionButton
                    label="Auditar hallazgo"
                    onClick={async () => {
                      try {
                        // Navigate to audit page
                        if (onNavigate) {
                          onNavigate(`audit?phase=${p.id}`)
                        } else {
                          navigate(`/audit?phase=${p.id}`)
                        }
                      } catch (err) {
                        Toast.error('Error al navegar')
                        console.error(err)
                      }
                    }}
                    variant={p.critical_unanswered > 0 ? 'danger' : 'secondary'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
