import React from 'react';
import { Info } from 'lucide-react';

export const DetailCard: React.FC<{ icon: any; label: string; value: string; onClick?: () => void }> = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick 
  }) => (
    <div 
        onClick={onClick}
        onKeyDown={(e) => { 
          if(onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); 
        }}
        role={onClick ? 'button' : 'presentation'}
        tabIndex={onClick ? 0 : undefined}
        className={`p-3 bg-slate-50 rounded-lg border border-slate-100 transition-all group relative ${onClick ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm' : ''}`}
    >
        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Icon size={12} />
            {label}
        </div>
        <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
            {value}
            {onClick && <Info size={12} className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity absolute right-2 top-2" />}
        </div>
    </div>
);
