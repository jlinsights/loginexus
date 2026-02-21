'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import {
  CreditCard, ExternalLink, FileText, TrendingUp,
  AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import { fetchSubscription, fetchInvoices, fetchUsage } from '@/lib/api';
import type { SubscriptionInfo, Invoice, UsageItem } from '@/lib/api';

function UsageBar({ label, used, limit, percentage }: { label: string; used: number; limit: number; percentage: number }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : percentage;
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {used}{isUnlimited ? ' / Unlimited' : ` / ${limit}`}
          {!isUnlimited && ` (${pct}%)`}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

const PLAN_DISPLAY: Record<string, { name: string; color: string; price: string }> = {
  free: { name: 'Free', color: 'bg-slate-100 text-slate-700', price: '$0/mo' },
  pro: { name: 'Pro', color: 'bg-blue-100 text-blue-700', price: '$49/mo' },
  enterprise: { name: 'Enterprise', color: 'bg-purple-100 text-purple-700', price: '$199/mo' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle className="text-emerald-500" size={18} />,
  past_due: <AlertCircle className="text-amber-500" size={18} />,
  canceled: <Clock className="text-slate-400" size={18} />,
};

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<{ shipments: UsageItem; users: UsageItem; escrows: UsageItem } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sub, usageData, invoiceData] = await Promise.all([
          fetchSubscription(),
          fetchUsage(),
          fetchInvoices(5),
        ]);
        setSubscription(sub);
        setUsage(usageData);
        setInvoices(invoiceData.invoices);
      } catch {
        // Graceful degradation - show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const plan = PLAN_DISPLAY[subscription?.plan_tier || 'free'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing</h1>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="text-slate-400" size={24} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Current Plan</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.color}`}>
                  {plan.name}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{plan.price}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STATUS_ICON[subscription?.subscription_status || 'active']}
            <span className="text-sm capitalize text-slate-600 dark:text-slate-300">
              {subscription?.subscription_status || 'active'}
            </span>
          </div>
        </div>

        {subscription?.billing_period_end && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Next billing: {new Date(subscription.billing_period_end).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            href="/billing/pricing"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Change Plan
          </Link>
          {subscription?.plan_tier !== 'free' && (
            <button
              onClick={async () => {
                try {
                  const { createPortalSession } = await import('@/lib/api');
                  const { portal_url } = await createPortalSession('/billing');
                  window.location.href = portal_url;
                } catch { /* ignore */ }
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              Manage Subscription <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Usage Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="text-slate-400" size={20} />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Usage This Period</h2>
        </div>

        <div className="space-y-5">
          {usage && (
            <>
              <UsageBar label="Shipments" {...usage.shipments} />
              <UsageBar label="Users" {...usage.users} />
              <UsageBar label="Escrows" {...usage.escrows} />
            </>
          )}
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="text-slate-400" size={20} />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Invoices</h2>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No invoices yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {inv.period_start ? new Date(inv.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Invoice'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ${(inv.amount_paid / 100).toFixed(2)} - {inv.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {inv.invoice_url && (
                    <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-600 hover:underline">
                      View
                    </a>
                  )}
                  {inv.invoice_pdf && (
                    <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-600 hover:underline">
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
