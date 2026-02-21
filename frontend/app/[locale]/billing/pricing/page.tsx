'use client';

import React, { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { fetchPlans, fetchSubscription, createCheckoutSession } from '@/lib/api';
import type { Plan, SubscriptionInfo } from '@/lib/api';

const TIER_COLORS: Record<string, string> = {
  free: 'border-slate-200 dark:border-slate-700',
  pro: 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900',
  enterprise: 'border-purple-500',
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [planData, sub] = await Promise.all([
          fetchPlans(),
          fetchSubscription().catch(() => null),
        ]);
        setPlans(planData.plans);
        setSubscription(sub);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpgrade = async (priceId: string | null) => {
    if (!priceId) return;
    setCheckoutLoading(priceId);
    try {
      const { checkout_url } = await createCheckoutSession(priceId);
      window.location.href = checkout_url;
    } catch {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentTier = subscription?.plan_tier || 'free';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Choose Your Plan</h1>
        <p className="text-slate-500 dark:text-slate-400">Scale your logistics operations with the right plan</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isPopular = plan.tier === 'pro';

          return (
            <div
              key={plan.tier}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 flex flex-col ${TIER_COLORS[plan.tier]}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    ${plan.price_monthly}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">/mo</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <FeatureItem
                  text={plan.limits.shipments_per_month === -1 ? 'Unlimited shipments' : `${plan.limits.shipments_per_month} shipments/mo`}
                />
                <FeatureItem
                  text={plan.limits.users === -1 ? 'Unlimited users' : `${plan.limits.users} users`}
                />
                <FeatureItem
                  text={plan.limits.escrows === -1 ? 'Unlimited escrows' : `${plan.limits.escrows} escrows`}
                />
                <FeatureItem text={`${plan.limits.api_rate_limit} req/min API limit`} />
                <FeatureItem text={`${plan.features.analytics === 'basic' ? 'Basic' : plan.features.analytics === 'full' ? 'Full' : 'Full + Export'} analytics`} />
                {plan.features.whitelabel && <FeatureItem text="Whitelabel branding" />}
                {plan.features.email_support && (
                  <FeatureItem text={plan.tier === 'enterprise' ? 'Priority email support' : 'Email support'} />
                )}
                {plan.features.webhook_notifications && <FeatureItem text="Webhook notifications" />}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : plan.price_id ? (
                <button
                  onClick={() => handleUpgrade(plan.price_id)}
                  disabled={!!checkoutLoading}
                  className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                  } ${checkoutLoading === plan.price_id ? 'opacity-60 cursor-wait' : ''}`}
                >
                  {checkoutLoading === plan.price_id ? 'Redirecting...' : 'Upgrade'}
                </button>
              ) : (
                <span className="w-full py-2.5 text-center text-sm text-slate-400 dark:text-slate-500">
                  Free forever
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
      <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
}
