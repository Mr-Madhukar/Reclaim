import React from 'react';
import { Activity, Coins, Zap, ShieldCheck } from 'lucide-react';
import { MetricSummary } from '../../types';
import { formatINR } from '../../lib/utils';

interface KpiCardGridProps {
  summary?: MetricSummary;
  isLoading?: boolean;
}

export const KpiCardGrid: React.FC<KpiCardGridProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card rounded-3xl p-6 border-cream-300 dark:border-surface-750 animate-pulse h-36"
          >
            <div className="h-4 bg-cream-300/60 dark:bg-surface-750 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-cream-300/80 dark:bg-surface-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-cream-300/40 dark:bg-surface-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const atRisk = summary?.totalAtRisk || 0;
  const recovered = summary?.totalRecovered || 0;
  const netRecovered = summary?.netRecovered || recovered;
  const recoveryRate = summary?.recoveryRatePercent || 0;
  const guardrailStops = summary?.stoppingRuleTriggersCount || 0;
  const activeCases = summary?.activeCasesCount || 0;
  const recoveredCases = summary?.recoveredCasesCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-slide-up">
      {/* KPI 1: ₹ Total At Risk */}
      <div aria-label={`Total at risk: ${formatINR(atRisk)}, ${activeCases} active cases`} className="glass-card glass-card-hover rounded-3xl p-6 border-cream-300 dark:border-surface-750">
        <div className="flex items-center justify-between text-cream-700 dark:text-slate-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-bold">
            ₹ Total at Risk
          </span>
          <div className="p-2 rounded-xl bg-risk/10 text-risk dark:text-risk-light">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
          {formatINR(atRisk)}
        </div>
        <div className="text-xs text-cream-700 dark:text-slate-400 mt-2 flex items-center justify-between">
          <span>Active cases:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
            {activeCases} Cases
          </span>
        </div>
      </div>

      {/* KPI 2: ₹ Measured Recovered */}
      <div aria-label={`Measured recovered: ${formatINR(recovered)}, ${recoveredCases} cases recovered`} className="glass-card glass-card-hover rounded-3xl p-6 border-emerald-500/30">
        <div className="flex items-center justify-between text-cream-700 dark:text-slate-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">
            ₹ Measured Recovered
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Coins className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
          {formatINR(recovered)}
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-400/90 mt-2 flex items-center justify-between">
          <span>Verified receipts:</span>
          <span className="font-mono font-bold">
            {recoveredCases} Cases (Net {formatINR(netRecovered)})
          </span>
        </div>
      </div>

      {/* KPI 3: Net Recovery Rate % */}
      <div aria-label={`Recovery rate: ${recoveryRate.toFixed(1)} percent across 3 loss lanes`} className="glass-card glass-card-hover rounded-3xl p-6 border-brand-500/30">
        <div className="flex items-center justify-between text-cream-700 dark:text-slate-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400">
            Recovery Rate
          </span>
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
            <Zap className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-brand-600 dark:text-brand-400">
          {recoveryRate.toFixed(1)}%
        </div>
        <div className="text-xs text-cream-700 dark:text-slate-400 mt-2 flex items-center justify-between">
          <span>Conversion:</span>
          <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">
            Across 3 Loss Lanes
          </span>
        </div>
      </div>

      {/* KPI 4: Policy Guardrail Stops */}
      <div aria-label={`Guardrail stops: ${guardrailStops} compliance stops triggered`} className="glass-card glass-card-hover rounded-3xl p-6 border-amber-500/30">
        <div className="flex items-center justify-between text-cream-700 dark:text-slate-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
            Guardrail Stops
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700 dark:text-amber-400">
          {guardrailStops}
        </div>
        <div className="text-xs text-cream-700 dark:text-slate-400 mt-2 flex items-center justify-between">
          <span>Compliance stops:</span>
          <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
            Max retries / Cooldowns
          </span>
        </div>
      </div>
    </div>
  );
};
