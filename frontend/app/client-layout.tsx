'use client'

import React, { useState } from 'react'
import { Providers } from './providers'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Menu } from 'lucide-react'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Providers>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-64">
          {/* Mobile Header Trigger */}
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center sticky top-0 z-20">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <span className="ml-3 font-bold text-slate-900">LogiNexus</span>
          </div>

          <div className="hidden lg:block">
             <Header />
          </div>
          
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
