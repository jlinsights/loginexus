'use client'

import React from 'react'
import Link from 'next/link'
import { Ship, ArrowLeft, ArrowRight } from 'lucide-react'

const TOOLS = [
  { href: '/tools/rate-explorer', label: '운임 탐색기' },
  { href: '/tools/hs-codes', label: 'HS Code 조회' },
  { href: '/tools/glossary', label: '물류 용어 사전' },
  { href: '/tools/emissions-calculator', label: '탄소 배출 계산기' },
]

export default function ToolLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: '"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif' }}
    >
      {/* ─── Top Nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Ship size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">LogiNexus</span>
            <span className="text-xs text-slate-400 hidden sm:inline">Tools</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="text-xs sm:text-sm text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                {t.label}
              </Link>
            ))}
          </div>

          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors"
          >
            무료 시작 <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ─── Hero Banner ─── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={14} /> 홈으로
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* ─── Content ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {children}
      </main>

      {/* ─── CTA Banner ─── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-white">LogiNexus와 함께 물류를 혁신하세요</h3>
          <p className="mt-2 text-blue-100">AI 견적, 실시간 트래킹, 블록체인 정산 — 모두 한 플랫폼에서</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/"
              className="text-white font-medium underline underline-offset-4 hover:text-blue-100 transition-colors"
            >
              자세히 알아보기
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Ship size={16} className="text-blue-400" />
            <span>© 2026 LogiNexus. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            {TOOLS.map((t) => (
              <Link key={t.href} href={t.href} className="hover:text-white transition-colors">
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
