import React from 'react';
import { Bell, Search, UserCircle } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:hidden">
            {/* Mobile menu trigger placeholder */}
            <div className="w-6 h-6 bg-slate-200 rounded"></div>
        </div>

        <div className="hidden md:flex items-center w-96 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <Search className="text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search shipments, quotes, or invoices..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-full placeholder-slate-400 text-slate-700"
            />
        </div>

        <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <button className="flex items-center gap-3 hover:bg-slate-50 py-1.5 px-2 rounded-full transition-colors">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">Alex Morgan</div>
                    <div className="text-xs text-slate-500">Logistics Manager</div>
                </div>
                <UserCircle size={32} className="text-slate-300" />
            </button>
        </div>
    </header>
  );
};
