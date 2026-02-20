'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full">
        <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Dashboard Error
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm text-sm">
        {error.message || 'Failed to load dashboard data. The backend may be unavailable.'}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reload Dashboard
      </button>
    </div>
  );
}
