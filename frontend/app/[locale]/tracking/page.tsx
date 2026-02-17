'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchShipmentByTracking, Shipment } from '@/lib/api';
import { ShipmentWorkflow } from '@/app/components/ShipmentWorkflow';
import { Package, MapPin, Calendar, Truck, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const ShipmentMapModal = dynamic(() => import('@/app/components/ShipmentMapModal').then(mod => mod.ShipmentMapModal), { ssr: false });

export default function TrackingPage() {
    const searchParams = useSearchParams();
    const trackingNumber = searchParams.get('number') || '';
    const [searchTerm, setSearchTerm] = useState(trackingNumber);
    const t = useTranslations('Common'); // Assuming common translations exist

    const { data: shipment, isLoading, isError, error } = useQuery({
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
                             We couldn't find a shipment with tracking number <span className="font-mono font-bold">{trackingNumber}</span>.
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
                                    <div className="font-semibold text-slate-900 dark:text-white">FCL 40' HC</div>
                                </div>
                            </div>

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
