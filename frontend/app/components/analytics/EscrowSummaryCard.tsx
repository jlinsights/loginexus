'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';
import type { EscrowAnalyticsSummary } from '../../../lib/api';

interface EscrowSummaryCardProps {
  data: EscrowAnalyticsSummary | undefined;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-300',
  funded: 'bg-blue-400',
  released: 'bg-emerald-400',
  disputed: 'bg-red-400',
  refunded: 'bg-amber-400',
};

export function EscrowSummaryCard({ data, isLoading }: EscrowSummaryCardProps) {
  const total = data?.escrow_count || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Escrow Summary</h3>
        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-8 w-32 bg-slate-100 animate-pulse rounded" />
          <div className="h-4 bg-slate-100 animate-pulse rounded" />
          <div className="h-20 bg-slate-100 animate-pulse rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            ${(data?.total_volume_usdc ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            {data?.escrow_count ?? 0} escrow contracts
          </p>

          {/* Status bar */}
          {total > 0 && (
            <div className="mb-3">
              <div className="flex h-2 rounded-full overflow-hidden">
                {(data?.status_breakdown || []).map((s) => (
                  <div
                    key={s.status}
                    className={`${STATUS_COLORS[s.status] || 'bg-slate-200'}`}
                    style={{ width: `${(s.count / total) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {(data?.status_breakdown || []).map((s) => (
              <div key={s.status} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s.status] || 'bg-slate-200'}`} />
                <span className="capitalize">{s.status}</span>
                <span className="text-slate-400">({s.count})</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
