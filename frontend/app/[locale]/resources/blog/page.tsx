'use client';

import React, { useState } from 'react';
import {
  BookOpen, Clock, User, Tag, ArrowRight, Search,
  TrendingUp, Ship, Plane, FileText, ChevronRight,
} from 'lucide-react';

/* ───── data ───── */

type Category = '전체' | '시장 동향' | '운영 가이드' | '기술' | '규제';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
  gradient: string;
}

const POSTS: BlogPost[] = [
  {
    id: '1',
    title: '2026년 글로벌 해상 운임 전망: AI가 예측하는 3가지 시나리오',
    excerpt: '상하이 컨테이너 운임지수(SCFI)를 기반으로 AI 모델이 분석한 2026년 해상 운임 트렌드와 수출입 기업이 준비해야 할 전략을 살펴봅니다.',
    category: '시장 동향',
    author: '김물류',
    date: '2026-02-14',
    readTime: '8분',
    featured: true,
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: '2',
    title: 'EU CBAM 시행 가이드: 한국 수출기업이 알아야 할 5가지',
    excerpt: '2026년 7월 본격 시행되는 EU 탄소국경조정제도(CBAM)의 핵심 요건과 대응 전략을 정리했습니다.',
    category: '규제',
    author: '이통관',
    date: '2026-02-10',
    readTime: '6분',
    gradient: 'from-emerald-600 to-teal-600',
  },
  {
    id: '3',
    title: 'LCL 혼적으로 운송비 40% 절감하기: 실전 사례 분석',
    excerpt: 'Buyer\'s Consolidation을 활용해 LCL 화물을 FCL로 혼적하여 비용을 대폭 절감한 3개 기업의 실제 사례를 소개합니다.',
    category: '운영 가이드',
    author: '박포워딩',
    date: '2026-02-07',
    readTime: '5분',
    gradient: 'from-amber-600 to-orange-600',
  },
  {
    id: '4',
    title: 'REST API로 자동 선적 예약 구현하기',
    excerpt: 'LogiNexus API를 활용하여 ERP 시스템과 연동, 자동 선적 예약 워크플로우를 구축하는 단계별 가이드입니다.',
    category: '기술',
    author: '정개발',
    date: '2026-02-03',
    readTime: '10분',
    gradient: 'from-violet-600 to-purple-600',
  },
  {
    id: '5',
    title: '항공 운송 vs 해상 운송: 어떤 상황에서 무엇을 선택할까?',
    excerpt: '비용, 속도, 환경 영향, 화물 유형 등 다양한 기준에서 두 운송 모드를 비교 분석합니다.',
    category: '운영 가이드',
    author: '김물류',
    date: '2026-01-28',
    readTime: '7분',
    gradient: 'from-sky-600 to-blue-600',
  },
  {
    id: '6',
    title: '2026 글로벌 공급망 리스크 맵: 지정학적 위험 분석',
    excerpt: '수에즈 운하 갈등, 대만 해협 긴장, 미-중 관세 전쟁 등 주요 지정학적 리스크와 대응 방안을 분석합니다.',
    category: '시장 동향',
    author: '이통관',
    date: '2026-01-22',
    readTime: '9분',
    gradient: 'from-rose-600 to-red-600',
  },
];

const CATEGORIES: Category[] = ['전체', '시장 동향', '운영 가이드', '기술', '규제'];

const CATEGORY_COLORS: Record<string, string> = {
  '시장 동향': 'bg-blue-100 text-blue-700',
  '운영 가이드': 'bg-amber-100 text-amber-700',
  '기술': 'bg-violet-100 text-violet-700',
  '규제': 'bg-emerald-100 text-emerald-700',
};

/* ───── component ───── */

export default function BlogPage() {
  const [category, setCategory] = useState<Category>('전체');
  const [search, setSearch] = useState('');

  const featured = POSTS.find((p) => p.featured);
  const filtered = POSTS.filter((p) => {
    if (p.featured && category === '전체' && !search) return false;
    const matchCat = category === '전체' || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <BookOpen className="h-4 w-4" /> Blog
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">물류 블로그</h1>
        <p className="mt-1 text-gray-500">물류 · 무역 트렌드, 운영 팁, 기술 가이드를 만나보세요</p>
      </div>

      {/* featured */}
      {featured && category === '전체' && !search && (
        <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${featured.gradient} p-8 text-white shadow-lg md:p-10`}>
          <div className="relative z-10 max-w-2xl">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
              ✨ Featured
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">{featured.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{featured.excerpt}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {featured.author}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readTime} 읽기</span>
              <span>{featured.date}</span>
            </div>
            <button className="mt-5 flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30">
              읽어보기 <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />
        </div>
      )}

      {/* search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors
                ${category === c ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-64"
          />
        </div>
      </div>

      {/* posts grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <article key={post.id} className="group flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className={`h-2 rounded-t-xl bg-gradient-to-r ${post.gradient}`} />
            <div className="flex flex-1 flex-col p-5">
              <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                {post.category}
              </span>
              <h3 className="mt-2 font-semibold leading-snug text-gray-900 dark:text-white line-clamp-2">{post.title}</h3>
              <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>
                <span>{post.date}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">검색 결과가 없습니다</p>
      )}
    </div>
  );
}
