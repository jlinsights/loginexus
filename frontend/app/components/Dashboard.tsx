'use client'

import React from 'react';
import { ShipmentList } from './ShipmentList';
import { useWhitelabel } from './WhitelabelProvider';

export function Dashboard() {
    const { name } = useWhitelabel();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back to {name}</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    + New Shipment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards Mockup */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium uppercase">Active Shipments</div>
                    <div className="text-3xl font-bold text-slate-900 mt-2">12</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium uppercase">Pending Actions</div>
                    <div className="text-3xl font-bold text-slate-900 mt-2">3</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium uppercase">Total Revenue</div>
                    <div className="text-3xl font-bold text-slate-900 mt-2">$4,250</div>
                </div>
            </div>

            <ShipmentList />
        </div>
    );
}
