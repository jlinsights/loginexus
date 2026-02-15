export type NavigationItem = 'dashboard' | 'tracking' | 'quote' | 'insights';

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delivered' | 'Pending' | 'Customs Hold' | 'Exception';
  eta: string;
  type: 'Sea' | 'Air' | 'Rail' | 'Road';
  progress: number;
  notes?: string;
  documents?: {
    name: string;
    type: string;
    date: string;
  }[];
  carrier?: string;
  carrierDetails?: {
    phone: string;
    email: string;
    website?: string;
    operationalHours?: string;
  };
  packageDetails?: {
    weight: string;
    volume: string;
    dimensions: string;
    commodity: string;
    count: number;
    packType: string;
  };
  hazardousMaterial?: {
    unNumber: string;
    class: string;
    properShippingName: string;
    packingGroup?: string;
    flashPoint?: string;
  };
}

export interface QuoteRequest {
  origin: string;
  destination: string;
  readyDate: string;
  cargoType: 'FCL' | 'LCL' | 'Air';
  weight: number;
  volume: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum InsightType {
  MARKET_TREND = 'MARKET_TREND',
  ROUTE_OPTIMIZATION = 'ROUTE_OPTIMIZATION',
  RISK_ALERT = 'RISK_ALERT'
}

export interface MarketInsight {
  title: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
  type: InsightType;
}