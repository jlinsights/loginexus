'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchShipmentByTracking } from '@/lib/api';
import { ShipmentWorkflow } from '@/app/components/ShipmentWorkflow';
import { Package, MapPin, Calendar, Truck, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TrackingPage() {
    const searchParams = useSearchParams();
    const trackingNumber = searchParams.get('number') || '';
    const [searchTerm, setSearchTerm] = useState(trackingNumber);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const t = useTranslations('Common'); // Reserved for future i18n usage

    const { data: shipment, isLoading, isError } = useQuery({
        queryKey: ['shipment', trackingNumber],
        queryFn: () => fetchShipmentByTracking(trackingNumber),
        enabled: !!trackingNumber,
        retry: 1
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            window.location.href = `/tracking?number=${searchTerm.trim()}`;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Search Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Track Your Shipment</h1>
                    <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Enter B/L or Tracking Number"
                            className="w-full px-5 py-3 pr-12 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        />
                        <button 
                            type="submit"
                            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <Truck size={20} />
                        </button>
                    </form>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm animate-pulse">
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm text-center border-l-4 border-red-500">
                        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Shipment Not Found</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                             We couldn&apos;t find a shipment with tracking number <span className="font-mono font-bold">{trackingNumber}</span>.
                        </p>
                        <p className="text-sm text-slate-400 mt-2">Please check the number and try again.</p>
                    </div>
                ) : shipment ? (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tracking Number</div>
                                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{shipment.tracking_number}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</div>
                                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {shipment.current_status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Route Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <MapPin size={14} /> Origin
                                    </div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{shipment.origin}</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <MapPin size={14} /> Destination
                                    </div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{shipment.destination}</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <Calendar size={14} /> ETA
                                    </div>
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                        {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : 'Pending'}
                                    </div>
                                </div>
                                <div>
                                     <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <Package size={14} /> Type
                                    </div>
                                    <div className="font-semibold text-slate-900 dark:text-white">FCL 40&apos; HC</div>
                                </div>
                            </div>

                            {/* Green Supply Chain Info */}
                            {shipment.carbon_emission !== undefined && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-8 border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600 dark:text-emerald-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.246-5.318-3.441-7.01C6.273 1.545 6.077 1.258 5.86 1.05a3 3 0 0 0-2.029.56c-.53.376-.906.94-1.071 1.579-.168.653-.13 1.353.111 1.983C3.541 6.258 4.66 9.387 6.138 12.06c.732 1.31 1.517 2.455 2.362 2.44zM16 8a4 4 0 0 1-1.38 7.37"/><path d="M11 12h1a2 2 0 1 1-1.55 3.19"/><path d="M17.5 19.5c1.68 0 3.03-1.28 2.45-2.88C19.38 15.08 17.2 12 16 12c-1.2 0-3.38 3.08-3.95 4.62-.58 1.6 0.77 2.88 2.45 2.88z"/></svg>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">Environmental Impact</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                                    {shipment.carbon_emission} kg CO₂
                                                </span>
                                                {shipment.is_green_certified && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-200 text-emerald-800">
                                                        Green Certified Route
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Workflow */}
                            <ShipmentWorkflow shipments={[shipment]} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Package size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                        <h2 className="text-xl font-medium text-slate-900 dark:text-white">Enter a tracking number to start</h2>
                    </div>
                )}
            </div>
        </div>
    );
}
