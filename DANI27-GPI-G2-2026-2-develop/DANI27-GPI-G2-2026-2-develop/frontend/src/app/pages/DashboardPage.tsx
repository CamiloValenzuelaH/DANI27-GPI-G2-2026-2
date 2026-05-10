import { useIntl } from 'react-intl';
import { TrendingUp, TrendingDown } from 'lucide-react';
import KpiChart from '../components/KpiChart';
import HealthScoreChart from '../components/HealthScoreChart';
import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard';
import type { DashboardMetricsResponse } from '../../api/types';

export default function DashboardPage() {
  const intl = useIntl();
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await dashboardApi.metrics()
        if (!mounted) return
        setMetrics(data)
      } catch (e: any) {
        console.error('Error fetching dashboard metrics', e)
        setError('No se pudieron cargar los KPIs')
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          {intl.formatMessage({ id: 'menu.dashboard' })}
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Overview of your compliance health and progress
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cardData.map((metric, index) => (
            <div
              key={index}
              className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]"
            >
              <div className="text-white/60 text-sm mb-2">{metric.label}</div>
              <div className="flex items-end gap-3">
                <div className="text-3xl font-bold text-white">{metric.value.toFixed(1)}%</div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold mb-1 ${
                    metric.delta >= 0 ? 'text-[#1DB954]' : 'text-[#E5484D]'
                  }`}
                >
                  {metric.delta >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {formatDelta(metric.delta)}
                </div>
              </div>
              <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <HealthScoreChart score={healthScore} status={healthStatus} />
      </div>

      {/* KPI chart (historical trend) */}
      <div className="mb-6">
        {loading ? (
          <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
            <div className="text-white/60">Cargando KPIs...</div>
          </div>
        ) : (
          <KpiChart labels={chartLabels} data={chartValues} title="Health Score Trend" />
        )}
        {error && <div className="text-sm text-[#E5484D] mt-2">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { title: 'Gap analysis completed for ISO 27001', time: '2 hours ago' },
              { title: 'Evidence uploaded for A.8.1', time: '5 hours ago' },
              { title: 'CAPA NC-2024-015 updated', time: '1 day ago' },
              { title: 'Risk R-001 treatment plan approved', time: '2 days ago' },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-[#4F6EF7] mt-1.5" />
                <div className="flex-1">
                  <div className="text-white text-sm">{activity.title}</div>
                  <div className="text-white/40 text-xs mt-0.5">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
          <h2 className="text-lg font-semibold text-white mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            {[
              { title: 'Complete evidence for A.9.2', priority: 'high', due: 'Today' },
              { title: 'Review CAPA NC-2025-002', priority: 'high', due: 'Tomorrow' },
              { title: 'Update risk treatment plan', priority: 'medium', due: 'This week' },
              { title: 'Prepare audit documentation', priority: 'low', due: 'Next week' },
            ].map((task, index) => (
              <div
                key={index}
                className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0"
              >
                <input type="checkbox" className="w-4 h-4 rounded border-white/20" />
                <div className="flex-1">
                  <div className="text-white text-sm">{task.title}</div>
                  <div className="text-white/40 text-xs mt-0.5">{task.due}</div>
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
                  {task.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
