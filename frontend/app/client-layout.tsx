'use client'

import { Providers } from './providers'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-64">
          <Header />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
