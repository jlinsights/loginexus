'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VolumeDataPoint } from '../../../lib/api';

interface VolumeChartProps {
  data: VolumeDataPoint[] | undefined;
  isLoading: boolean;
  granularity: string;
  onGranularityChange: (g: string) => void;
}

const GRANULARITY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function VolumeChart({ data, isLoading, granularity, onGranularityChange }: VolumeChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Shipment Volume</h3>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onGranularityChange(opt.value)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                granularity === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-slate-100 animate-pulse rounded" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data || []} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="status_booked" name="Booked" fill="#60a5fa" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="status_in_transit" name="In Transit" fill="#fbbf24" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="status_delivered" name="Delivered" fill="#34d399" radius={[2, 2, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
