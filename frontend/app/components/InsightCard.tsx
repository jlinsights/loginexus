'use client'

import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react'
import type { InsightData } from '@/lib/api'

interface InsightCardProps {
  insight: InsightData
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; icon: typeof Info }> = {
  high: { border: 'border-rose-200 dark:border-rose-800', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: AlertTriangle },
  medium: { border: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: TrendingDown },
  low: { border: 'border-blue-200 dark:border-blue-800', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Info },
}

const TYPE_ICONS: Record<string, typeof Info> = {
  rate_increase: TrendingUp,
  rate_decrease: TrendingDown,
  seasonal: AlertTriangle,
}

export default function InsightCard({ insight }: InsightCardProps) {
  const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low
  const Icon = TYPE_ICONS[insight.type] || style.icon

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon size={18} className="text-slate-600 dark:text-slate-400" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{insight.title}</h4>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  )
}
