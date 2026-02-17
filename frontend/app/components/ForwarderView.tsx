'use client';

import React from 'react';
import { DollarSign, FileText, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export function ForwarderView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Open Quote Requests', value: '12', icon: FileText, color: 'bg-blue-600' },
                    { label: 'Pending Bookings', value: '5', icon: Clock, color: 'bg-orange-600' },
                    { label: 'Active Shipments', value: '28', icon: TrendingUp, color: 'bg-emerald-600' },
                    { label: 'Total Revenue (MTD)', value: '$142.5k', icon: DollarSign, color: 'bg-indigo-600' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                                    <Icon size={20} className={`${stat.color.replace('bg-', 'text-')}`} />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                    +4.2% <TrendingUp size={12} />
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Quote Requests */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Recent RFQs</h3>
                        <button className="text-xs text-blue-600 font-semibold hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[
                            { company: 'Samsung Electronics', route: 'ICN → LAX', cargo: 'Electronics, 4 TEU', date: '2 hrs ago', status: 'Open' },
                            { company: 'Hyundai Glovis', route: 'PUS → RTM', cargo: 'Auto Parts, 2 FEU', date: '5 hrs ago', status: 'Urgent' },
                            { company: 'LG Chem', route: 'ICN → FRA', cargo: 'Chemicals, Air Cargo', date: '1 day ago', status: 'Open' },
                            { company: 'SK Hynix', route: 'ICN → SFO', cargo: 'Semiconductors, Air', date: '1 day ago', status: 'Quoted' },
                        ].map((rfq, i) => (
                            <div key={i} className="p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer">
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm mb-1">{rfq.company}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{rfq.route}</span>
                                        <span>• {rfq.cargo}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold ${
                                        rfq.status === 'Urgent' ? 'bg-red-100 text-red-600' :
                                        rfq.status === 'Quoted' ? 'bg-green-100 text-green-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {rfq.status}
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-1">{rfq.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance / Tasks */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-bold text-slate-800 mb-4">Tasks & Alerts</h3>
                    <div className="space-y-3">
                        {[
                            { msg: 'Upload Bill of Lading for SHIP-2024-001', type: 'urgent' },
                            { msg: 'Confirm booking request #BK-8821', type: 'normal' },
                            { msg: 'Update vessel schedule for HMM Algeciras', type: 'normal' },
                        ].map((task, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${task.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{task.msg}</p>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                        View All Tasks
                    </button>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800 text-sm">Lead Generation</h4>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Pro Feature</span>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <p className="text-xs text-indigo-800 mb-3 leading-relaxed">
                                4 new companies match your service profile in the Asia-US trade lane.
                            </p>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">
                                Unlock Leads <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
