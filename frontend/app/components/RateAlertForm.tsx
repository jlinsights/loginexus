'use client'

import React, { useState } from 'react'
import { Bell, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createRateSubscription } from '@/lib/api'
import { PORTS } from '@/lib/constants'

interface RateAlertFormProps {
  origin: string
  destination: string
  mode: string
  onClose: () => void
}

export default function RateAlertForm({ origin, destination, mode, onClose }: RateAlertFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [targetPrice, setTargetPrice] = useState<number | undefined>()
  const [frequency, setFrequency] = useState('daily')

  const originPort = PORTS.find(p => p.code === origin)
  const destPort = PORTS.find(p => p.code === destination)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createRateSubscription({
        origin,
        destination,
        mode,
        target_price: targetPrice,
        alert_frequency: frequency,
      })
      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch {
      alert('Failed to create subscription. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Bell size={18} /> Rate Alert
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Alert Created!</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">You will be notified when rates change.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400">
              <strong>{originPort?.name || origin}</strong> → <strong>{destPort?.name || destination}</strong>
              <span className="ml-2 text-xs text-slate-400">({mode})</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Target Rate (USD, optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 2000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                onChange={(e) => setTargetPrice(parseInt(e.target.value) || undefined)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Alert Frequency
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily (on change)</option>
                <option value="instant">Instant</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Set Alert
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
