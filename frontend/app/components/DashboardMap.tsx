'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Shipment } from '../../lib/api';

// Fix default marker icon
// @ts-expect-error - Leaflet icon fix for Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored marker icons
function createColoredIcon(color: string) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 14px; height: 14px; border-radius: 50%;
            background: ${color}; border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
    });
}

const ICONS = {
    inTransit: createColoredIcon('#f97316'),  // orange
    delivered: createColoredIcon('#10b981'),  // emerald
    booked: createColoredIcon('#3b82f6'),     // blue
    default: createColoredIcon('#64748b'),    // slate
};

function getIcon(status: string) {
    const s = status?.toUpperCase();
    if (s === 'DELIVERED' || s === 'ARRIVED') return ICONS.delivered;
    if (s === 'IN_TRANSIT' || s === 'IN TRANSIT') return ICONS.inTransit;
    if (s === 'BOOKED') return ICONS.booked;
    return ICONS.default;
}

// Auto-fit bounds to all markers
function FitBounds({ shipments }: { shipments: Shipment[] }) {
    const map = useMap();

    useEffect(() => {
        const validShipments = shipments.filter(s => s.latitude && s.longitude);
        if (validShipments.length === 0) return;

        const bounds = L.latLngBounds(
            validShipments.map(s => [s.latitude!, s.longitude!] as L.LatLngTuple)
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
    }, [shipments, map]);

    return null;
}

interface DashboardMapProps {
    shipments: Shipment[];
    onShipmentClick?: (shipment: Shipment) => void;
}

export function DashboardMap({ shipments, onShipmentClick }: DashboardMapProps) {
    const validShipments = shipments.filter(s => s.latitude && s.longitude);

    if (validShipments.length === 0) {
        return (
            <div className="h-full w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-sm font-medium">No location data available</p>
                    <p className="text-xs mt-1">Shipments with GPS data will appear on the map</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative z-0 rounded-xl overflow-hidden">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <FitBounds shipments={validShipments} />
                {validShipments.map((shipment) => (
                    <Marker
                        key={shipment.id}
                        position={[shipment.latitude!, shipment.longitude!]}
                        icon={getIcon(shipment.current_status)}
                        eventHandlers={{
                            click: () => onShipmentClick?.(shipment),
                        }}
                    >
                        <Popup>
                            <div className="text-xs min-w-[160px]">
                                <div className="font-bold text-slate-900 text-sm mb-1">{shipment.tracking_number}</div>
                                <div className="text-slate-600">{shipment.origin} → {shipment.destination}</div>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className={`inline-block w-2 h-2 rounded-full ${
                                        shipment.current_status?.toUpperCase() === 'DELIVERED' ? 'bg-emerald-500' :
                                        shipment.current_status?.toUpperCase() === 'IN_TRANSIT' ? 'bg-orange-500' :
                                        'bg-blue-500'
                                    }`}></span>
                                    <span className="font-medium">{shipment.current_status}</span>
                                </div>
                                {shipment.eta && (
                                    <div className="text-slate-400 mt-1">ETA: {new Date(shipment.eta).toLocaleDateString()}</div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Legend */}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/80 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 flex gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> In Transit</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Delivered</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Booked</span>
            </div>
        </div>
    );
}
