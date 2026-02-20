'use client';

import React, { useState } from 'react';
import {
  Users, Search, Star, MapPin, Shield, Clock,
  Ship, Plane, Truck, FileCheck, BadgeCheck,
  Building2, Globe, MessageSquare,
} from 'lucide-react';

/* ───── data ───── */

type PartnerCategory = '전체' | '해상' | '항공' | '내륙' | '통관' | '보험';
const CATEGORIES: PartnerCategory[] = ['전체', '해상', '항공', '내륙', '통관', '보험'];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  해상: Ship, 항공: Plane, 내륙: Truck, 통관: FileCheck, 보험: Shield,
};

type Partner = {
  id: number;
  name: string;
  category: Exclude<PartnerCategory, '전체'>;
  region: string;
  specialties: string[];
  rating: number;
  reviews: number;
  responseTime: string;
  certified: boolean;
  description: string;
  deals: number;
};

const PARTNERS: Partner[] = [
  { id: 1, name: 'Pacific Ocean Logistics', category: '해상', region: '부산 · 상하이 · LA', specialties: ['FCL', 'LCL', '냉동 컨테이너'], rating: 4.9, reviews: 428, responseTime: '2시간', certified: true, description: 'Asia-US 해상 운송 전문, 20년 이상 경력의 글로벌 포워더', deals: 1240 },
  { id: 2, name: 'SkyBridge Air Cargo', category: '항공', region: '인천 · 싱가포르 · 프랑크푸르트', specialties: ['특송', '반도체', '의약품'], rating: 4.8, reviews: 312, responseTime: '1시간', certified: true, description: '반도체 및 고가 화물 항공 특송 전문', deals: 890 },
  { id: 3, name: '한국내륙운송', category: '내륙', region: '전국 (수도권 당일배송)', specialties: ['FTL', 'LTL', '컨테이너 드레이지'], rating: 4.6, reviews: 567, responseTime: '30분', certified: true, description: '전국 네트워크 내륙 운송, 항만 컨테이너 배송 전문', deals: 2100 },
  { id: 4, name: 'ClearPass 관세법인', category: '통관', region: '인천공항 · 부산항', specialties: ['FTA 활용', '품목분류', 'AEO 인증'], rating: 4.7, reviews: 234, responseTime: '3시간', certified: true, description: 'FTA 활용 관세 절감, 수출입 통관 원스톱 서비스', deals: 780 },
  { id: 5, name: 'MarineGuard Insurance', category: '보험', region: '서울 · 부산', specialties: ['적하보험', '전쟁위험', '클레임'], rating: 4.5, reviews: 189, responseTime: '4시간', certified: false, description: '해상·항공 적하보험 전문, 신속한 클레임 처리', deals: 450 },
  { id: 6, name: 'EastWest Shipping', category: '해상', region: '부산 · 로테르담 · 함부르크', specialties: ['유럽항로', 'FCL', '프로젝트화물'], rating: 4.4, reviews: 198, responseTime: '3시간', certified: true, description: '유럽 항로 특화, 중량물/프로젝트 화물 전문', deals: 620 },
  { id: 7, name: 'QuickAir Express', category: '항공', region: '인천 · 도쿄 · 호치민', specialties: ['이커머스', '소형화물', 'Cross-border'], rating: 4.3, reviews: 445, responseTime: '1시간', certified: false, description: '아시아 역내 소형 항공화물 및 이커머스 풀필먼트', deals: 1560 },
  { id: 8, name: 'Global Customs Advisory', category: '통관', region: '서울 · 인천 · 광양', specialties: ['HS Code', '관세감면', '원산지증명'], rating: 4.8, reviews: 156, responseTime: '2시간', certified: true, description: '관세사 10인 이상 보유, 복잡한 품목분류 및 FTA 원산지 전문', deals: 340 },
];

/* ───── component ───── */

export default function PartnersPage() {
  const [category, setCategory] = useState<PartnerCategory>('전체');
  const [search, setSearch] = useState('');

  const filtered = PARTNERS.filter((p) => {
    const matchCat = category === '전체' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const totalDeals = PARTNERS.reduce((sum, p) => sum + p.deals, 0);

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-cyan-600">
          <Users className="h-4 w-4" /> B2B Partner Matching
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">물류 파트너 매칭</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          검증된 물류 파트너를 찾고 최적의 서비스를 비교하세요
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { value: PARTNERS.length.toString(), label: '등록 파트너', color: 'text-cyan-600' },
          { value: '2.1시간', label: '평균 응답', color: 'text-blue-600' },
          { value: totalDeals.toLocaleString(), label: '누적 거래', color: 'text-emerald-600' },
          { value: '4.6', label: '평균 평점', color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors
                ${category === c ? 'bg-cyan-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              {c !== '전체' && CATEGORY_ICONS[c] && React.createElement(CATEGORY_ICONS[c], { className: 'h-3.5 w-3.5' })}
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="파트너 · 전문 분야 검색..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-72"
          />
        </div>
      </div>

      {/* partner cards */}
      <div className="space-y-4">
        {filtered.map((p) => {
          const CatIcon = CATEGORY_ICONS[p.category] || Globe;
          return (
            <div key={p.id} className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col md:flex-row">
                {/* left color bar */}
                <div className={`flex w-full items-center justify-center p-6 md:w-48
                  ${p.category === '해상' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                    p.category === '항공' ? 'bg-gradient-to-br from-sky-500 to-blue-500' :
                    p.category === '내륙' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                    p.category === '통관' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
                    'bg-gradient-to-br from-violet-500 to-purple-500'}`}
                >
                  <div className="text-center text-white">
                    <CatIcon className="mx-auto mb-2 h-8 w-8" />
                    <div className="text-sm font-bold">{p.category}</div>
                  </div>
                </div>

                {/* content */}
                <div className="flex-1 p-5">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h3>
                        {p.certified && (
                          <span className="flex items-center gap-0.5 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                            <BadgeCheck className="h-3 w-3" /> 인증
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {p.region}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{p.rating}</span>
                      <span className="text-xs text-gray-500">({p.reviews})</span>
                    </div>
                  </div>

                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{p.description}</p>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {p.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{s}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 응답: {p.responseTime}</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {p.deals.toLocaleString()}건 거래</span>
                    </div>
                    <button className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:shadow-lg">
                      <MessageSquare className="h-3.5 w-3.5" /> 견적 요청
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
