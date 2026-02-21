'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { XCircle } from 'lucide-react';

export default function BillingCanceledPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <XCircle className="text-slate-400" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Checkout Canceled
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          No worries! Your current plan is still active. You can upgrade anytime.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/billing/pricing"
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Plans
          </Link>
          <Link
            href="/billing"
            className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Back to Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
