'use client';

import React from 'react';
import { Download } from 'lucide-react';
import type { VolumeDataPoint, RoutePerformance } from '../../../lib/api';

interface ExportCsvButtonProps {
  volumeData: VolumeDataPoint[] | undefined;
  routeData: RoutePerformance[] | undefined;
}

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportCsvButton({ volumeData, routeData }: ExportCsvButtonProps) {
  const handleExport = () => {
    const parts: string[] = [];

    if (volumeData && volumeData.length > 0) {
      parts.push('--- Shipment Volume ---');
      parts.push(
        toCsv(
          ['Date', 'Total', 'Booked', 'In Transit', 'Delivered'],
          volumeData.map((d) => [
            d.date,
            String(d.count),
            String(d.status_booked),
            String(d.status_in_transit),
            String(d.status_delivered),
          ]),
        ),
      );
    }

    if (routeData && routeData.length > 0) {
      parts.push('\n--- Route Performance ---');
      parts.push(
        toCsv(
          ['Origin', 'Destination', 'Shipments', 'Avg Transit Days', 'On-Time Rate %'],
          routeData.map((r) => [
            r.origin,
            r.destination,
            String(r.shipment_count),
            r.avg_transit_days.toFixed(1),
            r.on_time_rate.toFixed(1),
          ]),
        ),
      );
    }

    if (parts.length === 0) {
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    download(`analytics-${date}.csv`, parts.join('\n'));
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
