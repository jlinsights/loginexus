'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Info, BarChart3 } from 'lucide-react'

const INDICES = [
  {
    name: 'SCFI',
    fullName: 'Shanghai Containerized Freight Index',
    value: '2,147.86',
    change: '+3.2%',
    trend: 'up',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    sparkline: [40, 35, 45, 42, 48, 52, 50, 58, 62, 60]
  },
  {
    name: 'FBX',
    fullName: 'Freightos Baltic Index',
    value: '$2,642',
    change: '-1.5%',
    trend: 'down',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    sparkline: [60, 58, 55, 57, 52, 48, 45, 42, 40, 38]
  },
  {
    name: 'KCCI',
    fullName: 'Korea Containerized Freight Index',
    value: '2,492',
    change: '+0.8%',
    trend: 'up',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    sparkline: [30, 32, 31, 35, 38, 36, 40, 42, 41, 44]
  },
  {
    name: 'WCI',
    fullName: 'World Container Index (Drewry)',
    value: '$3,162',
    change: '+5.4%',
    trend: 'up',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    sparkline: [20, 25, 22, 28, 35, 40, 45, 55, 65, 70]
  }
]

export default function MarketIntelligence() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            Market Intelligence
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time global freight indices and trends</p>
        </div>
        <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          View Data Center <Info size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {INDICES.map((index) => (
          <div 
            key={index.name}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{index.name}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{index.value}</h3>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${index.bgColor} ${index.color}`}>
                {index.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {index.change}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 dark:text-slate-500 line-clamp-1 mb-4" title={index.fullName}>
              {index.fullName}
            </p>

            {/* Simple SVG Sparkline */}
            <div className="h-10 w-full mt-2">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d={`M ${index.sparkline.map((val, i) => `${(i / (index.sparkline.length - 1)) * 100} ${100 - val}`).join(' L ')}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={index.color}
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">AI</div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
            <span className="font-bold">Trade Insight:</span> Seafreight rates on Asia-Europe routes are expected to remain volatile due to seasonal demand shifts.
          </p>
        </div>
        <button className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Download PDF Report
        </button>
      </div>
    </div>
  )
}
