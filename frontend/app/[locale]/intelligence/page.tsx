'use client';

import React, { useState } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, Route, Activity,
  ArrowUpRight, Sparkles,
  Ship, Plane, RefreshCcw,
} from 'lucide-react';

/* ───── mock data ───── */

const RATE_TREND = [
  { week: 'W1', actual: 1650, predicted: null },
  { week: 'W2', actual: 1720, predicted: null },
  { week: 'W3', actual: 1680, predicted: null },
  { week: 'W4', actual: 1750, predicted: null },
  { week: 'W5', actual: 1810, predicted: null },
  { week: 'W6', actual: 1790, predicted: null },
  { week: 'W7', actual: 1850, predicted: null },
  { week: 'W8', actual: 1880, predicted: null },
  { week: 'W9', actual: null, predicted: 1920 },
  { week: 'W10', actual: null, predicted: 1960 },
  { week: 'W11', actual: null, predicted: 1940 },
  { week: 'W12', actual: null, predicted: 2010 },
];

const RISK_CARDS = [
  {
    title: '항구 혼잡도',
    level: 'high',
    location: 'Shanghai',
    detail: '평균 대기 시간 4.2일 (+180%)',
    icon: Ship,
    color: 'from-red-500 to-rose-500',
  },
  {
    title: '기상 위험',
    level: 'medium',
    location: 'Pacific Route',
    detail: '태풍 경보 — 3일 내 경로 영향 가능',
    icon: Activity,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: '지정학 리스크',
    level: 'low',
    location: 'Suez Canal',
    detail: '현재 정상 운항 — 모니터링 중',
    icon: AlertTriangle,
    color: 'from-emerald-500 to-teal-500',
  },
];

const ROUTE_OPTIONS = [
  { route: 'Busan → Rotterdam (Direct)', days: 28, cost: 1850, co2: 1.2, score: 92 },
  { route: 'Busan → Singapore → Rotterdam', days: 33, cost: 1450, co2: 1.4, score: 78 },
  { route: 'Busan → LA (Air + Rail)', days: 12, cost: 4200, co2: 3.8, score: 65 },
];

const ANOMALIES = [
  { time: '14:32', type: 'delay', msg: 'SH-2026-0042 부산항 출항 48시간 지연 감지', severity: 'high' },
  { time: '13:15', type: 'cost', msg: 'Shanghai-Rotterdam 운임 8% 급등 예측 (AI)', severity: 'medium' },
  { time: '11:48', type: 'route', msg: 'Pacific Storm — 대안 경로 Suez 추천', severity: 'medium' },
  { time: '09:22', type: 'customs', msg: 'CD-2026-0128 HS코드 불일치 리스크 감지', severity: 'low' },
  { time: '08:05', type: 'demand', msg: 'Q2 해상 운임 수요 15% 증가 전망', severity: 'info' },
];

const LEVEL_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-emerald-100 text-emerald-600',
  info: 'bg-blue-100 text-blue-600',
};

/* ───── page ───── */

export default function IntelligencePage() {
  const [selectedRoute, setSelectedRoute] = useState(0);

  // SVG chart helpers
  const chartW = 700;
  const chartH = 180;
  const maxVal = 2100;
  const minVal = 1500;
  const points = RATE_TREND.map((d, i) => ({
    x: (i / (RATE_TREND.length - 1)) * chartW,
    y: chartH - ((((d.actual ?? d.predicted ?? 0) - minVal) / (maxVal - minVal)) * chartH),
    val: d.actual ?? d.predicted ?? 0,
    isPredicted: d.actual === null,
  }));

  const actualLine = points.filter((p, i) => RATE_TREND[i].actual !== null);
  const predictedLine = points.filter((p, i) => RATE_TREND[i].predicted !== null || i === 7);

  const toPath = (pts: typeof points) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-violet-500 mb-2">
            <Sparkles size={16} /> AI Intelligence
          </div>
          <h1 className="text-3xl font-bold text-slate-900">공급망 인사이트</h1>
          <p className="text-slate-500 mt-1">AI 기반 분석으로 물류 의사결정을 최적화합니다</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          <RefreshCcw size={16} /> 분석 갱신
        </button>
      </div>

      {/* Rate Forecast Chart */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-violet-500" />
            <h2 className="text-lg font-bold text-slate-800">운임 변동 예측</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded" /> 실적</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-400 rounded border border-dashed border-violet-400" /> AI 예측</span>
          </div>
        </div>
        <div className="text-sm text-slate-500 mb-2">Busan → Rotterdam (40ft) · USD per TEU</div>

        <svg viewBox={`-20 -10 ${chartW + 40} ${chartH + 30}`} className="w-full h-48">
          {/* Grid lines */}
          {[1600, 1700, 1800, 1900, 2000].map((v) => {
            const y = chartH - (((v - minVal) / (maxVal - minVal)) * chartH);
            return (
              <g key={v}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                <text x={-10} y={y + 4} textAnchor="end" className="text-[9px] fill-slate-400">${v}</text>
              </g>
            );
          })}
          {/* Actual line */}
          <path d={toPath(actualLine)} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
          {/* Predicted line (dashed) */}
          <path d={toPath(predictedLine)} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6,4" strokeLinecap="round" />
          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill={p.isPredicted ? '#8b5cf6' : '#3b82f6'} stroke="white" strokeWidth={1.5} />
          ))}
          {/* Week labels */}
          {points.map((p, i) => (
            <text key={`lbl-${i}`} x={p.x} y={chartH + 16} textAnchor="middle" className="text-[8px] fill-slate-400">
              {RATE_TREND[i].week}
            </text>
          ))}
        </svg>

        <div className="flex items-center gap-2 mt-3 p-3 bg-violet-50 rounded-xl text-sm">
          <Brain size={16} className="text-violet-500" />
          <span className="text-violet-700">AI 분석: 향후 4주간 <strong>+8.3%</strong> 상승 예측 — 조기 부킹 권장</span>
          <ArrowUpRight size={14} className="text-violet-500" />
        </div>
      </section>

      {/* Risk Cards */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-amber-500" />
          <h2 className="text-lg font-bold text-slate-800">공급망 리스크 모니터링</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RISK_CARDS.map((r) => (
            <div key={r.title} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center`}>
                  <r.icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.location}</div>
                </div>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full uppercase ${LEVEL_BADGE[r.level]}`}>
                  {r.level}
                </span>
              </div>
              <p className="text-sm text-slate-500">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Route Optimization */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Route size={20} className="text-violet-500" />
          <h2 className="text-lg font-bold text-slate-800">최적 경로 추천</h2>
        </div>
        <div className="space-y-3">
          {ROUTE_OPTIONS.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelectedRoute(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                selectedRoute === i
                  ? 'bg-violet-50 border-2 border-violet-400'
                  : 'border border-slate-200 hover:border-slate-300'
              }`}
            >
              {i === 0 && <Sparkles size={16} className="text-violet-500 shrink-0" />}
              {i === 1 && <Ship size={16} className="text-blue-500 shrink-0" />}
              {i === 2 && <Plane size={16} className="text-sky-500 shrink-0" />}
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{r.route}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {r.days}일 · ${r.cost.toLocaleString()} · {r.co2} tCO₂
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-800">{r.score}</div>
                <div className="text-xs text-slate-400">AI 점수</div>
              </div>
              {i === 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-500 text-white rounded-full">BEST</span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {['비용', '시간', 'CO₂'].map((label, i) => {
            const r = ROUTE_OPTIONS[selectedRoute];
            const vals = [r.cost, r.days, r.co2];
            return (
              <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className="text-lg font-bold text-slate-800">
                  {i === 0 ? `$${vals[i].toLocaleString()}` : i === 1 ? `${vals[i]}일` : `${vals[i]} t`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Anomaly Feed */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity size={20} className="text-violet-500" />
          <h2 className="text-lg font-bold text-slate-800">이상 감지 알림</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {ANOMALIES.map((a, i) => (
            <div key={i} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_BADGE[a.severity]}`}>
                {a.severity === 'high' ? '긴급' : a.severity === 'medium' ? '주의' : a.severity === 'low' ? '참고' : 'ℹ️'}
              </span>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{a.msg}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
