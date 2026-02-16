'use client';

import React, { useState, useMemo } from 'react';
import { Layers, Package, ArrowRight, CheckCircle2, DollarSign, TrendingDown } from 'lucide-react';

/* ───── Mock LCL Orders ───── */

interface LclOrder {
  id: string;
  poNumber: string;
  origin: string;
  destination: string;
  cbm: number;
  weightKg: number;
  items: string;
  readyDate: string;
  selected: boolean;
}

const MOCK_LCL: LclOrder[] = [
  { id: '1', poNumber: 'PO-2026-002', origin: 'Tokyo', destination: 'Busan', cbm: 3.2, weightKg: 1200, items: 'Bearing Assembly', readyDate: '2026-03-01', selected: false },
  { id: '2', poNumber: 'PO-2026-005', origin: 'Osaka', destination: 'Busan', cbm: 2.1, weightKg: 800, items: 'Industrial Adhesive', readyDate: '2026-03-05', selected: false },
  { id: '3', poNumber: 'PO-2026-009', origin: 'Nagoya', destination: 'Busan', cbm: 4.5, weightKg: 2200, items: 'Auto Parts', readyDate: '2026-03-03', selected: false },
  { id: '4', poNumber: 'PO-2026-010', origin: 'Shanghai', destination: 'Busan', cbm: 6.8, weightKg: 3500, items: 'Electronics', readyDate: '2026-03-02', selected: false },
  { id: '5', poNumber: 'PO-2026-011', origin: 'Shanghai', destination: 'Busan', cbm: 2.3, weightKg: 900, items: 'Textile', readyDate: '2026-03-04', selected: false },
  { id: '6', poNumber: 'PO-2026-012', origin: 'Ningbo', destination: 'Busan', cbm: 5.1, weightKg: 2800, items: 'Machinery Parts', readyDate: '2026-03-01', selected: false },
];

const FCL_CAPACITY = { '20ft': 33, '40ft': 67, '40HQ': 76 };

/* ───── Page ───── */

export default function ConsolidationPage() {
  const [orders, setOrders] = useState(MOCK_LCL);
  const [containerType, setContainerType] = useState<'20ft' | '40ft' | '40HQ'>('40ft');

  const selected = orders.filter((o) => o.selected);
  const totalCbm = selected.reduce((s, o) => s + o.cbm, 0);
  const totalWeight = selected.reduce((s, o) => s + o.weightKg, 0);
  const capacity = FCL_CAPACITY[containerType];
  const utilization = Math.min((totalCbm / capacity) * 100, 100);

  // Simulated costs
  const lclCostPerCbm = 85; // USD per CBM (LCL rate)
  const fclCost: Record<string, number> = { '20ft': 1200, '40ft': 2100, '40HQ': 2400 };
  const lclTotal = totalCbm * lclCostPerCbm;
  const fclTotal = fclCost[containerType];
  const savings = lclTotal - fclTotal;
  const savingsPercent = lclTotal > 0 ? (savings / lclTotal) * 100 : 0;

  const toggleOrder = (id: string) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o)));

  const selectAll = () => setOrders((prev) => prev.map((o) => ({ ...o, selected: true })));
  const clearAll = () => setOrders((prev) => prev.map((o) => ({ ...o, selected: false })));

  // Group by origin for consolidation insight
  const groups = useMemo(() => {
    const g: Record<string, LclOrder[]> = {};
    selected.forEach((o) => {
      if (!g[o.origin]) g[o.origin] = [];
      g[o.origin].push(o);
    });
    return g;
  }, [selected]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Buyer&apos;s Consolidation</h1>
        <p className="text-sm text-slate-500 mt-1">LCL 화물을 FCL로 혼적하여 운송 비용을 최적화합니다</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left — Order List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 text-sm">혼적 가능한 발주 ({orders.length})</h3>
            <div className="flex gap-2 text-xs">
              <button onClick={selectAll} className="text-blue-600 hover:underline">전체 선택</button>
              <button onClick={clearAll} className="text-slate-400 hover:underline">초기화</button>
            </div>
          </div>
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => toggleOrder(order.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  order.selected
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  order.selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {order.selected && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{order.poNumber}</span>
                    <span className="text-xs text-slate-400">{order.items}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {order.origin} → {order.destination} · Ready: {order.readyDate}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-900">{order.cbm} CBM</div>
                  <div className="text-xs text-slate-400">{order.weightKg.toLocaleString()} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Consolidation Result */}
        <div className="space-y-4">
          {/* Container Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">컨테이너 타입</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FCL_CAPACITY) as Array<keyof typeof FCL_CAPACITY>).map((t) => (
                <button
                  key={t}
                  onClick={() => setContainerType(t)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    containerType === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Utilization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">적재율</h3>
              <span className="text-xs text-slate-400">{totalCbm.toFixed(1)} / {capacity} CBM</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilization > 90 ? 'bg-emerald-500' : utilization > 60 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${utilization}%` }}
              />
            </div>
            <div className="text-right text-sm font-bold text-slate-900">{utilization.toFixed(1)}%</div>
            {selected.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">← 왼쪽에서 발주를 선택하세요</p>
            )}
          </div>

          {/* Cost Comparison */}
          {selected.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2"><DollarSign size={16} /> 비용 비교</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">LCL 개별 운송</span>
                  <span className="text-sm font-semibold text-slate-900">${lclTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">FCL 혼적 ({containerType})</span>
                  <span className="text-sm font-semibold text-blue-600">${fclTotal.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  {savings > 0 ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1"><TrendingDown size={14} /> 절감 비용</span>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">${savings.toLocaleString()}</span>
                        <span className="text-xs text-emerald-500 ml-1">({savingsPercent.toFixed(0)}%↓)</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600">⚠ 선택된 물량에서는 LCL이 더 경제적입니다</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Origin Groups */}
          {Object.keys(groups).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2"><Layers size={16} /> 출발지별 그룹</h3>
              <div className="space-y-2">
                {Object.entries(groups).map(([origin, items]) => (
                  <div key={origin} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">{origin}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {items.length}건 · {items.reduce((s, i) => s + i.cbm, 0).toFixed(1)} CBM
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {selected.length > 0 && utilization >= 50 && (
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              혼적 부킹 요청 <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
