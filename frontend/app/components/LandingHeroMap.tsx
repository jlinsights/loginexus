'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
// @ts-expect-error - Leaflet icon fix for Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored marker icons - Smaller for hero map
function createColoredIcon(color: string) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 10px; height: 10px; border-radius: 50%;
            background: ${color}; border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        popupAnchor: [0, -6],
    });
}

const ICONS = {
    orange: createColoredIcon('#f97316'),
    emerald: createColoredIcon('#10b981'),
    blue: createColoredIcon('#3b82f6'),
};

// Mock Data for Landing Page
interface MockShipment {
    id: string;
    lat: number;
    lng: number;
    status: 'orange' | 'emerald' | 'blue';
    route: string;
}

const MOCK_SHIPMENTS: MockShipment[] = [
    { id: '1', lat: 34.0522, lng: -118.2437, status: 'orange', route: 'LAX → ICN' }, // Los Angeles
    { id: '2', lat: 37.7749, lng: -122.4194, status: 'blue', route: 'SFO → NRT' }, // San Francisco
    { id: '3', lat: 40.7128, lng: -74.0060, status: 'emerald', route: 'JFK → LHR' }, // New York
    { id: '4', lat: 51.5074, lng: -0.1278, status: 'orange', route: 'LHR → DXB' }, // London
    { id: '5', lat: 48.8566, lng: 2.3522, status: 'blue', route: 'CDG → SIN' }, // Paris
    { id: '6', lat: 35.6762, lng: 139.6503, status: 'emerald', route: 'NRT → LAX' }, // Tokyo
    { id: '7', lat: 37.5665, lng: 126.9780, status: 'orange', route: 'ICN → SFO' }, // Seoul
    { id: '8', lat: 22.3193, lng: 114.1694, status: 'blue', route: 'HKG → JFK' }, // Hong Kong
    { id: '9', lat: 1.3521, lng: 103.8198, status: 'emerald', route: 'SIN → LHR' }, // Singapore
    { id: '10', lat: 25.2048, lng: 55.2708, status: 'orange', route: 'DXB → CDG' }, // Dubai
    { id: '11', lat: -33.8688, lng: 151.2093, status: 'blue', route: 'SYD → ICN' }, // Sydney
    { id: '12', lat: 19.4326, lng: -99.1332, status: 'emerald', route: 'MEX → LAX' }, // Mexico City
    { id: '13', lat: -23.5505, lng: -46.6333, status: 'orange', route: 'GRU → JFK' }, // Sao Paulo
    { id: '14', lat: 55.7558, lng: 37.6173, status: 'blue', route: 'SVO → DXB' }, // Moscow
    { id: '15', lat: 31.2304, lng: 121.4737, status: 'orange', route: 'PVG → LAX' }, // Shanghai
];

// Auto-fit bounds
function FitBounds() {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLngBounds(MOCK_SHIPMENTS.map(s => [s.lat, s.lng] as L.LatLngTuple));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 3 });
        // Disable interaction
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((map as any).tap) (map as any).tap.disable();
    }, [map]);
    return null;
}

export function LandingHeroMap() {
    return (
        <div className="h-full w-full bg-slate-900">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                zoomControl={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
            >
                {/* Dark Matter CartoDB Layer */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    opacity={0.6}
                />
                <FitBounds />
                
                {/* Visual Markers */}
                {MOCK_SHIPMENTS.map((s) => (
                    <Marker
                        key={s.id}
                        position={[s.lat, s.lng]}
                        icon={ICONS[s.status]}
                    >
                        {/* Auto-open popup on hover effect simulated by CSS if needed, or just static */}
                    </Marker>
                ))}
            </MapContainer>
            
            {/* Visual Overlay Gradient to blend with Hero */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-[1000] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-[1000] pointer-events-none" />
        </div>
    );
}
