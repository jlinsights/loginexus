'use client';

import React, { useState } from 'react';
import {
  Video, Calendar, Clock, Users, Play, ExternalLink,
  Globe, Ship, BarChart3, Shield, Cpu,
} from 'lucide-react';

/* ───── data ───── */

type WebinarStatus = 'upcoming' | 'live' | 'recorded';

interface Webinar {
  id: string;
  title: string;
  desc: string;
  speaker: string;
  role: string;
  date: string;
  time: string;
  duration: string;
  attendees?: number;
  status: WebinarStatus;
  category: string;
  gradient: string;
}

const WEBINARS: Webinar[] = [
  {
    id: '1',
    title: 'AI로 운임을 예측하는 방법: 실전 머신러닝 모델 소개',
    desc: 'LogiNexus AI 엔진이 SCFI 및 FBX 데이터를 활용하여 해상 운임을 예측하는 원리와 실제 적용 사례를 소개합니다.',
    speaker: '김데이터',
    role: 'AI Engineering Lead',
    date: '2026-02-28',
    time: '14:00 KST',
    duration: '45분',
    status: 'upcoming',
    category: 'AI',
    gradient: 'from-violet-600 to-purple-600',
  },
  {
    id: '2',
    title: '2026 관세 변화 총정리: CBAM, FTA, 원산지 증명',
    desc: 'EU CBAM 시행, RCEP 활용 전략, 원산지 증명 자동화까지 — 수출입 기업이 알아야 할 모든 관세 변화를 정리합니다.',
    speaker: '이관세',
    role: 'Trade Compliance Director',
    date: '2026-02-20',
    time: '11:00 KST',
    duration: '60분',
    attendees: 234,
    status: 'upcoming',
    category: '규제',
    gradient: 'from-emerald-600 to-teal-600',
  },
  {
    id: '3',
    title: 'API 연동 마스터클래스: ERP × LogiNexus 자동화',
    desc: 'SAP, Oracle, 더존 등 주요 ERP 시스템과 LogiNexus API를 연동하여 선적-통관-정산을 자동화하는 실습 세션입니다.',
    speaker: '정개발',
    role: 'Developer Relations',
    date: '2026-02-12',
    time: '15:00 KST',
    duration: '90분',
    attendees: 187,
    status: 'recorded',
    category: '기술',
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: '4',
    title: '공급망 리스크 관리: 수에즈 위기에서 배우는 교훈',
    desc: '2024 수에즈 운하 위기 사례를 분석하고, 실시간 모니터링과 대체 경로 전략으로 리스크를 최소화하는 방법을 알아봅니다.',
    speaker: '박전략',
    role: 'Supply Chain Strategist',
    date: '2026-01-30',
    time: '14:00 KST',
    duration: '50분',
    attendees: 312,
    status: 'recorded',
    category: '전략',
    gradient: 'from-rose-600 to-red-600',
  },
  {
    id: '5',
    title: '풀필먼트 네트워크 설계: 한국-동남아 허브 전략',
    desc: '크로스보더 이커머스 성장에 대응하는 최적의 풀필먼트 거점 구성 전략과 LogiNexus 풀필먼트 서비스를 소개합니다.',
    speaker: '최물류',
    role: 'Fulfillment Operations Head',
    date: '2026-01-18',
    time: '11:00 KST',
    duration: '40분',
    attendees: 156,
    status: 'recorded',
    category: '운영',
    gradient: 'from-amber-600 to-orange-600',
  },
];

const STATUS_STYLE: Record<WebinarStatus, { label: string; bg: string; dot: string }> = {
  upcoming: { label: '예정', bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  live: { label: 'LIVE', bg: 'bg-red-100 text-red-700', dot: 'bg-red-500 animate-pulse' },
  recorded: { label: '녹화본', bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const FILTER_TABS = ['전체', '예정', '녹화본'];

/* ───── component ───── */

export default function WebinarsPage() {
  const [filter, setFilter] = useState('전체');

  const filtered = WEBINARS.filter((w) => {
    if (filter === '예정') return w.status === 'upcoming' || w.status === 'live';
    if (filter === '녹화본') return w.status === 'recorded';
    return true;
  });

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Video className="h-4 w-4" /> Webinars
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">웨비나 · 온라인 세미나</h1>
        <p className="mt-1 text-gray-500">물류 전문가와 함께하는 실시간 학습 — 놓친 세션은 녹화본으로 시청하세요</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-blue-600">{WEBINARS.filter((w) => w.status === 'upcoming').length}</p>
          <p className="text-xs text-gray-500">예정 세션</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-emerald-600">{WEBINARS.filter((w) => w.status === 'recorded').length}</p>
          <p className="text-xs text-gray-500">녹화 세션</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-violet-600">
            {WEBINARS.reduce((sum, w) => sum + (w.attendees || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">총 참석자</p>
        </div>
      </div>

      {/* filter */}
      <div className="flex gap-2">
        {FILTER_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors
              ${filter === f ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* webinar cards */}
      <div className="space-y-4">
        {filtered.map((w) => {
          const st = STATUS_STYLE[w.status];
          return (
            <div key={w.id} className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col md:flex-row">
                {/* left accent */}
                <div className={`flex items-center justify-center bg-gradient-to-br ${w.gradient} p-6 text-white md:w-48`}>
                  <div className="text-center">
                    <Play className="mx-auto h-8 w-8" />
                    <p className="mt-2 text-xs font-medium opacity-80">{w.duration}</p>
                  </div>
                </div>

                {/* content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                        {w.category}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{w.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{w.desc}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {w.speaker} · {w.role}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {w.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {w.time}</span>
                      {w.attendees && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {w.attendees}명</span>}
                    </div>
                    <button className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${w.status === 'upcoming' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}>
                      {w.status === 'upcoming' ? '사전 등록' : '시청하기'}
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
