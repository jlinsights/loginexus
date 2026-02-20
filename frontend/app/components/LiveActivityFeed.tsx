'use client'

import React, { useState, useEffect } from 'react'
import { Ship, CheckCircle2, User, ArrowRight } from 'lucide-react'

const MOCK_ACTIVITIES = [
  { id: 1, type: 'booking', port: 'Busan → Long Beach', entity: 'Forwarder L***', time: 'Just now' },
  { id: 2, type: 'quote', port: 'Shanghai → Rotterdam', entity: 'Shipper G***', time: '2 mins ago' },
  { id: 3, type: 'match', port: 'Ningbo → Hamburg', entity: 'Carrier H***', time: '5 mins ago' },
  { id: 4, type: 'booking', port: 'Incheon → Singapore', entity: 'Forwarder S***', time: '8 mins ago' },
  { id: 5, type: 'quote', port: 'Ho Chi Minh → Los Angeles', entity: 'Shipper T***', time: '12 mins ago' },
]

export default function LiveActivityFeed() {
  const [activities] = useState(MOCK_ACTIVITIES)
  const [visibleIdx, setVisibleIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleIdx((prev) => (prev + 1) % activities.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [activities.length])

  const activity = activities[visibleIdx]

  return (
    <div className="fixed bottom-6 left-6 z-[100] hidden sm:block pointer-events-none">
      <div className="animate-in slide-in-from-left-full duration-700 ease-out">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-[320px] pointer-events-auto group hover:scale-105 transition-transform cursor-pointer">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Ship size={20} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Live Matching</span>
              <span className="text-[10px] text-slate-400">{activity.time}</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {activity.port}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-0.5">
              <User size={8} /> {activity.entity}
            </p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={14} className="text-slate-400" />
          </div>
        </div>
      </div>
      
      {/* Activity Pulse Point */}
      <div className="absolute -top-1 -left-1 w-3 h-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </div>
    </div>
  )
}
