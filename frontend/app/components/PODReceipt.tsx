'use client';

import React, { useState, useEffect } from 'react';
import { fetchPODReceipt, PODReceipt as PODReceiptType } from '@/lib/api';
import { MapPin, CheckCircle, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PODReceiptProps {
    trackingNumber: string;
}

export default function PODReceipt({ trackingNumber }: PODReceiptProps) {
    const t = useTranslations('pod');
    const [receipt, setReceipt] = useState<PODReceiptType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchPODReceipt(trackingNumber);
                setReceipt(data);
            } catch {
                setError(t('errors.receiptNotAvailable'));
            } finally {
                setLoading(false);
            }
        })();
    }, [trackingNumber, t]);

    if (loading) {
        return <div className="text-center py-12 text-slate-400">{t('loading')}</div>;
    }

    if (error || !receipt) {
        return <div className="text-center py-12 text-red-500">{error || t('notFound')}</div>;
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white text-center">
                <Package size={24} className="mx-auto mb-2 text-blue-400" />
                <h2 className="font-bold text-lg">{t('deliveryReceipt')}</h2>
                <span className="text-xs text-slate-400 font-mono">{receipt.tracking_number}</span>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin size={16} className="text-slate-400" />
                    <div>
                        <p className="text-sm font-medium text-slate-800">
                            {receipt.origin} &rarr; {receipt.destination}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">{t('receiver')}</p>
                        <p className="text-sm font-medium text-slate-800">{receipt.pod_receiver_name || '-'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">{t('photoEvidence')}</p>
                        <p className="text-sm font-medium text-slate-800">{receipt.photo_count} {t('filesUnit')}</p>
                    </div>
                </div>

                {receipt.pod_timestamp && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">{t('delivered')}</p>
                        <p className="text-sm font-medium text-slate-800">
                            {new Date(receipt.pod_timestamp).toLocaleString()}
                        </p>
                    </div>
                )}

                {receipt.pod_location && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">{t('gpsLocation')}</p>
                        <p className="text-sm font-medium text-slate-800">
                            {receipt.pod_location.lat.toFixed(6)}, {receipt.pod_location.lng.toFixed(6)}
                        </p>
                    </div>
                )}

                {receipt.verified && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                        <CheckCircle size={16} />
                        <div>
                            <p className="text-sm font-medium">{t('verified')}</p>
                            {receipt.verified_at && (
                                <p className="text-xs text-green-600">
                                    {new Date(receipt.verified_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className={`text-center p-3 rounded-lg text-sm font-medium ${
                    receipt.pod_status === 'verified' ? 'bg-green-100 text-green-700' :
                    receipt.pod_status === 'disputed' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                    {t('status')}: {receipt.pod_status}
                </div>
            </div>
        </div>
    );
}
