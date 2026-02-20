'use client';

import React, { useState } from 'react';
import {
  Eye, Activity, AlertCircle, Clock, CheckCircle2,
  Ship, Plane, Truck, MapPin, Bell,
  ArrowUpRight, ArrowDownRight, Package,
} from 'lucide-react';

/* ───── mock data ───── */

const KPI = [
  { label: '활성 선적', value: 128, change: +12, icon: Package, color: 'text-blue-500 bg-blue-50' },
  { label: 'On-Time 율', value: '87.3%', change: +2.1, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
  { label: '예외 건수', value: 14, change: -3, icon: AlertCircle, color: 'text-red-500 bg-red-50' },
  { label: '평균 리드타임', value: '26.4일', change: -1.2, icon: Clock, color: 'text-amber-500 bg-amber-50' },
];

type Exception = {
  id: string;
  shipmentRef: string;
  type: 'delay' | 'customs' | 'document' | 'damage';
  desc: string;
  severity: 'critical' | 'warning' | 'info';
  assignee: string;
  time: string;
};

const EXCEPTIONS: Exception[] = [
  { id: '1', shipmentRef: 'SH-2026-0042', type: 'delay', desc: '부산항 출항 48시간 지연 — 하역 장비 고장', severity: 'critical', assignee: 'Kim JH', time: '2시간 전' },
  { id: '2', shipmentRef: 'SH-2026-0038', type: 'customs', desc: 'Rotterdam 통관 보류 — 추가 서류 요청', severity: 'critical', assignee: 'Park SY', time: '3시간 전' },
  { id: '3', shipmentRef: 'SH-2026-0051', type: 'document', desc: 'B/L 원본 미수신 — 선사 확인 필요', severity: 'warning', assignee: 'Lee MJ', time: '5시간 전' },
  { id: '4', shipmentRef: 'SH-2026-0047', type: 'delay', desc: 'Singapore 환적 대기 시간 초과 (72h+)', severity: 'warning', assignee: 'Choi DH', time: '6시간 전' },
  { id: '5', shipmentRef: 'SH-2026-0055', type: 'customs', desc: 'LA 세관 검사 지정 — 예상 지연 3일', severity: 'warning', assignee: 'Kim JH', time: '8시간 전' },
  { id: '6', shipmentRef: 'SH-2026-0060', type: 'document', desc: '원산지증명 불일치 — 보완 접수', severity: 'info', assignee: 'Park SY', time: '12시간 전' },
];

const EVENT_TIMELINE = [
  { time: '14:32', event: '선적 출항', detail: 'SH-0042 · HMM Algeciras · 부산 → Rotterdam', icon: Ship, color: 'bg-blue-500' },
  { time: '13:50', event: '통관 완료', detail: 'CD-0128 · Busan Customs 방출', icon: CheckCircle2, color: 'bg-emerald-500' },
  { time: '12:15', event: '항공화물 도착', detail: 'SH-0039 · 인천 → LA · KE 005', icon: Plane, color: 'bg-sky-500' },
  { time: '11:30', event: '내륙 운송 출발', detail: 'SH-0044 · LA → Chicago · Truck #T-198', icon: Truck, color: 'bg-amber-500' },
  { time: '10:22', event: '예외 발생', detail: 'SH-0051 · B/L 원본 미수신', icon: AlertCircle, color: 'bg-red-500' },
  { time: '09:15', event: '부킹 확인', detail: 'BK-0072 · MSC · Busan → Hamburg', icon: Package, color: 'bg-violet-500' },
  { time: '08:45', event: '도착 확인', detail: 'SH-0036 · Rotterdam 하역 완료', icon: MapPin, color: 'bg-emerald-500' },
];

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TYPE_LABELS: Record<string, string> = {
  delay: '지연',
  customs: '통관',
  document: '서류',
  damage: '파손',
};

/* ───── page ───── */

export default function ControlTowerPage() {
  const [exFilter, setExFilter] = useState<string>('all');

  const filtered = exFilter === 'all' ? EXCEPTIONS : EXCEPTIONS.filter((e) => e.type === exFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-blue-500 mb-2">
            <Eye size={16} /> Control Tower
          </div>
          <h1 className="text-3xl font-bold text-slate-900">공급망 관제센터</h1>
          <p className="text-slate-500 mt-1">전체 물류 프로세스를 실시간으로 모니터링합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {KPI.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.color}`}>
                <k.icon size={20} />
              </div>
              <span className="text-sm text-slate-500">{k.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-slate-800">{k.value}</div>
              <div className={`flex items-center gap-0.5 text-sm font-medium ${k.change > 0 ? (k.label === '예외 건수' ? 'text-emerald-500' : 'text-emerald-500') : (k.label === '예외 건수' ? 'text-emerald-500' : 'text-red-500')}`}>
                {k.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(k.change)}{typeof k.value === 'string' && k.value.includes('%') ? '%p' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Map placeholder */}
      <section className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden" style={{ minHeight: 320 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white mb-1">글로벌 화물 흐름</h2>
          <p className="text-slate-400 text-sm mb-6">현재 128개 활성 선적 모니터링 중</p>

          {/* Simulated map markers */}
          <div className="relative h-48">
            {[
              { label: 'Busan', x: '78%', y: '35%' },
              { label: 'Shanghai', x: '72%', y: '38%' },
              { label: 'Singapore', x: '68%', y: '62%' },
              { label: 'Rotterdam', x: '35%', y: '22%' },
              { label: 'LA', x: '12%', y: '35%' },
              { label: 'Hamburg', x: '36%', y: '18%' },
            ].map((m) => (
              <div key={m.label} className="absolute flex flex-col items-center" style={{ left: m.x, top: m.y }}>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/30" />
                <span className="text-[10px] text-blue-300 mt-0.5 whitespace-nowrap">{m.label}</span>
              </div>
            ))}

            {/* Animated route lines (SVG overlay) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="78" y1="35" x2="35" y2="22" stroke="rgba(96,165,250,0.3)" strokeWidth="0.3" strokeDasharray="2,2">
                <animate attributeName="stroke-dashoffset" from="4" to="0" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="72" y1="38" x2="12" y2="35" stroke="rgba(96,165,250,0.3)" strokeWidth="0.3" strokeDasharray="2,2">
                <animate attributeName="stroke-dashoffset" from="4" to="0" dur="2.5s" repeatCount="indefinite" />
              </line>
              <line x1="78" y1="35" x2="68" y2="62" stroke="rgba(96,165,250,0.2)" strokeWidth="0.2" strokeDasharray="1,2">
                <animate attributeName="stroke-dashoffset" from="3" to="0" dur="3s" repeatCount="indefinite" />
              </line>
            </svg>
          </div>

          {/* Mode summary */}
          <div className="flex gap-6 mt-4">
            {[
              { icon: Ship, label: '해상', count: 89, color: 'text-blue-400' },
              { icon: Plane, label: '항공', count: 24, color: 'text-sky-400' },
              { icon: Truck, label: '내륙', count: 15, color: 'text-amber-400' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <m.icon size={16} className={m.color} />
                <span className="text-sm text-slate-300">{m.label}</span>
                <span className="text-sm font-bold text-white">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exceptions Pipeline */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-slate-800">예외 파이프라인</h2>
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{EXCEPTIONS.length}</span>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            {['all', 'delay', 'customs', 'document'].map((f) => (
              <button
                key={f}
                onClick={() => setExFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  exFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'all' ? '전체' : TYPE_LABELS[f] || f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((e) => (
            <div key={e.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <span className={`mt-0.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${SEVERITY_STYLE[e.severity]}`}>
                {e.severity === 'critical' ? '긴급' : e.severity === 'warning' ? '주의' : '참고'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <code className="text-xs font-mono text-blue-600">{e.shipmentRef}</code>
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{TYPE_LABELS[e.type]}</span>
                </div>
                <p className="text-sm text-slate-700">{e.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">{e.assignee}</div>
                <div className="text-xs text-slate-400">{e.time}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real-time Event Timeline */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={20} className="text-blue-500" />
          <h2 className="text-lg font-bold text-slate-800">실시간 이벤트 타임라인</h2>
        </div>

        <div className="space-y-0">
          {EVENT_TIMELINE.map((ev, i) => (
            <div key={i} className="flex gap-4">
              {/* Time */}
              <div className="w-12 text-right text-xs text-slate-400 pt-1 shrink-0">{ev.time}</div>

              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${ev.color} flex items-center justify-center shrink-0`}>
                  <ev.icon size={14} className="text-white" />
                </div>
                {i < EVENT_TIMELINE.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="text-sm font-semibold text-slate-800">{ev.event}</div>
                <div className="text-xs text-slate-400 mt-0.5">{ev.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
