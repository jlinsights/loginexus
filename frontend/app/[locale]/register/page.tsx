'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registerTenant, TenantCreate } from '@/lib/api';

export default function RegisterPage() {
    interface ApiError {
        response?: {
            data?: {
                detail?: string;
            };
        };
    }

    const [formData, setFormData] = useState<TenantCreate>({
        name: '',
        subdomain: '',
        logo_url: '',
        primary_color: '#1E40AF'
    });
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: registerTenant,
        onSuccess: (data) => {
            // Redirect to the new subdomain
            const protocol = window.location.protocol;
            const host = window.location.host; // e.g., localhost:3000
            // Assuming localhost:3000 format, we prepend subdomain
            if (host.includes('localhost')) {
                window.location.href = `${protocol}//${data.subdomain}.${host}`;
            } else {
                // In production, might need different logic
                 window.location.href = `${protocol}//${data.subdomain}.${host}`;
            }
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            const message = apiError.response?.data?.detail || "Registration failed";
            setError(message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        mutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-100 dark:border-slate-800">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Partner Registration</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Join LogiNexus as a Forwarding Partner</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Maersk Line"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subdomain (URL)</label>
                        <div className="flex">
                            <input
                                type="text"
                                required
                                pattern="[a-z0-9-]+"
                                className="flex-1 px-4 py-2 rounded-l-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="maersk"
                                value={formData.subdomain}
                                onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase()})}
                            />
                            <span className="bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-300 dark:border-slate-700 px-3 py-2 rounded-r-lg text-slate-500 dark:text-slate-400 text-sm flex items-center">
                                .localhost:3000
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Only lowercase letters, numbers, and hyphens.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo URL (Optional)</label>
                        <input
                            type="url"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="https://example.com/logo.png"
                            value={formData.logo_url}
                            onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-blue-600 dark:bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {mutation.isPending ? 'Registering...' : 'Create Partner Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
