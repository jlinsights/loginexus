'use client'

import React, { useState, useEffect } from 'react'
import ToolLayout from '../ToolLayout'
import { Search, ArrowRight, TrendingDown, Clock, MapPin, Bell, Loader2 } from 'lucide-react'
import { fetchRouteRates, type RatesResponse } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import { PORTS, MODES } from '@/lib/constants'
import RateTable from '../../../components/RateTable'
import RateAlertForm from '../../../components/RateAlertForm'

function formatCurrency(v: number) {
  if (v >= 1000000) return `₩${(v / 10000).toLocaleString()}만`
  return `$${v.toLocaleString()}`
}

export default function RateExplorerPage() {
  const searchParams = useSearchParams()
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [mode, setMode] = useState<string>('ocean_fcl')
  const [results, setResults] = useState<RatesResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Initialize from URL params
  useEffect(() => {
    const pOrigin = searchParams.get('origin')
    const pDest = searchParams.get('dest')
    const pMode = searchParams.get('mode')

    if (pOrigin) setOrigin(pOrigin)
    if (pDest) setDest(pDest)
    if (pMode && MODES.some(m => m.id === pMode)) setMode(pMode)

    if (pOrigin && pDest && pOrigin !== pDest) {
      doSearch(pOrigin, pDest, pMode || 'ocean_fcl')
    }
  }, [searchParams])

  const doSearch = async (o: string, d: string, m: string) => {
    setIsSearching(true)
    try {
      const data = await fetchRouteRates({ origin: o, destination: d, mode: m })
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    if (!origin || !dest || origin === dest) return
    doSearch(origin, dest, mode)
  }

  const selectedMode = MODES.find(m => m.id === mode)!

  // Compute summary from API results
  const rates = results?.rates ?? []
  const minRate = rates.length ? Math.min(...rates.map(r => r.rate_usd)) : 0
  const maxRate = rates.length ? Math.max(...rates.map(r => r.rate_usd)) : 0
  const minTransit = rates.length
    ? Math.min(...rates.filter(r => r.transit_days_min != null).map(r => r.transit_days_min!))
    : 0
  const maxTransit = rates.length
    ? Math.max(...rates.filter(r => r.transit_days_max != null).map(r => r.transit_days_max!))
    : 0

  return (
    <ToolLayout title="운임 탐색기" description="출발항과 도착항을 선택하면 실시간 운임과 소요일수를 확인할 수 있습니다">
      {/* ─── Search Form ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 -mt-20 relative z-10">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResults(null) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                mode === m.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <m.icon size={16} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Port Selectors */}
        <div className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">출발항</label>
            <select
              value={origin}
              onChange={e => { setOrigin(e.target.value); setResults(null) }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">출발항 선택</option>
              {PORTS.map(p => (
                <option key={p.code} value={p.code}>{p.country} {p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 self-end mb-1">
            <ArrowRight size={18} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">도착항</label>
            <select
              value={dest}
              onChange={e => { setDest(e.target.value); setResults(null) }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">도착항 선택</option>
              {PORTS.map(p => (
                <option key={p.code} value={p.code}>{p.country} {p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={!origin || !dest || origin === dest || isSearching}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            조회
          </button>
        </div>
      </div>

      {/* ─── Results Summary Cards ─── */}
      {results && rates.length > 0 && (
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          {/* Rate Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingDown size={18} />
              <span className="text-sm font-medium">운임 범위</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatCurrency(minRate)} ~ {formatCurrency(maxRate)}
            </div>
            <div className="mt-1 text-sm text-slate-500">{selectedMode.unit} · {rates.length} carriers</div>
          </div>

          {/* Days Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Clock size={18} />
              <span className="text-sm font-medium">예상 소요일수</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {minTransit && maxTransit ? `${minTransit} ~ ${maxTransit}일` : '-'}
            </div>
            <div className="mt-1 text-sm text-slate-500">영업일 기준</div>
          </div>

          {/* Route Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-600">
                <MapPin size={18} />
                <span className="text-sm font-medium">항로 정보</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
              >
                <Bell size={12} /> 알림 받기
              </button>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {PORTS.find(p => p.code === origin)?.name} → {PORTS.find(p => p.code === dest)?.name}
            </div>
            <div className="mt-1 text-sm text-slate-500">{selectedMode.label} · {selectedMode.unit}</div>
          </div>
        </div>
      )}

      {/* ─── Carrier Rate Table ─── */}
      {results && rates.length > 0 && (
        <div className="mt-6">
          <RateTable rates={rates} />
        </div>
      )}

      {/* ─── No Results ─── */}
      {results && rates.length === 0 && (
        <div className="mt-8 text-center py-12 bg-white rounded-2xl border border-slate-200">
          <selectedMode.icon size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">해당 항로의 운임 데이터가 아직 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">다른 항로나 운송 모드를 시도해보세요.</p>
        </div>
      )}

      {results && rates.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
          <strong>참고:</strong> 표시된 운임은 시장 데이터 기반이며, 실제 운임은 화물 조건/시즌/서비스에 따라 달라집니다.
          정확한 견적은 <a href="/register" className="underline font-semibold hover:text-amber-900">LogiNexus 가입</a> 후 AI 견적 엔진에서 확인하세요.
        </div>
      )}

      {/* Empty State */}
      {!results && !isSearching && (
        <div className="mt-12 text-center text-slate-400">
          <selectedMode.icon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">출발항과 도착항을 선택한 뒤 <strong className="text-slate-600">조회</strong>를 눌러주세요</p>
        </div>
      )}

      {/* ─── Alert Modal ─── */}
      {isModalOpen && (
        <RateAlertForm
          origin={origin}
          destination={dest}
          mode={mode}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </ToolLayout>
  )
}
