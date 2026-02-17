'use client'

import React, { useState } from 'react'
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setStatus('loading')
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success')
      setEmail('')
      
      // Reset after showing success message
      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    }, 1500)
  }

  return (
    <section className="py-20 bg-stone-100 dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200 dark:border-slate-700 text-center relative overflow-hidden">
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 dark:bg-blue-900/20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 dark:bg-indigo-900/20 rounded-full translate-y-1/3 -translate-x-1/3 opacity-60"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Mail size={12} />
              <span>Logistics Insights</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Stay ahead of supply chain trends.
            </h2>
            <p className="text-stone-500 dark:text-slate-400 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
              Join 10,000+ logistics professionals receiving weekly market updates, rate forecasts, and industry analysis.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative">
              <div className="relative flex-1">
                <input 
                  type="email" 
                  placeholder="name@company.com"
                  aria-label="Email address"
                  className="w-full pl-12 pr-4 py-4 rounded-full border border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-slate-500 text-stone-900 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500" size={20} />
              </div>
              
              <button 
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={`
                  px-8 py-4 rounded-full font-bold text-white transition-all transform flex items-center justify-center gap-2
                  ${status === 'success' 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'bg-stone-900 dark:bg-blue-600 hover:bg-stone-800 dark:hover:bg-blue-700 hover:shadow-lg'
                  }
                  disabled:opacity-80 disabled:cursor-not-allowed
                `}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span className="sr-only">Subscribing...</span>
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Joined!</span>
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
            
            <p className="text-xs text-stone-400 dark:text-slate-500 mt-6">
              No spam, unsubscribe anytime. Read our <a href="#" className="underline hover:text-stone-600 dark:hover:text-slate-300">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
