'use client';

import React, { useState } from 'react';
import {
  Megaphone, Sparkles, Wrench, Bug, Tag,
  ChevronRight, Filter, Star,
} from 'lucide-react';

/* ───── types & data ───── */

type ReleaseCategory = 'feature' | 'improvement' | 'fix';

type ReleaseItem = {
  title: string;
  desc: string;
  category: ReleaseCategory;
};

type Release = {
  version: string;
  date: string;
  highlight?: string;
  items: ReleaseItem[];
};

const RELEASES: Release[] = [
  {
    version: 'v2.4.0',
    date: '2026-02-15',
    highlight: 'AI 공급망 인사이트 출시',
    items: [
      { title: 'AI Intelligence 대시보드', desc: '운임 예측, 리스크 모니터링, 최적 경로 추천 기능 추가', category: 'feature' },
      { title: 'Control Tower', desc: '전체 공급망 가시성 허브 — 예외 파이프라인 및 실시간 타임라인', category: 'feature' },
      { title: 'Carbon Control (ESG)', desc: '운송별 탄소 배출 추적 및 감축 목표 관리', category: 'feature' },
      { title: 'Developer Portal', desc: 'REST API 레퍼런스, Webhook 이벤트, SDK 문서 공개', category: 'feature' },
      { title: 'Fulfillment 모듈', desc: 'eCommerce/B2B 풀필먼트 관리 — 주문 처리, 반품, 창고 네트워크', category: 'feature' },
    ],
  },
  {
    version: 'v2.3.0',
    date: '2026-02-01',
    highlight: 'P1 금융 · 발주 서비스',
    items: [
      { title: 'Trade Finance', desc: 'L/C, T/T, D/A 여신 관리 및 결제 조건 비교', category: 'feature' },
      { title: 'Cargo Insurance', desc: '적하보험 가입, 보험료 계산기, 보장 범위 가이드', category: 'feature' },
      { title: 'Customs Brokerage', desc: '통관 상태 추적, 서류 체크리스트, 타임라인 시각화', category: 'feature' },
      { title: 'Booking Management', desc: '선사 스케줄 조회 및 부킹 요청 워크플로', category: 'feature' },
      { title: 'Buyer\'s Consolidation', desc: 'LCL→FCL 혼적 최적화 시뮬레이터', category: 'feature' },
      { title: 'Order Management', desc: '발주 생성→선적→도착 전 과정 관리', category: 'feature' },
      { title: '사이드바 리뉴얼', desc: '8+ 항목 확장 — 접이식 서브메뉴 도입', category: 'improvement' },
    ],
  },
  {
    version: 'v2.2.0',
    date: '2026-01-15',
    highlight: '무료 물류 도구 출시',
    items: [
      { title: 'Rate Explorer', desc: '항구별 예상 운임 · 소요일수 실시간 조회', category: 'feature' },
      { title: 'HS Code 조회', desc: '품목별 관세율 및 HS 코드 검색 도구', category: 'feature' },
      { title: '물류 용어 사전', desc: '국제 물류 핵심 용어 37개 학습 가이드', category: 'feature' },
      { title: '탄소 배출 계산기', desc: '운송 모드별 CO₂ 비교 분석 도구', category: 'feature' },
      { title: '랜딩 페이지 리뉴얼', desc: '메가메뉴, 트래킹 검색, 라이브 데모 위젯 추가', category: 'improvement' },
    ],
  },
  {
    version: 'v2.1.0',
    date: '2025-12-20',
    items: [
      { title: '대시보드 성능 최적화', desc: '초기 로딩 시간 40% 단축 — Dynamic Import 적용', category: 'improvement' },
      { title: 'DashboardMap 하이드레이션 수정', desc: 'SSR/CSR 불일치로 인한 지도 렌더링 오류 해결', category: 'fix' },
      { title: '모바일 반응형 개선', desc: '사이드바 오버레이 및 터치 인터랙션 안정화', category: 'improvement' },
    ],
  },
  {
    version: 'v2.0.0',
    date: '2025-11-01',
    highlight: 'LogiNexus 2.0 출시 🎉',
    items: [
      { title: 'Next.js 마이그레이션', desc: 'React SPA에서 Next.js App Router로 전면 전환', category: 'feature' },
      { title: '블록체인 에스크로', desc: 'Web3 기반 안전 결제 시스템 도입', category: 'feature' },
      { title: '실시간 선적 추적', desc: 'AIS/FlightAware 연동 실시간 트래킹 맵', category: 'feature' },
      { title: 'AI 견적 엔진', desc: '머신러닝 기반 최적 운임 자동 예측', category: 'feature' },
      { title: '백엔드 통합', desc: 'FastAPI + PostgreSQL + Redis 아키텍처 구축', category: 'improvement' },
    ],
  },
];

const CATEGORY_STYLE: Record<ReleaseCategory, { label: string; bg: string; icon: React.ElementType }> = {
  feature: { label: 'New Feature', bg: 'bg-emerald-100 text-emerald-700', icon: Sparkles },
  improvement: { label: 'Improvement', bg: 'bg-blue-100 text-blue-700', icon: Wrench },
  fix: { label: 'Bug Fix', bg: 'bg-rose-100 text-rose-700', icon: Bug },
};

/* ───── page ───── */

export default function ChangelogPage() {
  const [filter, setFilter] = useState<string>('all');

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-rose-500 mb-2">
          <Megaphone size={16} /> Product Updates
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Changelog</h1>
        <p className="text-slate-500 mt-1">LogiNexus 플랫폼의 주요 업데이트 기록</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: '전체' },
          { key: 'feature', label: 'Features' },
          { key: 'improvement', label: 'Improvements' },
          { key: 'fix', label: 'Fixes' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {RELEASES.map((release, ri) => {
          const filteredItems = filter === 'all'
            ? release.items
            : release.items.filter((item) => item.category === filter);

          if (filteredItems.length === 0) return null;

          return (
            <div key={release.version} className="flex gap-6">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Tag size={16} />
                </div>
                {ri < RELEASES.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
              </div>

              {/* Content */}
              <div className="pb-10 flex-1">
                {/* Version + Date */}
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-bold text-slate-800">{release.version}</span>
                  <span className="text-sm text-slate-400">{release.date}</span>
                </div>
                {release.highlight && (
                  <div className="flex items-center gap-2 text-sm text-rose-600 font-medium mb-3">
                    <Star size={14} /> {release.highlight}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3 mt-3">
                  {filteredItems.map((item, ii) => {
                    const cat = CATEGORY_STYLE[item.category];
                    const CatIcon = cat.icon;
                    return (
                      <div
                        key={ii}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cat.bg}`}>
                            <CatIcon size={12} /> {cat.label}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                            <div className="text-sm text-slate-500 mt-0.5">{item.desc}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
