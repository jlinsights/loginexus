import React, { useState } from 'react';
import React, { useState } from 'react';
import { Search, MapPin, Truck, Ship, Plane, Filter, Box, Anchor, Navigation, Phone, Mail, Globe, ExternalLink, Clock, Layers, Scale, Ruler, AlertTriangle, FileText, X } from 'lucide-react';
import { Card, Badge, Button } from './Shared';
import { Shipment } from '../types';
import { useShipments } from '../contexts/ShipmentContext';
import { MapVisualization } from './tracking/MapVisualization';
import { TimelineStepper } from './tracking/TimelineStepper';
import { DetailCard } from './tracking/DetailCard';
import { AddShipmentModal } from './tracking/AddShipmentModal';
import { DocumentPreview } from './tracking/DocumentPreview';

export const Tracking: React.FC = () => {
  const { shipments, selectedId, setSelectedId, addShipment } = useShipments();
  
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string } | null>(null);
  
  const selectedShipment = shipments.find(s => s.id === selectedId);

  const filteredShipments = shipments.filter(s => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      s.id.toLowerCase().includes(searchLower) || 
      s.origin.toLowerCase().includes(searchLower) || 
      s.destination.toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tracking Center</h2>
          <p className="text-slate-500 mt-1">Monitor your shipments in real-time across the globe.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">Export Report</Button>
            <Button onClick={() => setIsModalOpen(true)}>Add Shipment</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* List Panel */}
        <Card className="lg:w-1/3 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search BL, Container, or Ref..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-700"
                    >
                        <option value="All">Status</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Pending">Pending</option>
                        <option value="Customs Hold">Customs Hold</option>
                        <option value="Exception">Exception</option>
                    </select>
                </div>

                <div className="relative flex-1">
                    <Box className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-700"
                    >
                        <option value="All">Type</option>
                        <option value="Sea">Sea</option>
                        <option value="Air">Air</option>
                        <option value="Road">Road</option>
                        <option value="Rail">Rail</option>
                    </select>
                </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredShipments.length > 0 ? (
                filteredShipments.map((shipment) => (
                  <div 
                    key={shipment.id}
                    onClick={() => setSelectedId(shipment.id)}
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedId === shipment.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-900 text-sm">{shipment.id}</span>
                      <Badge status={shipment.status} />
                    </div>
                    <div className="flex items-center text-xs text-slate-500 gap-2 mb-3">
                        {shipment.type === 'Sea' && <Ship size={14} />}
                        {shipment.type === 'Air' && <Plane size={14} />}
                        <span className="truncate">{shipment.origin}</span>
                        <span>→</span>
                        <span className="truncate">{shipment.destination}</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${shipment.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-medium text-slate-600">{shipment.progress}%</span>
                        <span>ETA: {shipment.eta}</span>
                    </div>
                  </div>
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                    No shipments found matching "{searchQuery}"
                    {(statusFilter !== 'All' || typeFilter !== 'All') ? ' with selected filters' : ''}.
                </div>
            )}
          </div>
        </Card>

        {/* Detail/Map Panel */}
        <Card className="lg:w-2/3 flex flex-col h-full overflow-hidden">
            {selectedShipment ? (
                <>
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{selectedShipment.id}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                {selectedShipment.type === 'Sea' ? <Ship size={16} /> : <Plane size={16} />}
                                <span>{selectedShipment.type} Freight</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">Estimated Arrival</div>
                            <div className="text-lg font-bold text-slate-900">{selectedShipment.eta}</div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {/* Interactive Map Visualization */}
                        <MapVisualization shipment={selectedShipment} />

                        {/* Additional Shipment Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <DetailCard 
                                icon={Anchor} 
                                label="Carrier" 
                                value={selectedShipment.carrier || 'Unknown Carrier'} 
                                onClick={() => setActiveDetail({
                                    title: 'Carrier Information',
                                    content: (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                                                    <Anchor size={24} className="text-blue-600" /> 
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">{selectedShipment.carrier || 'Unknown Carrier'}</div>
                                                    <div className="text-xs text-slate-500">Global Logistics Partner</div>
                                                </div>
                                            </div>
                                            {selectedShipment.carrierDetails ? (
                                                <div className="space-y-3">
                                                    {/* Contact Info Group */}
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Contact</div>
                                                        <a href={`tel:${selectedShipment.carrierDetails.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                <Phone size={16} />
                                                            </div>
                                                            <span>{selectedShipment.carrierDetails.phone}</span>
                                                        </a>
                                                        <a href={`mailto:${selectedShipment.carrierDetails.email}`} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                <Mail size={16} />
                                                            </div>
                                                            <span>{selectedShipment.carrierDetails.email}</span>
                                                        </a>
                                                    </div>

                                                    {/* Operational Hours Section */}
                                                    {selectedShipment.carrierDetails.operationalHours && (
                                                        <div className="pt-2 border-t border-slate-100">
                                                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">Hours</div>
                                                            <div className="flex items-center gap-3 text-sm p-2 bg-slate-50/50 rounded-lg">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                                    <Clock size={16} />
                                                                </div>
                                                                <span className="font-medium text-slate-700">{selectedShipment.carrierDetails.operationalHours}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Website Section */}
                                                    {selectedShipment.carrierDetails.website && (
                                                        <div className="pt-2">
                                                             <a href={`https://${selectedShipment.carrierDetails.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                    <Globe size={16} />
                                                                </div>
                                                                <span>{selectedShipment.carrierDetails.website}</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-slate-400 text-sm py-4">No contact details available.</div>
                                            )}
                                        </div>
                                    )
                                })}
                            />
                            
                            <DetailCard 
                                icon={Navigation} 
                                label="Voyage No." 
                                value="204E"
                                onClick={() => setActiveDetail({
                                    title: 'Voyage Details',
                                    content: (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                    <span className="text-sm text-slate-500">Vessel Name</span>
                                                    <span className="font-semibold text-slate-900">MAERSK EINDHOVEN</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                    <span className="text-sm text-slate-500">IMO Number</span>
                                                    <span className="font-mono font-medium text-slate-700">9456771</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                    <span className="text-sm text-slate-500">Flag</span>
                                                    <span className="flex items-center gap-2 font-medium text-slate-700">
                                                        🇩🇰 Denmark
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Service Loop</span>
                                                    <span className="font-medium text-slate-700">AE10</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                                Full Schedule <ExternalLink size={14} />
                                            </Button>
                                        </div>
                                    )
                                })}
                            />

                            <DetailCard 
                                icon={MapPin} 
                                label="Current Location" 
                                value="Pacific Ocean" 
                            />

                            <DetailCard 
                                icon={Box} 
                                label="Container" 
                                value="MSKU0928374"
                                onClick={() => setActiveDetail({
                                    title: 'Container Details',
                                    content: (
                                        <div className="space-y-4">
                                            <div className="bg-slate-900 text-white p-6 rounded-xl text-center shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                                    <Box size={64} />
                                                </div>
                                                <div className="text-2xl font-mono font-bold tracking-widest relative z-10">MSKU 092837 4</div>
                                                <div className="text-xs text-blue-200 mt-1 relative z-10">45G1 / 40' HIGH CUBE</div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tare Weight</div>
                                                    <div className="font-bold text-slate-800">3,800 kg</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Max Payload</div>
                                                    <div className="font-bold text-slate-800">28,700 kg</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Volume</div>
                                                    <div className="font-bold text-slate-800">76.4 m³</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Seal No.</div>
                                                    <div className="font-bold text-slate-800">ML-88372</div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            />
                        </div>

                        {/* Cargo Information Section */}
                        {(selectedShipment.packageDetails || selectedShipment.hazardousMaterial) && (
                            <div className="mb-8">
                                <h4 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                    <Layers size={14} className="text-blue-600" />
                                    Cargo Information
                                </h4>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    {selectedShipment.packageDetails && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Scale size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Weight</div>
                                                    <div className="text-sm font-semibold text-slate-800">{selectedShipment.packageDetails.weight}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Box size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Volume</div>
                                                    <div className="text-sm font-semibold text-slate-800">{selectedShipment.packageDetails.volume}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Ruler size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Dimensions</div>
                                                    <div className="text-sm font-semibold text-slate-800">{selectedShipment.packageDetails.dimensions}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Box size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Commodity</div>
                                                    <div className="text-sm font-semibold text-slate-800 truncate" title={selectedShipment.packageDetails.commodity}>
                                                        {selectedShipment.packageDetails.commodity}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedShipment.hazardousMaterial && (
                                        <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 animate-pulse">
                                            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                            <div className="flex-1">
                                                <h5 className="font-bold text-red-800 text-sm flex items-center justify-between">
                                                    Hazardous Material Information
                                                    <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded uppercase tracking-wider">Dangerous Goods</span>
                                                </h5>
                                                <div className="text-xs text-red-700 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div>
                                                        <span className="block opacity-60">UN Number</span>
                                                        <span className="font-mono font-bold">{selectedShipment.hazardousMaterial.unNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block opacity-60">Class</span>
                                                        <span className="font-bold">{selectedShipment.hazardousMaterial.class}</span>
                                                    </div>
                                                    <div className="col-span-2 sm:col-span-2">
                                                        <span className="block opacity-60">Proper Shipping Name</span>
                                                        <span className="font-bold">{selectedShipment.hazardousMaterial.properShippingName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Shipment Documents */}
                        {selectedShipment.documents && selectedShipment.documents.length > 0 && (
                             <div className="mb-8">
                                <h4 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                   Shipment Documents <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{selectedShipment.documents.length}</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {selectedShipment.documents.map((doc, i) => (
                                    <div key={i} onClick={() => setViewingDocument(doc)} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group">
                                       <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3 group-hover:bg-blue-100 transition-colors">
                                          <FileText size={20} />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                                          <div className="text-xs text-slate-500">{doc.date} • {doc.type.toUpperCase()}</div>
                                       </div>
                                       <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                                    </div>
                                  ))}
                                </div>
                             </div>
                        )}

                        {/* Horizontal Visual Timeline */}
                        <div className="mb-8 bg-slate-50 rounded-xl border border-slate-100 p-4">
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm">Shipment Progress</h4>
                            <TimelineStepper progress={selectedShipment.progress} status={selectedShipment.status} />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Select a shipment to view details
                </div>
            )}
        </Card>
      </div>

      <AddShipmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addShipment} 
      />

      {activeDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{activeDetail.title}</h3>
                    <button onClick={() => setActiveDetail(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} /> // Fix: X is not imported, need to import it or pass onClose to a Modal component
                    </button> // Note: X is not imported in import list? Checked: imported.
                </div>
                <div className="p-5">
                    {activeDetail.content}
                </div>
            </div>
        </div>
      )}

      <DocumentPreview 
        document={viewingDocument} 
        shipment={selectedShipment} 
        onClose={() => setViewingDocument(null)} 
      />
    </div>
  );
};

  // Simple coordinate mapping (0-100 scale for x and y on an equirectangular-ish projection)
  const getCityCoordinates = (city: string): [number, number] => {
    const coords: Record<string, [number, number]> = {
      'Shanghai (CN)': [82, 45],
      'Los Angeles (US)': [15, 40],
      'New York (US)': [28, 35],
      'Hamburg (DE)': [52, 25],
      'Rotterdam (NL)': [50, 26],
      'Busan (KR)': [85, 44],
      'Tokyo (JP)': [90, 42],
      'Singapore (SG)': [78, 60],
      'Dubai (AE)': [62, 48],
      'London (UK)': [48, 28],
    };
    if (coords[city]) return coords[city];
    
    // Fallback: stable random-like position based on string hashing
    const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [(hash % 70) + 15, (hash % 50) + 25];
  };

  useEffect(() => {
    const s = getCityCoordinates(shipment.origin);
    const e = getCityCoordinates(shipment.destination);
    setStart(s);
    setEnd(e);
    // Reset zoom when shipment changes
    setZoom(1);
  }, [shipment]);

  // Calculate current position along quadratic bezier
  useEffect(() => {
    const t = shipment.progress / 100;
    
    // Control point logic to create an arc
    // Midpoint X, and arched Y (higher means lower Y value in SVG coords)
    const mx = (start[0] + end[0]) / 2;
    // Arch height varies by distance
    const dist = Math.abs(start[0] - end[0]);
    const archHeight = dist > 40 ? 20 : 10;
    const my = Math.min(start[1], end[1]) - archHeight;
    
    const cx = mx;
    const cy = my;

    // Quadratic Bezier formula
    // B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
    const x = Math.pow(1 - t, 2) * start[0] + 2 * (1 - t) * t * cx + Math.pow(t, 2) * end[0];
    const y = Math.pow(1 - t, 2) * start[1] + 2 * (1 - t) * t * cy + Math.pow(t, 2) * end[1];
    setCurrent([x, y]);
  }, [start, end, shipment.progress]);

  // Calculate SVG Path Data
  const mx = (start[0] + end[0]) / 2;
  const dist = Math.abs(start[0] - end[0]);
  const archHeight = dist > 40 ? 20 : 10;
  const my = Math.min(start[1], end[1]) - archHeight;
  const pathD = `M ${start[0]} ${start[1]} Q ${mx} ${my} ${end[0]} ${end[1]}`;

  // Zoom Logic
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoom(1);

  // ViewBox Calculation
  const size = 100 / zoom;
  const offset = (100 - size) / 2;
  const viewBox = `${offset} ${offset} ${size} ${size}`;

  return (
    <div className="w-full h-80 bg-slate-900 rounded-xl relative overflow-hidden shadow-inner group border border-slate-800 mb-6">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      {/* Abstract World Map Silhouette */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg viewBox={viewBox} preserveAspectRatio="none" className="w-full h-full fill-slate-400 transition-all duration-500 ease-in-out">
           {/* Rough polygonal approximations of continents for a 'cyber' aesthetic */}
           <path d="M5,15 L25,10 L35,25 L30,45 L15,50 L5,35 Z" /> {/* North America */}
           <path d="M20,55 L35,52 L40,70 L30,85 L20,75 Z" /> {/* South America */}
           <path d="M42,15 L60,10 L65,30 L55,45 L42,35 Z" /> {/* Europe */}
           <path d="M45,50 L65,48 L70,70 L55,80 L45,75 Z" /> {/* Africa */}
           <path d="M68,15 L95,10 L95,50 L80,55 L65,40 Z" /> {/* Asia */}
           <path d="M75,65 L90,65 L90,80 L75,80 Z" /> {/* Australia */}
        </svg>
      </div>

      {/* Interactive Layer */}
      <svg viewBox={viewBox} preserveAspectRatio="none" className="absolute inset-0 w-full h-full transition-all duration-500 ease-in-out">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Origin Marker */}
        <circle cx={start[0]} cy={start[1]} r="1.5" fill="#3b82f6" className="animate-pulse" />
        <circle cx={start[0]} cy={start[1]} r="0.5" fill="#white" />
        <text x={start[0]} y={start[1] + 6} fontSize="3" fill="#94a3b8" textAnchor="middle" className="font-mono font-bold tracking-wider uppercase opacity-70">{shipment.origin.split(' ')[0]}</text>

        {/* Destination Marker */}
        <circle cx={end[0]} cy={end[1]} r="1.5" fill="#10b981" className="animate-pulse" />
        <circle cx={end[0]} cy={end[1]} r="0.5" fill="#white" />
        <text x={end[0]} y={end[1] + 6} fontSize="3" fill="#94a3b8" textAnchor="middle" className="font-mono font-bold tracking-wider uppercase opacity-70">{shipment.destination.split(' ')[0]}</text>

        {/* Route Path */}
        {/* Shadow path */}
        <path d={pathD} stroke="#1e293b" strokeWidth="1" fill="none" />
        {/* Main path */}
        <path d={pathD} stroke="url(#routeGradient)" strokeWidth="0.5" fill="none" strokeDasharray="1 1" />
        
        {/* Vehicle */}
        <g transform={`translate(${current[0]}, ${current[1]})`} filter="url(#glow)">
           <circle r="3" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
           <circle r="1.2" fill="#ffffff" />
           {/* Tooltip-like label near vehicle */}
           <text x="0" y="-3" fontSize="2.5" fill="white" textAnchor="middle" fontWeight="bold">
             {shipment.type === 'Sea' ? 'VESSEL' : 'FLIGHT'}
           </text>
        </g>
      </svg>
      
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs text-slate-300 font-mono shadow-xl">
         <div className="flex items-center gap-2 mb-2 text-green-400 font-bold">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            LIVE TRACKING
         </div>
         <div className="space-y-1 opacity-80">
            <div className="flex justify-between gap-4"><span>LAT:</span> <span className="text-white">{current[1].toFixed(4)} N</span></div>
            <div className="flex justify-between gap-4"><span>LNG:</span> <span className="text-white">{current[0].toFixed(4)} E</span></div>
            <div className="flex justify-between gap-4"><span>SPD:</span> <span className="text-white">24.5 KN</span></div>
            <div className="flex justify-between gap-4"><span>HDG:</span> <span className="text-white">094° E</span></div>
            <div className="flex justify-between gap-4 text-blue-300 border-t border-slate-700 pt-1 mt-1"><span>ZOOM:</span> <span className="text-white">{zoom.toFixed(1)}x</span></div>
         </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
         <button 
           onClick={handleZoomIn}
           className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-lg active:scale-95"
           title="Zoom In"
         >
            <ZoomIn size={16} />
         </button>
         <button 
           onClick={handleZoomOut}
           className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-lg active:scale-95"
           title="Zoom Out"
         >
            <ZoomOut size={16} />
         </button>
         <button 
           onClick={handleResetZoom}
           className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-lg active:scale-95"
           title="Reset View"
         >
            <Maximize size={16} />
         </button>
      </div>
    </div>
  );
};

const TimelineStepper: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
  const steps = [
    { label: 'Booked', pct: 0 },
    { label: 'Export', pct: 25 },
    { label: 'Departed', pct: 50 },
    { label: 'Arrival', pct: 75 },
    { label: 'Delivered', pct: 100 },
  ];

  let activeIndex = 0;
  if (status === 'Delivered') activeIndex = 4;
  else if (progress >= 80) activeIndex = 3;
  else if (progress >= 50) activeIndex = 2;
  else if (progress >= 20) activeIndex = 1;

  return (
    <div className="w-full py-4 px-2">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-3 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
        <div 
            className="absolute left-0 top-3 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={index} className="flex flex-col items-center relative">
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white
                ${isCompleted ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}
                ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                `}
              >
                 {isCompleted && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className={`mt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-colors duration-300 ${isCompleted ? 'text-blue-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DetailCard: React.FC<{ icon: any; label: string; value: string; onClick?: () => void }> = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick 
  }) => (
    <div 
        onClick={onClick}
        className={`p-3 bg-slate-50 rounded-lg border border-slate-100 transition-all group relative ${onClick ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm' : ''}`}
    >
        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Icon size={12} />
            {label}
        </div>
        <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
            {value}
            {onClick && <Info size={12} className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity absolute right-2 top-2" />}
        </div>
    </div>
);

export const Tracking: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([
    { 
      id: 'SHP-2024-001', 
      origin: 'Shanghai (CN)', 
      destination: 'Los Angeles (US)', 
      status: 'In Transit', 
      eta: 'Oct 24', 
      type: 'Sea', 
      progress: 65, 
      notes: 'Priority handling required for electronics.',
      carrier: 'Maersk Line',
      carrierDetails: {
        phone: '+45 33 63 33 63',
        email: 'support@maersk.com',
        website: 'www.maersk.com',
        operationalHours: 'Mon-Fri: 08:30 - 17:00 CET'
      },
      packageDetails: {
        weight: '28,700 kg',
        volume: '76.4 cbm',
        dimensions: '40 x 8 x 9.5 ft',
        commodity: 'Electronic Components',
        count: 1450,
        packType: 'Cartons'
      },
      hazardousMaterial: {
        unNumber: 'UN 3480',
        class: '9',
        properShippingName: 'Lithium Ion Batteries',
        packingGroup: 'II',
        flashPoint: 'N/A'
      },
      documents: [
          { name: 'Bill of Lading', type: 'PDF', date: 'Oct 03, 2024' },
          { name: 'Commercial Invoice', type: 'PDF', date: 'Oct 01, 2024' },
          { name: 'Packing List', type: 'PDF', date: 'Oct 01, 2024' },
          { name: 'Dangerous Goods Declaration', type: 'PDF', date: 'Oct 01, 2024' }
      ]
    },
    { 
      id: 'SHP-2024-002', 
      origin: 'Hamburg (DE)', 
      destination: 'New York (US)', 
      status: 'Customs Hold', 
      eta: 'Oct 28', 
      type: 'Air', 
      progress: 90, 
      notes: 'Awaiting commercial invoice correction.',
      carrier: 'Lufthansa Cargo',
      carrierDetails: {
        phone: '+49 69 696 0',
        email: 'cargo@lufthansa.com',
        website: 'lufthansa-cargo.com',
        operationalHours: '24/7 Cargo Operations'
      },
      packageDetails: {
        weight: '4,250 kg',
        volume: '12.5 cbm',
        dimensions: '20 x Pallets',
        commodity: 'Automotive Parts',
        count: 20,
        packType: 'Pallets'
      },
      documents: [
          { name: 'Air Waybill', type: 'PDF', date: 'Oct 20, 2024' },
          { name: 'Customs Declaration', type: 'PDF', date: 'Oct 21, 2024' }
      ]
    },
    { 
      id: 'SHP-2024-003', 
      origin: 'Busan (KR)', 
      destination: 'Rotterdam (NL)', 
      status: 'Pending', 
      eta: 'Nov 05', 
      type: 'Sea', 
      progress: 0,
      carrier: 'HMM',
      carrierDetails: {
        phone: '+82 2 3706 5114',
        email: 'cs@hmm21.com',
        website: 'www.hmm21.com',
        operationalHours: 'Mon-Fri: 09:00 - 18:00 KST'
      }
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>(shipments[0].id);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string } | null>(null);
  
  const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
    origin: '',
    destination: '',
    status: 'Pending',
    eta: '',
    type: 'Sea',
    progress: 0,
    notes: ''
  });

  // Ref for the progress bar to calculate coordinates accurately
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

    setShipments(prev => [shipmentToAdd, ...prev]);
    setSelectedId(id);
    setIsModalOpen(false);
    
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
  
  const selectedShipment = shipments.find(s => s.id === selectedId);

  const filteredShipments = shipments.filter(s => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      s.id.toLowerCase().includes(searchLower) || 
      s.origin.toLowerCase().includes(searchLower) || 
      s.destination.toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tracking Center</h2>
          <p className="text-slate-500 mt-1">Monitor your shipments in real-time across the globe.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">Export Report</Button>
            <Button onClick={() => setIsModalOpen(true)}>Add Shipment</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* List Panel */}
        <Card className="lg:w-1/3 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search BL, Container, or Ref..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-700"
                    >
                        <option value="All">Status</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Pending">Pending</option>
                        <option value="Customs Hold">Customs Hold</option>
                        <option value="Exception">Exception</option>
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <div className="relative flex-1">
                    <Box className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-700"
                    >
                        <option value="All">Type</option>
                        <option value="Sea">Sea</option>
                        <option value="Air">Air</option>
                        <option value="Road">Road</option>
                        <option value="Rail">Rail</option>
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredShipments.length > 0 ? (
                filteredShipments.map((shipment) => (
                  <div 
                    key={shipment.id}
                    onClick={() => setSelectedId(shipment.id)}
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedId === shipment.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-900 text-sm">{shipment.id}</span>
                      <Badge status={shipment.status} />
                    </div>
                    <div className="flex items-center text-xs text-slate-500 gap-2 mb-3">
                        {shipment.type === 'Sea' && <Ship size={14} />}
                        {shipment.type === 'Air' && <Plane size={14} />}
                        <span className="truncate">{shipment.origin}</span>
                        <span>→</span>
                        <span className="truncate">{shipment.destination}</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${shipment.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-medium text-slate-600">{shipment.progress}%</span>
                        <span>ETA: {shipment.eta}</span>
                    </div>
                  </div>
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                    No shipments found matching "{searchQuery}"
                    {(statusFilter !== 'All' || typeFilter !== 'All') ? ' with selected filters' : ''}.
                </div>
            )}
          </div>
        </Card>

        {/* Detail/Map Panel */}
        <Card className="lg:w-2/3 flex flex-col h-full overflow-hidden">
            {selectedShipment ? (
                <>
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{selectedShipment.id}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                {selectedShipment.type === 'Sea' ? <Ship size={16} /> : <Plane size={16} />}
                                <span>{selectedShipment.type} Freight</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">Estimated Arrival</div>
                            <div className="text-lg font-bold text-slate-900">{selectedShipment.eta}</div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {/* Interactive Map Visualization */}
                        <MapVisualization shipment={selectedShipment} />

                        {/* Additional Shipment Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <DetailCard 
                                icon={Anchor} 
                                label="Carrier" 
                                value={selectedShipment.carrier || 'Unknown Carrier'} 
                                onClick={() => setActiveDetail({
                                    title: 'Carrier Information',
                                    content: (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                                                    <Anchor size={24} className="text-blue-600" /> 
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">{selectedShipment.carrier || 'Unknown Carrier'}</div>
                                                    <div className="text-xs text-slate-500">Global Logistics Partner</div>
                                                </div>
                                            </div>
                                            {selectedShipment.carrierDetails ? (
                                                <div className="space-y-3">
                                                    {/* Contact Info Group */}
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Contact</div>
                                                        <a href={`tel:${selectedShipment.carrierDetails.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                <Phone size={16} />
                                                            </div>
                                                            <span>{selectedShipment.carrierDetails.phone}</span>
                                                        </a>
                                                        <a href={`mailto:${selectedShipment.carrierDetails.email}`} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                <Mail size={16} />
                                                            </div>
                                                            <span>{selectedShipment.carrierDetails.email}</span>
                                                        </a>
                                                    </div>

                                                    {/* Operational Hours Section */}
                                                    {selectedShipment.carrierDetails.operationalHours && (
                                                        <div className="pt-2 border-t border-slate-100">
                                                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">Hours</div>
                                                            <div className="flex items-center gap-3 text-sm p-2 bg-slate-50/50 rounded-lg">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                                    <Clock size={16} />
                                                                </div>
                                                                <span className="font-medium text-slate-700">{selectedShipment.carrierDetails.operationalHours}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Website Section */}
                                                    {selectedShipment.carrierDetails.website && (
                                                        <div className="pt-2">
                                                             <a href={`https://${selectedShipment.carrierDetails.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                                    <Globe size={16} />
                                                                </div>
                                                                <span>{selectedShipment.carrierDetails.website}</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-slate-400 text-sm py-4">No contact details available.</div>
                                            )}
                                            {selectedShipment.carrierDetails?.website ? (
                                                <Button 
                                                    className="w-full flex items-center justify-center gap-2"
                                                    onClick={() => window.open(`https://${selectedShipment.carrierDetails!.website}`, '_blank')}
                                                >
                                                    Visit Carrier Website <ExternalLink size={16} />
                                                </Button>
                                            ) : (
                                                <Button className="w-full">View Carrier Profile</Button>
                                            )}
                                        </div>
                                    )
                                })}
                            />
                            
                            <DetailCard 
                                icon={Navigation} 
                                label="Voyage No." 
                                value="204E"
                                onClick={() => setActiveDetail({
                                    title: 'Voyage Details',
                                    content: (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                    <span className="text-sm text-slate-500">Vessel Name</span>
                                                    <span className="font-semibold text-slate-900">MAERSK EINDHOVEN</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                    <span className="text-sm text-slate-500">IMO Number</span>
                                                    <span className="font-mono font-medium text-slate-700">9456771</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                    <span className="text-sm text-slate-500">Flag</span>
                                                    <span className="flex items-center gap-2 font-medium text-slate-700">
                                                        🇩🇰 Denmark
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Service Loop</span>
                                                    <span className="font-medium text-slate-700">AE10</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                                                Full Schedule <ExternalLink size={14} />
                                            </Button>
                                        </div>
                                    )
                                })}
                            />

                            <DetailCard 
                                icon={MapPin} 
                                label="Current Location" 
                                value="Pacific Ocean" 
                            />

                            <DetailCard 
                                icon={Box} 
                                label="Container" 
                                value="MSKU0928374"
                                onClick={() => setActiveDetail({
                                    title: 'Container Details',
                                    content: (
                                        <div className="space-y-4">
                                            <div className="bg-slate-900 text-white p-6 rounded-xl text-center shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                                    <Box size={64} />
                                                </div>
                                                <div className="text-2xl font-mono font-bold tracking-widest relative z-10">MSKU 092837 4</div>
                                                <div className="text-xs text-blue-200 mt-1 relative z-10">45G1 / 40' HIGH CUBE</div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tare Weight</div>
                                                    <div className="font-bold text-slate-800">3,800 kg</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Max Payload</div>
                                                    <div className="font-bold text-slate-800">28,700 kg</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Volume</div>
                                                    <div className="font-bold text-slate-800">76.4 m³</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Seal No.</div>
                                                    <div className="font-bold text-slate-800">ML-88372</div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Button 
                                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => window.open('https://www.track-trace.com/container', '_blank')}
                                                >
                                                    Track on Terminal <ExternalLink size={16} />
                                                </Button>
                                                <div className="text-center pt-1">
                                                     <a 
                                                         href="https://www.maersk.com/tracking" 
                                                         target="_blank" 
                                                         rel="noopener noreferrer"
                                                         className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-colors"
                                                     >
                                                         Visit Carrier Tracking Page <Globe size={12} />
                                                     </a>
                                                 </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            />
                        </div>

                        {/* Cargo Information Section - NEW */}
                        {(selectedShipment.packageDetails || selectedShipment.hazardousMaterial) && (
                            <div className="mb-8">
                                <h4 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                    <Layers size={14} className="text-blue-600" />
                                    Cargo Information
                                </h4>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    {/* Package Details Grid */}
                                    {selectedShipment.packageDetails && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Scale size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Weight</div>
                                                    <div className="text-sm font-semibold text-slate-800">{selectedShipment.packageDetails.weight}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Box size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Volume</div>
                                                    <div className="text-sm font-semibold text-slate-800">{selectedShipment.packageDetails.volume}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Ruler size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Dimensions</div>
                                                    <div className="text-sm font-semibold text-slate-800">{selectedShipment.packageDetails.dimensions}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                                <div className="p-2 bg-white rounded-full text-slate-500 border border-slate-100">
                                                    <Box size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Commodity</div>
                                                    <div className="text-sm font-semibold text-slate-800 truncate" title={selectedShipment.packageDetails.commodity}>
                                                        {selectedShipment.packageDetails.commodity}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hazardous Material Warning - Conditional */}
                                    {selectedShipment.hazardousMaterial && (
                                        <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 animate-pulse">
                                            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                            <div className="flex-1">
                                                <h5 className="font-bold text-red-800 text-sm flex items-center justify-between">
                                                    Hazardous Material Information
                                                    <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded uppercase tracking-wider">Dangerous Goods</span>
                                                </h5>
                                                <div className="text-xs text-red-700 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div>
                                                        <span className="block opacity-60">UN Number</span>
                                                        <span className="font-mono font-bold">{selectedShipment.hazardousMaterial.unNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block opacity-60">Class</span>
                                                        <span className="font-bold">{selectedShipment.hazardousMaterial.class}</span>
                                                    </div>
                                                    <div className="col-span-2 sm:col-span-2">
                                                        <span className="block opacity-60">Proper Shipping Name</span>
                                                        <span className="font-bold">{selectedShipment.hazardousMaterial.properShippingName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Shipment Documents - NEW */}
                        {selectedShipment.documents && selectedShipment.documents.length > 0 && (
                             <div className="mb-8">
                                <h4 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                   Shipment Documents <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{selectedShipment.documents.length}</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {selectedShipment.documents.map((doc, i) => (
                                    <div key={i} onClick={() => setViewingDocument(doc)} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group">
                                       <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3 group-hover:bg-blue-100 transition-colors">
                                          <FileText size={20} />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                                          <div className="text-xs text-slate-500">{doc.date} • {doc.type.toUpperCase()}</div>
                                       </div>
                                       <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                                    </div>
                                  ))}
                                </div>
                             </div>
                        )}

                        {/* Shipment Notes */}
                        {selectedShipment.notes && (
                            <div className="mb-8 bg-amber-50 rounded-lg border border-amber-100 p-4">
                                <h4 className="font-semibold text-amber-900 mb-1 text-sm flex items-center gap-2">
                                    <FileText size={14} className="text-amber-600" />
                                    Shipment Notes
                                </h4>
                                <p className="text-sm text-amber-800">{selectedShipment.notes}</p>
                            </div>
                        )}

                        {/* Horizontal Visual Timeline */}
                        <div className="mb-8 bg-slate-50 rounded-xl border border-slate-100 p-4">
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm">Shipment Progress</h4>
                            <TimelineStepper progress={selectedShipment.progress} status={selectedShipment.status} />
                        </div>

                        {/* Timeline */}
                        <div className="space-y-6 max-w-lg mx-auto">
                            <h4 className="font-semibold text-slate-900">Activity Log</h4>
                            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-2">
                                {[
                                    { title: 'Gate In', date: 'Oct 01, 09:00 AM', loc: selectedShipment.origin, done: true },
                                    { title: 'Vessel Departed', date: 'Oct 03, 02:30 PM', loc: selectedShipment.origin, done: true },
                                    { title: 'In Transit', date: 'Current Status', loc: 'Pacific Ocean', done: true, active: true },
                                    { title: 'Vessel Arrival', date: 'Est. Oct 23', loc: selectedShipment.destination, done: false },
                                    { title: 'Customs Clearance', date: 'Est. Oct 24', loc: selectedShipment.destination, done: false },
                                    { title: 'Delivered', date: 'Est. Oct 25', loc: selectedShipment.destination, done: false },
                                ].map((event, i) => (
                                    <div key={i} className="relative pl-8">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                                            event.active 
                                                ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100' 
                                                : event.done 
                                                    ? 'bg-blue-600 border-blue-600' 
                                                    : 'bg-white border-slate-300'
                                        }`}>
                                            {event.done && !event.active && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${event.done ? 'text-slate-900' : 'text-slate-400'}`}>{event.title}</span>
                                            <span className="text-xs text-slate-500">{event.date} • {event.loc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Select a shipment to view details
                </div>
            )}
        </Card>
      </div>

      {/* Add Shipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Add New Shipment</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddShipment}>Create Shipment</Button>
                </div>
            </div>
        </div>
      )}

      {/* Details Modal */}
      {activeDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{activeDetail.title}</h3>
                    <button onClick={() => setActiveDetail(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5">
                    {activeDetail.content}
                </div>
            </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-scale-in overflow-hidden">
               <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white z-10">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                         <FileText size={20}/>
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{viewingDocument.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{viewingDocument.type.toUpperCase()}</span>
                            <span>•</span>
                            <span>{viewingDocument.date}</span>
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" className="gap-2 hidden sm:flex">
                        <Download size={16} /> Download
                     </Button>
                     <button onClick={() => setViewingDocument(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                        <X size={24}/>
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 bg-slate-100 p-4 sm:p-8 overflow-y-auto">
                  <div className="bg-white shadow-lg border border-slate-200 min-h-[800px] w-full max-w-[800px] mx-auto p-8 sm:p-12 relative">
                      {/* Document Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                           <Anchor size={400} />
                      </div>

                      {/* Mock Document Content */}
                      <div className="relative z-10 space-y-8">
                          {/* Header */}
                          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
                              <div>
                                  <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-wide uppercase mb-1">{viewingDocument.name}</h1>
                                  <p className="font-mono text-sm text-slate-500">ORIGINAL DOCUMENT</p>
                              </div>
                              <div className="text-right font-mono text-sm space-y-1">
                                  <div className="font-bold">NO. {selectedShipment?.id}</div>
                                  <div>DATE: {viewingDocument.date}</div>
                                  <div>PLACE: {selectedShipment?.origin}</div>
                              </div>
                          </div>

                          {/* Parties */}
                          <div className="grid grid-cols-2 gap-8">
                              <div className="border border-slate-300 p-4">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Shipper / Exporter</h4>
                                  <p className="font-serif text-sm leading-relaxed">
                                      GLOBAL TRADE CO., LTD.<br/>
                                      123 INDUSTRIAL PARK<br/>
                                      {selectedShipment?.origin.toUpperCase()}
                                  </p>
                              </div>
                              <div className="border border-slate-300 p-4">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Consignee</h4>
                                  <p className="font-serif text-sm leading-relaxed">
                                      LOGINEXUS IMPORTS INC.<br/>
                                      456 DISTRIBUTION WAY<br/>
                                      {selectedShipment?.destination.toUpperCase()}
                                  </p>
                              </div>
                          </div>

                          {/* Details */}
                          <div className="border border-slate-300">
                              <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-500 uppercase divide-x divide-slate-300">
                                  <div className="p-2">Vessel / Voyage</div>
                                  <div className="p-2">Port of Loading</div>
                                  <div className="p-2">Port of Discharge</div>
                                  <div className="p-2">Final Destination</div>
                              </div>
                              <div className="grid grid-cols-4 text-sm font-serif divide-x divide-slate-300">
                                  <div className="p-3">MAERSK EINDHOVEN / 204E</div>
                                  <div className="p-3">{selectedShipment?.origin}</div>
                                  <div className="p-3">{selectedShipment?.destination}</div>
                                  <div className="p-3">{selectedShipment?.destination}</div>
                              </div>
                          </div>

                          {/* Goods */}
                          <table className="w-full border border-slate-300 text-sm">
                              <thead className="bg-slate-50 border-b border-slate-300">
                                  <tr>
                                      <th className="p-3 text-left font-bold text-slate-500 uppercase text-xs">Marks & Nos</th>
                                      <th className="p-3 text-left font-bold text-slate-500 uppercase text-xs">Description of Packages and Goods</th>
                                      <th className="p-3 text-right font-bold text-slate-500 uppercase text-xs">Gross Weight</th>
                                      <th className="p-3 text-right font-bold text-slate-500 uppercase text-xs">Measurement</th>
                                  </tr>
                              </thead>
                              <tbody className="font-serif">
                                  <tr>
                                      <td className="p-4 align-top">MSKU 092837 4<br/>SEAL: 88372</td>
                                      <td className="p-4 align-top">
                                          1 X 40' HC CONTAINER<br/>
                                          SAID TO CONTAIN:<br/>
                                          ELECTRONIC COMPONENTS AND ACCESSORIES<br/>
                                          HS CODE: 854231
                                      </td>
                                      <td className="p-4 align-top text-right">28,700.00 KGS</td>
                                      <td className="p-4 align-top text-right">76.40 CBM</td>
                                  </tr>
                              </tbody>
                          </table>

                          {/* Footer */}
                          <div className="pt-12 flex justify-between items-end">
                               <div className="text-xs text-slate-400 max-w-md">
                                   RECEIVED by the Carrier the Goods as specified above in apparent good order and condition unless otherwise stated, to be transported to such place as agreed...
                               </div>
                               <div className="text-center">
                                   <div className="h-16 w-32 border-b border-slate-800 mb-2 relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="font-script text-2xl text-blue-900 -rotate-12 opacity-80">Authorized</span>
                                        </div>
                                   </div>
                                   <div className="text-xs font-bold uppercase">Carrier Signature</div>
                               </div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};