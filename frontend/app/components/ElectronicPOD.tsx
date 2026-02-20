'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, MapPin, CheckCircle, Upload, AlertCircle } from 'lucide-react';

interface ElectronicPODProps {
    trackingNumber: string;
    onComplete?: () => void;
}

export default function ElectronicPOD({ trackingNumber, onComplete }: ElectronicPODProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Limit to 3 photos
            setImageFiles(prev => [...prev, ...newFiles].slice(0, 3));
        }
    };

    const removeFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    }

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const submitPOD = async () => {
        setError(null);
        if (sigCanvas.current?.isEmpty()) {
            setError("Please sign the digital pad.");
            return;
        }

        setIsSubmitting(true);

        // 1. Get Signature
        const signatureData = (sigCanvas.current as { getTrimmedCanvas(): HTMLCanvasElement } | null)?.getTrimmedCanvas().toDataURL('image/png');

        // 2. Get Geolocation
        if (!navigator.geolocation) {
             setError("Geolocation is not supported by your browser.");
             setIsSubmitting(false);
             return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                
                const formData = new FormData();
                formData.append('signature', signatureData || '');
                formData.append('latitude', latitude.toString());
                formData.append('longitude', longitude.toString());
                
                imageFiles.forEach((file) => {
                    formData.append('photos', file);
                });

                // API Call
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/shipments/${trackingNumber}/pod`, {
                    method: 'POST',
                    body: formData, // Content-Type header is set automatically for FormData
                });

                if (!response.ok) {
                    throw new Error('Failed to upload POD');
                }

                setSuccess(true);
                if (onComplete) onComplete();

            } catch (err) {
                console.error(err);
                setError("Failed to submit Proof of Delivery. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }, (err) => {
            console.error(err);
            setError("Unable to retrieve location. Please enable location services.");
            setIsSubmitting(false);
        });
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Delivery Confirmed!</h2>
                <p className="text-slate-500">Proof of Delivery has been successfully uploaded.</p>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-400">
                    Tracking: {trackingNumber}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-blue-400" />
                    e-POD Entry
                </h2>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">
                    {trackingNumber}
                </span>
            </div>

            <div className="p-5 space-y-6">
                {/* 1. Photos */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Camera size={16} />
                        Cargo Photos (Max 3)
                    </label>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {imageFiles.map((file, idx) => (
                            <div key={idx} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover" 
                                />
                                <button 
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                         {imageFiles.length < 3 && (
                            <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                <Upload size={20} className="text-slate-400 mb-1" />
                                <span className="text-xs text-slate-400">Add</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple // In mobile, this allows selecting/taking multiple
                                    // capture="environment" // Only works on mobile to trigger camera directly
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* 2. Signature */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Receiver Signature
                        </label>
                        <button 
                            onClick={clearSignature}
                            className="text-xs text-red-500 hover:text-red-600"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="border border-slate-300 rounded-lg overflow-hidden touch-none h-48 bg-slate-50">
                        <SignatureCanvas 
                            ref={sigCanvas}
                            canvasProps={{
                                className: 'w-full h-full',
                                style: { width: '100%', height: '100%' }
                            }}
                            backgroundColor="rgba(248, 250, 252, 1)" // slate-50
                        />
                    </div>
                     <p className="text-xs text-slate-400 mt-1 text-center">Sign above using your finger</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button
                    onClick={submitPOD}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                    {isSubmitting ? 'Uploading Proof...' : 'Confirm Delivery'}
                </button>
            </div>
        </div>
    );
}
