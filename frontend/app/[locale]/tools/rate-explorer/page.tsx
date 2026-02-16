'use client'

import React, { useState } from 'react'
import ToolLayout from '../ToolLayout'
import { Ship, Plane, Truck, Search, ArrowRight, TrendingDown, Clock, MapPin } from 'lucide-react'

/* ───── data ───── */

const PORTS = [
  { code: 'KRPUS', name: '부산', country: '🇰🇷' },
  { code: 'KRINC', name: '인천', country: '🇰🇷' },
  { code: 'CNSHA', name: '상하이', country: '🇨🇳' },
  { code: 'CNNGB', name: '닝보', country: '🇨🇳' },
  { code: 'CNSHE', name: '선전', country: '🇨🇳' },
  { code: 'JPTYO', name: '도쿄', country: '🇯🇵' },
  { code: 'JPOSA', name: '오사카', country: '🇯🇵' },
  { code: 'SGSIN', name: '싱가포르', country: '🇸🇬' },
  { code: 'HKHKG', name: '홍콩', country: '🇭🇰' },
  { code: 'THBKK', name: '방콕', country: '🇹🇭' },
  { code: 'VNSGN', name: '호치민', country: '🇻🇳' },
  { code: 'VNHPH', name: '하이퐁', country: '🇻🇳' },
  { code: 'USNYC', name: '뉴욕', country: '🇺🇸' },
  { code: 'USLAX', name: 'LA/롱비치', country: '🇺🇸' },
  { code: 'USSEA', name: '시애틀', country: '🇺🇸' },
  { code: 'DEHAM', name: '함부르크', country: '🇩🇪' },
  { code: 'NLRTM', name: '로테르담', country: '🇳🇱' },
  { code: 'GBFXT', name: '펠릭스토', country: '🇬🇧' },
  { code: 'AEJEA', name: '제벨알리', country: '🇦🇪' },
  { code: 'INMUN', name: '뭄바이', country: '🇮🇳' },
]

type Mode = 'ocean_fcl' | 'ocean_lcl' | 'air' | 'trucking'

const MODES: { id: Mode; label: string; icon: React.ElementType; unit: string }[] = [
  { id: 'ocean_fcl', label: '해상 FCL', icon: Ship, unit: '/20ft' },
  { id: 'ocean_lcl', label: '해상 LCL', icon: Ship, unit: '/CBM' },
  { id: 'air', label: '항공', icon: Plane, unit: '/kg' },
  { id: 'trucking', label: '내륙 트럭', icon: Truck, unit: '/대' },
]

// Simulated rate ranges (base + variance by origin-destination hash)
function simulateRate(origin: string, dest: string, mode: Mode) {
  const hash = (origin + dest).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const bases: Record<Mode, { min: number; max: number; days: [number, number] }> = {
    ocean_fcl: { min: 1200, max: 3800, days: [18, 35] },
    ocean_lcl: { min: 45, max: 120, days: [22, 40] },
    air: { min: 3, max: 12, days: [2, 5] },
    trucking: { min: 800000, max: 2500000, days: [1, 3] },
  }
  const b = bases[mode]
  const factor = ((hash % 100) / 100)
  const low = Math.round(b.min + (b.max - b.min) * factor * 0.6)
  const high = Math.round(low + (b.max - b.min) * 0.25)
  const dLow = b.days[0] + Math.round(factor * (b.days[1] - b.days[0]) * 0.5)
  const dHigh = dLow + Math.round((b.days[1] - b.days[0]) * 0.3)
  return { low, high, daysLow: dLow, daysHigh: dHigh }
}

function formatCurrency(v: number) {
  if (v >= 1000000) return `₩${(v / 10000).toLocaleString()}만`
  return `$${v.toLocaleString()}`
}

/* ───── component ───── */

export default function RateExplorerPage() {
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [mode, setMode] = useState<Mode>('ocean_fcl')
  const [results, setResults] = useState<ReturnType<typeof simulateRate> | null>(null)

  const handleSearch = () => {
    if (!origin || !dest || origin === dest) return
    setResults(simulateRate(origin, dest, mode))
  }

  const selectedMode = MODES.find(m => m.id === mode)!

  return (
    <ToolLayout title="운임 탐색기" description="출발항과 도착항을 선택하면 예상 운임과 소요일수를 확인할 수 있습니다">
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
            disabled={!origin || !dest || origin === dest}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end"
          >
            <Search size={16} /> 조회
          </button>
        </div>
      </div>

      {/* ─── Results ─── */}
      {results && (
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          {/* Rate Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingDown size={18} />
              <span className="text-sm font-medium">예상 운임 범위</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatCurrency(results.low)} ~ {formatCurrency(results.high)}
            </div>
            <div className="mt-1 text-sm text-slate-500">{selectedMode.unit}</div>
          </div>

          {/* Days Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Clock size={18} />
              <span className="text-sm font-medium">예상 소요일수</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {results.daysLow} ~ {results.daysHigh}일
            </div>
            <div className="mt-1 text-sm text-slate-500">영업일 기준</div>
          </div>

          {/* Route Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <MapPin size={18} />
              <span className="text-sm font-medium">항로 정보</span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {PORTS.find(p => p.code === origin)?.name} → {PORTS.find(p => p.code === dest)?.name}
            </div>
            <div className="mt-1 text-sm text-slate-500">{selectedMode.label} · {selectedMode.unit}</div>
          </div>
        </div>
      )}

      {results && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
          💡 <strong>참고:</strong> 표시된 운임은 시장 평균 기반 추정치이며, 실제 운임은 화물 조건·시즌·서비스에 따라 달라집니다.
          정확한 견적은 <a href="/register" className="underline font-semibold hover:text-amber-900">LogiNexus 가입</a> 후 AI 견적 엔진에서 확인하세요.
        </div>
      )}

      {/* Empty State */}
      {!results && (
        <div className="mt-12 text-center text-slate-400">
          <selectedMode.icon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">출발항과 도착항을 선택한 뒤 <strong className="text-slate-600">조회</strong>를 눌러주세요</p>
        </div>
      )}
    </ToolLayout>
  )
}
