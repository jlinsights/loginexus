'use client';

import React from 'react';

export function AdminProfile() {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden md:block">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Admin User</div>
        <div className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors">View Profile</div>
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-slate-600">
        <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">AD</span>
      </div>
    </div>
  );
}
