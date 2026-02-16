'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Link } from '@/i18n/routing'
import LanguageToggle from '@/app/components/LanguageToggle'
import {
  Ship, Plane, Truck, Package, Search,
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Globe, Shield, BarChart3,
  Users, Zap, CheckCircle2, ExternalLink,
  MapPin, Phone, Mail, FileText, Headphones,
  X, Star, Quote, BookOpen, Compass, Leaf,
  Banknote, ClipboardList, Layers,
  Brain, Warehouse, Eye, Megaphone,
  Newspaper, Video,
  Calculator, Receipt, Building2,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const LandingHeroMap = dynamic(() => import('@/app/components/LandingHeroMap').then(mod => mod.LandingHeroMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-900" />
})

/* ───────── hooks ───────── */

/** Intersection Observer hook: returns [ref, isVisible] */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, isVisible] as const
}

/** Animated number counter */
function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    let startTs: number | null = null
    let raf: number
    const animate = (ts: number) => {
      if (!startTs) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])

  return value
}

/* ───────── sub-components ───────── */

/** Scroll-reveal wrapper */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, isVisible] = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Animated stat number */
function AnimatedStat({ value, suffix, label, decimal }: { value: number; suffix: string; label: string; decimal?: boolean }) {
  const [ref, isVisible] = useScrollReveal(0.3)
  const count = useCountUp(decimal ? Math.round(value * 10) : value, 2000, isVisible)
  const display = decimal ? (count / 10).toFixed(1) : count

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        {display}{suffix}
      </div>
      <div className="mt-2 text-sm text-slate-400 font-medium">{label}</div>
    </div>
  )
}

/* ───────── main component ───────── */

import {useTranslations} from 'next-intl';

export default function LandingPage() {
  const t = useTranslations();
  const [solutionTab, setSolutionTab] = useState('transport')
  const [segment, setSegment] = useState<'shipper' | 'forwarder'>('shipper')
  const [trackingQuery, setTrackingQuery] = useState('')
  const [showBanner, setShowBanner] = useState(true)
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  const SERVICES = [
    { icon: Ship, title: t('HomePage.features.transport'), desc: 'FCL / LCL', color: '#3B82F6' },
    { icon: Plane, title: 'Air Freight', desc: 'Urgent / Special', color: '#8B5CF6' },
    { icon: Truck, title: 'Inland', desc: 'Pick-up & Delivery', color: '#F59E0B' },
    { icon: Package, title: 'Value Added', desc: 'Customs / Insurance', color: '#10B981' },
  ]

  const WORKFLOW = [
    { step: 1, title: 'Quote', desc: 'Real-time Comparison', icon: FileText },
    { step: 2, title: 'Booking', desc: 'One-click Booking', icon: CheckCircle2 },
    { step: 3, title: 'Tracking', desc: 'Real-time Updates', icon: MapPin },
    { step: 4, title: 'Settlement', desc: 'Blockchain Escrow', icon: Shield },
  ]

  const STATS_DATA = [
    { value: 100, suffix: '+', label: t('HomePage.stats.partners') },
    { value: 50, suffix: 'K+', label: t('HomePage.stats.processed') },
    { value: 99.2, suffix: '%', label: t('HomePage.stats.arrival'), decimal: true },
    { value: 24, suffix: '/7', label: t('HomePage.stats.monitoring') },
  ]

  /* ───── data definitions (dynamic) ───── */

  const SOLUTIONS: Record<string, { title: string; items: { title: string; desc: string }[] }> = {
    transport: {
      title: t('HomePage.solutions.transport.title'),
      items: [
        { title: t('HomePage.solutions.transport.ocean.title'), desc: t('HomePage.solutions.transport.ocean.desc') },
        { title: t('HomePage.solutions.transport.air.title'), desc: t('HomePage.solutions.transport.air.desc') },
        { title: t('HomePage.solutions.transport.trucking.title'), desc: t('HomePage.solutions.transport.trucking.desc') },
      ],
    },
    manage: {
      title: t('HomePage.solutions.manage.title'),
      items: [
        { title: t('HomePage.solutions.manage.digital.title'), desc: t('HomePage.solutions.manage.digital.desc') },
        { title: t('HomePage.solutions.manage.tracking.title'), desc: t('HomePage.solutions.manage.tracking.desc') },
        { title: t('HomePage.solutions.manage.settlement.title'), desc: t('HomePage.solutions.manage.settlement.desc') },
      ],
    },
    finance: {
      title: t('HomePage.solutions.finance.title'),
      items: [
        { title: t('HomePage.solutions.finance.scf.title'), desc: t('HomePage.solutions.finance.scf.desc') },
        { title: t('HomePage.solutions.finance.insurance.title'), desc: t('HomePage.solutions.finance.insurance.desc') },
        { title: t('HomePage.solutions.finance.payment.title'), desc: t('HomePage.solutions.finance.payment.desc') },
      ],
    },
  }

  const SEGMENT_CONTENT = {
    shipper: {
      headline: t('HomePage.segments.shipper.title'),
      features: [
        { icon: BarChart3, title: t('HomePage.segments.shipper.feature1'), desc: t('HomePage.segments.shipper.desc') },
        { icon: MapPin, title: t('HomePage.segments.shipper.feature2'), desc: t('HomePage.segments.shipper.desc') },
        { icon: Shield, title: t('HomePage.segments.shipper.feature3'), desc: t('HomePage.segments.shipper.desc') },
      ],
    },
    forwarder: {
      headline: t('HomePage.segments.forwarder.title'),
      features: [
        { icon: Users, title: t('HomePage.segments.forwarder.feature1'), desc: t('HomePage.segments.forwarder.desc') },
        { icon: Zap, title: t('HomePage.segments.forwarder.feature2'), desc: t('HomePage.segments.forwarder.desc') },
        { icon: Globe, title: t('HomePage.segments.forwarder.feature3'), desc: t('HomePage.segments.forwarder.desc') },
      ],
    },
  }

  const NAV_ITEMS = [
    { label: t('Navigation.product'), children: [
      { label: t('Navigation.quoteProps.label'), desc: t('Navigation.quoteProps.desc'), href: '/products/quote', icon: Calculator, color: 'from-blue-500 to-blue-600' },
      { label: t('Navigation.bookingProps.label'), desc: t('Navigation.bookingProps.desc'), href: '/products/booking', icon: Ship, color: 'from-indigo-500 to-indigo-600' },
      { label: t('Navigation.trackingProps.label'), desc: t('Navigation.trackingProps.desc'), href: '/products/tracking', icon: MapPin, color: 'from-violet-500 to-violet-600' },
      { label: t('Navigation.settlementProps.label'), desc: t('Navigation.settlementProps.desc'), href: '/products/settlement', icon: Receipt, color: 'from-fuchsia-500 to-fuchsia-600' },
    ], sectionTitle: 'PLATFORM' },
    { label: t('Navigation.solutions'), children: [
      { label: t('Navigation.shipperProps.label'), desc: t('Navigation.shipperProps.desc'), href: '/solutions/shipper', icon: Building2, color: 'from-emerald-500 to-emerald-600' },
      { label: t('Navigation.forwarderProps.label'), desc: t('Navigation.forwarderProps.desc'), href: '/solutions/forwarder', icon: Plane, color: 'from-teal-500 to-teal-600' },
    ], sectionTitle: 'BY INDUSTRY' },
    { label: t('Navigation.pricing'), href: '/pricing' },
    { label: t('Navigation.support'), href: '/support' },
  ]

  const FOOTER_LINKS = [
    {
      title: t('Footer.product'),
      links: [
        { label: t('Footer.features'), href: '/features' },
        { label: t('Footer.solutions'), href: '/solutions' },
        { label: t('Footer.pricing'), href: '/pricing' },
        { label: t('Footer.updates'), href: '/updates' },
      ],
    },
    {
      title: t('Footer.company'),
      links: [
        { label: t('Footer.about'), href: '/about' },
        { label: t('Footer.careers'), href: '/careers' },
        { label: t('Footer.blog'), href: '/blog' },
        { label: t('Footer.partners'), href: '/partner' },
      ],
    },
    {
      title: t('Footer.support'),
      links: [
        { label: t('Footer.helpCenter'), href: '/help' },
        { label: t('Footer.apiDocs'), href: '/api' },
        { label: t('Footer.status'), href: '/status' },
        { label: t('Footer.contact'), href: '/contact' },
      ],
    },
    {
      title: t('Footer.legal'),
      links: [
        { label: t('Footer.terms'), href: '/terms' },
        { label: t('Footer.privacy'), href: '/privacy' },
        { label: t('Footer.security'), href: '/security' },
      ],
    },
  ]

  const TESTIMONIALS = [
    {
      quote: 'Reduced ocean freight management time by 40%. Real-time tracking is especially useful.',
      name: 'Seoyeon Kim',
      title: 'Logistics Lead',
      company: 'GlobalTech',
      rating: 5,
    },
    {
      quote: 'Complex international shipping became simple. Efficiency increased significantly.',
      name: 'Junhyeok Park',
      title: 'SCM Manager',
      company: 'FreshMart',
      rating: 5,
    },
  ]

  const seg = SEGMENT_CONTENT[segment]
  const sol = SOLUTIONS[solutionTab]

  // Auto-cycle testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const navOffset = showBanner ? 'pt-[104px] lg:pt-[104px]' : 'pt-16'
  const navTop = showBanner ? 'top-10' : 'top-0'

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: '"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif' }}>

      {/* ═══ ANNOUNCEMENT BANNER ═══ (Flexport) */}
      {showBanner && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-center gap-3 text-sm">
            <span className="hidden sm:inline">🎉</span>
            <span className="font-medium truncate">
               {t('HomePage.banner')}
            </span>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-blue-100 transition-colors flex-shrink-0"
            >
              {t('HomePage.start')} <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => setShowBanner(false)}
              className="absolute right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label={t('Common.close')}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ PUBLIC NAV ═══ */}
      <nav className={`fixed ${navTop} inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Ship size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">LogiNexus</span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative group">
                  {item.href ? (
                    <Link href={item.href} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                      {item.label}
                      {item.children && <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:rotate-180" />}
                    </button>
                  )}
                  {/* ─── Dropdown ─── */}
                  {item.children && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 min-w-[320px]">
                        {item.sectionTitle && (
                          <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase px-2 mb-2">{item.sectionTitle}</p>
                        )}
                        <div className="space-y-0.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                            >
                              {child.icon && (
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${child.color || 'from-slate-100 to-slate-200'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <child.icon size={16} className="text-white" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 group-hover/item:text-blue-600 transition-colors">{child.label}</div>
                                {child.desc && <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{child.desc}</div>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-500">
              <Search size={14} />
              <span className="hidden md:inline">{t('Common.searchPlaceholder')}</span>
            </div>
            <LanguageToggle />
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">
              {t('Navigation.login')}
            </Link>
            <Link href="/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full transition-colors shadow-sm">
              {t('Navigation.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className={`relative ${navOffset} overflow-hidden min-h-[85vh] flex items-center`}>
        <div className="absolute inset-0 z-0">
           <LandingHeroMap />
        </div>
        
        {/* Grid pattern overlay - reduced opacity and blended */}
        <div className="absolute inset-0 z-10 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <Reveal>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 bg-blue-900/30 px-4 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-md">
                  <Zap size={14} /> {t('HomePage.blockchainBadge')}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: t.raw('HomePage.title') }} />
                <p className="text-lg text-slate-400 max-w-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw('HomePage.subtitle') }} />
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                    {t('HomePage.startForFree')} <ArrowRight size={18} />
                  </Link>
                  <button className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 hover:border-white/60 font-medium px-8 py-3.5 rounded-full transition-all backdrop-blur-sm">
                    {t('HomePage.contactSales')} <ExternalLink size={16} />
                  </button>
                </div>
                {/* Mini tracking search */}
                <div className="relative max-w-md">
                  <form onSubmit={(e) => { e.preventDefault(); if(trackingQuery.trim()) window.location.href = `/dashboard?track=${trackingQuery}` }}>
                    <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                      <Search size={16} className="ml-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={trackingQuery}
                        onChange={(e) => setTrackingQuery(e.target.value)}
                        placeholder={t('Common.searchPlaceholder')}
                        className="flex-1 bg-transparent text-white placeholder:text-slate-500 px-3 py-3 text-sm outline-none"
                      />
                      <button type="submit" className="mr-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-colors">
                        {t('Common.search')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </Reveal>

            {/* Right: Dashboard Preview */}
            <Reveal delay={200}>
              <div className="hidden lg:block relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800/50 backdrop-blur-sm p-1">
                  <div className="rounded-xl bg-[#FAF7F2] p-6 space-y-4">
                    {/* Mock header */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Shipment Management</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Live Demo</span>
                    </div>
                    {/* Status cards row */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'TOTAL', value: '128', bg: 'bg-blue-500' },
                        { label: 'IN-TRANSIT', value: '43', bg: 'bg-orange-500' },
                        { label: 'ARRIVED', value: '72', bg: 'bg-emerald-500' },
                        { label: 'PENDING', value: '13', bg: 'bg-purple-500' },
                      ].map(c => (
                        <div key={c.label} className={`${c.bg} text-white rounded-lg p-3`}>
                          <div className="text-[10px] font-bold opacity-80">{c.label}</div>
                          <div className="text-xl font-bold">{c.value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Mock map */}
                    <div className="h-32 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23334155\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                      <Globe size={48} className="text-slate-400" />
                    </div>
                    {/* Workflow stepper mini */}
                    <div className="flex items-center gap-1.5">
                      {['견적', '부킹', '운송', '정산'].map((s, i) => (
                        <React.Fragment key={s}>
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${i <= 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {i <= 1 && <CheckCircle2 size={12} />} {s}
                          </div>
                          {i < 3 && <ChevronDown size={12} className="text-slate-300 rotate-[-90deg]" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-3xl -z-10 rounded-3xl" />
              </div>
            </Reveal>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="relative flex justify-center pb-8">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ SERVICE CARDS ═══ (PantosNow) */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 tracking-wide mb-2">SERVICES</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">원스톱 물류 솔루션</h2>
              <p className="mt-3 text-slate-500 max-w-2xl mx-auto">국제 운송의 모든 과정을 하나의 플랫폼에서 관리하세요</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors" style={{ backgroundColor: `${s.color}15` }}>
                    <s.icon size={28} style={{ color: s.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  <ArrowRight size={16} className="absolute top-6 right-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ (PantosNow) */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 tracking-wide mb-2">WORKFLOW</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">4단계로 완성하는 물류</h2>
              <p className="mt-3 text-slate-500">복잡한 국제 운송, LogiNexus가 간편하게 만들어 드립니다</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300" />
            {WORKFLOW.map((w, i) => (
              <Reveal key={w.step} delay={i * 150}>
                <div className="relative text-center group">
                  <div className="relative z-10 mx-auto w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                    {w.step}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{w.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TARGET SEGMENT TOGGLE ═══ (TradLinx) */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-blue-600 tracking-wide mb-2">FOR YOU</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">맞춤형 솔루션</h2>
            </div>
          </Reveal>

          {/* Toggle */}
          <Reveal delay={100}>
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-slate-100 rounded-full p-1">
                {[
                  { key: 'shipper' as const, label: '화주 / 수출입 기업' },
                  { key: 'forwarder' as const, label: '포워더 / 물류사' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSegment(opt.key)}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      segment === opt.key
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-900">
              {seg.headline} <span className="text-blue-600">LogiNexus</span>
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {seg.features.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <f.icon size={24} className="text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{f.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOLUTIONS TABS ═══ (LogiSpot) */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 tracking-wide mb-2">SOLUTIONS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">통합 물류 솔루션</h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Tabs sidebar */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:min-w-[200px]">
                {Object.entries(SOLUTIONS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setSolutionTab(key)}
                    className={`whitespace-nowrap px-5 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                      solutionTab === key
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {val.title}
                  </button>
                ))}
              </div>

              {/* Cards */}
              <div className="flex-1 grid sm:grid-cols-3 gap-5">
                {sol.items.map((item) => (
                  <div key={item.title} className="group bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <h4 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    <ArrowRight size={16} className="mt-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ (Flexport Customer Stories) */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 tracking-wide mb-2">TESTIMONIALS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">고객이 말하는 LogiNexus</h2>
              <p className="mt-3 text-slate-500">실제 사용자들의 생생한 후기를 확인하세요</p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative max-w-4xl mx-auto">
              {/* Carousel */}
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${testimonialIdx * 100}%)` }}
                >
                  {TESTIMONIALS.map((t, i) => (
                    <div key={i} className="w-full flex-shrink-0 px-2">
                      <div className="bg-white rounded-2xl p-8 lg:p-10 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-1 mb-4">
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Quote size={32} className="text-blue-100 mb-4" />
                        <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{t.name}</div>
                            <div className="text-sm text-slate-500">{t.title} · {t.company}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === testimonialIdx ? 'bg-blue-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ STATS & TRUST ═══ (Flexport + TradLinx) — Animated Counters */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-400 tracking-wide mb-2">WHY LOGINEXUS</p>
              <h2 className="text-3xl sm:text-4xl font-bold">신뢰할 수 있는 파트너</h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {STATS_DATA.map((s) => (
              <AnimatedStat key={s.label} {...s} />
            ))}
          </div>
          {/* ═══ PARTNER SOCIAL PROOF ═══ (TradLinx P1-6.4) */}
          <Reveal delay={200}>
            <div className="text-center">
              <p className="text-sm text-blue-400 mb-2 font-semibold tracking-wide">TRUSTED PARTNERS</p>
              <p className="text-lg text-slate-300 mb-8 font-medium">글로벌 기업이 신뢰하는 LogiNexus</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {[
                  { name: 'SAMSUNG SDS', sub: 'IT & Logistics' },
                  { name: 'CJ Logistics', sub: 'Global 3PL' },
                  { name: 'Hyundai Glovis', sub: 'Automotive Logistics' },
                  { name: 'LX Pantos', sub: 'Supply Chain' },
                  { name: 'HANJIN', sub: 'Transportation' },
                  { name: 'HMM', sub: 'Ocean Carrier' },
                  { name: 'POSCO', sub: 'Steel & Materials' },
                  { name: 'LG Electronics', sub: 'Consumer Electronics' },
                  { name: 'SK Networks', sub: 'Trading & Distribution' },
                  { name: 'Doosan', sub: 'Industrial Equipment' },
                ].map((c) => (
                  <div key={c.name} className="group rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-4 transition-all hover:border-blue-500/50 hover:bg-slate-800">
                    <div className="text-sm font-bold tracking-wider text-slate-300 group-hover:text-white transition-colors">{c.name}</div>
                    <div className="mt-1 text-[10px] text-slate-500 group-hover:text-slate-400">{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      {/* ═══ FREE TOOLS ═══ (Flexport Lead-Gen Strategy) */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-emerald-600 tracking-wide mb-2">FREE TOOLS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">무료 물류 도구</h2>
              <p className="mt-3 text-slate-500 max-w-2xl mx-auto">회원가입 없이 바로 사용할 수 있는 실용적인 물류 도구를 제공합니다</p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Compass, title: '운임 탐색기', desc: '항구별 예상 운임과 소요일수를 즉시 조회하세요', href: '/tools/rate-explorer', color: 'from-blue-500 to-indigo-500' },
              { icon: Search, title: 'HS Code 조회', desc: '품목별 관세율과 HS 코드를 검색하세요', href: '/tools/hs-codes', color: 'from-amber-500 to-orange-500' },
              { icon: BookOpen, title: '물류 용어 사전', desc: '국제 물류 핵심 용어 37개를 학습하세요', href: '/tools/glossary', color: 'from-purple-500 to-pink-500' },
              { icon: Leaf, title: '탄소 배출 계산기', desc: '운송 모드별 CO₂ 배출량을 비교하세요', href: '/tools/emissions-calculator', color: 'from-emerald-500 to-teal-500' },
            ].map((tool, i) => (
              <Reveal key={tool.title} delay={i * 100}>
                <Link
                  href={tool.href}
                  className="group block bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-xl transition-all duration-300 h-full"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <tool.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{tool.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{tool.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                    사용하기 <ArrowRight size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOG & NEWS ═══ (TradLinx P1-6.3) */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 tracking-wide mb-2">LATEST INSIGHTS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">물류 인사이트</h2>
              <p className="mt-3 text-slate-500 max-w-2xl mx-auto">최신 물류 트렌드, 운영 팁, 규제 변화를 한눈에 확인하세요</p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { cat: '시장 동향', color: 'from-blue-500 to-indigo-500', title: '2026년 해상 운임 전망: AI가 분석한 3대 시나리오', excerpt: 'SCFI 기반 AI 모델이 분석한 2026년 글로벌 해상 운임 트렌드와 대응 전략', date: '2026-02-14', readTime: '8분' },
              { cat: '규제', color: 'from-emerald-500 to-teal-500', title: 'EU CBAM 시행 가이드: 수출기업이 알아야 할 5가지', excerpt: '탄소국경조정제도(CBAM) 본격 시행에 따른 한국 수출기업 대응 가이드', date: '2026-02-12', readTime: '6분' },
              { cat: '운영 가이드', color: 'from-amber-500 to-orange-500', title: 'LCL 혼적으로 운송비 40% 절감하기: 실전 사례', excerpt: 'Consolidation 전략으로 실제 물류비를 절감한 3개 기업 사례 분석', date: '2026-02-10', readTime: '5분' },
            ].map((post, i) => (
              <Reveal key={post.title} delay={i * 100}>
                <Link href="/resources/blog" className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  <div className={`h-2 bg-gradient-to-r ${post.color}`} />
                  <div className="p-6">
                    <span className={`inline-block rounded-full bg-gradient-to-r ${post.color} px-3 py-0.5 text-[11px] font-bold text-white mb-3`}>{post.cat}</span>
                    <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors leading-snug">{post.title}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{post.date}</span>
                      <span>{post.readTime} 읽기</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300}>
            <div className="text-center">
              <Link href="/resources/blog" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all">
                블로그 전체 보기 <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ (PantosNow + LogiSpot) */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <Reveal>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">지금 바로 시작하세요</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              회원가입 후 바로 실시간 운임 조회와 선적 추적을 경험해보세요. 기업 도입 문의도 환영합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg">
                무료 회원가입 <ArrowRight size={18} />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors">
                도입 문의하기 <Phone size={16} />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ MEGA FOOTER ═══ (LogiSpot) */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Ship size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">LogiNexus</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">차세대 블록체인 물류 플랫폼</p>
              <div className="flex gap-3 text-slate-500">
                <Mail size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
                <Phone size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
                <Headphones size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_LINKS.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">© 2026 LogiNexus. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <Link href="#" className="hover:text-slate-400 transition-colors">{t('Footer.terms')}</Link>
              <Link href="#" className="hover:text-slate-400 transition-colors">{t('Footer.privacy')}</Link>
              <Link href="#" className="hover:text-slate-400 transition-colors">{t('Footer.transportTerms')}</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING ACTION BAR ═══ (LogiSpot) */}
      <div className="fixed right-4 bottom-8 z-40 flex flex-col gap-2">
        {[
          { icon: Search, label: t('Floating.search'), bg: 'bg-blue-600 hover:bg-blue-700', action: undefined },
          { icon: FileText, label: t('Floating.quote'), bg: 'bg-indigo-600 hover:bg-indigo-700', action: undefined },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={`group flex items-center gap-2 ${btn.bg} text-white rounded-full pl-3 pr-4 py-2.5 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5`}
          >
            <btn.icon size={16} />
            <span className="text-xs font-semibold">{btn.label}</span>
          </button>
        ))}
      </div>


    </div>
  )
}
