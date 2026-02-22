'use client'

import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { fetchIndexHistory } from '@/lib/api'

interface RateChartProps {
  indexCode: string
  indexName?: string
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '180d', label: '180D' },
]

export default function RateChart({ indexCode, indexName }: RateChartProps) {
  const [period, setPeriod] = useState('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['market', 'history', indexCode, period],
    queryFn: () => fetchIndexHistory(indexCode, period),
    staleTime: 5 * 60 * 1000,
    enabled: !!indexCode,
  })

  const chartData = data?.data ?? []
  const isPositive = chartData.length >= 2
    ? chartData[chartData.length - 1].value >= chartData[0].value
    : true

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {indexName || indexCode} History
        </h3>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === opt.value
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
      ) : chartData.length < 3 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
          Not enough data points to display chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${indexCode}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v: string) => {
                const d = new Date(v)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
              }}
              formatter={(value: number | undefined) => value != null ? [value.toLocaleString(), indexCode] : ['-', indexCode]}
              labelFormatter={(label: unknown) => typeof label === 'string' ? new Date(label).toLocaleDateString() : String(label)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth={2}
              fill={`url(#gradient-${indexCode})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
