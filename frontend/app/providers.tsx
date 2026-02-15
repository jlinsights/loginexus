'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode, Suspense } from 'react'
import { WagmiProvider } from 'wagmi'
import { config } from '../lib/wagmi' 
import { WhitelabelProvider } from './components/WhitelabelProvider'

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="h-screen w-screen bg-slate-50" />}>
          <WhitelabelProvider>
            {props.children}
          </WhitelabelProvider>
        </Suspense>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
