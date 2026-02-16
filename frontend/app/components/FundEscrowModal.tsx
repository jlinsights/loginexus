'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { useApproveUSDC, useFundEscrow } from '../../lib/contracts/hooks';
import { formatUnits } from 'viem';

interface FundEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowAddress: `0x${string}`;
  amount: bigint;
  onSuccess?: () => void;
}

export function FundEscrowModal({ isOpen, onClose, escrowAddress, amount, onSuccess }: FundEscrowModalProps) {
  const [step, setStep] = useState<'approve' | 'fund' | 'done'>('approve');
  const approve = useApproveUSDC();
  const fund = useFundEscrow();

  const amountFormatted = formatUnits(amount, 6);

  useEffect(() => {
    if (approve.isSuccess && step === 'approve') {
      setStep('fund');
    }
  }, [approve.isSuccess, step]);

  useEffect(() => {
    if (fund.isSuccess && step === 'fund') {
      setStep('done');
      onSuccess?.();
    }
  }, [fund.isSuccess, step, onSuccess]);

  if (!isOpen) return null;

  const handleApprove = () => {
    approve.approve(escrowAddress, Number(amountFormatted));
  };

  const handleFund = () => {
    fund.fund(escrowAddress);
  };

  const isProcessing = approve.isPending || approve.isConfirming || fund.isPending || fund.isConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Fund Escrow</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-slate-900">{amountFormatted} USDC</div>
          <div className="text-sm text-slate-500 mt-1">will be locked in escrow</div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-6">
          <StepIndicator num={1} label="Approve USDC" active={step === 'approve'} done={step !== 'approve'} />
          <div className="flex-1 h-px bg-slate-200" />
          <StepIndicator num={2} label="Deposit" active={step === 'fund'} done={step === 'done'} />
        </div>

        {step === 'approve' && (
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {(approve.isPending || approve.isConfirming) ? <Loader2 size={18} className="animate-spin" /> : null}
            {approve.isPending ? 'Confirm in Wallet...' : approve.isConfirming ? 'Confirming...' : 'Approve USDC'}
          </button>
        )}

        {step === 'fund' && (
          <button
            onClick={handleFund}
            disabled={isProcessing}
            className="w-full py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {(fund.isPending || fund.isConfirming) ? <Loader2 size={18} className="animate-spin" /> : null}
            {fund.isPending ? 'Confirm in Wallet...' : fund.isConfirming ? 'Confirming...' : 'Deposit Funds'}
          </button>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-2 text-green-600">
            <CheckCircle size={32} />
            <span className="font-semibold">Escrow Funded Successfully</span>
            <button onClick={onClose} className="mt-2 text-sm text-slate-500 hover:text-slate-700 underline">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
      }`}>
        {done ? <CheckCircle size={14} /> : num}
      </div>
      <span className={`text-xs ${active ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}
