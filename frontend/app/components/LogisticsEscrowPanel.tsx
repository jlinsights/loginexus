'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useLogisticsEscrowTransaction, useDepositEscrow, useApproveUSDCLogistics, useFinalSettlement } from '@/lib/contracts/logistics-hooks';
import { formatUnits } from 'viem';
import NFTEscrowStatus from './NFTEscrowStatus';

interface LogisticsEscrowPanelProps {
  trackingNumber: string;
}

// Updated State Map: PENDING, LOCKED, ARRIVED, RELEASED, REFUNDED
const STATE_MAP = ['Pending', 'Locked', 'Arrived (Oracle)', 'Released', 'Refunded'];
const STATE_COLORS = ['bg-gray-100 text-gray-800', 'bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-green-100 text-green-800', 'bg-red-100 text-red-800'];

export function LogisticsEscrowPanel({ trackingNumber }: LogisticsEscrowPanelProps) {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  
  // State for form
  const [sellerAddr, setSellerAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenId, setTokenId] = useState('');

  // Hooks
  const { transaction, isLoading } = useLogisticsEscrowTransaction(trackingNumber);
  const { depositWithNFT, isPending: isDepositPending, isConfirming: isDepositConfirming, isSuccess: isDepositSuccess } = useDepositEscrow();
  const { approve, isPending: isApprovePending, isConfirming: isApproveConfirming } = useApproveUSDCLogistics();
  const { settle, isPending: isSettlePending, isConfirming: isSettleConfirming } = useFinalSettlement();

  const handleDeposit = () => {
      if (!sellerAddr || !amount || !tokenId) return;
      depositWithNFT(trackingNumber, sellerAddr as `0x${string}`, parseFloat(amount), parseInt(tokenId));
  };

  const handleApprove = () => {
      if (!amount) return;
      approve(parseFloat(amount));
  }

  const handleSettlement = () => {
      settle(trackingNumber);
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Connect Wallet</h3>
        <p className="text-slate-500 mb-6">Connect your wallet to access secure escrow services.</p>
        <button 
          onClick={() => connect({ connector: injected() })}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  if (isLoading) {
      return <div className="p-8 text-center text-slate-500">Loading blockchain data...</div>;
  }

  // --- EXISTING TRANSACTION ---
  if (transaction) {
    const formattedAmount = formatUnits(transaction.amount, 6);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-green-600" />
                Secure Escrow
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATE_COLORS[transaction.status] || 'bg-gray-100'}`}>
                {STATE_MAP[transaction.status] || 'Unknown'}
            </span>
        </div>
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Amount</span>
                    <p className="text-xl font-bold text-slate-900">{formattedAmount} USDC</p>
                </div>
                <div>
                     <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tracking #</span>
                     <p className="font-mono text-sm text-slate-600 mt-1">{transaction.trackingNumber}</p>
                </div>
                <div>
                     <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">e-B/L ID</span>
                     <p className="font-mono text-sm text-slate-600 mt-1">#{transaction.eblTokenId.toString()}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500">Buyer</span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{transaction.buyer}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Seller</span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{transaction.seller}</span>
                </div>
            </div>
            
            <NFTEscrowStatus shipment={{
                eblTokenId: transaction.eblTokenId.toString(),
                currentOwnerName: transaction.status >= 3 ? 'Buyer (Transferred)' : 'Seller / Pending',
                isLocked: transaction.status >= 1,
                isArrived: transaction.status >= 2,
                isTransferred: transaction.status >= 3, // Simplification: Released implies transferred
                isReleased: transaction.status >= 3
            }} />

            {(transaction.status === 2) && ( // ARRIVED
                 <div className="mt-4 p-3 bg-purple-50 text-purple-700 text-sm rounded-lg flex flex-col gap-3">
                    <div className="flex gap-2">
                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Action Required</p>
                            <p className="opacity-80">Cargo Arrived. Once Digital Original ownership is transferred to Buyer, release funds.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSettlement}
                        disabled={isSettlePending || isSettleConfirming}
                        className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isSettlePending || isSettleConfirming ? 'Settling...' : 'Release Funds (Final Settlement)'}
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  // --- CREATE NEW ESCROW ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Create New Escrow (with Digital Original)</h3>
      </div>
      <div className="p-6 space-y-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
            <input type="text" value={trackingNumber} disabled className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500" />
        </div>
        
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Seller Wallet Address</label>
            <input 
                type="text" 
                placeholder="0x..." 
                value={sellerAddr} 
                onChange={e => setSellerAddr(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (USDC)</label>
                <input 
                    type="number" 
                    placeholder="1000.00" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">e-B/L ID (Digital Original)</label>
                <input 
                    type="number" 
                    placeholder="1"
                    value={tokenId} 
                    onChange={e => setTokenId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>
        </div>

        <div className="flex gap-3 pt-2">
            <button 
                onClick={handleApprove}
                disabled={isApprovePending || isApproveConfirming || !amount}
                className="flex-1 py-2 px-4 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
                {isApprovePending || isApproveConfirming ? 'Approving...' : '1. Approve USDC'}
            </button>
            <button 
                onClick={handleDeposit}
                disabled={isDepositPending || isDepositConfirming || !amount || !sellerAddr || !tokenId}
                className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {isDepositPending || isDepositConfirming ? 'Depositing...' : '2. Deposit & Lock'}
            </button>
        </div>
        
        {isDepositSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <CheckCircle size={18} />
                <span>Escrow Created Successfully!</span>
            </div>
        )}
      </div>
    </div>
  );
}
