'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchPODList, PODListItem } from '@/lib/api';
import { CheckCircle, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PODListProps {
    onSelect: (trackingNumber: string) => void;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
    submitted: <Clock size={14} className="text-blue-500" />,
    verified: <CheckCircle size={14} className="text-green-500" />,
    disputed: <AlertTriangle size={14} className="text-amber-500" />,
};

export default function PODList({ onSelect }: PODListProps) {
    const t = useTranslations('pod');
    const [items, setItems] = useState<PODListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const limit = 20;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPODList({ status: statusFilter, page, limit });
            setItems(data.items);
            setTotal(data.total);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const filters = [
        { key: undefined, label: t('filterAll') },
        { key: 'submitted', label: t('filterSubmitted') },
        { key: 'verified', label: t('filterVerified') },
        { key: 'disputed', label: t('filterDisputed') },
    ];

    return (
        <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {filters.map((f) => (
                    <button
                        key={f.key ?? 'all'}
                        onClick={() => { setStatusFilter(f.key); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === f.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">{t('noPods')}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                                <th className="pb-3 font-medium">Tracking #</th>
                                <th className="pb-3 font-medium">{t('route')}</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">{t('receiver')}</th>
                                <th className="pb-3 font-medium">{t('photoEvidence')}</th>
                                <th className="pb-3 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.tracking_number}
                                    onClick={() => onSelect(item.tracking_number)}
                                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <td className="py-3 font-mono text-xs text-blue-600">{item.tracking_number}</td>
                                    <td className="py-3 text-slate-700">
                                        {item.origin} → {item.destination}
                                    </td>
                                    <td className="py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100">
                                            {STATUS_ICONS[item.pod_status || ''] || null}
                                            {item.pod_status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-slate-700">{item.pod_receiver_name || '-'}</td>
                                    <td className="py-3 text-slate-500">{item.photo_count}</td>
                                    <td className="py-3 text-slate-400 text-xs">
                                        {item.pod_timestamp
                                            ? new Date(item.pod_timestamp).toLocaleDateString()
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-slate-500">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
