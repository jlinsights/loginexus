'use client';

import React, { useState } from 'react';
import {
  Search, HelpCircle, MessageSquare, Phone, Mail,
  ChevronDown, ChevronRight, FileText, CreditCard,
  Code2, Ship, Clock, CheckCircle2, AlertCircle,
  LifeBuoy, BookOpen,
} from 'lucide-react';

/* ───── data ───── */

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQ: FaqItem[] = [
  { q: '선적 상태를 확인하려면 어떻게 하나요?', a: 'Dashboard → Tracking 페이지에서 B/L 번호 또는 Tracking 번호를 입력하면 실시간 위치와 예상 도착 시간을 확인할 수 있습니다.', category: '선적' },
  { q: '견적은 어떻게 요청하나요?', a: '메인 대시보드의 "New Quote" 버튼을 클릭하고 출발지, 도착지, 화물 정보를 입력하면 자동으로 최적 운임이 산출됩니다.', category: '선적' },
  { q: 'HS Code를 모르는 경우 어떻게 하나요?', a: '무료 도구 > HS Code 조회 페이지에서 품목 설명을 입력하면 AI가 적합한 HS Code를 추천해드립니다.', category: '통관' },
  { q: '통관 서류는 어떤 것이 필요한가요?', a: '일반적으로 Commercial Invoice, Packing List, B/L(선하증권)이 필요합니다. Finance → Customs 페이지에서 서류 상태를 관리할 수 있습니다.', category: '통관' },
  { q: '인보이스는 어디서 확인하나요?', a: 'Finance → Overview 페이지에서 모든 청구서를 확인하고 PDF로 다운로드할 수 있습니다.', category: '결제' },
  { q: '결제 수단은 어떤 것이 있나요?', a: '신용카드, 계좌이체, 후불 결제(승인 후)를 지원합니다. Settings → Payment Methods에서 설정할 수 있습니다.', category: '결제' },
  { q: 'API 키는 어떻게 발급받나요?', a: 'Settings → API Keys에서 새 키를 생성할 수 있습니다. Developer Portal에서 상세 가이드를 확인하세요.', category: 'API' },
  { q: 'Webhook은 어떻게 설정하나요?', a: 'Developer Portal → Webhook Events에서 수신할 이벤트를 선택하고 엔드포인트 URL을 등록하면 됩니다.', category: 'API' },
];

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved';
  category: string;
  updated: string;
}

const TICKETS: Ticket[] = [
  { id: 'TK-2026-001', subject: 'SH-2026-0042 선적 지연 문의', status: 'in-progress', category: '선적', updated: '2시간 전' },
  { id: 'TK-2026-002', subject: 'API rate limit 초과 이슈', status: 'open', category: 'API', updated: '5시간 전' },
  { id: 'TK-2026-003', subject: '인보이스 금액 불일치', status: 'resolved', category: '결제', updated: '1일 전' },
  { id: 'TK-2026-004', subject: '통관 서류 반려 재제출', status: 'resolved', category: '통관', updated: '3일 전' },
];

const CATEGORIES = ['전체', '선적', '통관', '결제', 'API'];

const STATUS_STYLE: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  open: { label: '접수', bg: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  'in-progress': { label: '처리 중', bg: 'bg-blue-100 text-blue-700', icon: Clock },
  resolved: { label: '완료', bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  '선적': Ship,
  '통관': FileText,
  '결제': CreditCard,
  API: Code2,
};

const CONTACT_CARDS = [
  { label: '이메일', detail: 'support@loginexus.com', desc: '영업일 기준 24시간 내 답변', icon: Mail, color: 'from-blue-500 to-indigo-500' },
  { label: '전화', detail: '1588-0000', desc: '평일 09:00 – 18:00 (KST)', icon: Phone, color: 'from-emerald-500 to-teal-500' },
  { label: '라이브 채팅', detail: '실시간 상담', desc: '평균 응답 시간 2분', icon: MessageSquare, color: 'from-violet-500 to-purple-500' },
];

/* ───── component ───── */

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaq = FAQ.filter((f) => {
    const matchCat = category === '전체' || f.category === category;
    const matchSearch = search === '' || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* header */}
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <LifeBuoy className="h-4 w-4" /> Help Center
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">고객 지원 센터</h1>
        <p className="mt-1 text-gray-500">무엇이든 물어보세요 — LogiNexus 팀이 도와드립니다</p>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="질문을 검색하세요..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* contact cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CONTACT_CARDS.map((c) => (
          <div key={c.label} className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.label}</p>
              <p className="text-sm font-medium text-blue-600">{c.detail}</p>
              <p className="text-xs text-gray-500">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-blue-500" /> 자주 묻는 질문
          </h2>
        </div>

        {/* category filter */}
        <div className="mt-3 flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors
                ${category === c
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* accordion */}
        <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
          {filteredFaq.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-500">검색 결과가 없습니다</p>
          )}
          {filteredFaq.map((f, idx) => {
            const Icon = CATEGORY_ICON[f.category] || HelpCircle;
            const isOpen = openFaq === idx;
            return (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{f.q}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="bg-blue-50/50 px-12 py-3 text-sm leading-relaxed text-gray-600 dark:bg-gray-750 dark:text-gray-300">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* recent tickets */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <MessageSquare className="h-5 w-5 text-violet-500" /> 최근 지원 요청
        </h2>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700">
                <th className="px-5 py-3 font-medium">티켓번호</th>
                <th className="px-5 py-3 font-medium">제목</th>
                <th className="px-5 py-3 font-medium">카테고리</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium text-right">업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {TICKETS.map((t) => {
                const st = STATUS_STYLE[t.status];
                return (
                  <tr key={t.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-5 py-3 font-mono text-xs text-blue-600">{t.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{t.subject}</td>
                    <td className="px-5 py-3 text-gray-500">{t.category}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg}`}>
                        <st.icon className="h-3 w-3" /> {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-gray-500">{t.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* contact form */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📨 새 문의하기</h2>
        <p className="mt-1 text-sm text-gray-500">아래 양식을 작성하시면 담당자가 빠르게 회신드립니다</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">이름</label>
            <input
              placeholder="홍길동"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">이메일</label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">카테고리</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option>선적 관련</option>
              <option>통관 관련</option>
              <option>결제 관련</option>
              <option>API / 기술 지원</option>
              <option>기타</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">메시지</label>
            <textarea
              rows={4}
              placeholder="문의 내용을 입력하세요..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        <button className="mt-5 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700">
          문의 보내기
        </button>
      </section>
    </div>
  );
}
