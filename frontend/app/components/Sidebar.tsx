'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import {
  LayoutDashboard, Truck, Wallet, Settings, X,
  ChevronDown, Package, ClipboardList, Ship,
  Shield, Banknote, FileCheck, Layers,
  Brain, Eye, Leaf, Warehouse, Code2, Megaphone, LifeBuoy,
  BookOpen, Video, FileText, Newspaper,
  DollarSign, Users2, Target, BarChart3,
} from 'lucide-react';
import { useWhitelabel } from './WhitelabelProvider';

/* ───── Nav Structure ───── */

type NavChild = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
};

import { useTranslations } from 'next-intl';

// ... (imports)

// Remove static NAV_ITEMS definition

/* ───── Sidebar ───── */

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { primaryColor } = useWhitelabel();
  const t = useTranslations('Sidebar');

  const NAV_ITEMS: NavItem[] = [
    {
      name: t('dashboard'),
      icon: LayoutDashboard,
      children: [
        { name: t('overview'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('controlTower'), href: '/dashboard/control-tower', icon: Eye },
        { name: t('analytics'), href: '/dashboard/analytics', icon: BarChart3 },
      ],
    },
    {
      name: t('shipments'),
      icon: Package,
      children: [
        { name: t('allShipments'), href: '/dashboard', icon: Package },
        { name: t('booking'), href: '/shipments/booking', icon: Ship },
      ],
    },
    {
      name: t('orders'),
      icon: ClipboardList,
      children: [
        { name: t('orderManagement'), href: '/orders', icon: ClipboardList },
        { name: t('consolidation'), href: '/orders/consolidation', icon: Layers },
      ],
    },
    { name: t('tracking'), href: '/tracking', icon: Truck },
    {
      name: t('finance'),
      icon: Wallet,
      children: [
        { name: t('overview'), href: '/finance', icon: Wallet },
        { name: t('customs'), href: '/finance/customs', icon: FileCheck },
        { name: t('insurance'), href: '/finance/insurance', icon: Shield },
        { name: t('tradeFinance'), href: '/finance/trade-finance', icon: Banknote },
      ],
    },
    {
      name: t('intelligence'),
      icon: Brain,
      children: [
        { name: t('aiAnalytics'), href: '/intelligence', icon: Brain },
        { name: t('aiQuote'), href: '/ai-quote', icon: DollarSign },
        { name: t('developerApi'), href: '/developers', icon: Code2 },
      ],
    },
    {
      name: t('esg'),
      icon: Leaf,
      children: [
        { name: t('carbonControl'), href: '/esg/carbon', icon: Leaf },
      ],
    },

    { name: t('partners'), href: '/partners', icon: Users2 },
    { name: t('marketing'), href: '/marketing', icon: Target },
    { name: t('fulfillment'), href: '/fulfillment', icon: Warehouse },
    { name: t('changelog'), href: '/changelog', icon: Megaphone },
    { name: t('support'), href: '/support', icon: LifeBuoy },
    { name: t('settings'), href: '/settings', icon: Settings },
  ];

  // Auto-expand sidebar groups whose child matches the current route
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))) {
        next[item.name] = true;
      }
    });
    // eslint-disable-next-line
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const activeClass = (href: string) =>
    isActive(href)
      ? `bg-slate-800 text-white ${primaryColor.replace('bg-', 'border-l-4 border-')}`
      : 'hover:bg-slate-800 hover:text-white';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      >
        <div className="p-6 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('menu')}</div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isGroupOpen = expanded[item.name];

            // Simple link (no children)
            if (!hasChildren && item.href) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeClass(item.href)}`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            }

            // Collapsible group
            const groupActive = item.children?.some((c) => isActive(c.href));
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggle(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    groupActive && !isGroupOpen ? 'bg-slate-800/50 text-white' : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium flex-1 text-left">{item.name}</span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Children */}
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isGroupOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="ml-4 pl-4 border-l border-slate-700/50 mt-1 space-y-0.5">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => onClose()}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                            isActive(child.href)
                              ? 'bg-slate-800 text-white font-semibold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <ChildIcon size={16} />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-xs text-white font-bold">AD</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white">Admin User</div>
              <div className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">View Profile</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
