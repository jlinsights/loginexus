'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchShipments, Shipment, deliverShipment } from '@/lib/api';
import dynamic from 'next/dynamic';
import { ShipmentMapModal } from '@/app/components/ShipmentMapModal';
import { ShipmentWorkflow } from '@/app/components/ShipmentWorkflow';
import { SegmentToggle } from '@/app/components/SegmentToggle';
import { RoleToggle, UserRole } from '@/app/components/RoleToggle';
import { ForwarderView } from '@/app/components/ForwarderView';
import { Map, List, AlertTriangle, Clock, MapPinOff, CloudRain, FileWarning } from 'lucide-react';

// Dynamically import DashboardMap to avoid SSR issues with Leaflet
const DashboardMap = dynamic(
  () => import('@/app/components/DashboardMap').then(mod => mod.DashboardMap),
  {
    ssr: false,
    loading: () => <div className="h-[420px] w-full bg-slate-200 animate-pulse rounded-xl" />,
  }
);

type ViewMode = 'map' | 'table';

export default function ShipmentDashboard() {
  const queryClient = useQueryClient();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [userRole, setUserRole] = useState<UserRole>('shipper');

  const { data: shipments = [], isLoading, isError } = useQuery({
    queryKey: ['shipments'],
    queryFn: fetchShipments,
    refetchInterval: 3000,
  });

  const deliverMutation = useMutation({
    mutationFn: deliverShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  const handleSimulateArrival = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Simulate vessel arrival for this shipment?')) {
      deliverMutation.mutate(id);
    }
  };

  const openMap = (shipment: Shipment) => setSelectedShipment(shipment);
  const closeMap = () => setSelectedShipment(null);

  // Derive exception data
  const now = new Date();
  const delayedShipments = shipments.filter(s => {
    if (s.current_status?.toUpperCase() === 'DELIVERED') return false;
    if (!s.eta) return false;
    return new Date(s.eta) < now;
  });
  const noLocationShipments = shipments.filter(s => !s.latitude || !s.longitude);
  // Simulated Data for Benchmarking
  const weatherDisruptedShipments = shipments.filter(s => 
      ['USLAX', 'CNSHA', 'KRPUS'].some(code => s.destination.includes(code) || s.origin.includes(code)) && 
      s.current_status === 'IN_TRANSIT'
  );
  
  const portCongestionShipments = shipments.filter(s => 
      ['NLRTM', 'DEHAM'].some(code => s.destination.includes(code)) &&
      s.current_status !== 'DELIVERED'
  );

  // Documentation: shipments without escrow (blockchain_status not set)
  const docPendingShipments = shipments.filter(s =>
    s.current_status?.toUpperCase() !== 'DELIVERED' &&
    (!s.blockchain_status || s.blockchain_status === 'NONE')
  );

  const totalExceptions = delayedShipments.length + noLocationShipments.length +
    docPendingShipments.length + weatherDisruptedShipments.length + portCongestionShipments.length;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse"></div>)}
        </div>
        <div className="h-[420px] bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
          <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
          <h3 className="font-bold text-red-800 mb-1">Connection Failed</h3>
          <p className="text-sm text-red-600">Unable to connect to the shipment API. Please ensure the backend server is running.</p>
        </div>
      </div>
    );
  }

  const inTransitCount = shipments.filter(s => s.current_status === 'IN_TRANSIT' || s.current_status === 'In Transit').length;
  const arrivedCount = shipments.filter(s => s.current_status === 'DELIVERED' || s.current_status === 'Delivered').length;
  const pendingPaymentCount = shipments.filter(s => s.blockchain_status === 'LOCKED').length;

  return (
    <div>
      {/* Header & Role Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shipment Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {userRole === 'shipper' 
              ? 'Track and manage your global shipments in real-time.' 
              : 'Manage quotes, bookings, and customer requests.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <RoleToggle role={userRole} onChange={setUserRole} />
            {userRole === 'shipper' && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        <Map size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            )}
        </div>
      </div>

      {userRole === 'shipper' ? (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-6">
                <StatusCard label="Total" count={shipments.length} color="bg-blue-600 dark:bg-blue-700" />
                <StatusCard label="In-Transit" count={inTransitCount} color="bg-orange-600 dark:bg-orange-700" />
                <StatusCard label="Arrived" count={arrivedCount} color="bg-emerald-600 dark:bg-emerald-700" />
                <StatusCard label="Pending Payment" count={pendingPaymentCount} color="bg-purple-600 dark:bg-purple-700" />
            </div>

            {/* Workflow Visualization */}
            <ShipmentWorkflow shipments={shipments} />

            {/* Exception/Alert Cards */}
            {totalExceptions > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D4] dark:border-slate-800 p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-500" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Exceptions & Alerts ({totalExceptions})</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {delayedShipments.length > 0 && (
                    <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl px-3.5 py-3 border-l-4 border-red-400 dark:border-red-600">
                        <Clock size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Delayed Shipments</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{delayedShipments.length} shipment{delayedShipments.length > 1 ? 's' : ''} past ETA</div>
                        </div>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{delayedShipments.length}</span>
                    </div>
                    )}
                    {noLocationShipments.length > 0 && (
                    <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl px-3.5 py-3 border-l-4 border-amber-400 dark:border-amber-600">
                        <MapPinOff size={16} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                        <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Missing Location</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{noLocationShipments.length} without GPS data</div>
                        </div>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{noLocationShipments.length}</span>
                    </div>
                    )}
                    {weatherDisruptedShipments.length > 0 && (
                    <div className="flex items-center gap-2.5 bg-sky-50 dark:bg-sky-900/30 rounded-xl px-3.5 py-3 border-l-4 border-sky-400 dark:border-sky-600">
                        <CloudRain size={16} className="text-sky-500 dark:text-sky-400 flex-shrink-0" />
                        <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Weather Alert</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{weatherDisruptedShipments.length} likely delayed by typhoon</div>
                        </div>
                        <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{weatherDisruptedShipments.length}</span>
                    </div>
                    )}
                    {portCongestionShipments.length > 0 && (
                    <div className="flex items-center gap-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-xl px-3.5 py-3 border-l-4 border-orange-400 dark:border-orange-600">
                        <AlertTriangle size={16} className="text-orange-500 dark:text-orange-400 flex-shrink-0" />
                        <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Port Congestion</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{portCongestionShipments.length} at congested terminals</div>
                        </div>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{portCongestionShipments.length}</span>
                    </div>
                    )}
                    {docPendingShipments.length > 0 && (
                    <div className="flex items-center gap-2.5 bg-violet-50 dark:bg-violet-900/30 rounded-xl px-3.5 py-3 border-l-4 border-violet-400 dark:border-violet-600">
                        <FileWarning size={16} className="text-violet-500 dark:text-violet-400 flex-shrink-0" />
                        <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Documentation Pending</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{docPendingShipments.length} missing escrow/docs</div>
                        </div>
                        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{docPendingShipments.length}</span>
                    </div>
                    )}
                </div>
                </div>
            )}

            {/* Main Content Area */}
            {viewMode === 'map' ? (
                <div className="h-[600px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 relative">
                <DashboardMap shipments={shipments} onShipmentClick={openMap} />
                
                {/* Map Overlay Stats */}
                <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200/60 dark:border-slate-700/60 pointer-events-auto">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        <CloudRain size={14} className="text-blue-400" /> Weather Alert
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Typhoon near Taiwan Strait</div>
                    </div>
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200/60 dark:border-slate-700/60 pointer-events-auto">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        <FileWarning size={14} className="text-amber-500" /> Customs Delay
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">2 Shipments in Busan</div>
                    </div>
                </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                        <tr>
                        <th className="px-6 py-4">Tracking #</th>
                        <th className="px-6 py-4">Origin / Dest</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">ETA</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading shipments...</td></tr>
                        ) : shipments.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No shipments found</td></tr>
                        ) : (
                        shipments.map((shipment) => (
                            <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => openMap(shipment)}>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{shipment.tracking_number}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{shipment.origin}</span>
                                <span className="text-slate-400">→</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{shipment.destination}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={shipment.current_status} /></td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity mr-3">
                                View Map
                                </span>
                                {shipment.current_status !== 'DELIVERED' && (
                                <button
                                    onClick={(e) => handleSimulateArrival(shipment.id, e)}
                                    disabled={deliverMutation.isPending}
                                    className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
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
            )}

            {/* Service Segment Toggle */}
            <div className="mb-6">
                <SegmentToggle />
            </div>
        </>
      ) : (
        <ForwarderView />
      )}

      {/* Single Shipment Map Modal */}
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

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`${color} p-4 lg:p-5 rounded-xl text-white shadow-sm ring-1 ring-black/5`}>
      <div className="text-[10px] lg:text-xs font-bold uppercase tracking-wider opacity-90 mb-1">{label}</div>
      <div className="text-2xl lg:text-3xl font-bold">{count}</div>
      <div className="text-[10px] lg:text-xs opacity-75 mt-1">shipments</div>
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
