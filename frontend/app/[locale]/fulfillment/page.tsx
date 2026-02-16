'use client';

import React, { useState } from 'react';
import {
  Warehouse, Package, RotateCcw, MapPin, Search,
  ArrowRight, CheckCircle2, Clock, Truck, ShoppingCart,
  Filter, TrendingUp,
} from 'lucide-react';

/* ───── mock data ───── */

const WAREHOUSE_STATS = [
  { name: '인천 (KR)', capacity: 12000, used: 8400, orders: 142, color: 'bg-blue-500' },
  { name: '도쿄 (JP)', capacity: 8000, used: 5600, orders: 89, color: 'bg-rose-500' },
  { name: '상하이 (CN)', capacity: 15000, used: 11200, orders: 215, color: 'bg-amber-500' },
  { name: 'LA (US)', capacity: 10000, used: 7200, orders: 176, color: 'bg-emerald-500' },
];

type FulfillmentOrder = {
  id: string;
  orderId: string;
  channel: string;
  items: number;
  warehouse: string;
  status: 'received' | 'picking' | 'packing' | 'shipped' | 'delivered';
  updated: string;
};

const ORDERS: FulfillmentOrder[] = [
  { id: '1', orderId: 'FF-2026-8001', channel: 'Shopify', items: 3, warehouse: '인천 (KR)', status: 'shipped', updated: '2시간 전' },
  { id: '2', orderId: 'FF-2026-8002', channel: 'Coupang', items: 1, warehouse: '인천 (KR)', status: 'picking', updated: '30분 전' },
  { id: '3', orderId: 'FF-2026-8003', channel: 'Amazon', items: 5, warehouse: 'LA (US)', status: 'packing', updated: '1시간 전' },
  { id: '4', orderId: 'FF-2026-8004', channel: 'Rakuten', items: 2, warehouse: '도쿄 (JP)', status: 'delivered', updated: '5시간 전' },
  { id: '5', orderId: 'FF-2026-8005', channel: 'Shopify', items: 4, warehouse: '상하이 (CN)', status: 'received', updated: '15분 전' },
  { id: '6', orderId: 'FF-2026-8006', channel: 'Amazon', items: 1, warehouse: 'LA (US)', status: 'shipped', updated: '3시간 전' },
  { id: '7', orderId: 'FF-2026-8007', channel: 'Coupang', items: 2, warehouse: '인천 (KR)', status: 'packing', updated: '45분 전' },
  { id: '8', orderId: 'FF-2026-8008', channel: '직진입', items: 8, warehouse: '상하이 (CN)', status: 'picking', updated: '20분 전' },
];

type ReturnItem = {
  id: string;
  orderId: string;
  reason: string;
  status: 'requested' | 'received' | 'inspected' | 'refunded';
  date: string;
};

const RETURNS: ReturnItem[] = [
  { id: '1', orderId: 'FF-2026-7042', reason: '사이즈 불일치', status: 'refunded', date: '2026-02-14' },
  { id: '2', orderId: 'FF-2026-7089', reason: '파손 배송', status: 'inspected', date: '2026-02-15' },
  { id: '3', orderId: 'FF-2026-7123', reason: '단순 변심', status: 'received', date: '2026-02-16' },
  { id: '4', orderId: 'FF-2026-7156', reason: '오배송', status: 'requested', date: '2026-02-16' },
];

const STATUS_STEPS = ['received', 'picking', 'packing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  received: '접수',
  picking: '피킹',
  packing: '포장',
  shipped: '출고',
  delivered: '배송완료',
};
const STATUS_COLORS: Record<string, string> = {
  received: 'bg-slate-400',
  picking: 'bg-amber-500',
  packing: 'bg-blue-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-emerald-500',
};

const RETURN_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  received: 'bg-blue-100 text-blue-700',
  inspected: 'bg-violet-100 text-violet-700',
  refunded: 'bg-emerald-100 text-emerald-700',
};

/* ───── page ───── */

export default function FulfillmentPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const totalOrders = ORDERS.length;
  const shippedToday = ORDERS.filter((o) => o.status === 'shipped' || o.status === 'delivered').length;

  const filtered = statusFilter === 'all' ? ORDERS : ORDERS.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-orange-500 mb-2">
            <Warehouse size={16} /> Fulfillment
          </div>
          <h1 className="text-3xl font-bold text-slate-900">풀필먼트 센터</h1>
          <p className="text-slate-500 mt-1">eCommerce · B2B 주문 처리 및 창고 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors">
          <ShoppingCart size={16} /> 채널 연동
        </button>
      </div>

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {WAREHOUSE_STATS.map((w) => {
          const usage = ((w.used / w.capacity) * 100).toFixed(0);
          return (
            <div key={w.name} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${w.color} flex items-center justify-center`}>
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{w.name}</div>
                  <div className="text-xs text-slate-400">{w.orders}건 처리 중</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{w.used.toLocaleString()} / {w.capacity.toLocaleString()} CBM</span>
                <span>{usage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${w.color}`} style={{ width: `${usage}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_STEPS.map((s) => {
          const count = ORDERS.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`p-4 rounded-xl border transition-all text-center ${
                statusFilter === s
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[s]} mx-auto mb-2`} />
              <div className="text-lg font-bold text-slate-800">{count}</div>
              <div className="text-xs text-slate-500">{STATUS_LABELS[s]}</div>
            </button>
          );
        })}
      </div>

      {/* Fulfillment Pipeline */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold text-slate-800">주문 처리 현황</h2>
          </div>
          <span className="text-sm text-slate-400">{filtered.length}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-6 py-3 font-medium">주문번호</th>
                <th className="text-left px-4 py-3 font-medium">채널</th>
                <th className="text-center px-4 py-3 font-medium">수량</th>
                <th className="text-left px-4 py-3 font-medium">창고</th>
                <th className="text-left px-4 py-3 font-medium">상태</th>
                <th className="text-left px-4 py-3 font-medium">진행</th>
                <th className="text-right px-6 py-3 font-medium">업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => {
                const stepIdx = STATUS_STEPS.indexOf(o.status);
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-blue-600">{o.orderId}</td>
                    <td className="px-4 py-3 text-slate-700">{o.channel}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{o.items}</td>
                    <td className="px-4 py-3 text-slate-600">{o.warehouse}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {STATUS_STEPS.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? STATUS_COLORS[o.status] : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-slate-400">{o.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Returns */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <RotateCcw size={20} className="text-orange-500" />
          <h2 className="text-lg font-bold text-slate-800">반품 관리</h2>
          <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{RETURNS.length}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {RETURNS.map((r) => (
            <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <code className="text-sm font-mono text-blue-600">{r.orderId}</code>
              <span className="text-sm text-slate-600 flex-1">{r.reason}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RETURN_STATUS_COLORS[r.status]}`}>
                {r.status === 'requested' ? '요청' : r.status === 'received' ? '수령' : r.status === 'inspected' ? '검수' : '환불'}
              </span>
              <span className="text-xs text-slate-400">{r.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Warehouse Network */}
      <section className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={20} />
          <h2 className="text-lg font-bold">글로벌 창고 네트워크</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {WAREHOUSE_STATS.map((w) => (
            <div key={w.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">
                {w.name.includes('KR') ? '🇰🇷' : w.name.includes('JP') ? '🇯🇵' : w.name.includes('CN') ? '🇨🇳' : '🇺🇸'}
              </div>
              <div className="text-sm font-bold">{w.name}</div>
              <div className="text-xs text-slate-400 mt-1">{w.capacity.toLocaleString()} CBM</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
