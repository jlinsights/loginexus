'use client'

import React, { useState } from 'react'
import { usePathname } from '@/i18n/routing'
import { Providers } from './providers'
import { Sidebar } from '@/app/components/Sidebar'
import { Header } from '@/app/components/Header'
import { GlobalSearch } from '@/app/components/GlobalSearch'
import { TrackingSearch } from '@/app/components/TrackingSearch'
import { Menu } from 'lucide-react'

// Pages that use the public layout (no sidebar/header)
const PUBLIC_PATHS = ['/', '/register', '/signup'];
const PUBLIC_PREFIXES = ['/tools'];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPublicPage = PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p));

  // Public pages: no sidebar, no header — just render children
  if (isPublicPage) {
    return <Providers>{children}</Providers>;
  }

  return (
    <Providers>
      <div className="flex min-h-screen bg-[#FAF7F2]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-64">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-[#E8E0D4] p-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu size={22} />
              </button>
              <span className="ml-2 font-bold text-slate-900">LogiNexus</span>
            </div>
            <div className="flex items-center gap-2">
              <TrackingSearch />
              <GlobalSearch />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-[#E8E0D4] px-8 h-16 sticky top-0 z-10">
            <Header />
            <div className="ml-4 flex items-center gap-3">
              <TrackingSearch />
              <GlobalSearch />
            </div>
          </div>
          
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}

