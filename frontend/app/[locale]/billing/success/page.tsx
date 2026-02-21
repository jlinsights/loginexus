'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { CheckCircle } from 'lucide-react';

export default function BillingSuccessPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/billing';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Subscription Activated!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Your plan has been upgraded successfully. You now have access to all features in your new plan.
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
          Redirecting to billing dashboard in {countdown}s...
        </p>
        <Link
          href="/billing"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Billing
        </Link>
      </div>
    </div>
  );
}
