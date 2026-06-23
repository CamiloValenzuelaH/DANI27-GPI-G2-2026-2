import { useEffect, useMemo, useState } from 'react'
import Card from '../components/common/Card'
import ValidationHistory from '../components/ValidationHistory'
import { getGapsSummary, getPhases } from '../../api/assessment'

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

export default function FindingsPage() {
  const [summary, setSummary] = useState<GapsSummary | null>(null)
  const [phases, setPhases] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [summaryData, phasesData] = await Promise.all([getGapsSummary(), getPhases()])
        if (!active) return
        setSummary(summaryData)
        setPhases(phasesData)
      } catch (err) {
        if (!active) return
        setError('No se pudieron cargar los hallazgos. Intenta recargar la página.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const phaseList = useMemo(() => {
    if (!summary) return []

    return Object.entries(summary.per_phase).map(([id, values], index) => {
      const phaseMeta = phases.find((item) => item.id === id)
      return {
        id,
        name: phaseMeta?.name ?? `Fase ${index + 1}`,
        ...values,
      }
    })
    .sort((a, b) => b.critical_unanswered - a.critical_unanswered || b.unanswered - a.unanswered)
  }, [summary, phases])

  const totalQuestions = summary?.total_questions ?? 0
  const answeredQuestions = summary?.answered ?? 0
  const criticalUnanswered = summary?.critical_unanswered ?? 0
  const progress = summary?.overall_progress ?? 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Hallazgos</h1>
          <p className="text-sm text-white/50 mt-1">Visualiza los hallazgos de validación y las brechas detectadas en el gap analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">Gaps Totales</div>
          <div className="text-3xl font-semibold text-white">{totalQuestions}</div>
          <div className="text-xs text-white/50 mt-2">Preguntas de gap analysis</div>
        </div>
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">Sin responder</div>
          <div className="text-3xl font-semibold text-[#E5484D]">{totalQuestions - answeredQuestions}</div>
          <div className="text-xs text-white/50 mt-2">Incluye brechas críticas</div>
        </div>
        <div className="bg-[#1A1D28] rounded-xl border border-[#2A2E3D] p-4">
          <div className="text-sm text-white/40 uppercase tracking-wide mb-2">Progreso</div>
          <div className="text-3xl font-semibold text-[#1DB954]">{progress}%</div>
          <div className="text-xs text-white/50 mt-2">Avance en gap analysis</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <Card title="Hallazgos de validación">
          <div className="text-sm text-[#94A3B8] mb-4">
            Revisa los hallazgos generados por la validación granular de documentos en el historial reciente.
          </div>
          <ValidationHistory />
        </Card>

        <div className="space-y-6">
          <Card title="Brechas críticas">
            {loading ? (
              <div className="text-sm text-[#94A3B8]">Cargando las brechas...</div>
            ) : error ? (
              <div className="text-sm text-rose-300">{error}</div>
            ) : phaseList.length === 0 ? (
              <div className="text-sm text-[#94A3B8]">No se encontraron brechas en este momento.</div>
            ) : (
              <div className="space-y-3">
                {phaseList.slice(0, 5).map((phase) => (
                  <div key={phase.id} className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{phase.name}</div>
                        <div className="text-xs text-[#94A3B8] mt-1">{phase.unanswered} brechas sin responder · {phase.critical_unanswered} críticas</div>
                      </div>
                      <div className="text-sm font-semibold text-[#FBBF24]">{phase.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Hallazgos de Gap Analysis">
            <div className="text-sm text-[#94A3B8] mb-4">
              Revisa el estado actual por fase y accede a los hallazgos más importantes del gap analysis.
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                <div className="text-sm text-[#94A3B8]">Brechas críticas abiertas</div>
                <div className="text-2xl font-semibold text-[#E5484D]">{criticalUnanswered}</div>
              </div>
              <div className="rounded-2xl border border-[#2A2E3D] bg-[#111827] p-4">
                <div className="text-sm text-[#94A3B8]">Preguntas respondidas</div>
                <div className="text-2xl font-semibold text-[#1DB954]">{answeredQuestions}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
