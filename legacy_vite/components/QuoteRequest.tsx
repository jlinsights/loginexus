import React, { useState } from 'react';
import { Card, Button } from './Shared';
import { Package, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { TRANSPORT_MODES, INCOTERMS } from '../constants/data';

export const QuoteRequest: React.FC = () => {
  const [step, setStep] = useState(1);
  const [transportMode, setTransportMode] = useState<typeof TRANSPORT_MODES[number]['id']>('sea');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Instant Freight Quote</h2>
        <p className="text-slate-500 mt-2">Get competitive rates for your global cargo in seconds.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-1 bg-slate-200 mx-2 ${step > s ? 'bg-blue-600' : ''}`}></div>}
          </div>
        ))}
      </div>

      <Card className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">1. Select Transport Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRANSPORT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setTransportMode(mode.id)}
                  aria-label={`Select ${mode.label}`}
                  aria-pressed={transportMode === mode.id}
                  className={`p-6 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
                    transportMode === mode.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="mb-3"><mode.icon size={32} /></div>
                  <span className="font-bold block">{mode.label}</span>
                  <span className="text-xs opacity-70 mt-1">{mode.desc}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(2)} aria-label="Go to next step">Next Step <ArrowRight size={16} className="ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">2. Route Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="origin" className="block text-sm font-medium text-slate-700">Origin Port / City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input id="origin" type="text" aria-label="Origin Port or City" className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. Shanghai, CN" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="destination" className="block text-sm font-medium text-slate-700">Destination Port / City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input id="destination" type="text" aria-label="Destination Port or City" className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. Hamburg, DE" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="readyDate" className="block text-sm font-medium text-slate-700">Ready Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input id="readyDate" type="date" aria-label="Cargo Ready Date" className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="incoterms" className="block text-sm font-medium text-slate-700">Incoterms</label>
                <select id="incoterms" aria-label="Select Incoterms" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                  {INCOTERMS.map((term) => (
                    <option key={term}>{term}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)} aria-label="Go back to previous step">Back</Button>
              <Button onClick={() => setStep(3)} aria-label="Go to next step">Next Step <ArrowRight size={16} className="ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900">3. Cargo Specification</h3>
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-4">Container Type (FCL)</h4>
                <div className="flex gap-4" role="radiogroup" aria-label="Container Type">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="container" className="w-4 h-4 text-blue-600" defaultChecked aria-label="20 foot standard container" />
                        <span>20' Standard</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="container" className="w-4 h-4 text-blue-600" aria-label="40 foot standard container" />
                        <span>40' Standard</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="container" className="w-4 h-4 text-blue-600" aria-label="40 foot high cube container" />
                        <span>40' HQ</span>
                    </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantity</label>
                    <input id="quantity" type="number" aria-label="Number of containers" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1" />
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="weight" className="block text-sm font-medium text-slate-700">Total Weight (kg)</label>
                    <input id="weight" type="number" aria-label="Total weight in kilograms" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="volume" className="block text-sm font-medium text-slate-700">Volume (cbm)</label>
                    <input id="volume" type="number" aria-label="Volume in cubic meters" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                 </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <Package className="text-blue-600 mt-1" size={20} />
                  <div>
                      <h5 className="font-bold text-blue-800 text-sm">Commodity Info</h5>
                      <p className="text-blue-700 text-xs mt-1">Please ensure you have valid HS codes. Dangerous goods require special handling.</p>
                  </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)} aria-label="Go back to previous step">Back</Button>
                <Button onClick={() => alert("Quote request submitted successfully! Our team will contact you shortly.")} aria-label="Submit quote request">Request Quote</Button>
              </div>
            </div>
        )}
      </Card>
    </div>
  );
};
