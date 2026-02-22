'use client'

import React from 'react'
import { TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketIndices, fetchMarketInsights, MarketIndex } from '@/lib/api'
import Link from 'next/link'

// Fallback data when API is unavailable
const FALLBACK_INDICES: MarketIndex[] = [
  { index_code: 'SCFI', index_name: 'Shanghai Containerized Freight Index', value: 2147.86, change_pct: 3.2, recorded_at: '', sparkline: [40, 35, 45, 42, 48, 52, 50] },
  { index_code: 'FBX', index_name: 'Freightos Baltic Index', value: 2642, change_pct: -1.5, recorded_at: '', sparkline: [60, 58, 55, 52, 48, 45, 42] },
  { index_code: 'KCCI', index_name: 'Korea Containerized Freight Index', value: 2492, change_pct: 0.8, recorded_at: '', sparkline: [30, 32, 35, 38, 40, 42, 44] },
  { index_code: 'WCI', index_name: 'World Container Index (Drewry)', value: 3162, change_pct: 5.4, recorded_at: '', sparkline: [20, 25, 35, 40, 55, 65, 70] },
]

function formatValue(value: number): string {
  return value >= 1000 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(2)
}

function SparklineSVG({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 80 - 10
    return `${x} ${y}`
  })
  const color = positive ? 'text-emerald-500' : 'text-rose-500'

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`h-full w-full ${color}`}>
      <path d={`M ${points.join(' L ')}`} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MarketIntelligence() {
  const { data: marketData, isLoading, isError } = useQuery({
    queryKey: ['market', 'indices'],
    queryFn: fetchMarketIndices,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  })

  const { data: insightData } = useQuery({
    queryKey: ['market', 'insight'],
    queryFn: fetchMarketInsights,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  })

  const indices = marketData?.indices ?? (isError ? FALLBACK_INDICES : [])
  const insight = insightData?.insights?.[0]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            Market Intelligence
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time global freight indices and trends</p>
        </div>
        <Link
          href="/tools/market"
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Dashboard →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-16 mb-3" />
              <div className="h-7 bg-slate-200 rounded w-24 mb-4" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {indices.map((idx) => {
            const isPositive = idx.change_pct >= 0
            const color = isPositive ? 'text-emerald-500' : 'text-rose-500'
            const bgColor = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'

            return (
              <div
                key={idx.index_code}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{idx.index_code}</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{formatValue(idx.value)}</h3>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${bgColor} ${color}`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isPositive ? '+' : ''}{idx.change_pct.toFixed(1)}%
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-500 line-clamp-1 mb-4" title={idx.index_name}>
                  {idx.index_name}
                </p>

                <div className="h-10 w-full mt-2">
                  <SparklineSVG data={idx.sparkline} positive={isPositive} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isError && (
        <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle size={14} />
          <span>Using cached data. Live data temporarily unavailable.</span>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">AI</div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
            <span className="font-bold">Trade Insight:</span>{' '}
            {insight
              ? insight.description
              : 'Seafreight rates on Asia-Europe routes are expected to remain volatile due to seasonal demand shifts.'}
          </p>
        </div>
        <Link
          href="/tools/market"
          className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          View All Insights
        </Link>
      </div>
    </div>
  )
}
