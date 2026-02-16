'use client';

import React, { useState } from 'react';
import {
  FileText, Download, Eye, Clock, Tag,
  Ship, Plane, Shield, BarChart3, Globe, Leaf,
  ArrowRight, BookOpen, CheckCircle2,
} from 'lucide-react';

/* ───── data ───── */

type GuideCategory = '전체' | '입문' | '운영' | '규제' | '전략';

interface Guide {
  id: string;
  title: string;
  desc: string;
  category: GuideCategory;
  pages: number;
  downloads: number;
  icon: React.ElementType;
  gradient: string;
  topics: string[];
  updated: string;
}

const GUIDES: Guide[] = [
  {
    id: '1',
    title: '국제 물류 입문 가이드',
    desc: '포워딩의 기본 개념부터 선적, 통관, 보험까지 — 처음 수출입을 시작하는 기업을 위한 완벽 가이드',
    category: '입문',
    pages: 42,
    downloads: 2840,
    icon: Ship,
    gradient: 'from-blue-500 to-indigo-500',
    topics: ['FOB/CIF 조건', '인코텀즈 2020', 'B/L 종류', '통관 절차', '보험 가입'],
    updated: '2026-02',
  },
  {
    id: '2',
    title: '해상 운송 운임 최적화 전략',
    desc: 'FCL/LCL 선택 기준, 혼적(Consolidation) 활용법, 계약 운임 협상 팁까지 운임 절감을 위한 실전 가이드',
    category: '운영',
    pages: 35,
    downloads: 1920,
    icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-500',
    topics: ['FCL vs LCL', '혼적 전략', '운임 벤치마킹', '장기 계약', 'Spot 시장'],
    updated: '2026-01',
  },
  {
    id: '3',
    title: 'HS Code & 관세 완벽 가이드',
    desc: '품목분류, HS Code 결정 방법, FTA 활용 절세 전략, 원산지 증명 프로세스를 체계적으로 설명합니다',
    category: '규제',
    pages: 48,
    downloads: 3150,
    icon: Shield,
    gradient: 'from-amber-500 to-orange-500',
    topics: ['HS Code 구조', 'FTA 활용법', '원산지 증명', '관세 환급', '사전 심사제'],
    updated: '2026-02',
  },
  {
    id: '4',
    title: '항공 운송 실무 핸드북',
    desc: '항공 화물 예약부터 ULD, AWB 작성, 위험물 운송 규정까지 항공 운송 실무에 필요한 모든 정보',
    category: '운영',
    pages: 38,
    downloads: 1450,
    icon: Plane,
    gradient: 'from-violet-500 to-purple-500',
    topics: ['AWB 작성법', 'ULD 종류', '위험물 규정', 'TACT 요율', '급송 서비스'],
    updated: '2025-12',
  },
  {
    id: '5',
    title: '글로벌 공급망 ESG 전략',
    desc: '탄소 배출 측정, Scope 3 관리, CBAM 대응, 그린 물류 실천 방안을 담은 ESG 전략 가이드',
    category: '전략',
    pages: 52,
    downloads: 980,
    icon: Leaf,
    gradient: 'from-green-500 to-emerald-500',
    topics: ['Scope 3 산정', 'CBAM 대응', '녹색 항로', '탄소 상쇄', 'ESG 공시'],
    updated: '2026-01',
  },
  {
    id: '6',
    title: '크로스보더 이커머스 물류 가이드',
    desc: '해외 직구/역직구 풀필먼트, 반품 관리, 관세 면제 한도, 라스트마일 전략까지 A to Z',
    category: '전략',
    pages: 44,
    downloads: 2100,
    icon: Globe,
    gradient: 'from-cyan-500 to-blue-500',
    topics: ['풀필먼트 설계', '반품 프로세스', '관세 면제', '라스트마일', '현지 배송'],
    updated: '2026-02',
  },
];

const CATEGORIES: GuideCategory[] = ['전체', '입문', '운영', '규제', '전략'];

/* ───── component ───── */

export default function GuidesPage() {
  const [category, setCategory] = useState<GuideCategory>('전체');

  const filtered = category === '전체' ? GUIDES : GUIDES.filter((g) => g.category === category);

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <BookOpen className="h-4 w-4" /> E-Guides
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">물류 가이드 라이브러리</h1>
        <p className="mt-1 text-gray-500">실무에 바로 적용할 수 있는 무료 물류 · 무역 가이드를 다운로드하세요</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-blue-600">{GUIDES.length}</p>
          <p className="text-xs text-gray-500">가이드</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-emerald-600">{GUIDES.reduce((s, g) => s + g.pages, 0)}</p>
          <p className="text-xs text-gray-500">총 페이지</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-violet-600">{GUIDES.reduce((s, g) => s + g.downloads, 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">총 다운로드</p>
        </div>
      </div>

      {/* filter */}
      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors
              ${category === c ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* guide cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((guide) => (
          <div key={guide.id} className="group flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            {/* icon header */}
            <div className={`flex items-center gap-4 rounded-t-xl bg-gradient-to-br ${guide.gradient} p-5 text-white`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <guide.icon className="h-6 w-6" />
              </div>
              <div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
                  {guide.category}
                </span>
                <p className="mt-1 text-xs text-white/70">{guide.pages}p · {guide.updated}</p>
              </div>
            </div>

            {/* body */}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-bold text-gray-900 dark:text-white">{guide.title}</h3>
              <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-2">{guide.desc}</p>

              {/* topics */}
              <div className="mt-3 flex flex-wrap gap-1">
                {guide.topics.slice(0, 3).map((t) => (
                  <span key={t} className="flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {t}
                  </span>
                ))}
                {guide.topics.length > 3 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400 dark:bg-gray-700">
                    +{guide.topics.length - 3}
                  </span>
                )}
              </div>

              {/* footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Download className="h-3 w-3" /> {guide.downloads.toLocaleString()}
                </span>
                <button className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                  <Download className="h-3 w-3" /> 다운로드
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
