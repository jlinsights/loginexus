'use client'

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useWhitelabel } from './WhitelabelProvider'
import { formatUnits } from 'viem'
import LanguageToggle from './LanguageToggle'

import { useTranslations } from 'next-intl'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { logoUrl, primaryColor } = useWhitelabel()
  const t = useTranslations('Navigation')

  return (
    <div className="flex items-center justify-between flex-1">
      <div className="text-xl font-bold flex items-center gap-2">
        <span className={`w-3 h-8 rounded-sm ${primaryColor}`}></span>
        {logoUrl}
      </div>

      <div className="flex items-center gap-4">
        <LanguageToggle />
        {isConnected ? (
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium text-slate-700">
                {balance ? Number(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0'} {balance?.symbol}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              {t('disconnect')}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${primaryColor} hover:opacity-90`}
              >
                {t('connectWallet')} ({connector.name})
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
