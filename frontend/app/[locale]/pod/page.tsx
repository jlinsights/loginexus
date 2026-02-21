'use client';

import React, { useState } from 'react';
import PODList from '@/app/components/PODList';
import PODDetail from '@/app/components/PODDetail';
import { useTranslations } from 'next-intl';
import { ClipboardCheck } from 'lucide-react';

export default function PODManagementPage() {
    const t = useTranslations('pod');
    const [selectedTracking, setSelectedTracking] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {!selectedTracking ? (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <ClipboardCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{t('podManagement')}</h1>
                                <p className="text-sm text-slate-500">{t('podDescription')}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <PODList onSelect={setSelectedTracking} />
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <PODDetail
                            trackingNumber={selectedTracking}
                            onBack={() => setSelectedTracking(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
