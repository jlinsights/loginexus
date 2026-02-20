'use client';

import React, { useState } from 'react';
import {
  Globe, TrendingUp, TrendingDown, Ship, Plane, Truck,
  AlertTriangle, Clock,
  BarChart3,
} from 'lucide-react';

/* ───── data ───── */

interface MarketUpdate {
  route: string;
  from: string;
  to: string;
  mode: 'ocean' | 'air' | 'truck';
  rate: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  transitTime: string;
  updated: string;
}

const MARKET_DATA: MarketUpdate[] = [
  { route: 'CNSHA → KRPUS', from: 'Shanghai', to: 'Busan', mode: 'ocean', rate: '$1,250/TEU', change: +8.5, trend: 'up', transitTime: '3-4일', updated: '2시간 전' },
  { route: 'CNSHA → USLAX', from: 'Shanghai', to: 'Los Angeles', mode: 'ocean', rate: '$3,850/FEU', change: -3.2, trend: 'down', transitTime: '12-14일', updated: '4시간 전' },
  { route: 'NLRTM → KRPUS', from: 'Rotterdam', to: 'Busan', mode: 'ocean', rate: '$1,780/TEU', change: +2.1, trend: 'up', transitTime: '28-32일', updated: '6시간 전' },
  { route: 'ICN → PVG', from: 'Incheon', to: 'Shanghai', mode: 'air', rate: '$4.20/kg', change: -1.5, trend: 'down', transitTime: '1일', updated: '3시간 전' },
  { route: 'ICN → LAX', from: 'Incheon', to: 'Los Angeles', mode: 'air', rate: '$6.80/kg', change: +12.3, trend: 'up', transitTime: '1-2일', updated: '2시간 전' },
  { route: 'ICN → NRT', from: 'Incheon', to: 'Narita', mode: 'air', rate: '$3.10/kg', change: 0, trend: 'stable', transitTime: '3시간', updated: '5시간 전' },
];

interface Alert {
  id: string;
  title: string;
  desc: string;
  region: string;
  severity: 'critical' | 'warning' | 'info';
  date: string;
}

const ALERTS: Alert[] = [
  { id: '1', title: '수에즈 운하 통항 제한', desc: '후티 반군 공격으로 인한 우회 항로 운영 — 유럽행 해상 운송 15-20일 추가 소요', region: '중동', severity: 'critical', date: '2026-02-15' },
  { id: '2', title: '상하이항 혼잡도 상승', desc: '춘절 이후 물동량 급증으로 평균 대기 시간 3.5일 — FCL 선적 지연 가능', region: '아시아', severity: 'warning', date: '2026-02-14' },
  { id: '3', title: 'LA/LB 항구 노사 협상 진행 중', desc: '3월 말 계약 만료 예정 — 사전 선적 권고', region: '북미', severity: 'warning', date: '2026-02-12' },
  { id: '4', title: 'EU CBAM 탄소 신고 의무화', desc: '2026년 7월부터 수입 철강·시멘트·알루미늄에 CO₂ 비용 부과 예정', region: '유럽', severity: 'info', date: '2026-02-10' },
];

interface IndexData {
  name: string;
  value: string;
  change: number;
  desc: string;
}

const INDICES: IndexData[] = [
  { name: 'SCFI (상하이 컨테이너 운임지수)', value: '1,842', change: +5.3, desc: '전주 대비 상승' },
  { name: 'BDI (발틱 건화물 지수)', value: '1,256', change: -2.1, desc: '벌크 시황 소폭 하락' },
  { name: 'FBX (Freightos 종합지수)', value: '$2,340/FEU', change: +8.7, desc: '글로벌 컨테이너 운임 상승' },
  { name: 'USD/KRW 환율', value: '₩1,342.50', change: +0.3, desc: '원화 약세 지속' },
];

const MODE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  ocean: { icon: Ship, color: 'text-blue-500 bg-blue-50' },
  air: { icon: Plane, color: 'text-violet-500 bg-violet-50' },
  truck: { icon: Truck, color: 'text-amber-500 bg-amber-50' },
};

const SEVERITY_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
};

/* ───── component ───── */

export default function LogisticsUpdatePage() {
  const [modeFilter, setModeFilter] = useState<string>('all');

  const filteredMarket = modeFilter === 'all' ? MARKET_DATA : MARKET_DATA.filter((m) => m.mode === modeFilter);

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Globe className="h-4 w-4" /> Global Logistics Update
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">글로벌 물류 시황</h1>
        <p className="mt-1 text-gray-500">실시간 운임 동향, 항구 상황, 주요 지수를 한눈에 확인하세요</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" /> 마지막 업데이트: 2026-02-16 09:00 KST
        </p>
      </div>

      {/* indices */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {INDICES.map((idx) => (
          <div key={idx.name} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500">{idx.name}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{idx.value}</span>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${idx.change >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {idx.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {idx.change > 0 ? '+' : ''}{idx.change}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">{idx.desc}</p>
          </div>
        ))}
      </div>

      {/* alerts */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> 주요 알림
        </h2>
        <div className="mt-4 space-y-3">
          {ALERTS.map((a) => {
            const s = SEVERITY_STYLE[a.severity];
            return (
              <div key={a.id} className={`rounded-xl border ${s.border} ${s.bg} p-4 dark:bg-gray-800 dark:border-gray-700`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${s.icon}`} />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{a.desc}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-[11px] text-gray-400">{a.region}</span>
                    <p className="text-[11px] text-gray-400">{a.date}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* market rates */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <BarChart3 className="h-5 w-5 text-blue-500" /> 주요 항로 운임
          </h2>
          <div className="flex gap-2">
            {[
              { id: 'all', label: '전체' },
              { id: 'ocean', label: '해상' },
              { id: 'air', label: '항공' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setModeFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                  ${modeFilter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700">
                <th className="px-5 py-3 font-medium">항로</th>
                <th className="px-5 py-3 font-medium">모드</th>
                <th className="px-5 py-3 font-medium">현재 운임</th>
                <th className="px-5 py-3 font-medium">변동</th>
                <th className="px-5 py-3 font-medium">소요 시간</th>
                <th className="px-5 py-3 font-medium text-right">업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredMarket.map((m) => {
                const mi = MODE_ICON[m.mode];
                return (
                  <tr key={m.route} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white">{m.route}</p>
                      <p className="text-[11px] text-gray-400">{m.from} → {m.to}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${mi.color}`}>
                        <mi.icon className="h-3 w-3" />
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{m.rate}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-0.5 text-xs font-semibold ${m.change > 0 ? 'text-red-500' : m.change < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {m.change > 0 ? <TrendingUp className="h-3 w-3" /> : m.change < 0 ? <TrendingDown className="h-3 w-3" /> : '—'}
                        {m.change !== 0 && `${m.change > 0 ? '+' : ''}${m.change}%`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{m.transitTime}</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400">{m.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* subscribe CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">📬 주간 물류 시황 리포트</h2>
        <p className="mt-2 text-slate-300">매주 월요일, 주요 운임 변동과 시장 이슈를 이메일로 받아보세요</p>
        <div className="mx-auto mt-5 flex max-w-md gap-2">
          <input
            placeholder="이메일 주소 입력"
            className="flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold shadow transition hover:bg-blue-700">
            구독하기
          </button>
        </div>
      </div>
    </div>
  );
}
