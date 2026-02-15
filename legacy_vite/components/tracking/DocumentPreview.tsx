import React from 'react';
import { X, FileText, Download, Anchor } from 'lucide-react';
import { Button } from '../Shared';
import { Shipment } from '../../types';

interface DocumentPreviewProps {
  document: { name: string; type: string; date: string } | null;
  shipment: Shipment | undefined;
  onClose: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, shipment, onClose }) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-scale-in overflow-hidden">
           <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white z-10">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                     <FileText size={20}/>
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{document.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{document.type.toUpperCase()}</span>
                        <span>•</span>
                        <span>{document.date}</span>
                    </p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" className="gap-2 hidden sm:flex">
                    <Download size={16} /> Download
                 </Button>
                 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
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
                              <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-wide uppercase mb-1">{document.name}</h1>
                              <p className="font-mono text-sm text-slate-500">ORIGINAL DOCUMENT</p>
                          </div>
                          <div className="text-right font-mono text-sm space-y-1">
                              <div className="font-bold">NO. {shipment?.id}</div>
                              <div>DATE: {document.date}</div>
                              <div>PLACE: {shipment?.origin}</div>
                          </div>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-8">
                          <div className="border border-slate-300 p-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Shipper / Exporter</h4>
                              <p className="font-serif text-sm leading-relaxed">
                                  GLOBAL TRADE CO., LTD.<br/>
                                  123 INDUSTRIAL PARK<br/>
                                  {shipment?.origin.toUpperCase()}
                              </p>
                          </div>
                          <div className="border border-slate-300 p-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Consignee</h4>
                              <p className="font-serif text-sm leading-relaxed">
                                  LOGINEXUS IMPORTS INC.<br/>
                                  456 DISTRIBUTION WAY<br/>
                                  {shipment?.destination.toUpperCase()}
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
                              <div className="p-3">{shipment?.origin}</div>
                              <div className="p-3">{shipment?.destination}</div>
                              <div className="p-3">{shipment?.destination}</div>
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
  );
};
