'use client';

import React from 'react';
import { Calendar, Download } from 'lucide-react';

interface DateRangeBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onExport: () => void;
}

export function DateRangeBar({ startDate, endDate, onStartDateChange, onEndDateChange, onExport }: DateRangeBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="text-sm text-slate-700 bg-transparent outline-none"
        />
        <span className="text-slate-400">-</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="text-sm text-slate-700 bg-transparent outline-none"
        />
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );
}
