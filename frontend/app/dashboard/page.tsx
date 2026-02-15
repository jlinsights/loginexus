'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchShipments, Shipment, deliverShipment } from '../../lib/api';
import Link from 'next/link';
import { ShipmentMapModal } from '../components/ShipmentMapModal';

export default function ShipmentDashboard() {
  const queryClient = useQueryClient();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const { data: shipments = [], isLoading, isError } = useQuery({
    queryKey: ['shipments'],
    queryFn: fetchShipments,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
  });

  const deliverMutation = useMutation({
      mutationFn: deliverShipment,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['shipments'] });
      }
  });

  const handleSimulateArrival = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent row click
      if (confirm('Simulate vessel arrival for this shipment?')) {
          deliverMutation.mutate(id);
      }
  };

  const openMap = (shipment: Shipment) => {
      setSelectedShipment(shipment);
  };

  const closeMap = () => {
      setSelectedShipment(null);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading shipments...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load shipments.</div>;
  }
  
  const inTransitCount = shipments.filter(s => s.current_status === 'IN_TRANSIT' || s.current_status === 'In Transit').length;
  const arrivedCount = shipments.filter(s => s.current_status === 'DELIVERED' || s.current_status === 'Delivered').length;
  const pendingPaymentCount = shipments.filter(s => s.blockchain_status === 'LOCKED').length; 

  return (
    <div className="">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Shipment Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          + New Shipment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatusCard label="Total" count={shipments.length} color="bg-blue-500" />
        <StatusCard label="In-Transit" count={inTransitCount} color="bg-orange-500" />
        <StatusCard label="Arrived" count={arrivedCount} color="bg-emerald-500" />
        <StatusCard label="Pending Payment" count={pendingPaymentCount} color="bg-purple-500" />
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <th className="py-4 px-6 text-left">Tracking No.</th>
                <th className="py-4 px-6 text-left">Origin / Destination</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">ETA</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
              {shipments.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                        No shipments found.
                    </td>
                 </tr>
              ) : (
                  shipments.map((shipment) => (
                    <tr 
                        key={shipment.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => openMap(shipment)}
                    >
                      <td className="py-4 px-6 text-left whitespace-nowrap font-medium text-slate-900">
                        {shipment.tracking_number}
                      </td>
                      <td className="py-4 px-6 text-left">
                        <span className="block text-slate-900">{shipment.origin}</span>
                        <span className="text-xs text-slate-400">to</span> <span className="text-slate-900">{shipment.destination}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <StatusBadge status={shipment.current_status} />
                      </td>
                      <td className="py-4 px-6 text-center text-slate-500">
                        {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                         <span className="text-xs text-slate-400 font-medium px-2 py-1 rounded bg-slate-100">Click to View Map</span>
                         {/* Simulate Update Button */}
                         {shipment.current_status !== 'DELIVERED' && (
                             <button 
                                onClick={(e) => handleSimulateArrival(shipment.id, e)}
                                disabled={deliverMutation.isPending}
                                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
                             >
                                {deliverMutation.isPending ? 'Updating...' : 'Simulate Arrival'}
                             </button>
                         )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedShipment && (
          <ShipmentMapModal 
            isOpen={!!selectedShipment}
            onClose={closeMap}
            trackingNumber={selectedShipment.tracking_number}
            coordinates={[selectedShipment.latitude || 0, selectedShipment.longitude || 0]}
          />
      )}
    </div>
  );
}

function StatusCard({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className={`${color} p-5 rounded-xl text-white shadow-sm ring-1 ring-black/5`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">{label}</div>
      <div className="text-3xl font-bold">{count}</div>
      <div className="text-xs opacity-75 mt-2">shipments</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    let classes = 'bg-slate-100 text-slate-800';
    
    const s = status?.toUpperCase();
    if (s === 'DELIVERED' || s === 'ARRIVED') classes = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    else if (s === 'IN_TRANSIT' || s === 'IN TRANSIT') classes = 'bg-orange-100 text-orange-800 border border-orange-200';
    else if (s === 'BOOKED') classes = 'bg-blue-100 text-blue-800 border border-blue-200';

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>
            {status}
        </span>
    );
}
