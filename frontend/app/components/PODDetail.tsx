'use client';

import React, { useState, useEffect } from 'react';
import { fetchPOD, verifyPOD, PODDetail as PODDetailType } from '@/lib/api';
import { MapPin, CheckCircle, AlertTriangle, ArrowLeft, Camera, User, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PODDetailProps {
    trackingNumber: string;
    onBack: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PODDetail({ trackingNumber, onBack }: PODDetailProps) {
    const t = useTranslations('pod');
    const [pod, setPod] = useState<PODDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchPOD(trackingNumber);
                setPod(data);
            } catch {
                setError(t('errors.loadFailed'));
            } finally {
                setLoading(false);
            }
        })();
    }, [trackingNumber]);

    const handleAction = async (action: 'verify' | 'dispute') => {
        setActionLoading(true);
        setError(null);
        try {
            const result = await verifyPOD(trackingNumber, { action, notes: notes || undefined });
            setPod((prev) => prev ? { ...prev, pod_status: result.pod_status } : prev);
        } catch {
            setError(t('errors.actionFailed'));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-400">{t('loading')}</div>;
    }

    if (!pod) {
        return <div className="text-center py-12 text-red-500">{error || t('notFound')}</div>;
    }

    const isSubmitted = pod.pod_status === 'submitted';
    const photoUrls = pod.pod_photos || [];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {t('podDetails')} - {trackingNumber}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            pod.pod_status === 'verified' ? 'bg-green-100 text-green-700' :
                            pod.pod_status === 'disputed' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {pod.pod_status === 'verified' && <CheckCircle size={12} />}
                            {pod.pod_status === 'disputed' && <AlertTriangle size={12} />}
                            {pod.pod_status}
                        </span>
                        {pod.pod_timestamp && (
                            <span className="text-xs text-slate-400">
                                {new Date(pod.pod_timestamp).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Route & Receiver */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <MapPin size={14} />
                            {t('route')}
                        </h3>
                        <p className="text-slate-800">
                            {pod.shipment_origin} → {pod.shipment_destination}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <User size={14} />
                            {t('receiver')}
                        </h3>
                        <p className="text-slate-800">{pod.pod_receiver_name || '-'}</p>
                        {pod.pod_receiver_contact && (
                            <p className="text-sm text-slate-500">{pod.pod_receiver_contact}</p>
                        )}
                    </div>
                </div>

                {/* Photos */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Camera size={14} />
                        {t('photoEvidence')} ({photoUrls.length})
                    </h3>
                    {photoUrls.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {photoUrls.map((url, idx) => {
                                const src = url.startsWith('data:') ? url : `${API_URL}${url}`;
                                return (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                        <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">{t('noPhotos')}</p>
                    )}
                </div>

                {/* Signature */}
                {pod.pod_signature && (
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-3">{t('signature')}</h3>
                        <div className="inline-block border border-slate-200 rounded-lg p-2 bg-white">
                            <img
                                src={pod.pod_signature}
                                alt="Signature"
                                className="max-h-32"
                            />
                        </div>
                    </div>
                )}

                {/* GPS Location */}
                {pod.pod_location && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <MapPin size={14} />
                            {t('gpsLocation')}
                        </h3>
                        <p className="text-sm text-slate-700">
                            {pod.pod_location.lat.toFixed(6)}, {pod.pod_location.lng.toFixed(6)}
                            {pod.pod_location.accuracy && (
                                <span className="ml-2 text-slate-400">
                                    ({t('accuracy', { meters: pod.pod_location.accuracy })})
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Verification Info */}
                {pod.pod_verified_at && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                            {t('verifiedAt')}: {new Date(pod.pod_verified_at).toLocaleString()}
                        </p>
                        {pod.pod_verified_by && (
                            <p className="text-sm text-slate-600">
                                {t('verifiedBy')}: {pod.pod_verified_by}
                            </p>
                        )}
                        {pod.pod_notes && (
                            <p className="text-sm text-slate-700 mt-2">{pod.pod_notes}</p>
                        )}
                    </div>
                )}

                {/* Admin Actions */}
                {isSubmitted && (
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                            <FileText size={14} />
                            {t('adminNotes')}
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('notesPlaceholder')}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />

                        {error && (
                            <p className="text-sm text-red-500 mt-2">{error}</p>
                        )}

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handleAction('verify')}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} />
                                {t('verify')}
                            </button>
                            <button
                                onClick={() => handleAction('dispute')}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={16} />
                                {t('dispute')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
