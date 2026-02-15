import { Shipment } from '../types';
import { Ship, Plane, Truck } from 'lucide-react';
import React from 'react';

export const VOLUME_DATA = [
  { name: 'Jan', fcl: 40, lcl: 24 },
  { name: 'Feb', fcl: 30, lcl: 13 },
  { name: 'Mar', fcl: 20, lcl: 58 },
  { name: 'Apr', fcl: 27, lcl: 39 },
  { name: 'May', fcl: 18, lcl: 48 },
  { name: 'Jun', fcl: 23, lcl: 38 },
  { name: 'Jul', fcl: 34, lcl: 43 },
];

export const SPEND_DATA = [
  { name: 'Week 1', amount: 12000 },
  { name: 'Week 2', amount: 19000 },
  { name: 'Week 3', amount: 15000 },
  { name: 'Week 4', amount: 22000 },
];

export const RECENT_SHIPMENTS: Shipment[] = [
  { id: 'SHP-2024-001', origin: 'Shanghai (CN)', destination: 'Los Angeles (US)', status: 'In Transit', eta: 'Oct 24', type: 'Sea', progress: 65 },
  { id: 'SHP-2024-002', origin: 'Hamburg (DE)', destination: 'New York (US)', status: 'Customs Hold', eta: 'Oct 28', type: 'Air', progress: 90 },
  { id: 'SHP-2024-003', origin: 'Busan (KR)', destination: 'Rotterdam (NL)', status: 'Pending', eta: 'Nov 05', type: 'Sea', progress: 0 },
  { id: 'SHP-2024-004', origin: 'Tokyo (JP)', destination: 'Singapore (SG)', status: 'Delivered', eta: 'Oct 15', type: 'Air', progress: 100 },
];

export const TRANSPORT_MODES = [
  { id: 'sea' as const, label: 'Ocean Freight', icon: Ship, desc: 'FCL & LCL services' },
  { id: 'air' as const, label: 'Air Freight', icon: Plane, desc: 'Express & Standard' },
  { id: 'road' as const, label: 'Inland Transport', icon: Truck, desc: 'Trucking & Rail' },
];

export const INCOTERMS = [
  'FOB (Free On Board)',
  'EXW (Ex Works)',
  'CIF (Cost, Insurance & Freight)',
  'DDP (Delivered Duty Paid)',
];
