'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Map to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent').then(mod => mod.MapComponent), { 
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-lg" />
});

interface ShipmentMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    trackingNumber: string;
    coordinates: [number, number];
}

export function ShipmentMapModal({ isOpen, onClose, trackingNumber, coordinates }: ShipmentMapModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800">
                        Tracking Location: <span className="text-blue-600">{trackingNumber}</span>
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="h-96 w-full relative">
                     <MapComponent coordinates={coordinates} popupText={trackingNumber} />
                </div>
                <div className="p-4 bg-slate-50 text-sm text-slate-500 flex justify-between">
                    <span>Lat: {coordinates[0].toFixed(4)}</span>
                    <span>Lng: {coordinates[1].toFixed(4)}</span>
                </div>
            </div>
        </div>
    );
}
