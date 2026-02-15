'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Wallet, Settings } from 'lucide-react';
import { useWhitelabel } from './WhitelabelProvider';

export function Sidebar() {
  const pathname = usePathname();
  const { primaryColor } = useWhitelabel();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tracking', href: '/tracking', icon: Truck },
    { name: 'Finance', href: '/finance', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Menu</div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const activeClass = isActive 
                ? `bg-slate-800 text-white ${primaryColor.replace('bg-', 'border-l-4 border-')}` 
                : 'hover:bg-slate-800 hover:text-white';

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeClass}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700"></div>
            <div>
                <div className="text-sm font-medium text-white">Admin User</div>
                <div className="text-xs text-slate-500">View Profile</div>
            </div>
        </div>
      </div>
    </div>
  );
}
