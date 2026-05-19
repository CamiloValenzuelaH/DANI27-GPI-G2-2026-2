import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { usePreferences } from './AppShell'
import { translations } from '../types'

type Props = {
  score: number
  status: string
  title?: string
}

const COLORS = {
  Ready: '#1DB954',
  'In progress': '#F5A623',
  'At risk': '#E5484D',
  Critical: '#9CA3AF',
}

function getTone(status: string) {
  return COLORS[status as keyof typeof COLORS] ?? COLORS.Critical
}

export default function HealthScoreChart({ score, status, title = 'Health Score' }: Props) {
  const { language } = usePreferences()
  const t = (id: string, fallback: string) => translations[language][id] ?? fallback
  const safeScore = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0))
  const remainder = 100 - safeScore
  const tone = getTone(status)

  const data = [
    { name: 'score', value: safeScore },
    { name: 'remainder', value: remainder },
  ]

  return (
    <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D] shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-white/50 text-sm mt-1">{t('healthScore.subtitle', 'Backend-calculated compliance readiness')}</p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${tone}22`, color: tone }}
        >
          {t(`healthScore.status.${status.toLowerCase().replace(/\s+/g, '_')}`, status)}
        </span>
      </div>

      <div className="relative h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={82}
              outerRadius={112}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            >
              <Cell fill={tone} />
              <Cell fill="#2A2E3D" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="text-5xl font-bold tracking-tight text-white">{safeScore.toFixed(0)}%</div>
          <div className="mt-2 text-sm font-semibold text-white/70">{t(`healthScore.status.${status.toLowerCase().replace(/\s+/g, '_')}`, status)}</div>
          <div className="mt-1 text-xs text-white/40">{t('healthScore.readyLevel', 'Ready level')}</div>
        </div>
      </div>
    </div>
  )
}