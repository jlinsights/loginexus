'use client';

import React from 'react';
import { Lock, Unlock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { EscrowStatus } from '../../lib/contracts/types';

const CONFIG: Record<EscrowStatus, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  created: { label: 'Awaiting Deposit', icon: <Clock size={14} />, bg: 'bg-slate-100', text: 'text-slate-700' },
  funded: { label: 'Funds Locked', icon: <Lock size={14} />, bg: 'bg-amber-100', text: 'text-amber-700' },
  released: { label: 'Funds Released', icon: <Unlock size={14} />, bg: 'bg-green-100', text: 'text-green-700' },
  disputed: { label: 'Disputed', icon: <AlertTriangle size={14} />, bg: 'bg-red-100', text: 'text-red-700' },
  refunded: { label: 'Refunded', icon: <CheckCircle size={14} />, bg: 'bg-blue-100', text: 'text-blue-700' },
};

export function EscrowStatusBadge({ status }: { status?: EscrowStatus }) {
  if (!status) return null;
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
