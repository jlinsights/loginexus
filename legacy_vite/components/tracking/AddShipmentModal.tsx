import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Shared';
import { Shipment } from '../../types';

interface AddShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (shipment: Shipment) => void;
}

export const AddShipmentModal: React.FC<AddShipmentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
    origin: '',
    destination: '',
    status: 'Pending',
    eta: '',
    type: 'Sea',
    progress: 0,
    notes: ''
  });

  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        // Clamp between 0 and 100
        const percentage = Math.min(Math.max(Math.round((x / width) * 100), 0), 100);
        setNewShipment(prev => ({ ...prev, progress: percentage }));
    }
  };

  const handleAddShipment = () => {
    const id = `SHP-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const shipmentToAdd: Shipment = {
        id,
        origin: newShipment.origin || 'Unknown Origin',
        destination: newShipment.destination || 'Unknown Destination',
        status: (newShipment.status as any) || 'Pending',
        eta: newShipment.eta || 'TBD',
        type: (newShipment.type as any) || 'Sea',
        progress: newShipment.progress || 0,
        notes: newShipment.notes || '',
        documents: [],
        carrier: 'Pending Assignment'
    };

    onAdd(shipmentToAdd);
    onClose();
    
    // Reset form
    setNewShipment({
        origin: '',
        destination: '',
        status: 'Pending',
        eta: '',
        type: 'Sea',
        progress: 0,
        notes: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Add New Shipment</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Origin</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="City, Country"
                            value={newShipment.origin}
                            onChange={e => setNewShipment({...newShipment, origin: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Destination</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="City, Country"
                            value={newShipment.destination}
                            onChange={e => setNewShipment({...newShipment, destination: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                        <select 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={newShipment.type}
                            onChange={e => setNewShipment({...newShipment, type: e.target.value as any})}
                        >
                            <option value="Sea">Sea Freight</option>
                            <option value="Air">Air Freight</option>
                            <option value="Road">Road Freight</option>
                            <option value="Rail">Rail Freight</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                        <select 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={newShipment.status}
                            onChange={e => setNewShipment({...newShipment, status: e.target.value as any})}
                        >
                            <option value="Pending">Pending</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Customs Hold">Customs Hold</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Exception">Exception</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Estimated Arrival (ETA)</label>
                    <input 
                        type="text" 
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Nov 15"
                        value={newShipment.eta}
                        onChange={e => setNewShipment({...newShipment, eta: e.target.value})}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Progress</label>
                        <div className="flex items-center gap-1">
                            <input 
                                type="number" 
                                min="0" 
                                max="100"
                                className="w-12 text-right text-xs font-bold text-blue-600 border-b border-blue-200 focus:border-blue-600 outline-none bg-transparent"
                                value={newShipment.progress || 0}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                        setNewShipment({...newShipment, progress: Math.min(Math.max(val, 0), 100)});
                                    }
                                }}
                            />
                            <span className="text-xs font-bold text-blue-600">%</span>
                        </div>
                    </div>
                    
                    <div 
                        className="relative w-full h-4 bg-slate-200 rounded-full cursor-pointer group"
                        ref={progressBarRef}
                        onMouseDown={handleProgressChange}
                        onMouseMove={(e) => {
                            if (e.buttons === 1) handleProgressChange(e);
                        }}
                    >
                        <div 
                            className="absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-75"
                            style={{ width: `${newShipment.progress || 0}%` }}
                        ></div>
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md transform transition-transform group-hover:scale-110"
                            style={{ left: `calc(${newShipment.progress || 0}% - 10px)` }}
                        ></div>
                    </div>

                    <div className="flex justify-between gap-1">
                        {[0, 25, 50, 75, 100].map(step => (
                            <button
                                key={step}
                                onClick={() => setNewShipment({...newShipment, progress: step})}
                                className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                                    (newShipment.progress || 0) === step 
                                    ? 'bg-blue-100 text-blue-700 font-bold' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {step}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Notes</label>
                    <textarea 
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                        placeholder="Add any internal notes or remarks..."
                        value={newShipment.notes}
                        onChange={e => setNewShipment({...newShipment, notes: e.target.value})}
                    />
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleAddShipment}>Create Shipment</Button>
            </div>
        </div>
    </div>
  );
};
