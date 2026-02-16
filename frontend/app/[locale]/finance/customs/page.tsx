'use client';

import React, { useState } from 'react';
import {
  FileCheck, CheckCircle2, Clock, AlertCircle, Upload,
  ChevronRight, FileText, Shield, Package,
} from 'lucide-react';

/* ───── Mock Data ───── */

type ClearanceStatus = 'submitted' | 'reviewing' | 'approved' | 'released' | 'held';

interface Clearance {
  id: string;
  declarationNo: string;
  shipmentRef: string;
  importer: string;
  hsCode: string;
  itemDesc: string;
  dutyAmount: number;
  status: ClearanceStatus;
  submittedAt: string;
  updatedAt: string;
}

const MOCK_CLEARANCES: Clearance[] = [
  { id: '1', declarationNo: 'CD-2026-0128', shipmentRef: 'SH-2026-0042', importer: 'LogiNexus Corp.', hsCode: '8528.72', itemDesc: 'LCD Monitor 27"', dutyAmount: 2625, status: 'released', submittedAt: '2026-02-20', updatedAt: '2026-02-22' },
  { id: '2', declarationNo: 'CD-2026-0135', shipmentRef: 'SH-2026-0051', importer: 'LogiNexus Corp.', hsCode: '8708.30', itemDesc: 'Brake Pad Set', dutyAmount: 5000, status: 'approved', submittedAt: '2026-02-25', updatedAt: '2026-02-26' },
  { id: '3', declarationNo: 'CD-2026-0140', shipmentRef: 'SH-2026-0055', importer: 'LogiNexus Corp.', hsCode: '5209.42', itemDesc: 'Cotton Fabric', dutyAmount: 1800, status: 'reviewing', submittedAt: '2026-02-28', updatedAt: '2026-02-28' },
  { id: '4', declarationNo: 'CD-2026-0142', shipmentRef: 'SH-2026-0058', importer: 'LogiNexus Corp.', hsCode: '4001.10', itemDesc: 'Natural Rubber', dutyAmount: 900, status: 'submitted', submittedAt: '2026-03-01', updatedAt: '2026-03-01' },
  { id: '5', declarationNo: 'CD-2026-0099', shipmentRef: 'SH-2026-0030', importer: 'LogiNexus Corp.', hsCode: '0910.20', itemDesc: 'Saffron', dutyAmount: 14000, status: 'held', submittedAt: '2026-02-05', updatedAt: '2026-02-12' },
];

const STATUS_MAP: Record<ClearanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: '접수', color: 'bg-slate-100 text-slate-700', icon: Upload },
  reviewing: { label: '심사중', color: 'bg-blue-100 text-blue-700', icon: Clock },
  approved: { label: '승인', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  released: { label: '반출허가', color: 'bg-green-100 text-green-800', icon: Package },
  held: { label: '보류', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const DOC_CHECKLIST = [
  { name: 'Commercial Invoice (C/I)', required: true },
  { name: 'Packing List (P/L)', required: true },
  { name: 'Bill of Lading (B/L)', required: true },
  { name: 'Certificate of Origin (C/O)', required: false },
  { name: 'Insurance Certificate', required: false },
  { name: 'Inspection Certificate', required: false },
];

const TIMELINE_STEPS: { label: string; status: ClearanceStatus }[] = [
  { label: '서류 접수', status: 'submitted' },
  { label: '세관 심사', status: 'reviewing' },
  { label: '승인 완료', status: 'approved' },
  { label: '반출 허가', status: 'released' },
];

/* ───── Page ───── */

export default function CustomsPage() {
  const [selected, setSelected] = useState<Clearance | null>(null);

  const getStepIndex = (status: ClearanceStatus) => {
    if (status === 'held') return -1;
    return TIMELINE_STEPS.findIndex((s) => s.status === status);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Customs Brokerage</h1>
        <p className="text-sm text-slate-500 mt-1">통관 진행 상태를 추적하고 필요 서류를 관리합니다</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left — Clearance List */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-5 text-left">신고번호</th>
                    <th className="py-3.5 px-5 text-left">품목</th>
                    <th className="py-3.5 px-5 text-center">HS Code</th>
                    <th className="py-3.5 px-5 text-right">관세</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_CLEARANCES.map((c) => {
                    const sc = STATUS_MAP[c.status];
                    const Ic = sc.icon;
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelected(c)}
                      >
                        <td className="py-3.5 px-5 font-semibold text-slate-900">{c.declarationNo}</td>
                        <td className="py-3.5 px-5 text-slate-600">{c.itemDesc}</td>
                        <td className="py-3.5 px-5 text-center font-mono text-xs text-slate-500">{c.hsCode}</td>
                        <td className="py-3.5 px-5 text-right font-semibold text-slate-900">${c.dutyAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
                            <Ic size={12} /> {sc.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center"><ChevronRight size={14} className="text-slate-300" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right — Detail Panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2"><Clock size={16} /> 진행 상태</h3>
                <div className="space-y-3">
                  {TIMELINE_STEPS.map((step, i) => {
                    const currentIdx = getStepIndex(selected.status);
                    const isCompleted = currentIdx >= i;
                    const isCurrent = currentIdx === i;
                    return (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                        </div>
                        <span className={`text-sm ${isCompleted ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                      </div>
                    );
                  })}
                  {selected.status === 'held' && (
                    <div className="flex items-center gap-3 bg-red-50 rounded-lg px-3 py-2 mt-2">
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-xs text-red-700 font-medium">세관 보류 — 추가 서류 요청</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2"><FileText size={16} /> 서류 체크리스트</h3>
                <div className="space-y-2">
                  {DOC_CHECKLIST.map((doc) => (
                    <div key={doc.name} className="flex items-center gap-3 py-1.5">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      </div>
                      <span className="text-sm text-slate-700">{doc.name}</span>
                      {doc.required && <span className="text-[10px] bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded">필수</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2"><Shield size={16} /> 세부 정보</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    ['신고번호', selected.declarationNo],
                    ['선적 참조', selected.shipmentRef],
                    ['HS Code', selected.hsCode],
                    ['수입자', selected.importer],
                    ['신고일', selected.submittedAt],
                    ['최종 업데이트', selected.updatedAt],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-slate-400">{label}</dt>
                      <dd className="font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
              <FileCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">통관 건을 선택하면 상세 정보가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
