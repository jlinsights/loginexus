'use client'

import React, { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { PORTS, MODES } from '@/lib/constants'

export default function QuickQuoteWidget() {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [mode, setMode] = useState('ocean_fcl')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !dest) return

    // Redirect to Rate Explorer with params
    router.push(`/tools/rate-explorer?origin=${origin}&dest=${dest}&mode=${mode}`)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-lg w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Search size={18} />
          </span>
          빠른 운임 조회
        </h3>
        <div className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800">
          Real-time Quote
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Mode Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                mode === m.id
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Route Inputs */}
        <div className="space-y-3">
          <div className="relative group">
            <MapPin size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80"
            >
              <option value="">출발지 선택 (Origin)</option>
              {PORTS.map(p => (
                <option key={p.code} value={p.code}>{p.country} {p.name} ({p.code})</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div className="relative group">
            <MapPin size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80"
            >
              <option value="">도착지 선택 (Destination)</option>
              {PORTS.map(p => (
                <option key={p.code} value={p.code}>{p.country} {p.name} ({p.code})</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
        >
          <span>운임 조회하기</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          최근 24시간 내 <span className="text-blue-600 dark:text-blue-400 font-bold">1,240건</span>의 견적이 조회되었습니다.
        </p>
      </form>
    </motion.div>
  )
}
