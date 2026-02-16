'use client';

import React, { useState } from 'react';
import {
  Megaphone, Target, BarChart3, Users, TrendingUp,
  ArrowRight, CheckCircle2, Star, Zap, Eye,
  Building2, Globe, Award, ChevronRight,
} from 'lucide-react';

/* ───── data ───── */

const STEPS = [
  { step: '01', title: '파트너 등록', desc: '기본 정보와 서비스 영역을 입력하고 무료로 파트너 등록을 완료하세요', icon: Building2, color: 'from-cyan-500 to-blue-500' },
  { step: '02', title: '프로필 설정', desc: '전문 분야, 서비스 지역, 인증 정보 등 상세 프로필을 구성하세요', icon: Target, color: 'from-violet-500 to-indigo-500' },
  { step: '03', title: '노출 시작', desc: '화주 기업에게 프로필이 노출되고 견적 요청을 받기 시작합니다', icon: Eye, color: 'from-emerald-500 to-teal-500' },
];

type PlanId = 'basic' | 'pro' | 'enterprise';

const PLANS: { id: PlanId; name: string; price: string; period: string; desc: string; features: string[]; highlight?: boolean; badge?: string }[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '무료',
    period: '',
    desc: '소규모 물류사를 위한 기본 노출',
    features: ['기본 프로필 등록', '월 5건 견적 요청 수신', '기본 검색 노출', '실적 통계 (기본)', '이메일 알림'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₩290,000',
    period: '/월',
    desc: '성장하는 포워더를 위한 프리미엄',
    highlight: true,
    badge: '인기',
    features: ['우선 검색 노출', '무제한 견적 요청', '인증 배지 부여', '상세 분석 대시보드', '맞춤 프로모션 배너', '전담 매니저 배정'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '맞춤 견적',
    period: '',
    desc: '대형 물류사/선사를 위한 통합 솔루션',
    features: ['전용 브랜드 페이지', 'API 연동', '화주 맞춤 타겟팅', '성과 기반 과금', '전략 컨설팅', '실시간 채팅 지원', 'SLA 보장'],
  },
];

const RESULTS = [
  { metric: '프로필 노출수', value: '42,800+', change: '+156%', icon: Eye },
  { metric: '견적 요청 수신', value: '1,240건', change: '+89%', icon: TrendingUp },
  { metric: '신규 거래 성사', value: '380건', change: '+67%', icon: Award },
  { metric: '평균 전환율', value: '31%', change: '+12%p', icon: BarChart3 },
];

/* ───── component ───── */

export default function MarketingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-orange-600">
          <Megaphone className="h-4 w-4" /> Marketing Program
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">물류 마케팅 프로그램</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          물류사·선사를 위한 B2B 마케팅 프로그램 — 수출입 기업에게 직접 노출되세요
        </p>
      </div>

      {/* hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-8 text-white shadow-lg md:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2 text-orange-100">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-semibold">TradLinx-inspired B2B Marketing</span>
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">물류 전문 기업을 위한<br />디지털 마케팅 솔루션</h2>
          <p className="mt-3 max-w-2xl text-sm text-orange-100">
            LogiNexus 플랫폼에 등록된 수천 개 수출입 기업에게 귀사의 서비스를 직접 알리세요.
            프로필 노출부터 맞춤 타겟팅까지, 효과적인 B2B 마케팅을 제공합니다.
          </p>
          <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-orange-600 shadow hover:bg-orange-50 transition-colors">
            프로그램 시작하기 <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* how it works */}
      <div>
        <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">가입 프로세스</h3>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="group relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div className="absolute right-4 top-4 text-3xl font-black text-gray-100 dark:text-gray-700">{s.step}</div>
              <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{s.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* pricing */}
      <div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">요금 플랜</h3>
        <p className="mb-6 text-sm text-gray-500">비즈니스 규모에 맞는 플랜을 선택하세요</p>
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all
                ${plan.highlight
                  ? 'border-orange-500 bg-white shadow-lg ring-1 ring-orange-200 dark:bg-gray-800'
                  : selectedPlan === plan.id
                    ? 'border-blue-500 bg-white shadow-md dark:bg-gray-800'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-4 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-bold text-white shadow">
                  {plan.badge}
                </span>
              )}
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
              <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-5 w-full rounded-lg py-2.5 text-sm font-bold transition-colors
                ${plan.highlight
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow hover:shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {plan.price === '맞춤 견적' ? '문의하기' : '시작하기'} <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* performance stats */}
      <div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Pro 플랜 평균 성과</h3>
        <p className="mb-6 text-sm text-gray-500">가입 후 3개월 기준 평균 성과 데이터입니다</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {RESULTS.map((r) => (
            <div key={r.metric} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <r.icon className="mb-2 h-5 w-5 text-orange-500" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{r.value}</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs">
                <span className="text-gray-500">{r.metric}</span>
                <span className="font-semibold text-emerald-600">{r.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* testimonial */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-orange-50 to-rose-50 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30">
            <Star className="h-6 w-6 fill-orange-400 text-orange-400" />
          </div>
          <div>
            <p className="text-sm italic text-gray-700 dark:text-gray-300">
              &ldquo;Pro 플랜 가입 후 3개월 만에 신규 화주 12곳과 계약을 체결했습니다.
              기존 영업 대비 비용은 절반으로 줄고, 문의 품질은 훨씬 높아졌어요.&rdquo;
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">이승호</span>
              <span className="text-xs text-gray-500">대표 · PacificBridge Logistics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
