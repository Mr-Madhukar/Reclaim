import React from 'react';
import { KpiCardGrid } from './KpiCardGrid';
import { BatchRunBanner } from './BatchRunBanner';
import { LaneBreakdown } from './LaneBreakdown';
import { RecoveryCharts } from './RecoveryCharts';
import { useMetricsSummary } from '../../hooks/useMetrics';

export const DashboardOverview: React.FC = () => {
  const { data: summary, isLoading } = useMetricsSummary(10000);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Revenue Recovery Command Center
          </h2>
          <p className="text-xs sm:text-sm text-cream-700 dark:text-slate-400 mt-1">
            Real-time financial telemetry, loss lane conversion rates, and stopping rule enforcement.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCardGrid summary={summary} isLoading={isLoading} />

      {/* Interactive Batch Trigger Banner */}
      <BatchRunBanner />

      {/* 3 Recovery Lanes Performance */}
      <LaneBreakdown summary={summary} />

      {/* Visual Charts */}
      <RecoveryCharts summary={summary} />
    </div>
  );
};
