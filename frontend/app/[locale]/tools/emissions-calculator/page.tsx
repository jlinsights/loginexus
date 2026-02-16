'use client'

import React, { useState } from 'react'
import ToolLayout from '../ToolLayout'
import { Ship, Plane, Truck, Train, Calculator, Leaf, TreePine } from 'lucide-react'

/* ───── emission factors (g CO₂ per ton-km, GLEC Framework v3) ───── */
const FACTORS: Record<string, { factor: number; icon: React.ElementType; label: string; color: string }> = {
  ocean: { factor: 16, icon: Ship, label: '해상 운송', color: 'bg-blue-500' },
  air: { factor: 602, icon: Plane, label: '항공 운송', color: 'bg-amber-500' },
  truck: { factor: 62, icon: Truck, label: '도로 운송', color: 'bg-red-500' },
  rail: { factor: 22, icon: Train, label: '철도 운송', color: 'bg-emerald-500' },
}

/* Approximate distances between major route pairs (km) */
const ROUTES: Record<string, { label: string; km: number }> = {
  'kr-us-west': { label: '부산 → LA (태평양)', km: 9500 },
  'kr-us-east': { label: '부산 → 뉴욕 (수에즈)', km: 18500 },
  'kr-cn': { label: '부산 → 상하이', km: 850 },
  'kr-eu': { label: '부산 → 함부르크', km: 20000 },
  'kr-sea': { label: '부산 → 싱가포르', km: 4600 },
  'kr-jp': { label: '부산 → 도쿄', km: 900 },
  'kr-vn': { label: '부산 → 호치민', km: 3700 },
  'custom': { label: '직접 입력', km: 0 },
}

const TREES_PER_TON_CO2 = 45 // ~45 trees absorb 1 ton CO₂/year

export default function EmissionsCalculatorPage() {
  const [mode, setMode] = useState('ocean')
  const [route, setRoute] = useState('kr-us-west')
  const [customKm, setCustomKm] = useState('')
  const [weight, setWeight] = useState('1000')
  const [result, setResult] = useState<null | { emissions: Record<string, number>; distance: number; weightKg: number }>(null)

  const handleCalc = () => {
    const d = route === 'custom' ? Number(customKm) : ROUTES[route].km
    const w = Number(weight)
    if (!d || !w || d <= 0 || w <= 0) return

    const emissions: Record<string, number> = {}
    for (const [k, v] of Object.entries(FACTORS)) {
      emissions[k] = (v.factor * (w / 1000) * d) / 1000 // kg CO₂
    }
    setResult({ emissions, distance: d, weightKg: w })
  }

  const maxEmission = result ? Math.max(...Object.values(result.emissions)) : 0

  return (
    <ToolLayout title="탄소 배출 계산기" description="운송 모드별 CO₂ 배출량을 계산하고 비교하세요 (GLEC Framework 기반)">
      {/* ─── Input Form ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 -mt-20 relative z-10">
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">운송 구간</label>
            <select value={route} onChange={e => { setRoute(e.target.value); setResult(null) }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {Object.entries(ROUTES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}{v.km > 0 ? ` (${v.km.toLocaleString()}km)` : ''}</option>
              ))}
            </select>
            {route === 'custom' && (
              <input type="number" value={customKm} onChange={e => setCustomKm(e.target.value)}
                placeholder="거리 (km)" min={1}
                className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">화물 중량 (kg)</label>
            <input type="number" value={weight} onChange={e => { setWeight(e.target.value); setResult(null) }}
              placeholder="예: 1000" min={1}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <p className="mt-1 text-xs text-slate-400">1 TEU ≈ 18,000 kg / 1 CBM ≈ 150 kg</p>
          </div>

          {/* Calculate */}
          <div className="flex items-end">
            <button onClick={handleCalc}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors">
              <Calculator size={16} /> 계산하기
            </button>
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Comparison Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">운송 모드별 CO₂ 배출량 비교</h3>
            <p className="text-sm text-slate-500 mb-6">
              거리 {result.distance.toLocaleString()}km · 화물 {result.weightKg.toLocaleString()}kg 기준
            </p>

            <div className="space-y-4">
              {Object.entries(FACTORS).map(([key, info]) => {
                const val = result.emissions[key]
                const pct = maxEmission > 0 ? (val / maxEmission) * 100 : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <info.icon size={18} className="text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">{info.label}</span>
                        <span className="text-xs text-slate-400">({info.factor} g/ton-km)</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {val >= 1000 ? `${(val / 1000).toFixed(1)} t` : `${val.toFixed(1)} kg`} CO₂
                      </span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${info.color} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected Mode Details */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* CO₂ amount */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6 text-center">
              <Leaf size={24} className="mx-auto text-emerald-600 mb-2" />
              <div className="text-sm text-emerald-700 font-medium mb-1">선택 모드 배출량</div>
              <div className="text-2xl font-bold text-slate-900">
                {result.emissions[mode] >= 1000
                  ? `${(result.emissions[mode] / 1000).toFixed(2)} t`
                  : `${result.emissions[mode].toFixed(1)} kg`}
              </div>
              <div className="text-xs text-slate-500 mt-1">CO₂ ({FACTORS[mode].label})</div>
            </div>

            {/* Tree equivalent */}
            <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-2xl border border-green-100 p-6 text-center">
              <TreePine size={24} className="mx-auto text-green-600 mb-2" />
              <div className="text-sm text-green-700 font-medium mb-1">나무 환산</div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.ceil(result.emissions[mode] / 1000 * TREES_PER_TON_CO2)}그루
              </div>
              <div className="text-xs text-slate-500 mt-1">1년간 흡수를 위해 필요</div>
            </div>

            {/* Savings vs Air */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 text-center">
              <Ship size={24} className="mx-auto text-blue-600 mb-2" />
              <div className="text-sm text-blue-700 font-medium mb-1">항공 대비 절감</div>
              <div className="text-2xl font-bold text-slate-900">
                {mode === 'air' ? '—' : `${((1 - result.emissions[mode] / result.emissions.air) * 100).toFixed(0)}%`}
              </div>
              <div className="text-xs text-slate-500 mt-1">{mode === 'air' ? '기준 모드' : `CO₂ 절감 (vs 항공)`}</div>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex gap-2 justify-center">
            {Object.entries(FACTORS).map(([k, v]) => (
              <button key={k} onClick={() => setMode(k)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === k ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                <v.icon size={14} />{v.label}
              </button>
            ))}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-sm text-emerald-800">
            🌱 <strong>탄소 중립 운송</strong>을 시작하세요. LogiNexus는 모든 선적에 자동 탄소 배출 추적과 상쇄 옵션을 제공합니다.
            <a href="/register" className="ml-1 underline font-semibold hover:text-emerald-900">지금 가입 →</a>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && (
        <div className="mt-12 text-center text-slate-400">
          <Leaf size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">운송 구간과 화물 중량을 입력한 뒤 <strong className="text-slate-600">계산하기</strong>를 눌러주세요</p>
        </div>
      )}
    </ToolLayout>
  )
}
