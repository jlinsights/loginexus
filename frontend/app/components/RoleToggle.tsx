'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase, Building2 } from 'lucide-react';

export type UserRole = 'shipper' | 'forwarder';

interface RoleToggleProps {
    role: UserRole;
    onChange: (role: UserRole) => void;
}

export function RoleToggle({ role, onChange }: RoleToggleProps) {
    const t = useTranslations('HomePage.RoleToggle');

    return (
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
                onClick={() => onChange('shipper')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    role === 'shipper'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                }`}
            >
                <Building2 size={16} />
                <span>{t('shipper')}</span>
            </button>
            <button
                onClick={() => onChange('forwarder')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    role === 'forwarder'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                }`}
            >
                <Briefcase size={16} />
                <span>{t('forwarder')}</span>
            </button>
        </div>
    );
}
