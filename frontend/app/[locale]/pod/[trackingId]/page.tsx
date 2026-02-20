import React from 'react';
import ElectronicPOD from '@/app/components/ElectronicPOD';

interface PageProps {
    params: {
        trackingId: string;
    }
}

export default function PODPage({ params }: PageProps) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <ElectronicPOD trackingNumber={params.trackingId} />
                
                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>&copy; 2026 LogiNexus. All rights reserved.</p>
                    <p className="mt-1">Secure Digital Logistics Platform</p>
                </div>
            </div>
        </div>
    );
}
