import React from 'react';
import { KpiCardGrid } from './KpiCardGrid';
import { BatchRunBanner } from './BatchRunBanner';
import { MeasuredRecoverySection } from './MeasuredRecoverySection';
import { StoppingRulesSection } from './StoppingRulesSection';
import { LaneBreakdown } from './LaneBreakdown';
import { RecoveryCharts } from './RecoveryCharts';
import { useMetricsSummary } from '../../hooks/useMetrics';

export const DashboardOverview: React.FC = () => {
  const { data: summary, isLoading } = useMetricsSummary(30000);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Revenue Recovery Command Center
          </h2>
          <p className="text-xs sm:text-sm text-cream-700 dark:text-slate-400 mt-1">
            Real-time financial telemetry, loss lane conversion rates, and deterministic stopping rule enforcement.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCardGrid summary={summary} isLoading={isLoading} />

      {/* Interactive Batch Trigger Banner */}
      <BatchRunBanner />

      {/* Verifiable Rupee Ledger & Measured Recovery */}
      <MeasuredRecoverySection summary={summary} />

      {/* 3 Recovery Lanes Performance */}
      <LaneBreakdown summary={summary} />

      {/* Policy Guardrails & Stopping Rules Visibility */}
      <StoppingRulesSection summary={summary} />

      {/* Visual Charts */}
      <RecoveryCharts summary={summary} />
    </div>
  );
};
