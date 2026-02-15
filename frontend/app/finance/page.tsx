import React from 'react';

export default function FinancePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <line x1="12" x2="12" y1="2" y2="22"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Finance & Payments</h1>
            <p className="text-slate-500 max-w-md">
                Blockchain-based escrow management and payment history modules are coming soon.
            </p>
        </div>
    );
}
