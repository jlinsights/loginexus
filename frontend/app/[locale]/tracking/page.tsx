import React from 'react';

export default function TrackingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
                    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
                    <line x1="6" x2="6.01" y1="6" y2="6"/>
                    <line x1="6" x2="6.01" y1="18" y2="18"/>
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Tracking</h1>
            <p className="text-slate-500 max-w-md">
                Advanced map visualization and real-time telemetry features are currently under development.
            </p>
        </div>
    );
}
