'use client';

import React, { useState } from 'react';
import {
  Ship, Clock, Anchor, CheckCircle2,
  ChevronRight, MapPin, Filter,
} from 'lucide-react';

/* ───── Mock Schedule Data ───── */

interface Schedule {
  id: string;
  carrier: string;
  carrierCode: string;
  vessel: string;
  voyage: string;
  origin: string;
  destination: string;
  etd: string;
  eta: string;
  transitDays: number;
  type: 'direct' | 'transshipment';
  transshipmentPort?: string;
  space: 'available' | 'limited' | 'full';
  price20ft: number;
  price40ft: number;
}

const SCHEDULES: Schedule[] = [
  { id: '1', carrier: 'HMM', carrierCode: 'HMM', vessel: 'HMM Algeciras', voyage: 'V.026E', origin: 'Busan', destination: 'Rotterdam', etd: '2026-03-05', eta: '2026-04-02', transitDays: 28, type: 'direct', space: 'available', price20ft: 1650, price40ft: 2800 },
  { id: '2', carrier: 'Maersk', carrierCode: 'MSK', vessel: 'Maersk Elba', voyage: 'M.042E', origin: 'Busan', destination: 'Rotterdam', etd: '2026-03-08', eta: '2026-04-07', transitDays: 30, type: 'transshipment', transshipmentPort: 'Singapore', space: 'available', price20ft: 1450, price40ft: 2500 },
  { id: '3', carrier: 'MSC', carrierCode: 'MSC', vessel: 'MSC Gulsun', voyage: 'G.018E', origin: 'Busan', destination: 'Rotterdam', etd: '2026-03-10', eta: '2026-04-06', transitDays: 27, type: 'direct', space: 'limited', price20ft: 1800, price40ft: 3100 },
  { id: '4', carrier: 'ONE', carrierCode: 'ONE', vessel: 'ONE Commitment', voyage: 'O.033E', origin: 'Busan', destination: 'Los Angeles', etd: '2026-03-04', eta: '2026-03-18', transitDays: 14, type: 'direct', space: 'available', price20ft: 1200, price40ft: 2100 },
  { id: '5', carrier: 'Evergreen', carrierCode: 'EVG', vessel: 'Ever Ace', voyage: 'E.109E', origin: 'Busan', destination: 'Los Angeles', etd: '2026-03-07', eta: '2026-03-22', transitDays: 15, type: 'transshipment', transshipmentPort: 'Kaohsiung', space: 'available', price20ft: 1100, price40ft: 1900 },
  { id: '6', carrier: 'HMM', carrierCode: 'HMM', vessel: 'HMM Oslo', voyage: 'V.031E', origin: 'Busan', destination: 'Hamburg', etd: '2026-03-12', eta: '2026-04-11', transitDays: 30, type: 'direct', space: 'limited', price20ft: 1700, price40ft: 2900 },
  { id: '7', carrier: 'Yang Ming', carrierCode: 'YML', vessel: 'YM Wellness', voyage: 'Y.058E', origin: 'Busan', destination: 'New York', etd: '2026-03-06', eta: '2026-03-28', transitDays: 22, type: 'transshipment', transshipmentPort: 'Panama', space: 'full', price20ft: 2200, price40ft: 3800 },
  { id: '8', carrier: 'CMA CGM', carrierCode: 'CMA', vessel: 'CMA CGM Jacques Saadé', voyage: 'C.015E', origin: 'Busan', destination: 'Le Havre', etd: '2026-03-09', eta: '2026-04-08', transitDays: 30, type: 'direct', space: 'available', price20ft: 1550, price40ft: 2700 },
];

const DESTINATIONS = ['All', 'Rotterdam', 'Los Angeles', 'Hamburg', 'New York', 'Le Havre'];
const CARRIERS = ['All', 'HMM', 'Maersk', 'MSC', 'ONE', 'Evergreen', 'Yang Ming', 'CMA CGM'];

/* ───── Page ───── */

export default function BookingPage() {
  const [destFilter, setDestFilter] = useState('All');
  const [carrierFilter, setCarrierFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<string | null>(null);

  const filtered = SCHEDULES.filter((s) => {
    if (destFilter !== 'All' && s.destination !== destFilter) return false;
    if (carrierFilter !== 'All' && s.carrier !== carrierFilter) return false;
    return true;
  });

  const handleBooking = (id: string) => {
    setSelectedBooking(id);
    setTimeout(() => {
      setBookingConfirmed(id);
      setSelectedBooking(null);
    }, 1500);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Booking Management</h1>
        <p className="text-sm text-slate-500 mt-1">선사 스케줄을 조회하고 부킹을 요청합니다</p>
      </div>

      {/* Booking Confirmed Toast */}
      {bookingConfirmed && (
        <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-3 animate-in">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="text-sm font-medium">부킹이 성공적으로 요청되었습니다 (Ref: BK-{bookingConfirmed})</span>
          <button onClick={() => setBookingConfirmed(null)} className="ml-auto text-xs text-emerald-600 hover:underline">닫기</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Destination:</span>
          <div className="flex gap-1 flex-wrap">
            {DESTINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDestFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  destFilter === d ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Ship size={14} className="text-slate-400" />
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c}>{c === 'All' ? '전체 선사' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">조건에 맞는 스케줄이 없습니다</div>
        ) : (
          filtered.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Carrier Info */}
                <div className="flex items-center gap-3 lg:w-[200px]">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                    {schedule.carrierCode}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{schedule.carrier}</div>
                    <div className="text-xs text-slate-400">{schedule.vessel} · {schedule.voyage}</div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-slate-400">ETD</div>
                    <div className="font-semibold text-slate-900 text-sm">{schedule.etd.slice(5)}</div>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-1"><MapPin size={10} />{schedule.origin}</div>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 border-t-2 border-dashed border-slate-200 relative">
                      {schedule.type === 'transshipment' && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                          T/S {schedule.transshipmentPort}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">{schedule.transitDays}일</span>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                  </div>

                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-slate-400">ETA</div>
                    <div className="font-semibold text-slate-900 text-sm">{schedule.eta.slice(5)}</div>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-1"><Anchor size={10} />{schedule.destination}</div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center gap-3 lg:w-[240px] justify-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">20ft / 40ft</div>
                    <div className="font-bold text-slate-900 text-sm">
                      ${schedule.price20ft.toLocaleString()} / ${schedule.price40ft.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      schedule.space === 'available' ? 'bg-emerald-100 text-emerald-700'
                      : schedule.space === 'limited' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {schedule.space === 'available' ? '여유' : schedule.space === 'limited' ? '잔여 소' : '만석'}
                    </span>
                    <button
                      onClick={() => handleBooking(schedule.id)}
                      disabled={schedule.space === 'full' || selectedBooking === schedule.id}
                      className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        schedule.space === 'full'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : selectedBooking === schedule.id
                          ? 'bg-blue-100 text-blue-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedBooking === schedule.id ? (
                        <>처리 중...</>
                      ) : (
                        <>부킹 요청 <ChevronRight size={12} /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
