'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { StatusDistribution } from '../../../lib/api';

interface StatusPieChartProps {
  data: StatusDistribution[] | undefined;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  booked: '#60a5fa',
  in_transit: '#fbbf24',
  delivered: '#34d399',
  cancelled: '#f87171',
};

const DEFAULT_COLOR = '#94a3b8';

export function StatusPieChart({ data, isLoading }: StatusPieChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>

      {isLoading ? (
        <div className="h-64 bg-slate-100 animate-pulse rounded" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data || []}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={({ payload }: { payload?: StatusDistribution }) =>
                payload ? `${payload.status} (${payload.percentage.toFixed(1)}%)` : ''
              }
            >
              {(data || []).map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] || DEFAULT_COLOR}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown) => [`${value} shipments`, String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
