import React from 'react';
import { CreditCard, ShoppingCart, Building2 } from 'lucide-react';
import { MetricSummary } from '../../types';
import { formatINR } from '../../lib/utils';

interface LaneBreakdownProps {
  summary?: MetricSummary;
}

export const LaneBreakdown: React.FC<LaneBreakdownProps> = ({ summary }) => {
  const lanes = [
    {
      key: 'payment',
      name: 'Lane A: Payment Degradation',
      sub: 'Root-cause retries & mandates',
      icon: CreditCard,
      badgeBg: 'bg-brand-500/10 text-brand-500',
      data: summary?.laneMetrics?.payment || { atRisk: 0, recovered: 0, rate: 0, caseCount: 0 },
      barGradient: 'from-brand-500 to-amber-400',
    },
    {
      key: 'checkout',
      name: 'Lane B: Checkout Drop-off',
      sub: 'Cart recovery & capped incentives',
      icon: ShoppingCart,
      badgeBg: 'bg-indigo-500/10 text-indigo-500',
      data: summary?.laneMetrics?.checkout || { atRisk: 0, recovered: 0, rate: 0, caseCount: 0 },
      barGradient: 'from-brand-500 to-indigo-500',
    },
    {
      key: 'receivable',
      name: 'Lane C: B2B Receivables',
      sub: 'Overdue invoices & promise-to-pay',
      icon: Building2,
      badgeBg: 'bg-amber-500/10 text-amber-500',
      data: summary?.laneMetrics?.receivable || { atRisk: 0, recovered: 0, rate: 0, caseCount: 0 },
      barGradient: 'from-brand-500 to-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {lanes.map((lane) => {
        const Icon = lane.icon;
        const rate = lane.data.rate || 0;
        return (
          <div
            key={lane.key}
            className="glass-card rounded-3xl p-6 border-cream-300 dark:border-surface-750 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl ${lane.badgeBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {lane.name}
                  </h4>
                  <p className="text-[11px] text-cream-700 dark:text-slate-400">
                    {lane.sub}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cream-300/80 dark:border-surface-750/80 text-xs">
              <div>
                <span className="text-cream-600 dark:text-slate-400 block text-[11px]">
                  At Risk
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(lane.data.atRisk)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-cream-600 dark:text-slate-400 block text-[11px]">
                  Recovered
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatINR(lane.data.recovered)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-cream-800 dark:text-slate-300 mb-1">
                <span>Conversion Rate</span>
                <span className="font-mono">{rate.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 bg-cream-300/80 dark:bg-surface-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${lane.barGradient} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] font-mono text-cream-600 dark:text-slate-400 text-right">
              {lane.data.caseCount} Total Cases In Lane
            </div>
          </div>
        );
      })}
    </div>
  );
};
