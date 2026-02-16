'use client';

import React from 'react';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import type { AnalyticsSummary } from '../../../lib/api';

interface KpiCardsProps {
  data: AnalyticsSummary | undefined;
  isLoading: boolean;
}

const cards = [
  { key: 'total_shipments' as const, label: 'Total Shipments', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'in_transit' as const, label: 'In Transit', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'delivered' as const, label: 'Delivered', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'on_time_rate' as const, label: 'On-Time Rate', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50', suffix: '%' },
];

export function KpiCards({ data, isLoading }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{card.label}</span>
              <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">
                {data ? data[card.key] : 0}{card.suffix || ''}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
