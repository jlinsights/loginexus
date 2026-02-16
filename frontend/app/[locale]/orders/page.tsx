'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Search, Filter, ChevronRight,
  Package, Clock, CheckCircle2, Truck, AlertTriangle,
} from 'lucide-react';

/* ───── Types & Mock Data ───── */

type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  poNumber: string;
  supplier: string;
  supplierCountry: string;
  items: string;
  qty: number;
  totalUsd: number;
  status: OrderStatus;
  createdAt: string;
  eta: string;
  shipmentRef?: string;
}

const MOCK_ORDERS: Order[] = [
  { id: '1', poNumber: 'PO-2026-001', supplier: 'Shenzhen Electronics Co.', supplierCountry: '🇨🇳 CN', items: 'LCD Monitor 27" × 500', qty: 500, totalUsd: 87500, status: 'shipped', createdAt: '2026-01-15', eta: '2026-02-28', shipmentRef: 'SH-2026-0042' },
  { id: '2', poNumber: 'PO-2026-002', supplier: 'Tokyo Precision Parts', supplierCountry: '🇯🇵 JP', items: 'Bearing Assembly × 2000', qty: 2000, totalUsd: 34000, status: 'confirmed', createdAt: '2026-01-20', eta: '2026-03-10' },
  { id: '3', poNumber: 'PO-2026-003', supplier: 'Vietnam Textile Ltd.', supplierCountry: '🇻🇳 VN', items: 'Cotton Fabric Roll × 300', qty: 300, totalUsd: 22500, status: 'delivered', createdAt: '2026-01-05', eta: '2026-02-10', shipmentRef: 'SH-2026-0038' },
  { id: '4', poNumber: 'PO-2026-004', supplier: 'Bangkok Rubber Corp.', supplierCountry: '🇹🇭 TH', items: 'Natural Rubber Sheet × 1000', qty: 1000, totalUsd: 45000, status: 'draft', createdAt: '2026-02-10', eta: '2026-04-01' },
  { id: '5', poNumber: 'PO-2026-005', supplier: 'Osaka Chemical Ind.', supplierCountry: '🇯🇵 JP', items: 'Industrial Adhesive × 800', qty: 800, totalUsd: 16000, status: 'confirmed', createdAt: '2026-02-01', eta: '2026-03-15' },
  { id: '6', poNumber: 'PO-2026-006', supplier: 'Guangzhou Auto Parts', supplierCountry: '🇨🇳 CN', items: 'Brake Pad Set × 5000', qty: 5000, totalUsd: 125000, status: 'shipped', createdAt: '2026-01-28', eta: '2026-03-05', shipmentRef: 'SH-2026-0051' },
  { id: '7', poNumber: 'PO-2026-007', supplier: 'Mumbai Spice Traders', supplierCountry: '🇮🇳 IN', items: 'Saffron 50kg', qty: 50, totalUsd: 175000, status: 'cancelled', createdAt: '2026-01-12', eta: '-' },
  { id: '8', poNumber: 'PO-2026-008', supplier: 'Berlin Machinery GmbH', supplierCountry: '🇩🇪 DE', items: 'CNC Milling Head × 10', qty: 10, totalUsd: 320000, status: 'draft', createdAt: '2026-02-14', eta: '2026-05-01' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: ClipboardList },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
  shipped: { label: 'Shipped', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
};

const STATUS_FILTERS: (OrderStatus | 'all')[] = ['all', 'draft', 'confirmed', 'shipped', 'delivered', 'cancelled'];

/* ───── Page ───── */

export default function OrdersPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = useMemo(() => {
    let items = MOCK_ORDERS;
    if (statusFilter !== 'all') items = items.filter((o) => o.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (o) =>
          o.poNumber.toLowerCase().includes(q) ||
          o.supplier.toLowerCase().includes(q) ||
          o.items.toLowerCase().includes(q)
      );
    }
    return items;
  }, [query, statusFilter]);

  // Summary stats
  const stats = useMemo(() => ({
    total: MOCK_ORDERS.length,
    draft: MOCK_ORDERS.filter((o) => o.status === 'draft').length,
    confirmed: MOCK_ORDERS.filter((o) => o.status === 'confirmed').length,
    inTransit: MOCK_ORDERS.filter((o) => o.status === 'shipped').length,
    delivered: MOCK_ORDERS.filter((o) => o.status === 'delivered').length,
  }), []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Order Management</h1>
          <p className="text-sm text-slate-500 mt-1">발주 생성부터 선적, 도착까지 전 과정을 관리합니다</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-sm text-sm font-medium"
        >
          <Plus size={16} /> 신규 발주
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Orders', value: stats.total, color: 'bg-slate-900' },
          { label: 'Draft', value: stats.draft, color: 'bg-slate-500' },
          { label: 'Confirmed', value: stats.confirmed, color: 'bg-blue-500' },
          { label: 'In Transit', value: stats.inTransit, color: 'bg-orange-500' },
          { label: 'Delivered', value: stats.delivered, color: 'bg-emerald-500' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} text-white rounded-xl p-4 shadow-sm`}>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* New Order Form Placeholder */}
      {showNewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">🚀 신규 발주 작성</h3>
          <p className="text-sm text-blue-700">발주서 작성 기능은 추후 백엔드 API 연동 시 활성화됩니다. 현재는 데모 데이터를 기반으로 표시됩니다.</p>
          <button onClick={() => setShowNewForm(false)} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">닫기</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="PO번호, 공급자, 품목 검색..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-5 text-left">PO #</th>
                <th className="py-3.5 px-5 text-left">Supplier</th>
                <th className="py-3.5 px-5 text-left">Items</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-center">ETA</th>
                <th className="py-3.5 px-5 text-center">Shipment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">검색 결과가 없습니다</td></tr>
              ) : (
                filtered.map((order) => {
                  const sc = STATUS_CONFIG[order.status];
                  const Ic = sc.icon;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{order.poNumber}</td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-800">{order.supplier}</div>
                        <div className="text-xs text-slate-400">{order.supplierCountry}</div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 max-w-[200px] truncate">{order.items}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-slate-900">${order.totalUsd.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>
                          <Ic size={12} /> {sc.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center text-slate-500">{order.eta}</td>
                      <td className="py-3.5 px-5 text-center">
                        {order.shipmentRef ? (
                          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-lg">{order.shipmentRef}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Lifecycle */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock size={18} /> Order Lifecycle</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['draft', 'confirmed', 'shipped', 'delivered'] as OrderStatus[]).map((s, i) => {
            const sc = STATUS_CONFIG[s];
            const Ic = sc.icon;
            return (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 min-w-[140px]">
                  <Ic size={18} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{sc.label}</div>
                    <div className="text-xs text-slate-400">{MOCK_ORDERS.filter((o) => o.status === s).length} orders</div>
                  </div>
                </div>
                {i < 3 && <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
