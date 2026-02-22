'use client'

import React from 'react'
import type { RouteRateData } from '@/lib/api'

interface RateTableProps {
  rates: RouteRateData[]
  isLoading?: boolean
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RateTable({ rates, isLoading }: RateTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded mb-2 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!rates.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Carrier Rates</h3>
        <p className="text-sm text-slate-400 text-center py-8">No rate data available for this route</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Carrier Rates ({rates.length})
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">Carrier</th>
            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">Rate (USD)</th>
            <th className="text-center py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">Transit</th>
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Valid Until</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate, idx) => (
            <tr
              key={`${rate.carrier}-${rate.container_type}-${idx}`}
              className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                {rate.carrier || '-'}
              </td>
              <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
                {rate.container_type || rate.mode}
              </td>
              <td className="py-3 pr-4 text-right font-semibold text-slate-900 dark:text-white">
                ${rate.rate_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-3 pr-4 text-center text-slate-500 dark:text-slate-400">
                {rate.transit_days_min && rate.transit_days_max
                  ? `${rate.transit_days_min}-${rate.transit_days_max}d`
                  : '-'}
              </td>
              <td className="py-3 text-slate-500 dark:text-slate-400">
                {formatDate(rate.valid_to)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
