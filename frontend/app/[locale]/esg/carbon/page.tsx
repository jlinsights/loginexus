'use client';

import React from 'react';
import {
  Leaf, TrendingDown, Ship, Plane, Truck, Target,
  Download, ArrowDownRight, ArrowUpRight, BarChart3,
  Globe, TreePine,
} from 'lucide-react';

/* ───── mock data ───── */

const MONTHLY_EMISSIONS = [
  { month: 'Sep', total: 142 },
  { month: 'Oct', total: 158 },
  { month: 'Nov', total: 135 },
  { month: 'Dec', total: 148 },
  { month: 'Jan', total: 127 },
  { month: 'Feb', total: 118 },
];

const MODE_BREAKDOWN = [
  { mode: '해상', icon: Ship, value: 85.2, pct: 62, color: 'bg-blue-500', barColor: 'bg-blue-400' },
  { mode: '항공', icon: Plane, value: 38.4, pct: 28, color: 'bg-sky-500', barColor: 'bg-sky-400' },
  { mode: '내륙', icon: Truck, value: 13.8, pct: 10, color: 'bg-amber-500', barColor: 'bg-amber-400' },
];

type ShipmentEmission = {
  ref: string;
  route: string;
  mode: string;
  weight: number;
  distance: number;
  co2: number;
  intensity: number;
};

const SHIPMENT_EMISSIONS: ShipmentEmission[] = [
  { ref: 'SH-2026-0042', route: 'Busan → Rotterdam', mode: '해상', weight: 18500, distance: 19250, co2: 12.4, intensity: 0.67 },
  { ref: 'SH-2026-0038', route: 'Incheon → Los Angeles', mode: '항공', weight: 2800, distance: 9650, co2: 18.6, intensity: 6.64 },
  { ref: 'SH-2026-0051', route: 'Shanghai → Hamburg', mode: '해상', weight: 24000, distance: 20100, co2: 15.2, intensity: 0.63 },
  { ref: 'SH-2026-0047', route: 'Busan → Singapore', mode: '해상', weight: 12000, distance: 4600, co2: 4.8, intensity: 0.40 },
  { ref: 'SH-2026-0055', route: 'LA → Chicago', mode: '내륙', weight: 8500, distance: 3200, co2: 5.6, intensity: 0.66 },
  { ref: 'SH-2026-0060', route: 'Tokyo → Busan', mode: '해상', weight: 6200, distance: 1180, co2: 1.8, intensity: 0.29 },
];

const OFFSET_PROGRAMS = [
  { name: '한국 재생에너지 크레딧', type: '재생에너지', price: '$14/tCO₂e', verified: true },
  { name: '인도네시아 맹그로브 복원', type: '자연기반', price: '$18/tCO₂e', verified: true },
  { name: 'EU ETS 탄소 크레딧', type: '규제 시장', price: '$72/tCO₂e', verified: true },
];

/* ───── page ───── */

export default function CarbonControlPage() {
  const annualTarget = 1200; // tCO₂e
  const ytdEmissions = MONTHLY_EMISSIONS.reduce((s, m) => s + m.total, 0);
  const remaining = annualTarget - ytdEmissions;
  const progressPct = (ytdEmissions / annualTarget) * 100;
  const totalThisMonth = MONTHLY_EMISSIONS[MONTHLY_EMISSIONS.length - 1].total;
  const prevMonth = MONTHLY_EMISSIONS[MONTHLY_EMISSIONS.length - 2].total;
  const changePct = (((totalThisMonth - prevMonth) / prevMonth) * 100).toFixed(1);

  // Chart bar max
  const maxEmission = Math.max(...MONTHLY_EMISSIONS.map((m) => m.total));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-emerald-500 mb-2">
            <Leaf size={16} /> ESG · Carbon Control
          </div>
          <h1 className="text-3xl font-bold text-slate-900">탄소 배출 관리</h1>
          <p className="text-slate-500 mt-1">운송 탄소 발자국을 추적하고 감축 목표를 관리합니다</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Download size={16} /> ESG 리포트
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '이번 달 배출량', value: `${totalThisMonth} tCO₂e`, change: Number(changePct), icon: BarChart3, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'YTD 누적', value: `${ytdEmissions} tCO₂e`, change: null, icon: TrendingDown, color: 'text-blue-500 bg-blue-50' },
          { label: '연간 목표', value: `${annualTarget} tCO₂e`, change: null, icon: Target, color: 'text-amber-500 bg-amber-50' },
          { label: '잔여 허용량', value: `${remaining} tCO₂e`, change: null, icon: Globe, color: 'text-violet-500 bg-violet-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <span className="text-sm text-slate-500">{s.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-xl font-bold text-slate-800">{s.value}</div>
              {s.change !== null && (
                <div className={`flex items-center gap-0.5 text-sm font-medium ${s.change < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {s.change < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  {Math.abs(s.change)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reduction Target Gauge */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800">감축 목표 진행률</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>YTD {ytdEmissions} tCO₂e</span>
              <span>목표 {annualTarget} tCO₂e</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressPct > 80 ? 'bg-gradient-to-r from-red-500 to-rose-500' : progressPct > 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
            <div className="text-sm text-slate-400 mt-2">{progressPct.toFixed(1)}% 소진 · 잔여 {remaining} tCO₂e</div>
          </div>
        </div>
      </section>

      {/* Monthly Chart */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800">월별 배출량 추이</h2>
        </div>
        <div className="flex items-end gap-4 h-48">
          {MONTHLY_EMISSIONS.map((m, i) => {
            const h = (m.total / maxEmission) * 100;
            const isLast = i === MONTHLY_EMISSIONS.length - 1;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-500">{m.total}</span>
                <div className="w-full relative" style={{ height: `${h}%` }}>
                  <div
                    className={`absolute inset-0 rounded-t-xl transition-all ${isLast ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-slate-300 to-slate-200'}`}
                  />
                </div>
                <span className={`text-xs ${isLast ? 'font-bold text-emerald-600' : 'text-slate-400'}`}>{m.month}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mode Breakdown */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800">운송 모드별 배출 비교</h2>
        </div>
        <div className="space-y-4">
          {MODE_BREAKDOWN.map((m) => (
            <div key={m.mode} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center`}>
                <m.icon size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{m.mode}</span>
                  <span className="text-slate-500">{m.value} tCO₂e ({m.pct}%)</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.barColor}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shipment CO₂ Table */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Leaf size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800">선적별 탄소 배출</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-6 py-3 font-medium">선적번호</th>
                <th className="text-left px-4 py-3 font-medium">경로</th>
                <th className="text-left px-4 py-3 font-medium">모드</th>
                <th className="text-right px-4 py-3 font-medium">중량 (kg)</th>
                <th className="text-right px-4 py-3 font-medium">거리 (km)</th>
                <th className="text-right px-4 py-3 font-medium">CO₂ (t)</th>
                <th className="text-right px-6 py-3 font-medium">원단위</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SHIPMENT_EMISSIONS.map((s) => (
                <tr key={s.ref} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-blue-600">{s.ref}</td>
                  <td className="px-4 py-3 text-slate-700">{s.route}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{s.mode}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.weight.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.distance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{s.co2}</td>
                  <td className="px-6 py-3 text-right text-slate-500">{s.intensity} g/tkm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Offset Programs */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <TreePine size={20} />
          <h2 className="text-lg font-bold">탄소 오프셋 프로그램</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OFFSET_PROGRAMS.map((p) => (
            <div key={p.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm font-bold mb-1">{p.name}</div>
              <div className="text-xs text-emerald-200 mb-2">{p.type}</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{p.price}</span>
                {p.verified && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">✓ Verified</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
