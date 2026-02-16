'use client';

import React, { useState } from 'react';
import {
  Globe, MapPin, Warehouse,
  Building2, Anchor, ArrowRight,
} from 'lucide-react';

/* ───── data ───── */

interface Office {
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  type: 'office' | 'warehouse' | 'port';
  services: string[];
}

const OFFICES: Office[] = [
  { city: '서울', country: '대한민국', region: 'asia', lat: 37.57, lng: 126.98, type: 'office', services: ['포워딩', '통관', 'Trade Finance'] },
  { city: '부산', country: '대한민국', region: 'asia', lat: 35.18, lng: 129.08, type: 'port', services: ['해상 운송', '통관', '창고'] },
  { city: '인천', country: '대한민국', region: 'asia', lat: 37.46, lng: 126.71, type: 'warehouse', services: ['풀필먼트', '항공 운송', '창고'] },
  { city: 'Shanghai', country: 'China', region: 'asia', lat: 31.23, lng: 121.47, type: 'port', services: ['해상 운송', '포워딩', '통관'] },
  { city: 'Shenzhen', country: 'China', region: 'asia', lat: 22.54, lng: 114.06, type: 'office', services: ['포워딩', '통관', 'QC 검수'] },
  { city: 'Tokyo', country: 'Japan', region: 'asia', lat: 35.68, lng: 139.69, type: 'office', services: ['포워딩', '통관', '풀필먼트'] },
  { city: 'Singapore', country: 'Singapore', region: 'asia', lat: 1.35, lng: 103.82, type: 'office', services: ['해상 운송', 'Trade Finance', '보험'] },
  { city: 'Ho Chi Minh', country: 'Vietnam', region: 'asia', lat: 10.82, lng: 106.63, type: 'office', services: ['포워딩', '통관', 'QC 검수'] },
  { city: 'Rotterdam', country: 'Netherlands', region: 'europe', lat: 51.92, lng: 4.48, type: 'port', services: ['해상 운송', '통관', '내륙 운송'] },
  { city: 'Hamburg', country: 'Germany', region: 'europe', lat: 53.55, lng: 9.99, type: 'port', services: ['해상 운송', '내륙 운송', '창고'] },
  { city: 'London', country: 'United Kingdom', region: 'europe', lat: 51.51, lng: -0.13, type: 'office', services: ['포워딩', 'Trade Finance', '보험'] },
  { city: 'Los Angeles', country: 'United States', region: 'americas', lat: 34.05, lng: -118.24, type: 'warehouse', services: ['풀필먼트', '해상 운송', '내륙 운송'] },
  { city: 'New York', country: 'United States', region: 'americas', lat: 40.71, lng: -74.01, type: 'office', services: ['포워딩', 'Trade Finance', '통관'] },
  { city: 'Chicago', country: 'United States', region: 'americas', lat: 41.88, lng: -87.63, type: 'warehouse', services: ['풀필먼트', '내륙 운송', '창고'] },
];

const STATS = [
  { label: '글로벌 거점', value: '14+', icon: Building2, color: 'text-blue-500 bg-blue-50' },
  { label: '커버 국가', value: '8개국', icon: Globe, color: 'text-emerald-500 bg-emerald-50' },
  { label: '파트너 항구', value: '120+', icon: Anchor, color: 'text-violet-500 bg-violet-50' },
  { label: '창고 면적', value: '45,000 CBM', icon: Warehouse, color: 'text-amber-500 bg-amber-50' },
];

const REGIONS = [
  { id: 'all', label: '전체' },
  { id: 'asia', label: '아시아 · 태평양' },
  { id: 'europe', label: '유럽' },
  { id: 'americas', label: '아메리카' },
];

const TYPE_META: Record<string, { label: string; icon: React.ElementType; dot: string }> = {
  office: { label: '오피스', icon: Building2, dot: 'bg-blue-500' },
  warehouse: { label: '창고', icon: Warehouse, dot: 'bg-amber-500' },
  port: { label: '항구 거점', icon: Anchor, dot: 'bg-emerald-500' },
};

/* ───── helpers ───── */

function toSvg(lng: number, lat: number): [number, number] {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return [x, y];
}

/* ───── component ───── */

export default function NetworkPage() {
  const [region, setRegion] = useState('all');
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = region === 'all' ? OFFICES : OFFICES.filter((o) => o.region === region);

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Globe className="h-4 w-4" /> Global Network
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">글로벌 네트워크</h1>
          <p className="mt-1 text-gray-500">전 세계 주요 거점에서 원스톱 물류 서비스를 제공합니다</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* region filter */}
      <div className="flex gap-2">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRegion(r.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors
              ${region === r.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* map */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
        <svg viewBox="0 0 1000 500" className="w-full" style={{ minHeight: 320 }}>
          {/* grid lines */}
          {[...Array(9)].map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 62.5} x2={1000} y2={i * 62.5} stroke="rgba(255,255,255,0.04)" />
          ))}
          {[...Array(17)].map((_, i) => (
            <line key={`v${i}`} x1={i * 62.5} y1={0} x2={i * 62.5} y2={500} stroke="rgba(255,255,255,0.04)" />
          ))}

          {/* dots */}
          {filtered.map((o) => {
            const [cx, cy] = toSvg(o.lng, o.lat);
            const isHovered = hovered === o.city;
            const fill = o.type === 'office' ? '#3b82f6' : o.type === 'warehouse' ? '#f59e0b' : '#10b981';
            return (
              <g key={o.city} onMouseEnter={() => setHovered(o.city)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                {isHovered && <circle cx={cx} cy={cy} r={18} fill={fill} opacity={0.15} />}
                <circle cx={cx} cy={cy} r={isHovered ? 7 : 5} fill={fill} stroke="white" strokeWidth={1.5}>
                  <animate attributeName="r" values={isHovered ? '7;8;7' : '5;6;5'} dur="2s" repeatCount="indefinite" />
                </circle>
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  className="text-[10px] font-semibold"
                  fill="white"
                  opacity={isHovered ? 1 : 0.7}
                >
                  {o.city}
                </text>
              </g>
            );
          })}
        </svg>

        {/* legend */}
        <div className="flex gap-6 border-t border-white/10 px-6 py-3">
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-gray-300">
              <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </div>
          ))}
        </div>
      </div>

      {/* location cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((o) => {
          const meta = TYPE_META[o.type];
          return (
            <div
              key={o.city}
              className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.dot}/20`}>
                    <meta.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{o.city}</p>
                    <p className="text-xs text-gray-500">{o.country}</p>
                  </div>
                </div>
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.services.map((s) => (
                  <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {s}
                  </span>
                ))}
              </div>

              <button className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                자세히 보기 <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">가까운 거점에서 시작하세요</h2>
        <p className="mt-2 text-blue-100">전 세계 어디서든 LogiNexus의 통합 물류 서비스를 경험할 수 있습니다</p>
        <button className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 shadow transition hover:shadow-lg">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> 상담 요청하기
          </span>
        </button>
      </div>
    </div>
  );
}
