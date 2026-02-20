'use client';

import React, { useState } from 'react';
import {
  Brain, Ship, Plane, ArrowRight, Loader2,
  TrendingDown, Star, Clock, MapPin, Shield, Zap,
  ChevronDown, Package, DollarSign,
} from 'lucide-react';

/* ───── data ───── */

const PORTS = {
  origin: ['부산 (KRPUS)', '인천 (KRICN)', '광양 (KRKWG)', '상하이 (CNSHA)', '닝보 (CNNBO)', '칭다오 (CNTAO)'],
  dest: ['LA/LB (USLAX)', 'Long Beach (USLGB)', 'Hamburg (DEHAM)', 'Rotterdam (NLRTM)', 'Tokyo (JPTYO)', 'Ho Chi Minh (VNSGN)', 'Singapore (SGSIN)'],
};

const CARGO_TYPES = [
  { id: 'fcl20', label: "FCL 20'", icon: Package },
  { id: 'fcl40', label: "FCL 40'", icon: Package },
  { id: 'lcl', label: 'LCL', icon: Package },
  { id: 'air', label: 'Air', icon: Plane },
];

type QuoteResult = {
  id: number;
  forwarder: string;
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  transit: number;
  via: string;
  reliability: number;
  savings: number;
  badge?: string;
};

const MOCK_RESULTS: QuoteResult[] = [
  { id: 1, forwarder: 'GlobalShip Express', rating: 4.8, reviews: 324, price: 1850, currency: 'USD', transit: 14, via: 'Direct', reliability: 97, savings: 30, badge: 'AI 추천' },
  { id: 2, forwarder: 'Pacific Logistics', rating: 4.5, reviews: 189, price: 1720, currency: 'USD', transit: 18, via: 'Ningbo 경유', reliability: 94, savings: 35, badge: '최저가' },
  { id: 3, forwarder: 'Korea Express Line', rating: 4.7, reviews: 256, price: 1980, currency: 'USD', transit: 12, via: 'Direct', reliability: 98, savings: 22 },
  { id: 4, forwarder: 'Asia Trade Partners', rating: 4.3, reviews: 142, price: 1650, currency: 'USD', transit: 21, via: 'Shanghai 경유', reliability: 91, savings: 38 },
];

/* ───── component ───── */

export default function AIQuotePage() {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [cargoType, setCargoType] = useState('fcl20');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QuoteResult[] | null>(null);

  const handleQuote = () => {
    if (!origin || !dest) return;
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setLoading(false);
      setResults(MOCK_RESULTS);
    }, 2200);
  };

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-violet-600">
          <Brain className="h-4 w-4" /> AI Freight Quote
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">AI 물류비 견적</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          AI가 여러 포워더의 운임을 실시간으로 비교 분석하여 최적 견적을 제안합니다
        </p>
      </div>

      {/* savings banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-200">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-semibold">ZimGo-inspired AI Engine</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">최대 <span className="text-yellow-300">30%</span> 물류비 절감</h2>
            <p className="mt-1 text-sm text-violet-100">AI가 최적 경로 · 최저 운임 · 최고 신뢰도를 분석하여 추천합니다</p>
          </div>
          <div className="flex gap-6">
            {[
              { value: '4.2만+', label: '견적 분석' },
              { value: '380+', label: '파트너 포워더' },
              { value: '96%', label: '고객 만족도' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-violet-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* quote form */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">견적 요청</h3>

        <div className="grid gap-5 md:grid-cols-2">
          {/* origin */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">출발지</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">항구를 선택하세요</option>
                {PORTS.origin.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* destination */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">도착지</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">항구를 선택하세요</option>
                {PORTS.dest.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* cargo type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">화물 유형</label>
            <div className="flex gap-2">
              {CARGO_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setCargoType(ct.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${cargoType === ct.id
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                >
                  <ct.icon className="h-3.5 w-3.5" />
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* weight */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">예상 중량 (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="예: 12000"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleQuote}
          disabled={!origin || !dest || loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> AI 분석 중...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" /> AI 견적 받기
            </>
          )}
        </button>
      </div>

      {/* loading animation */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <Brain className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-violet-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">380+ 포워더 운임 데이터 분석 중...</p>
          <div className="mt-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              AI 추천 견적 <span className="text-sm font-normal text-gray-500">({results.length}건)</span>
            </h3>
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <TrendingDown className="h-4 w-4" />
              <span className="font-semibold">평균 28% 절감</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {results.map((r) => (
              <div key={r.id} className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {r.badge && (
                  <span className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-bold
                    ${r.badge === 'AI 추천' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {r.badge}
                  </span>
                )}

                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Ship className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{r.forwarder}</h4>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {r.rating} · {r.reviews}건 리뷰
                    </div>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                  <div className="text-center">
                    <DollarSign className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">${r.price.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">견적 운임</div>
                  </div>
                  <div className="text-center">
                    <Clock className="mx-auto mb-1 h-4 w-4 text-blue-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{r.transit}일</div>
                    <div className="text-[10px] text-gray-500">소요 일수</div>
                  </div>
                  <div className="text-center">
                    <Shield className="mx-auto mb-1 h-4 w-4 text-violet-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{r.reliability}%</div>
                    <div className="text-[10px] text-gray-500">신뢰도</div>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">경유: <span className="font-medium text-gray-700 dark:text-gray-300">{r.via}</span></span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <TrendingDown className="h-3.5 w-3.5" /> {r.savings}% 절감
                  </span>
                </div>

                <button className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow transition-all hover:shadow-lg">
                  견적 선택 <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
