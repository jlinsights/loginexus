'use client';

import React, { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, MapPin, CheckCircle, Upload, AlertCircle, RotateCcw } from 'lucide-react';
import { uploadPOD } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface ElectronicPODProps {
    trackingNumber: string;
    onComplete?: () => void;
}

const MAX_PHOTOS = 5;
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;

async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
            }

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
                    } else {
                        resolve(file);
                    }
                },
                'image/jpeg',
                JPEG_QUALITY
            );
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}

export default function ElectronicPOD({ trackingNumber, onComplete }: ElectronicPODProps) {
    const t = useTranslations('pod');
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [receiverName, setReceiverName] = useState('');
    const [receiverContact, setReceiverContact] = useState('');
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);
    const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const compressed = await Promise.all(newFiles.map(compressImage));
            setImageFiles((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS));
        }
    };

    const removeFile = (index: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const requestGeolocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeoStatus('error');
            setError(t('errors.geoNotSupported'));
            return;
        }

        setGeoStatus('loading');
        setError(null);

        let attempts = 0;
        const maxAttempts = 3;

        const tryGetPosition = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGeoCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setGeoAccuracy(Math.round(position.coords.accuracy));
                    setGeoStatus('success');
                },
                () => {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(tryGetPosition, 2000);
                    } else {
                        setGeoStatus('error');
                        setError(t('errors.geoFailed'));
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        tryGetPosition();
    }, [t]);

    // Auto-request geolocation on mount
    React.useEffect(() => {
        requestGeolocation();
    }, [requestGeolocation]);

    const submitPOD = async () => {
        setError(null);

        if (!receiverName.trim()) {
            setError(t('errors.receiverNameRequired'));
            return;
        }

        if (sigCanvas.current?.isEmpty()) {
            setError(t('errors.signatureRequired'));
            return;
        }

        if (!geoCoords) {
            setError(t('errors.geoFailed'));
            return;
        }

        setIsSubmitting(true);

        try {
            const signatureData = (sigCanvas.current as { getTrimmedCanvas(): HTMLCanvasElement } | null)
                ?.getTrimmedCanvas()
                .toDataURL('image/png');

            const formData = new FormData();
            formData.append('signature', signatureData || '');
            formData.append('latitude', geoCoords.lat.toString());
            formData.append('longitude', geoCoords.lng.toString());
            if (geoAccuracy !== null) {
                formData.append('accuracy', geoAccuracy.toString());
            }
            formData.append('receiver_name', receiverName.trim());
            if (receiverContact.trim()) {
                formData.append('receiver_contact', receiverContact.trim());
            }

            imageFiles.forEach((file) => {
                formData.append('photos', file);
            });

            await uploadPOD(trackingNumber, formData);

            setSuccess(true);
            if (onComplete) onComplete();
        } catch (err: unknown) {
            const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
            if (axiosError.response?.status === 409) {
                setError(t('errors.alreadySubmitted'));
            } else {
                setError(t('errors.uploadFailed'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('success')}</h2>
                <p className="text-slate-500">{t('successMessage')}</p>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-400">
                    {t('tracking')}: {trackingNumber}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-blue-400" />
                    {t('title')}
                </h2>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">
                    {trackingNumber}
                </span>
            </div>

            <div className="p-5 space-y-6">
                {/* Receiver Name */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        {t('receiverName')} *
                    </label>
                    <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder={t('receiverName')}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Receiver Contact */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        {t('receiverContact')}
                    </label>
                    <input
                        type="text"
                        value={receiverContact}
                        onChange={(e) => setReceiverContact(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Photos */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Camera size={16} />
                        {t('photos')} ({imageFiles.length}/{MAX_PHOTOS})
                    </label>

                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {imageFiles.map((file, idx) => (
                            <div key={idx} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Photo ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        {imageFiles.length < MAX_PHOTOS && (
                            <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                <Upload size={16} className="text-slate-400 mb-0.5" />
                                <span className="text-[10px] text-slate-400">Add</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Geolocation */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MapPin size={16} />
                        {t('location')}
                    </label>
                    <div className="flex items-center gap-2">
                        {geoStatus === 'loading' && (
                            <span className="text-xs text-blue-600 animate-pulse">Detecting location...</span>
                        )}
                        {geoStatus === 'success' && geoAccuracy !== null && (
                            <span className="text-xs text-green-600">
                                {t('accuracy', { meters: geoAccuracy })}
                                {geoAccuracy > 100 && (
                                    <span className="ml-1 text-amber-500">(Low accuracy)</span>
                                )}
                            </span>
                        )}
                        {geoStatus === 'error' && (
                            <span className="text-xs text-red-500">Location unavailable</span>
                        )}
                        {(geoStatus === 'error' || geoStatus === 'idle') && (
                            <button
                                onClick={requestGeolocation}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <RotateCcw size={12} />
                                {t('retry')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Signature */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-slate-700">
                            {t('signature')}
                        </label>
                        <button
                            onClick={clearSignature}
                            className="text-xs text-red-500 hover:text-red-600"
                        >
                            {t('clear')}
                        </button>
                    </div>
                    <div className="border border-slate-300 rounded-lg overflow-hidden touch-none h-48 bg-slate-50">
                        <SignatureCanvas
                            ref={sigCanvas}
                            canvasProps={{
                                className: 'w-full h-full',
                                style: { width: '100%', height: '100%' },
                            }}
                            backgroundColor="rgba(248, 250, 252, 1)"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-center">{t('signHint')}</p>
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
                    {isSubmitting ? t('submitting') : t('submit')}
                </button>
            </div>
        </div>
    );
}
