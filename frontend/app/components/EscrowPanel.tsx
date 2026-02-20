'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { toHex } from 'viem';
import { useEscrowAddress, useEscrowState, useDisputeEscrow } from '../../lib/contracts/hooks';
import { EscrowStatusBadge } from './EscrowStatusBadge';
import { FundEscrowModal } from './FundEscrowModal';
import { formatUnits } from 'viem';

interface EscrowPanelProps {
  shipmentId: string;
  escrowContractAddress?: string;
}

function shipmentIdToBytes32(id: string): `0x${string}` {
  // Pad the shipment ID to bytes32
  const hex = toHex(id, { size: 32 });
  return hex;
}

export function EscrowPanel({ shipmentId, escrowContractAddress }: EscrowPanelProps) {
  const { address: userAddress } = useAccount();
  const [showFundModal, setShowFundModal] = useState(false);

  const shipmentBytes32 = shipmentIdToBytes32(shipmentId);
  const { escrowAddress: factoryAddr, isLoading: addrLoading } = useEscrowAddress(shipmentBytes32);

  // Use direct address if provided, otherwise look up from factory
  const escrowAddr = (escrowContractAddress as `0x${string}`) || factoryAddr;

  const { status, amount, buyer, isLoading: stateLoading, refetch } = useEscrowState(escrowAddr);
  const disputeHook = useDisputeEscrow();

  const isLoading = addrLoading || stateLoading;
  const isBuyer = userAddress && buyer && userAddress.toLowerCase() === buyer.toLowerCase();

  if (!escrowAddr && !isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-slate-400">
          <Shield size={16} />
          <span className="text-sm">No escrow contract linked</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Loading escrow...</span>
      </div>
    );
  }

  const amountFormatted = amount ? formatUnits(amount, 6) : '0';

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Payment Escrow</span>
        </div>
        <EscrowStatusBadge status={status} />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Amount</span>
        <span className="font-semibold text-slate-900">{amountFormatted} USDC</span>
      </div>

      {/* Actions based on status and role */}
      {status === 'created' && isBuyer && (
        <button
          onClick={() => setShowFundModal(true)}
          className="w-full py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 text-sm"
        >
          Fund Escrow
        </button>
      )}

      {status === 'funded' && isBuyer && (
        <button
          onClick={() => escrowAddr && disputeHook.dispute(escrowAddr)}
          disabled={disputeHook.isPending || disputeHook.isConfirming}
          className="w-full py-2.5 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {(disputeHook.isPending || disputeHook.isConfirming) && <Loader2 size={14} className="animate-spin" />}
          <AlertTriangle size={14} />
          Raise Dispute
        </button>
      )}

      {showFundModal && escrowAddr && amount && (
        <FundEscrowModal
          isOpen={showFundModal}
          onClose={() => setShowFundModal(false)}
          escrowAddress={escrowAddr}
          amount={amount}
          onSuccess={() => {
            setShowFundModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
