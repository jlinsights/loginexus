'use client'

import React, { useState } from 'react'
import ToolLayout from '../ToolLayout'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchMarketIndices,
  fetchMarketTrends,
  fetchMarketInsights,
  type MarketIndex,
} from '@/lib/api'
import RateChart from '../../../components/RateChart'
import InsightCard from '../../../components/InsightCard'
import Link from 'next/link'

const FALLBACK_INDICES: MarketIndex[] = [
  { index_code: 'SCFI', index_name: 'Shanghai Containerized Freight Index', value: 2147.86, change_pct: 3.2, recorded_at: '', sparkline: [40, 35, 45, 42, 48, 52, 50] },
  { index_code: 'FBX', index_name: 'Freightos Baltic Index', value: 2642, change_pct: -1.5, recorded_at: '', sparkline: [60, 58, 55, 52, 48, 45, 42] },
  { index_code: 'KCCI', index_name: 'Korea Container Cost Index', value: 2492, change_pct: 0.8, recorded_at: '', sparkline: [30, 32, 35, 38, 40, 42, 44] },
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

export default function MarketDashboardPage() {
  const [selectedIndex, setSelectedIndex] = useState<string>('SCFI')

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

  const { data: trendData } = useQuery({
    queryKey: ['market', 'trends', '30d'],
    queryFn: () => fetchMarketTrends({ period: '30d' }),
    staleTime: 5 * 60 * 1000,
  })

  const indices = marketData?.indices ?? (isError ? FALLBACK_INDICES : [])
  const insights = insightData?.insights ?? []
  const selectedIdx = indices.find(i => i.index_code === selectedIndex)

  return (
    <ToolLayout title="Market Dashboard" description="글로벌 물류 시장 인텔리전스 — 실시간 운임 지수, 트렌드, AI 인사이트">
      {/* ─── Index Cards ─── */}
      <div className="-mt-20 relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-16 mb-3" />
                <div className="h-7 bg-slate-200 rounded w-24 mb-4" />
                <div className="h-10 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {indices.map((idx) => {
              const isPositive = idx.change_pct >= 0
              const color = isPositive ? 'text-emerald-500' : 'text-rose-500'
              const bgColor = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              const isSelected = idx.index_code === selectedIndex

              return (
                <button
                  key={idx.index_code}
                  onClick={() => setSelectedIndex(idx.index_code)}
                  className={`bg-white rounded-2xl border p-5 text-left transition-all duration-300 hover:shadow-lg ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{idx.index_code}</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">{formatValue(idx.value)}</h3>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${bgColor} ${color}`}>
                      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isPositive ? '+' : ''}{idx.change_pct.toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mb-4" title={idx.index_name}>{idx.index_name}</p>
                  <div className="h-10 w-full">
                    <SparklineSVG data={idx.sparkline} positive={isPositive} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Charts Grid ─── */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* Selected Index Chart */}
        <RateChart
          indexCode={selectedIndex}
          indexName={selectedIdx?.index_name}
        />

        {/* Trend Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Rate Trend (30D)</h3>
          {trendData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500">Avg Rate</span>
                  <p className="text-lg font-bold text-slate-900">
                    ${trendData.summary.avg_rate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Period Change</span>
                  <p className={`text-lg font-bold ${trendData.summary.period_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trendData.summary.period_change_pct >= 0 ? '+' : ''}{trendData.summary.period_change_pct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Direction</span>
                  <p className="text-lg font-bold text-slate-900 capitalize">{trendData.summary.trend_direction}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Data Points</span>
                  <p className="text-lg font-bold text-slate-900">{trendData.summary.total_data_points.toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/tools/rate-explorer"
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Search Rates by Route →
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-slate-100 animate-pulse rounded" />
          )}
        </div>
      </div>

      {/* ─── AI Insights ─── */}
      {insights.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">AI</div>
            Trade Insights
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <Link
          href="/tools/rate-explorer"
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow group"
        >
          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Rate Explorer</h4>
          <p className="text-sm text-slate-500 mt-1">Search and compare carrier rates by route</p>
        </Link>
        <Link
          href="/register"
          className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 hover:shadow-md transition-shadow group"
        >
          <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">AI Quote Engine</h4>
          <p className="text-sm text-slate-500 mt-1">Get accurate quotes with LogiNexus AI</p>
        </Link>
      </div>
    </ToolLayout>
  )
}
