'use client';

import React, { useState } from 'react';
import {
  Banknote, Clock, CheckCircle2, AlertCircle,
  FileText, TrendingUp,
  Filter,
} from 'lucide-react';

/* ───── Types & Data ───── */

type FinanceStatus = 'applied' | 'approved' | 'disbursed' | 'repaid' | 'rejected';
type PaymentTerm = 'LC' | 'TT' | 'DA' | 'DP';

interface TradeFinanceItem {
  id: string;
  referenceNo: string;
  type: PaymentTerm;
  supplier: string;
  amount: number;
  currency: string;
  status: FinanceStatus;
  appliedAt: string;
  dueDate: string;
  interestRate: number;
  shipmentRef?: string;
}

const MOCK_FINANCE: TradeFinanceItem[] = [
  { id: '1', referenceNo: 'TF-2026-001', type: 'LC', supplier: 'Shenzhen Electronics Co.', amount: 87500, currency: 'USD', status: 'disbursed', appliedAt: '2026-01-10', dueDate: '2026-04-10', interestRate: 3.5, shipmentRef: 'SH-2026-0042' },
  { id: '2', referenceNo: 'TF-2026-002', type: 'TT', supplier: 'Berlin Machinery GmbH', amount: 320000, currency: 'USD', status: 'approved', appliedAt: '2026-02-10', dueDate: '2026-05-10', interestRate: 2.8 },
  { id: '3', referenceNo: 'TF-2026-003', type: 'DA', supplier: 'Bangkok Rubber Corp.', amount: 45000, currency: 'USD', status: 'applied', appliedAt: '2026-02-28', dueDate: '2026-05-28', interestRate: 4.2 },
  { id: '4', referenceNo: 'TF-2026-004', type: 'LC', supplier: 'Guangzhou Auto Parts', amount: 125000, currency: 'USD', status: 'repaid', appliedAt: '2025-11-15', dueDate: '2026-02-15', interestRate: 3.0, shipmentRef: 'SH-2026-0051' },
  { id: '5', referenceNo: 'TF-2026-005', type: 'DP', supplier: 'Mumbai Spice Traders', amount: 175000, currency: 'USD', status: 'rejected', appliedAt: '2026-01-08', dueDate: '-', interestRate: 0 },
];

const STATUS_MAP: Record<FinanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  applied: { label: '신청', color: 'bg-slate-100 text-slate-700', icon: Clock },
  approved: { label: '승인', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  disbursed: { label: '집행', color: 'bg-emerald-100 text-emerald-700', icon: Banknote },
  repaid: { label: '상환', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const TERM_INFO: Record<PaymentTerm, { full: string; desc: string; risk: string; color: string }> = {
  LC: { full: 'Letter of Credit', desc: '은행이 대금 결제를 보증하는 가장 안전한 방식', risk: '낮음', color: 'bg-blue-500' },
  TT: { full: 'Telegraphic Transfer', desc: '전신환 송금. 사전·사후 T/T로 구분', risk: '중간', color: 'bg-emerald-500' },
  DA: { full: 'Documents against Acceptance', desc: '인수인도조건. 환어음 인수 시 서류 교부', risk: '높음', color: 'bg-amber-500' },
  DP: { full: 'Documents against Payment', desc: '지급인도조건. 대금 지급 시 서류 교부', risk: '중간', color: 'bg-purple-500' },
};

/* ───── Page ───── */

export default function TradeFinancePage() {
  const [statusFilter, setStatusFilter] = useState<FinanceStatus | 'all'>('all');

  const filtered = statusFilter === 'all' ? MOCK_FINANCE : MOCK_FINANCE.filter((f) => f.status === statusFilter);

  const totalOutstanding = MOCK_FINANCE.filter((f) => f.status === 'disbursed').reduce((s, f) => s + f.amount, 0);
  const totalApproved = MOCK_FINANCE.filter((f) => f.status === 'approved').reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Trade Finance</h1>
          <p className="text-sm text-slate-500 mt-1">수입 대금 결제 · 여신 관리 및 결제 조건 비교</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-sm text-sm font-medium">
          <FileText size={16} /> 여신 신청
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-500 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Outstanding</div>
          <div className="text-2xl font-bold mt-1">${(totalOutstanding / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-blue-500 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Approved</div>
          <div className="text-2xl font-bold mt-1">${(totalApproved / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Transactions</div>
          <div className="text-2xl font-bold mt-1">{MOCK_FINANCE.length}</div>
        </div>
        <div className="bg-amber-500 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Avg. Rate</div>
          <div className="text-2xl font-bold mt-1">{(MOCK_FINANCE.filter((f) => f.interestRate > 0).reduce((s, f) => s + f.interestRate, 0) / MOCK_FINANCE.filter((f) => f.interestRate > 0).length).toFixed(1)}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        <Filter size={14} className="text-slate-400" />
        {(['all', 'applied', 'approved', 'disbursed', 'repaid', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_MAP[s].label}
          </button>
        ))}
      </div>

      {/* Finance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-5 text-left">Ref #</th>
                <th className="py-3.5 px-5 text-center">Type</th>
                <th className="py-3.5 px-5 text-left">Supplier</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
                <th className="py-3.5 px-5 text-center">Rate</th>
                <th className="py-3.5 px-5 text-center">Due</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f) => {
                const sc = STATUS_MAP[f.status];
                const Ic = sc.icon;
                const term = TERM_INFO[f.type];
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{f.referenceNo}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block ${term.color} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>{f.type}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">{f.supplier}</td>
                    <td className="py-3.5 px-5 text-right font-bold text-slate-900">${f.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center text-slate-600">{f.interestRate > 0 ? `${f.interestRate}%` : '—'}</td>
                    <td className="py-3.5 px-5 text-center text-slate-500">{f.dueDate}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
                        <Ic size={12} /> {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Term Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={18} /> 결제 조건 비교</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(TERM_INFO) as [PaymentTerm, typeof TERM_INFO[PaymentTerm]][]).map(([key, info]) => (
            <div key={key} className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className={`${info.color} text-white text-xs font-bold px-2.5 py-1 rounded`}>{key}</span>
                <span className="text-sm font-semibold text-slate-900">{info.full}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{info.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">수입자 위험</span>
                <span className={`text-xs font-semibold ${
                  info.risk === '낮음' ? 'text-emerald-600' : info.risk === '높음' ? 'text-red-600' : 'text-amber-600'
                }`}>{info.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
