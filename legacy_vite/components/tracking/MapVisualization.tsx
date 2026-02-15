import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Shipment } from '../../types';

export const MapVisualization: React.FC<{ shipment: Shipment }> = ({ shipment }) => {
  const [start, setStart] = useState([0, 0]);
  const [end, setEnd] = useState([0, 0]);
  const [current, setCurrent] = useState([0, 0]);
  const [zoom, setZoom] = useState(1);

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
