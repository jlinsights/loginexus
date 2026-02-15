'use client';

import React from 'react';
import { Truck, Calendar, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { useWhitelabel } from './WhitelabelProvider';

interface ShipmentDetails {
    id: string;
    origin: string;
    destination: string;
    status: string;
    blockchain_status: string;
    eta: string;
}

export const ShipmentCard = ({ shipment, onDeliver }: { shipment: ShipmentDetails, onDeliver: () => void }) => {
    const { primaryColor } = useWhitelabel();
    const isLocked = shipment.blockchain_status === 'Locked';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipment ID</span>
                    <h2 className="text-2xl font-bold text-slate-900">{shipment.id}</h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    shipment.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {shipment.status}
                </div>
            </div>

            <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Truck size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-900">{shipment.origin}</div>
                        <div className="text-xs text-slate-400">Origin</div>
                    </div>
                    <div className="flex-1 h-px bg-slate-200 mx-2"></div>
                    <div>
                        <div className="text-sm font-medium text-slate-900">{shipment.destination}</div>
                        <div className="text-xs text-slate-400">Destination</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Calendar size={16} />
                            <span className="text-xs">ETA</span>
                        </div>
                        <div className="font-semibold text-slate-900">{shipment.eta}</div>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${isLocked ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
                            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                            <span className="text-xs font-bold">Smart Contract</span>
                        </div>
                        <div className={`font-bold ${isLocked ? 'text-red-800' : 'text-green-800'}`}>
                            {shipment.blockchain_status}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
                {isLocked ? (
                    <button 
                        onClick={onDeliver}
                        className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 ${primaryColor.replace('bg-', 'bg-') || 'bg-blue-600'} hover:opacity-90`}
                    >
                        Confirm Delivery & Unlock Funds
                    </button>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold p-3 bg-green-50 rounded-lg border border-green-100">
                         <ShieldCheck size={20} />
                         Funds Released
                    </div>
                )}
            </div>
        </div>
    );
};
