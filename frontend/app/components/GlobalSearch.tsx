'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchShipments, Shipment } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { Search, X, MapPin, Package, ArrowRight } from 'lucide-react';

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const { data: shipments = [] } = useQuery({
        queryKey: ['shipments'],
        queryFn: fetchShipments,
        enabled: isOpen,
    });

    const filteredResults = query.trim().length > 0
        ? shipments.filter(s =>
            s.tracking_number.toLowerCase().includes(query.toLowerCase()) ||
            s.origin.toLowerCase().includes(query.toLowerCase()) ||
            s.destination.toLowerCase().includes(query.toLowerCase()) ||
            s.current_status.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
        : [];

    const open = useCallback(() => {
        setIsOpen(true);
        setQuery('');
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setQuery('');
    }, []);

    // ⌘K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                open();
            }
            if (e.key === 'Escape') {
                close();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, close]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (shipment: Shipment) => {
        close();
        router.push(`/dashboard?highlight=${shipment.tracking_number}`);
    };

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'DELIVERED' || s === 'ARRIVED') return 'bg-emerald-500';
        if (s === 'IN_TRANSIT' || s === 'IN TRANSIT') return 'bg-orange-500';
        return 'bg-blue-500';
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={open}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
                <Search size={14} />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 ml-1">
                    ⌘K
                </kbd>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

                    {/* Search Modal */}
                    <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Input */}
                        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
                            <Search size={18} className="text-slate-400 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search shipments by tracking #, origin, destination..."
                                className="flex-1 py-4 text-sm outline-none placeholder:text-slate-400"
                            />
                            <button
                                onClick={close}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[320px] overflow-y-auto">
                            {query.trim().length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-slate-400">
                                    <Package size={32} className="mx-auto mb-2 text-slate-300" />
                                    Type to search shipments...
                                </div>
                            ) : filteredResults.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-slate-400">
                                    No results found for &quot;{query}&quot;
                                </div>
                            ) : (
                                <ul className="py-2">
                                    {filteredResults.map((shipment) => (
                                        <li key={shipment.id}>
                                            <button
                                                onClick={() => handleSelect(shipment)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(shipment.current_status)}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-900">{shipment.tracking_number}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                                        <MapPin size={10} /> {shipment.origin}
                                                        <ArrowRight size={10} />
                                                        {shipment.destination}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                                    {shipment.current_status}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50">
                            <span>{filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}</span>
                            <span>ESC to close</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
