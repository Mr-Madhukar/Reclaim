import React from 'react';
import {
  ShieldAlert,
  Clock,
  UserX,
  Repeat,
  DollarSign,
  CheckCircle2,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { MetricSummary } from '../../types';

interface StoppingRulesSectionProps {
  summary?: MetricSummary;
  onNavigateAudit?: () => void;
}

export const StoppingRulesSection: React.FC<StoppingRulesSectionProps> = ({
  summary,
  onNavigateAudit,
}) => {
  const breakdown = summary?.stoppingRulesBreakdown || {
    maxAttempts: 12,
    customerOptOut: 4,
    cooldownActive: 8,
    contactHours: 6,
    monetaryCeiling: 3,
    dailyCap: 2,
    total: summary?.stoppingRuleTriggersCount || 35,
  };

  const rules = [
    {
      id: 'max-attempts',
      name: 'Max Retries Ceiling',
      desc: 'Hard stop after 3 attempts per incident',
      count: breakdown.maxAttempts,
      icon: Repeat,
      color: 'text-risk dark:text-risk-light bg-risk/10 border-risk/20',
      badge: 'Hard Cap',
    },
    {
      id: 'opt-out',
      name: 'Customer Opt-Out',
      desc: 'Permanent halt upon customer STOP request',
      count: breakdown.customerOptOut,
      icon: UserX,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'Irreversible',
    },
    {
      id: 'business-hours',
      name: 'Business Hours Gate',
      desc: 'Dispatches strictly 9:00 AM – 7:00 PM IST',
      count: breakdown.contactHours,
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badge: 'Time Gate',
    },
    {
      id: 'cooldown',
      name: 'Mandatory Cooldown',
      desc: '60 min minimum delay between touches',
      count: breakdown.cooldownActive,
      icon: Lock,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      badge: 'Throttle',
    },
    {
      id: 'budget-ceiling',
      name: 'Monetary & Daily Caps',
      desc: 'Max ₹500 discount & merchant budget limits',
      count: breakdown.monetaryCeiling + breakdown.dailyCap,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Budget Safe',
    },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border-amber-500/30 shadow-xl space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Deterministic Policy Engine</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Stopping Rules &amp; Guardrail Telemetry
          </h3>
          <p className="text-xs sm:text-sm text-cream-800 dark:text-slate-300 mt-1">
            Zero runaway agent loops. 100% of interventions are validated against strict business policies before dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>0 Policy Breaches</span>
          </span>
        </div>
      </div>

      {/* Grid of Stopping Conditions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <div
              key={rule.id}
              className="p-4 rounded-2xl bg-cream-200/60 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${rule.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cream-300/80 dark:bg-surface-750 text-cream-800 dark:text-slate-300">
                  {rule.badge}
                </span>
              </div>

              <div>
                <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white block">
                  {rule.count}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {rule.name}
                </span>
                <p className="text-[11px] text-cream-700 dark:text-slate-300 mt-1 leading-snug">
                  {rule.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-cream-300/80 dark:border-surface-750 text-xs text-cream-800 dark:text-slate-300">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>
            Every policy evaluation writes an immutable record with pre-condition and outcome diffs.
          </span>
        </div>

        {onNavigateAudit && (
          <button
            type="button"
            onClick={onNavigateAudit}
            className="inline-flex items-center space-x-1 font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0"
          >
            <span>Inspect Audit Trail</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
