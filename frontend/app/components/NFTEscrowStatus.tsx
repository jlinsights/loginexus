import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface NFTEscrowStatusProps {
  shipment: {
    eblTokenId: string;
    currentOwnerName: string;
    isLocked: boolean;
    isArrived: boolean;
    isTransferred: boolean;
    isReleased: boolean;
  };
}

export default function NFTEscrowStatus({ shipment }: NFTEscrowStatusProps) {
  return (
    <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm mt-4">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Secure Digital Asset & Escrow Status</h3>
      
      {/* e-B/L Card */}
      <div className="flex items-center p-4 bg-blue-50/50 border border-blue-100 rounded-lg mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-4 shadow-sm">
          e-B/L
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Secure Digital Original ID: #{shipment.eblTokenId}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Holder: {shipment.currentOwnerName}</p>
        </div>
      </div>

      {/* Settlement Progress */}
      <div className="space-y-4 relative">
        {/* Vertical Line for connection (optional visual) */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 -z-10" />

        <Step active={shipment.isLocked} label="Funds Locked (USDC)" />
        <Step active={shipment.isArrived} label="Cargo Arrived (Oracle Verified)" />
        <Step active={shipment.isTransferred} label="Digital Original Transferred" />
        <Step active={shipment.isReleased} label="Final Settlement & Release" />
      </div>
    </div>
  );
}

function Step({ active, label }: { active: boolean, label: string }) {
  return (
    <div className="flex items-center bg-white">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 border-2 transition-colors ${
        active 
          ? 'bg-green-50 border-green-500 text-green-600' 
          : 'bg-white border-slate-200 text-slate-300'
      }`}>
        {active ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </div>
      <span className={`font-medium ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}
