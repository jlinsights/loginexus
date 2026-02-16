'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAnalyticsSummary,
  fetchAnalyticsVolume,
  fetchStatusDistribution,
  fetchRoutePerformance,
  fetchEscrowAnalyticsSummary,
} from '@/lib/api';
import { KpiCards } from '@/app/components/analytics/KpiCards';
import { DateRangeBar } from '@/app/components/analytics/DateRangeBar';
import { VolumeChart } from '@/app/components/analytics/VolumeChart';
import { StatusPieChart } from '@/app/components/analytics/StatusPieChart';
import { RouteTable } from '@/app/components/analytics/RouteTable';
import { EscrowSummaryCard } from '@/app/components/analytics/EscrowSummaryCard';
import { ExportCsvButton } from '@/app/components/analytics/ExportCsvButton';

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [granularity, setGranularity] = useState('daily');

  const params = { start_date: startDate, end_date: endDate };

  const summary = useQuery({
    queryKey: ['analytics', 'summary', params],
    queryFn: () => fetchAnalyticsSummary(params),
  });

  const volume = useQuery({
    queryKey: ['analytics', 'volume', params, granularity],
    queryFn: () => fetchAnalyticsVolume({ ...params, granularity }),
  });

  const statusDist = useQuery({
    queryKey: ['analytics', 'status-distribution', params],
    queryFn: () => fetchStatusDistribution(params),
  });

  const routes = useQuery({
    queryKey: ['analytics', 'route-performance', params],
    queryFn: () => fetchRoutePerformance(params),
  });

  const escrow = useQuery({
    queryKey: ['analytics', 'escrow-summary', params],
    queryFn: () => fetchEscrowAnalyticsSummary(params),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Shipment performance and financial overview.</p>
        </div>
        <ExportCsvButton volumeData={volume.data} routeData={routes.data} />
      </div>

      <DateRangeBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onExport={() => {}}
      />

      <KpiCards data={summary.data} isLoading={summary.isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <VolumeChart
            data={volume.data}
            isLoading={volume.isLoading}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        </div>
        <StatusPieChart data={statusDist.data} isLoading={statusDist.isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <RouteTable data={routes.data} isLoading={routes.isLoading} />
        </div>
        <EscrowSummaryCard data={escrow.data} isLoading={escrow.isLoading} />
      </div>
    </div>
  );
}
