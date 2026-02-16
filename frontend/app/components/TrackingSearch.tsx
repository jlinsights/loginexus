'use client';

import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchShipments } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Package } from 'lucide-react';

export function TrackingSearch() {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { data: shipments = [] } = useQuery({
        queryKey: ['shipments'],
        queryFn: fetchShipments,
        enabled: query.trim().length > 0,
    });

    const matches = query.trim().length > 0
        ? shipments.filter(s =>
            s.tracking_number.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
        : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (matches.length === 1) {
            router.push(`/dashboard?highlight=${matches[0].tracking_number}`);
            setQuery('');
            setIsFocused(false);
            inputRef.current?.blur();
        } else if (query.trim()) {
            router.push(`/dashboard?highlight=${query.trim()}`);
            setQuery('');
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (trackingNumber: string) => {
        router.push(`/dashboard?highlight=${trackingNumber}`);
        setQuery('');
        setIsFocused(false);
        inputRef.current?.blur();
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Only close if focus leaves the container entirely
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsFocused(false), 150);
        }
    };

    const showDropdown = isFocused && query.trim().length > 0;

    return (
        <div ref={containerRef} className="relative">
            <form onSubmit={handleSubmit}>
                <div className={`
                    flex items-center gap-2 rounded-full border transition-all duration-200
                    ${isFocused
                        ? 'border-blue-300 bg-white shadow-sm ring-2 ring-blue-100'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }
                `}>
                    <Search size={14} className="ml-3 text-slate-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleBlur}
                        placeholder="B/L or Tracking #"
                        className="w-32 lg:w-44 py-1.5 pr-3 text-xs bg-transparent outline-none placeholder:text-slate-400"
                    />
                    {query.trim() && (
                        <button
                            type="submit"
                            className="mr-1 p-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                        >
                            <ArrowRight size={12} />
                        </button>
                    )}
                </div>
            </form>

            {/* Dropdown Results */}
            {showDropdown && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    {matches.length === 0 ? (
                        <div className="px-4 py-5 text-center text-xs text-slate-400">
                            <Package size={20} className="mx-auto mb-1.5 text-slate-300" />
                            No tracking results for &quot;{query}&quot;
                        </div>
                    ) : (
                        <ul className="py-1">
                            {matches.map((s) => (
                                <li key={s.id}>
                                    <button
                                        onMouseDown={() => handleSelect(s.tracking_number)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                                    >
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            s.current_status?.toUpperCase() === 'DELIVERED' ? 'bg-emerald-500'
                                            : s.current_status?.toUpperCase() === 'IN_TRANSIT' ? 'bg-orange-500'
                                            : 'bg-blue-500'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold text-slate-900">{s.tracking_number}</div>
                                            <div className="text-[11px] text-slate-400 truncate">
                                                {s.origin} → {s.destination}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {s.current_status}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
