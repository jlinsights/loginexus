'use client';

import React, { useState } from 'react';
import {
  Code2, Key, Webhook, Gauge, Copy, Check, ExternalLink,
  Terminal, ChevronRight, Shield, Zap, BookOpen,
} from 'lucide-react';

/* ───── types ───── */

type Endpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  desc: string;
  auth: boolean;
};

type WebhookEvent = {
  event: string;
  desc: string;
  payload: string;
};

/* ───── data ───── */

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/v1/shipments', desc: '전체 선적 목록 조회', auth: true },
  { method: 'GET', path: '/v1/shipments/:id', desc: '선적 상세 조회', auth: true },
  { method: 'POST', path: '/v1/shipments', desc: '새 선적 생성', auth: true },
  { method: 'PUT', path: '/v1/shipments/:id', desc: '선적 정보 수정', auth: true },
  { method: 'GET', path: '/v1/tracking/:trackingNo', desc: '실시간 추적 조회', auth: true },
  { method: 'GET', path: '/v1/rates/ocean', desc: '해상 운임 시세 조회', auth: true },
  { method: 'GET', path: '/v1/rates/air', desc: '항공 운임 시세 조회', auth: true },
  { method: 'POST', path: '/v1/bookings', desc: '부킹 요청 생성', auth: true },
  { method: 'GET', path: '/v1/customs/:id', desc: '통관 상태 조회', auth: true },
  { method: 'POST', path: '/v1/documents/upload', desc: '선적 서류 업로드', auth: true },
];

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { event: 'shipment.created', desc: '새 선적 생성 시', payload: '{ shipmentId, origin, destination, etd }' },
  { event: 'shipment.departed', desc: '출항 확인 시', payload: '{ shipmentId, vessel, actualDeparture }' },
  { event: 'shipment.arrived', desc: '도착 확인 시', payload: '{ shipmentId, port, actualArrival }' },
  { event: 'tracking.updated', desc: '선박 위치 업데이트 시', payload: '{ trackingNo, lat, lng, status }' },
  { event: 'customs.cleared', desc: '통관 완료 시', payload: '{ declarationNo, clearanceDate }' },
  { event: 'invoice.issued', desc: '청구서 발행 시', payload: '{ invoiceId, amount, currency }' },
];

const CODE_SAMPLES: Record<string, string> = {
  cURL: `curl -X GET "https://api.loginexus.com/v1/shipments" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,

  Python: `import requests

response = requests.get(
    "https://api.loginexus.com/v1/shipments",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    }
)
shipments = response.json()`,

  'Node.js': `const res = await fetch(
  "https://api.loginexus.com/v1/shipments",
  {
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json",
    },
  }
);
const shipments = await res.json();`,
};

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-400',
  PUT: 'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-red-500/15 text-red-400',
};

/* ───── page ───── */

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState<string>('cURL');
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-indigo-400 mb-2">
          <Code2 size={16} /> Developer Portal
        </div>
        <h1 className="text-3xl font-bold text-slate-900">LogiNexus API</h1>
        <p className="text-slate-500 mt-1">RESTful API로 물류 데이터를 연동하세요</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'API 버전', value: 'v1.4.2', icon: Zap, color: 'text-indigo-500 bg-indigo-50' },
          { label: '엔드포인트', value: `${ENDPOINTS.length}개`, icon: Code2, color: 'text-emerald-500 bg-emerald-50' },
          { label: '인증 방식', value: 'Bearer Token', icon: Key, color: 'text-amber-500 bg-amber-50' },
          { label: 'Rate Limit', value: '1,000 req/min', icon: Gauge, color: 'text-rose-500 bg-rose-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <span className="text-sm text-slate-500">{s.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Authentication */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">인증 (Authentication)</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          모든 API 요청에는 <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Authorization: Bearer YOUR_API_KEY</code> 헤더가 필요합니다.
          Settings → API Keys에서 키를 생성하세요.
        </p>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> OAuth 2.0 지원</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" /> HMAC 서명 검증</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> IP 화이트리스트</div>
        </div>
      </section>

      {/* API Reference */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <BookOpen size={20} className="text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">API 엔드포인트 레퍼런스</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {ENDPOINTS.map((ep) => (
            <div key={ep.method + ep.path} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md w-16 text-center ${METHOD_COLOR[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono text-slate-700 flex-1">{ep.path}</code>
              <span className="text-sm text-slate-400 hidden md:block">{ep.desc}</span>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          ))}
        </div>
      </section>

      {/* Code Samples */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">코드 샘플</h2>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            {Object.keys(CODE_SAMPLES).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <pre className="p-6 text-sm font-mono text-slate-300 bg-slate-900 overflow-x-auto leading-relaxed">
            {CODE_SAMPLES[activeTab]}
          </pre>
          <button
            onClick={() => copy(CODE_SAMPLES[activeTab])}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-slate-400" />}
          </button>
        </div>
      </section>

      {/* Webhooks */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Webhook size={20} className="text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">Webhook 이벤트</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {WEBHOOK_EVENTS.map((wh) => (
            <div key={wh.event} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <code className="text-sm font-mono font-bold text-indigo-600">{wh.event}</code>
                <span className="text-xs text-slate-400">{wh.desc}</span>
              </div>
              <pre className="text-xs text-slate-400 font-mono bg-slate-50 rounded-lg px-3 py-2 mt-1">{wh.payload}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* Rate Limits */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={20} className="text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-800">Rate Limits & 사용량</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { plan: 'Free', limit: '100 req/min', daily: '5,000/일', color: 'border-slate-300' },
            { plan: 'Pro', limit: '1,000 req/min', daily: '100,000/일', color: 'border-indigo-400' },
            { plan: 'Enterprise', limit: 'Unlimited', daily: 'Unlimited', color: 'border-amber-400' },
          ].map((p) => (
            <div key={p.plan} className={`rounded-xl border-2 ${p.color} p-4`}>
              <div className="text-sm font-bold text-slate-700 mb-2">{p.plan}</div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{p.limit}</div>
              <div className="text-xs text-slate-400">{p.daily}</div>
            </div>
          ))}
        </div>
        {/* Usage bar mock */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>오늘 사용량</span>
            <span>2,847 / 5,000</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: '57%' }} />
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-bold mb-2">공식 SDK</h2>
        <p className="text-indigo-200 text-sm mb-4">주요 언어별 공식 SDK를 제공합니다.</p>
        <div className="flex flex-wrap gap-3">
          {['Python', 'Node.js', 'Java', 'Go', 'PHP', 'Ruby'].map((lang) => (
            <a key={lang} href="#" className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors">
              {lang} <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
