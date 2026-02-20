'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Link } from '@/i18n/routing'
import LanguageToggle from '@/app/components/LanguageToggle'
import { ThemeToggle } from '@/app/components/ThemeToggle'
import {
  Ship, Plane, Search,
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Globe, Shield, BarChart3,
  Users, Zap, CheckCircle2, ExternalLink,
  MapPin, Mail, FileText,
  X, Star, Quote, BookOpen, Compass, Leaf,
  Calculator, Receipt, Building2,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import {useTranslations} from 'next-intl';
import Newsletter from '@/app/components/Newsletter'
import QuickQuoteWidget from '@/app/components/QuickQuoteWidget'
import MarketIntelligence from '@/app/components/MarketIntelligence'
import LiveActivityFeed from '@/app/components/LiveActivityFeed'

const LandingHeroMap = dynamic(() => import('@/app/components/LandingHeroMap').then(mod => mod.LandingHeroMap), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900" />
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

export default function LandingPage() {
  const t = useTranslations();
  const [solutionTab, setSolutionTab] = useState('transport')
  const [segment, setSegment] = useState<'shipper' | 'forwarder'>('shipper')

  const [showBanner, setShowBanner] = useState(true)
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  const SERVICES = [
    { 
      img: '/assets/3d/ocean-fcl.png', 
      title: t('HomePage.features.transport'), 
      desc: 'FCL / LCL', 
      color: '#3B82F6',
      alt: 'Ocean Freight'
    },
    { 
      img: '/assets/3d/air-freight.png', 
      title: 'Air Freight', 
      desc: 'Urgent / Special', 
      color: '#8B5CF6',
      alt: 'Air Freight'
    },
    { 
      img: '/assets/3d/rail-freight.png', 
      title: 'Inland', 
      desc: 'Pick-up & Delivery', 
      color: '#F59E0B',
      alt: 'Inland Transport'
    },
    { 
      img: '/assets/3d/specialized.png', 
      title: 'Value Added', 
      desc: 'Customs / Insurance', 
      color: '#10B981',
      alt: 'Value Added Services'
    },
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" style={{ fontFamily: '"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif' }}>
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
      <nav className={`fixed ${navTop} inset-x-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Ship size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">LogiNexus</span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative group">
                  {item.href ? (
                    <Link href={item.href} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      {item.label}
                      {item.children && <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform group-hover:rotate-180" />}
                    </button>
                  )}
                  {/* ─── Dropdown ─── */}
                  {item.children && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-4 min-w-[320px]">
                        {item.sectionTitle && (
                          <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase px-2 mb-2">{item.sectionTitle}</p>
                        )}
                        <div className="space-y-0.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/item"
                            >
                              {child.icon && (
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${child.color || 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <child.icon size={16} className="text-white" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{child.label}</div>
                                {child.desc && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{child.desc}</div>}
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400">
              <Search size={14} />
              <span className="hidden md:inline">{t('Common.searchPlaceholder')}</span>
            </div>

            <Link href="/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full transition-colors shadow-sm">
              {t('Navigation.getStarted')}
            </Link>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <LanguageToggle />
            <ThemeToggle />
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
            <div className="space-y-8 max-w-2xl">
              <Reveal>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30 backdrop-blur-md mb-6">
                  <Zap size={14} className="fill-blue-600 dark:fill-blue-300" /> {t('HomePage.blockchainBadge')}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-6">
                  The Future of <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Trustless Logistics</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-lg">
                  Experience true transparency with Blockchain Verification. No hidden fees, no data manipulation—just pure, verified logistics.
                </p>
                
                {/* Social Proof / Network Reach */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">120+</div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Global Partners</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">15k+</div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Verified Shipments</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">$45M</div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Value Secured</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105 shadow-xl hover:shadow-2xl">
                    {t('HomePage.startForFree')} <ArrowRight size={18} />
                  </Link>
                  <button className="inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium px-8 py-3.5 rounded-full transition-all">
                    {t('HomePage.contactSales')} <ExternalLink size={16} />
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Right: Quick Quote Widget (Cello Style) */}
            <div className="relative flex justify-center lg:justify-end">
               <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full -z-10 transform translate-y-10 scale-90" />
               <QuickQuoteWidget />
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="relative flex justify-center pb-8">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ MARKET INTELLIGENCE ═══ (SURFF Inspired) */}
      <section className="py-12 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <MarketIntelligence />
          </Reveal>
        </div>
      </section>

      {/* ═══ FEATURES / SERVICES ═══ */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase mb-3">
              {t('HomePage.features.badge')}
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              {t('HomePage.features.title')}
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('HomePage.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-bl-[60px] -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
                  
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10 bg-slate-50 dark:bg-slate-800/50 p-2">
                    <div className="relative w-full h-full">
                      <Image 
                        src={s.img} 
                        alt={s.alt} 
                        fill 
                        className="object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">{s.desc}</p>
                  
                  <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
                    {t('Common.learnMore')} <ArrowRight size={16} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ (PantosNow) */}
      <section className="py-20 lg:py-28 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide mb-2">WORKFLOW</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">4단계로 완성하는 물류</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">복잡한 국제 운송, LogiNexus가 간편하게 만들어 드립니다</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 opacity-50 dark:opacity-40" />
            {WORKFLOW.map((w, i) => (
              <Reveal key={w.step} delay={i * 150}>
                <div className="relative text-center group">
                  <div className="relative z-10 mx-auto w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                    {w.step}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{w.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TARGET SEGMENT TOGGLE ═══ (TradLinx) */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide mb-2">FOR YOU</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">맞춤형 솔루션</h2>
            </div>
          </Reveal>

          {/* Toggle */}
          <Reveal delay={100}>
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                {[
                  { key: 'shipper' as const, label: '화주 / 수출입 기업' },
                  { key: 'forwarder' as const, label: '포워더 / 물류사' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSegment(opt.key)}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      segment === opt.key
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {seg.headline} <span className="text-blue-600 dark:text-blue-400">LogiNexus</span>
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {seg.features.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <f.icon size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{f.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOLUTIONS TABS ═══ (LogiSpot) */}
      <section className="py-20 lg:py-28 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide mb-2">SOLUTIONS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">통합 물류 솔루션</h2>
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
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {val.title}
                  </button>
                ))}
              </div>

              {/* Cards */}
              <div className="flex-1 grid sm:grid-cols-3 gap-5">
                {sol.items.map((item) => (
                  <div key={item.title} className="group bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    <ArrowRight size={16} className="mt-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ (Flexport Customer Stories) */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wide mb-2">TESTIMONIALS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">고객이 말하는 LogiNexus</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">실제 사용자들의 생생한 후기를 확인하세요</p>
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
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-1 mb-4">
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Quote size={32} className="text-blue-100 dark:text-blue-900/40 mb-4" />
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{t.title} · {t.company}</div>
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
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === testimonialIdx ? 'bg-blue-600 w-8' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
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
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide mb-2">FREE TOOLS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">무료 물류 도구</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">회원가입 없이 바로 사용할 수 있는 실용적인 물류 도구를 제공합니다</p>
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
                  className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-xl transition-all duration-300 h-full"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <tool.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{tool.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                    사용하기 <ArrowRight size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOG & NEWS ═══ (TradLinx P1-6.3) */}
      <section className="py-20 lg:py-28 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 tracking-wide mb-2">LATEST INSIGHTS</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">물류 인사이트</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">최신 물류 트렌드, 운영 팁, 규제 변화를 한눈에 확인하세요</p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { cat: '시장 동향', color: 'from-blue-500 to-indigo-500', title: '2026년 해상 운임 전망: AI가 분석한 3대 시나리오', excerpt: 'SCFI 기반 AI 모델이 분석한 2026년 글로벌 해상 운임 트렌드와 대응 전략', date: '2026-02-14', readTime: '8분' },
              { cat: '규제', color: 'from-emerald-500 to-teal-500', title: 'EU CBAM 시행 가이드: 수출기업이 알아야 할 5가지', excerpt: '탄소국경조정제도(CBAM) 본격 시행에 따른 한국 수출기업 대응 가이드', date: '2026-02-12', readTime: '6분' },
              { cat: '운영 가이드', color: 'from-amber-500 to-orange-500', title: 'LCL 혼적으로 운송비 40% 절감하기: 실전 사례', excerpt: 'Consolidation 전략으로 실제 물류비를 절감한 3개 기업 사례 분석', date: '2026-02-10', readTime: '5분' },
            ].map((post, i) => (
              <Reveal key={post.title} delay={i * 100}>
                <Link href="/resources/blog" className="group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  <div className={`h-2 bg-gradient-to-r ${post.color}`} />
                  <div className="p-6">
                    <span className={`inline-block rounded-full bg-gradient-to-r ${post.color} px-3 py-0.5 text-[11px] font-bold text-white mb-3`}>{post.cat}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">{post.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>{post.date}</span>
                      <span>{post.readTime} 읽기</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <Newsletter />


      {/* ═══ FOOTER ═══ */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Ship size={18} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">LogiNexus</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
                {t('Footer.desc')}
              </p>
              <div className="flex gap-4">
                {/* Social icons */}
                {[
                  { icon: Globe, href: '#' },
                  { icon: Mail, href: '#' },
                ].map((social, i) => (
                  <a key={i} href={social.href} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_LINKS.map((section) => (
              <div key={section.title}>
                <h4 className="font-bold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} LogiNexus Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-xs text-slate-500 hover:text-white transition-colors">{t('Footer.terms')}</Link>
              <Link href="/privacy" className="text-xs text-slate-500 hover:text-white transition-colors">{t('Footer.privacy')}</Link>
              <Link href="/cookies" className="text-xs text-slate-500 hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ LIVE ACTIVITY FEED ═══ (SURFF Inspired) */}
      <LiveActivityFeed />
    </div>
  )
}
