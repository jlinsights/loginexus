import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Wallet, Settings, X } from 'lucide-react';
import { useWhitelabel } from './WhitelabelProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { primaryColor } = useWhitelabel();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tracking', href: '/tracking', icon: Truck },
    { name: 'Finance', href: '/finance', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu</div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
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
                onClick={() => onClose()} // Close on navigation (mobile)
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeClass}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
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
