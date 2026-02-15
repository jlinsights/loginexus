import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Shipment } from '../types';
import { RECENT_SHIPMENTS } from '../constants/data';

interface ShipmentContextType {
  shipments: Shipment[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  addShipment: (shipment: Shipment) => void;
  getShipment: (id: string) => Shipment | undefined;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with data from constants
  const [shipments, setShipments] = useState<Shipment[]>(RECENT_SHIPMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(shipments[0]?.id || null);

  const addShipment = (shipment: Shipment) => {
    setShipments(prev => [shipment, ...prev]);
    setSelectedId(shipment.id);
  };

  const getShipment = (id: string) => shipments.find(s => s.id === id);

  return (
    <ShipmentContext.Provider value={{ shipments, selectedId, setSelectedId, addShipment, getShipment }}>
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (context === undefined) {
    throw new Error('useShipments must be used within a ShipmentProvider');
  }
  return context;
};
