'use client';

import React from 'react';
import { Shipment } from '../../lib/api';
import { FileText, Ship, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

interface WorkflowProps {
    shipments: Shipment[];
}

const steps = [
    {
        key: 'quote',
        label: 'Quote',
        icon: FileText,
        color: 'bg-blue-500',
        lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Booked',
    },
    {
        key: 'book',
        label: 'Book',
        icon: Ship,
        color: 'bg-indigo-500',
        lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: 'Escrow locked',
    },
    {
        key: 'track',
        label: 'Track',
        icon: MapPin,
        color: 'bg-orange-500',
        lightColor: 'bg-orange-50 text-orange-700 border-orange-200',
        description: 'In transit',
    },
    {
        key: 'settle',
        label: 'Settle',
        icon: CheckCircle2,
        color: 'bg-emerald-500',
        lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Delivered',
    },
];

function getCounts(shipments: Shipment[]) {
    const s = (status: string) => status?.toUpperCase();
    return {
        quote: shipments.filter(sh => s(sh.current_status) === 'BOOKED' && sh.blockchain_status !== 'LOCKED').length,
        book: shipments.filter(sh => s(sh.current_status) === 'BOOKED' && sh.blockchain_status === 'LOCKED').length,
        track: shipments.filter(sh => s(sh.current_status) === 'IN_TRANSIT' || s(sh.current_status) === 'IN TRANSIT').length,
        settle: shipments.filter(sh => s(sh.current_status) === 'DELIVERED' || s(sh.current_status) === 'ARRIVED').length,
    } as Record<string, number>;
}

export function ShipmentWorkflow({ shipments }: WorkflowProps) {
    const counts = getCounts(shipments);
    const total = shipments.length || 1;

    return (
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-4 lg:p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Shipment Lifecycle</h3>
                <span className="text-[10px] text-slate-400 font-medium">{shipments.length} total</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden flex">
                {steps.map((step) => {
                    const pct = (counts[step.key] / total) * 100;
                    return (
                        <div
                            key={step.key}
                            className={`${step.color} transition-all duration-500 ease-out`}
                            style={{ width: `${pct}%` }}
                        />
                    );
                })}
            </div>

            {/* Steps */}
            <div className="grid grid-cols-4 gap-2 lg:gap-3">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const count = counts[step.key];
                    return (
                        <div key={step.key} className="relative">
                            <div className={`rounded-xl border p-3 lg:p-4 text-center ${step.lightColor} transition-all hover:shadow-sm`}>
                                <Icon size={18} className="mx-auto mb-1.5 opacity-80" />
                                <div className="text-lg lg:text-xl font-bold">{count}</div>
                                <div className="text-[10px] lg:text-xs font-semibold mt-0.5">{step.label}</div>
                                <div className="text-[9px] lg:text-[10px] opacity-60 mt-0.5">{step.description}</div>
                            </div>
                            {/* Arrow connector */}
                            {idx < steps.length - 1 && (
                                <div className="absolute top-1/2 -right-1.5 lg:-right-2 -translate-y-1/2 z-10 hidden sm:block">
                                    <ArrowRight size={10} className="text-slate-300" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
