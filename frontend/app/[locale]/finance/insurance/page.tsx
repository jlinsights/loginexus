'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield, Calculator,
  Package, DollarSign, Plus,
} from 'lucide-react';

/* ───── Types & Data ───── */

type PolicyStatus = 'active' | 'pending' | 'expired' | 'claimed';

interface Policy {
  id: string;
  policyNo: string;
  shipmentRef: string;
  cargoDesc: string;
  cargoValue: number;
  premium: number;
  coverage: string;
  status: PolicyStatus;
  validFrom: string;
  validTo: string;
  insurer: string;
}

const MOCK_POLICIES: Policy[] = [
  { id: '1', policyNo: 'INS-2026-0042', shipmentRef: 'SH-2026-0042', cargoDesc: 'LCD Monitor 27" × 500', cargoValue: 87500, premium: 263, coverage: 'ICC(A) - All Risks', status: 'active', validFrom: '2026-01-15', validTo: '2026-03-15', insurer: 'Samsung Fire & Marine' },
  { id: '2', policyNo: 'INS-2026-0051', shipmentRef: 'SH-2026-0051', cargoDesc: 'Brake Pad Set × 5000', cargoValue: 125000, premium: 375, coverage: 'ICC(A) - All Risks', status: 'active', validFrom: '2026-01-28', validTo: '2026-04-01', insurer: 'Hyundai Marine & Fire' },
  { id: '3', policyNo: 'INS-2026-0038', shipmentRef: 'SH-2026-0038', cargoDesc: 'Cotton Fabric Roll × 300', cargoValue: 22500, premium: 68, coverage: 'ICC(B) - Named Perils', status: 'expired', validFrom: '2026-01-05', validTo: '2026-02-28', insurer: 'DB Insurance' },
  { id: '4', policyNo: 'INS-2026-0060', shipmentRef: 'SH-2026-0060', cargoDesc: 'CNC Milling Head × 10', cargoValue: 320000, premium: 1280, coverage: 'ICC(A) - All Risks + War', status: 'pending', validFrom: '2026-03-01', validTo: '2026-06-01', insurer: 'Samsung Fire & Marine' },
];

const STATUS_CONFIG: Record<PolicyStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  expired: { label: 'Expired', color: 'bg-slate-100 text-slate-500' },
  claimed: { label: 'Claimed', color: 'bg-red-100 text-red-700' },
};

const COVERAGE_TYPES = [
  { name: 'ICC(A) - All Risks', desc: '전위험 담보. 거의 모든 손해를 보상합니다.', rate: 0.30 },
  { name: 'ICC(B) - Named Perils', desc: '열거위험 담보. 화재, 폭발, 좌초, 침몰 등을 보상합니다.', rate: 0.20 },
  { name: 'ICC(C) - Minimum', desc: '최소 담보. 화재, 폭발, 좌초, 침몰만 보상합니다.', rate: 0.12 },
  { name: 'ICC(A) + War', desc: '전위험 + 전쟁위험 담보.', rate: 0.40 },
];

/* ───── Page ───── */

export default function InsurancePage() {
  const [showCalc, setShowCalc] = useState(false);
  const [cargoValue, setCargoValue] = useState('100000');
  const [selectedCoverage, setSelectedCoverage] = useState(COVERAGE_TYPES[0].name);

  const coverageRate = COVERAGE_TYPES.find((c) => c.name === selectedCoverage)?.rate || 0.3;

  const calcResult = useMemo(() => {
    const val = Number(cargoValue) || 0;
    const insuredValue = val * 1.1; // CIF + 10%
    const premium = (insuredValue * coverageRate) / 100;
    return { insuredValue, premium, rate: coverageRate };
  }, [cargoValue, coverageRate]);

  const totalActiveCoverage = MOCK_POLICIES.filter((p) => p.status === 'active').reduce((s, p) => s + p.cargoValue, 0);
  const totalPremiums = MOCK_POLICIES.filter((p) => p.status === 'active').reduce((s, p) => s + p.premium, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Cargo Insurance</h1>
          <p className="text-sm text-slate-500 mt-1">화물 보험 가입 및 증서를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowCalc(!showCalc)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-sm text-sm font-medium"
        >
          <Plus size={16} /> 보험 가입
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-500 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Active Policies</div>
          <div className="text-2xl font-bold mt-1">{MOCK_POLICIES.filter((p) => p.status === 'active').length}</div>
        </div>
        <div className="bg-blue-500 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Coverage</div>
          <div className="text-2xl font-bold mt-1">${(totalActiveCoverage / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Premiums</div>
          <div className="text-2xl font-bold mt-1">${totalPremiums.toLocaleString()}</div>
        </div>
        <div className="bg-amber-500 text-white rounded-xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Pending</div>
          <div className="text-2xl font-bold mt-1">{MOCK_POLICIES.filter((p) => p.status === 'pending').length}</div>
        </div>
      </div>

      {/* Premium Calculator */}
      {showCalc && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Calculator size={18} /> 보험료 계산기</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">화물 가액 (USD)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={cargoValue}
                  onChange={(e) => setCargoValue(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">담보 조건</label>
              <select
                value={selectedCoverage}
                onChange={(e) => setSelectedCoverage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COVERAGE_TYPES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.rate}%)</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500">보험가액 (CIF+10%)</div>
                <div className="font-bold text-slate-900">${calcResult.insuredValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">요율</div>
                <div className="font-bold text-slate-900">{calcResult.rate}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">예상 보험료</div>
                <div className="font-bold text-blue-600 text-lg">${calcResult.premium.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
            보험 가입 신청
          </button>
        </div>
      )}

      {/* Policy Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-5 text-left">증서번호</th>
                <th className="py-3.5 px-5 text-left">화물</th>
                <th className="py-3.5 px-5 text-right">화물가액</th>
                <th className="py-3.5 px-5 text-center">담보</th>
                <th className="py-3.5 px-5 text-right">보험료</th>
                <th className="py-3.5 px-5 text-center">상태</th>
                <th className="py-3.5 px-5 text-left">보험사</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_POLICIES.map((p) => {
                const sc = STATUS_CONFIG[p.status];
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{p.policyNo}</td>
                    <td className="py-3.5 px-5">
                      <div className="text-slate-800">{p.cargoDesc}</div>
                      <div className="text-xs text-slate-400">{p.shipmentRef}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-semibold text-slate-900">${p.cargoValue.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center text-xs text-slate-500">{p.coverage}</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-blue-600">${p.premium.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">{p.insurer}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coverage Guide */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield size={18} /> 담보 조건 안내</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {COVERAGE_TYPES.map((c) => (
            <div key={c.name} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
              <Package size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
                <div className="text-xs text-blue-600 font-semibold mt-1">요율: {c.rate}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
