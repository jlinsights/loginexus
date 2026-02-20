'use client';

import React, { useState } from 'react';
import { Shield, Search, ArrowRight } from 'lucide-react';
import { LogisticsEscrowPanel } from '@/app/components/LogisticsEscrowPanel';
import NFTGallery from '@/app/components/NFTGallery';

export default function EscrowPage() {
  const [trackingInput, setTrackingInput] = useState('');
  const [activeTracking, setActiveTracking] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      setActiveTracking(trackingInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Secure Digital Logistics Escrow</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Secure your global trade payments with next-gen digital originals. Funds are held safely and released only upon verified cargo delivery.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <form onSubmit={handleSearch} className="relative">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Enter Shipment Tracking Number
             </label>
             <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="e.g. SHIP-2026-001" 
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <button 
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
                >
                    Proceeed <ArrowRight size={18} />
                </button>
             </div>
          </form>
        </div>

         {activeTracking && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LogisticsEscrowPanel trackingNumber={activeTracking} />
            </div>
        )}

        <div className="mt-12">
            <NFTGallery />
        </div>

         {/* Instructional / Demo Info */}
         {!activeTracking && (
             <div className="grid md:grid-cols-3 gap-6 text-center text-sm text-slate-500">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 font-bold">1</div>
                    <p>Buyer deposits funds into Secure Escrow</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 font-bold">2</div>
                    <p>Funds are locked until Digital Original matches</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 font-bold">3</div>
                    <p>Oracle verifies delivery & releases funds</p>
                </div>
             </div>
         )}
      </div>
    </div>
  );
}
