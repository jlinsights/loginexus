'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchShipments, Shipment } from '../../lib/api';
import Link from 'next/link';

export function ShipmentList() {
    const { data: shipments, isLoading, isError } = useQuery({
        queryKey: ['shipments'],
        queryFn: fetchShipments,
    });

    if (isLoading) return <div className="p-4 text-center">Loading shipments...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Failed to load shipments</div>;

    if (!shipments || shipments.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500 mb-4">No shipments found.</p>
                <Link href="/create-shipment" className="text-blue-600 hover:underline">
                    Create your first shipment
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Recent Shipments</h3>
                <span className="text-sm text-slate-400">{shipments.length} Active</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Tracking #</th>
                            <th className="px-6 py-3">Origin</th>
                            <th className="px-6 py-3">Destination</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">ETA</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shipments.map((shipment) => (
                            <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {shipment.tracking_number}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{shipment.origin}</td>
                                <td className="px-6 py-4 text-slate-600">{shipment.destination}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${shipment.current_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                                          shipment.current_status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-slate-100 text-slate-800'}`}>
                                        {shipment.current_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link 
                                        href={`/tracking/${shipment.tracking_number}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
