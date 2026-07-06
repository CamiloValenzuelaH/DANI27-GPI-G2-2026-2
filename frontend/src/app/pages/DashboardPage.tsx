import { TrendingUp, TrendingDown } from 'lucide-react';
import KpiChart from '../components/KpiChart';
import HealthScoreChart from '../components/HealthScoreChart';
import SearchBinder from '../components/SearchBinder';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import type {
  DashboardActivityItem,
  DashboardMetricsResponse,
  DashboardUpcomingTaskItem,
} from '../../api/types';
import { usePreferences } from '../components/AppShell';
import { translations } from '../types';

const defaultActivities: DashboardActivityItem[] = []
const defaultTasks: DashboardUpcomingTaskItem[] = []

export default function DashboardPage() {
  const { language, auditCycle } = usePreferences();
  const intl = {
    formatMessage: ({ id, defaultMessage }: { id: string; defaultMessage?: string }) => {
      const messages = translations[language] as Record<string, string>;
      return messages[id] ?? defaultMessage ?? id;
    },
  };
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
  const [activities, setActivities] = useState<DashboardActivityItem[]>(defaultActivities)
  const [tasks, setTasks] = useState<DashboardUpcomingTaskItem[]>(defaultTasks)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const initialQuery = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [metricsData, recentActivity, upcomingTasks] = await Promise.all([
          dashboardApi.metrics(),
          dashboardApi.recentActivity(),
          dashboardApi.upcomingTasks(),
        ])
        if (!mounted) return
        setMetrics(metricsData)
        setActivities(recentActivity)
        setTasks(upcomingTasks)
      } catch (e: any) {
        console.error('Error fetching dashboard data', e)
        setError(intl.formatMessage({ id: 'dashboard.kpiLoadError' }))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const latestTrend = metrics?.trend.at(-1)
  const previousTrend = metrics?.trend.at(-2)
  const healthScore = metrics?.health_score ?? 0
  const healthStatus = metrics?.health_status ?? 'Critical'

  const auditCountdown = useMemo(() => {
    const now = new Date()
    if (metrics?.next_audit_date) {
      const targetDate = new Date(metrics.next_audit_date)
      const diffMs = targetDate.getTime() - now.getTime()
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      return {
        daysLeft,
        targetDate,
        referenceLabel: metrics?.last_audit_date
          ? `${intl.formatMessage({ id: 'dashboard.lastAudit', defaultMessage: 'Last audit' })}: ${metrics.last_audit_date}`
          : intl.formatMessage({ id: 'dashboard.today', defaultMessage: 'From today' }),
      }
    }

    const auditFrequencyDays = (() => {
      switch (auditCycle) {
        case 'quarterly':
          return 90
        case 'annual':
          return 365
        default:
          return 30
      }
    })()

    const reference = metrics?.last_audit_date ? new Date(metrics.last_audit_date) : new Date()
    const targetDate = new Date(reference)
    targetDate.setDate(reference.getDate() + auditFrequencyDays)
    const diffMs = targetDate.getTime() - now.getTime()
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    return {
      daysLeft,
      targetDate,
      referenceLabel: metrics?.last_audit_date
        ? `${intl.formatMessage({ id: 'dashboard.lastAudit', defaultMessage: 'Last audit' })}: ${metrics.last_audit_date}`
        : intl.formatMessage({ id: 'dashboard.today', defaultMessage: 'From today' }),
    }
  }, [metrics?.next_audit_date, metrics?.last_audit_date, auditCycle, intl])

  const cardData = metrics
    ? [
        {
          label: intl.formatMessage({ id: 'dashboard.documentation' }),
          value: metrics.documentation_percentage,
          color: 'bg-[#4F6EF7]',
          delta: latestTrend && previousTrend ? latestTrend.documentation_percentage - previousTrend.documentation_percentage : 0,
        },
        {
          label: intl.formatMessage({ id: 'dashboard.implementation' }),
          value: metrics.implementation_percentage,
          color: 'bg-[#1DB954]',
          delta: latestTrend && previousTrend ? latestTrend.implementation_percentage - previousTrend.implementation_percentage : 0,
        },
        {
          label: intl.formatMessage({ id: 'dashboard.tested' }),
          value: metrics.tested_percentage,
          color: 'bg-[#F5A623]',
          delta: latestTrend && previousTrend ? latestTrend.tested_percentage - previousTrend.tested_percentage : 0,
        },
      ]
    : []

  const chartLabels = metrics?.trend.map(point => point.month) ?? []
  const chartValues = metrics?.trend.map(point => point.health_score) ?? []

  const formatDelta = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 rounded-[28px] border border-white/10 bg-[#111827] p-8 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-white/40 font-semibold">
              {intl.formatMessage({ id: 'dashboard.overviewLabel', defaultMessage: 'Dashboard' })}
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">
              {intl.formatMessage({ id: 'menu.dashboard' })}
            </h1>
            <p className="mt-3 text-sm text-white/60 max-w-2xl">
              {intl.formatMessage({ id: 'dashboard.overview', defaultMessage: 'Overview of your compliance health and next steps for your organization.' })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">{intl.formatMessage({ id: 'dashboard.cycleLabel', defaultMessage: 'Cycle' })}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{auditCycle.charAt(0).toUpperCase() + auditCycle.slice(1)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">{intl.formatMessage({ id: 'dashboard.statusLabel', defaultMessage: 'Status' })}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{healthStatus}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cardData.map((metric, index) => (
              <div
                key={index}
                className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D] h-36 flex flex-col justify-between"
              >
                <div>
                  <div className="text-white/60 text-sm mb-2">{metric.label}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">{metric.value.toFixed(1)}%</div>
                    <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${metric.delta >= 0 ? 'text-[#1DB954]' : 'text-[#E5484D]'}`}>
                      {metric.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatDelta(metric.delta)}
                    </div>
                  </div>

                  <div className="w-32">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(metric.value, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
            <div>
              <HealthScoreChart score={healthScore} status={healthStatus} />
            </div>

            <div className="flex">
              <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D] w-full h-full">
                <div className="text-white/60 text-sm mb-2">{intl.formatMessage({ id: 'dashboard.nextAuditTitle', defaultMessage: 'Next audit' })}</div>
                <div className="text-4xl font-bold text-white">{auditCountdown.daysLeft}</div>
                <div className="mt-2 text-sm text-white/50">{intl.formatMessage({ id: 'dashboard.daysLeft', defaultMessage: 'days left' })}</div>
                <div className="mt-4 text-xs text-white/50">
                  {intl.formatMessage({
                    id:
                      auditCycle === 'annual'
                        ? 'settings.auditCycle.annual'
                        : auditCycle === 'quarterly'
                        ? 'settings.auditCycle.quarterly'
                        : 'settings.auditCycle.monthly',
                    defaultMessage: auditCycle.charAt(0).toUpperCase() + auditCycle.slice(1),
                  })}
                </div>
                <div className="mt-2 text-xs text-white/40">{auditCountdown.referenceLabel}</div>
                <div className="mt-2 text-xs text-white/40">
                  {intl.formatMessage({ id: 'dashboard.targetDate', defaultMessage: 'Target date' })}: {auditCountdown.targetDate.toLocaleDateString(language)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI chart (historical trend) */}
      <div className="mb-6">
        {loading ? (
          <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
            <div className="text-white/60">{intl.formatMessage({ id: 'dashboard.loadingKpis' })}</div>
          </div>
        ) : (
          <KpiChart labels={chartLabels} data={chartValues} title={intl.formatMessage({ id: 'dashboard.healthScoreTrend' })} />
        )}
        {error && <div className="text-sm text-[#E5484D] mt-2">{error}</div>}
      </div>

      <div className="mb-8 rounded-2xl border border-white/10 bg-[#111827] p-5">
        <SearchBinder initialQuery={initialQuery} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{intl.formatMessage({ id: 'dashboard.recentActivity' })}</h2>
            {loading && <span className="text-xs text-white/40">{intl.formatMessage({ id: 'dashboard.loading' })}</span>}
          </div>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-[#4F6EF7] mt-1.5" />
                  <div className="flex-1">
                    <div className="text-white text-sm">{activity.title}</div>
                    <div className="text-white/40 text-xs mt-0.5">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-white/40 text-sm">{intl.formatMessage({ id: 'dashboard.noRecentActivity' })}</div>
            )}
          </div>
        </div>

        <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{intl.formatMessage({ id: 'dashboard.upcomingTasks' })}</h2>
            {loading && <span className="text-xs text-white/40">{intl.formatMessage({ id: 'dashboard.loading' })}</span>}
          </div>
          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0"
                >
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20" />
                  <div className="flex-1">
                    <div className="text-white text-sm">{task.title}</div>
                    <div className="text-white/40 text-xs mt-0.5">{task.due_date ?? task.due}</div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-[#E5484D] text-white'
                        : task.priority === 'medium'
                        ? 'bg-[#F5A623] text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {intl.formatMessage({ id: `dashboard.priority.${task.priority}` })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-white/40 text-sm">{intl.formatMessage({ id: 'dashboard.noUpcomingTasks' })}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
