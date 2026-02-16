'use client';

import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { RoutePerformance } from '../../../lib/api';

interface RouteTableProps {
  data: RoutePerformance[] | undefined;
  isLoading: boolean;
}

type SortKey = keyof RoutePerformance;

export function RouteTable({ data, isLoading }: RouteTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('shipment_count');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...(data || [])].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortAsc ? av - bv : bv - av;
    }
    return sortAsc
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: 'origin', label: 'Origin' },
    { key: 'destination', label: 'Destination' },
    { key: 'shipment_count', label: 'Shipments', align: 'text-right' },
    { key: 'avg_transit_days', label: 'Avg Transit (d)', align: 'text-right' },
    { key: 'on_time_rate', label: 'On-Time %', align: 'text-right' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Route Performance</h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2 px-3 font-medium text-slate-500 cursor-pointer hover:text-slate-700 ${col.align || 'text-left'}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No route data available
                  </td>
                </tr>
              ) : (
                sorted.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700">{row.origin}</td>
                    <td className="py-2 px-3 text-slate-700">{row.destination}</td>
                    <td className="py-2 px-3 text-right text-slate-900 font-medium">{row.shipment_count}</td>
                    <td className="py-2 px-3 text-right text-slate-700">{row.avg_transit_days.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`font-medium ${
                          row.on_time_rate >= 90
                            ? 'text-emerald-600'
                            : row.on_time_rate >= 70
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {row.on_time_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
