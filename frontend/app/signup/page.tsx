'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createTenant, TenantCreate } from '../../lib/api';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<TenantCreate>({
        name: '',
        subdomain: '',
        logo_url: '',
        primary_color: '#1E40AF'
    });
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: createTenant,
        onSuccess: (data) => {
            // Redirect to the new subdomain
            const protocol = window.location.protocol;
            const host = window.location.host; // e.g., localhost:3000
            // Assuming localhost:3000 format, we prepend subdomain
            if (host.includes('localhost')) {
                window.location.href = `${protocol}//${data.subdomain}.${host}`;
            } else {
                 window.location.href = `${protocol}//${data.subdomain}.${host}`;
            }
        },
        onError: (err: any) => {
            setError(err.response?.data?.detail || "Registration failed");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        mutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-600">Partner Signup</h1>
                    <p className="text-slate-500 mt-2">Join LogiNexus as a Forwarding Partner</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Maersk Line"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain (URL)</label>
                        <div className="flex">
                            <input
                                type="text"
                                required
                                pattern="[a-z0-9-]+"
                                className="flex-1 px-4 py-2 rounded-l-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="maersk"
                                value={formData.subdomain}
                                onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase()})}
                            />
                            <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2 rounded-r-lg text-slate-500 text-sm flex items-center">
                                .localhost:3000
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Only lowercase letters, numbers, and hyphens.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (Optional)</label>
                        <input
                            type="url"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="https://example.com/logo.png"
                            value={formData.logo_url}
                            onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {mutation.isPending ? 'Registering...' : 'Create Partner Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
