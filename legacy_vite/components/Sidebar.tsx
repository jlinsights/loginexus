import React from 'react';
import { LayoutDashboard, Package, Calculator, BrainCircuit, Settings, LogOut, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationItem } from '../types';

interface SidebarProps {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || 'dashboard';

  const navItems: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'tracking', label: 'Tracking', icon: <Package size={20} /> },
    { id: 'quote', label: 'Get Quote', icon: <Calculator size={20} /> },
    { id: 'insights', label: 'AI Insights', icon: <BrainCircuit size={20} /> },
  ];

  const handleNavigation = (id: string) => {
    setActiveTab(id as NavigationItem);
    navigate(`/${id}`);
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Globe size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">LogiNexus</h1>
          <p className="text-xs text-slate-400">Enterprise Logistics</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              currentPath === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Settings size={20} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors text-red-400 hover:text-red-300">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};
