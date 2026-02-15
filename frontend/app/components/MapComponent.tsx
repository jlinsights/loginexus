'use client'

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
    coordinates: [number, number]; // [lat, lng]
    popupText?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({ coordinates, popupText }) => {
    // Basic check for coordinates
    if (!coordinates) return <div className="bg-slate-100 h-full w-full flex items-center justify-center text-slate-400">No Location Data</div>;

    return (
        <div className="h-full w-full relative z-0">
             <MapContainer center={coordinates} zoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coordinates}>
                    <Popup>
                        {popupText || "Shipment Location"}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};
