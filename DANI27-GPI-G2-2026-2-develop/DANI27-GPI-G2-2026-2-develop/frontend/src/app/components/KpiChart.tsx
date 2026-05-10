import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type KpiPoint = { name: string; value: number }

type Props = {
  labels?: string[]
  data?: number[]
  title?: string
  height?: number
}

function formatNumber(n: number) {
  return Number.isFinite(n) ? n.toFixed(0) : '0'
}

export default function KpiChart({
  labels = [],
  data = [],
  title = 'KPIs - Trend',
  height = 300,
}: Props) {
  const chartData: KpiPoint[] = useMemo(() => {
    return labels.map((label, i) => ({ name: label, value: Number(data[i] ?? 0) }))
  }, [labels, data])

  if (!chartData.length) {
    return (
      <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D]">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <div className="flex items-center justify-center text-white/60 h-40">No hay datos disponibles</div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1D28] rounded-xl p-6 border border-[#2A2E3D] shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="kpiTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2A2E3D" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="name" stroke="#C3CADB" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#C3CADB"
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => formatNumber(v)}
              width={34}
            />
            <Tooltip
              cursor={{ stroke: '#4F6EF7', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ background: '#0f1724', border: '1px solid #2A2E3D', borderRadius: 8 }}
              formatter={(value: any) => [`${formatNumber(Number(value))}%`, 'Compliance']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7C91FF"
              strokeWidth={3.5}
              fill="url(#kpiTrendFill)"
              dot={{ r: 4, fill: '#A9B7FF', stroke: '#0F1724', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#4F6EF7', strokeWidth: 2 }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
