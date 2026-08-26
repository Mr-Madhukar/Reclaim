import React, { useState } from 'react';
import { ShieldCheck, Save, CheckCircle2, Lock } from 'lucide-react';
import { usePolicyConfigs, useUpdatePolicyConfig } from '../../hooks/usePolicies';
import { useAuth } from '../../hooks/useAuth';
import { PolicyConfig, Lane } from '../../types';
import { getLaneBadgeProps, formatINR } from '../../lib/utils';

export const PolicyConfigView: React.FC = () => {
  const { data: configs, isLoading } = usePolicyConfigs();
  const updateMutation = useUpdatePolicyConfig();
  const { hasRole, switchRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const [formEdits, setFormEdits] = useState<Record<string, Partial<PolicyConfig>>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (id: string, field: keyof PolicyConfig, value: number) => {
    setFormEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (config: PolicyConfig) => {
    const data = { ...config, ...formEdits[config.id] };
    try {
      await updateMutation.mutateAsync({
        id: config.id,
        updates: {
          maxAttempts: data.maxAttempts,
          cooldownMinutes: data.cooldownMinutes,
          maxIncentiveAmount: data.maxIncentiveAmount,
          dailyCapGlobal: data.dailyCapGlobal,
        },
      });
      setSuccessMsg(`Policy for ${data.lane} updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-8 border-cream-300 dark:border-surface-750 animate-pulse space-y-4">
        <div className="h-8 bg-cream-300/50 dark:bg-surface-800 rounded w-1/3"></div>
        <div className="h-40 bg-cream-300/50 dark:bg-surface-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Deterministic Guardrails</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Policy Engine Configurations
          </h2>
          <p className="text-xs sm:text-sm text-cream-700 dark:text-slate-400 mt-1">
            Configure hard safety limits, retry ceilings, and compliance windows per recovery lane.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center space-x-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              Admin permissions required to modify policies.{' '}
              <button
                onClick={() => switchRole('ADMIN')}
                className="font-bold underline ml-1"
              >
                Switch to Admin
              </button>
            </span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center space-x-2 animate-slide-down">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3 Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(configs || []).map((config) => {
          const laneProps = getLaneBadgeProps(config.lane as Lane);
          const currentForm = { ...config, ...formEdits[config.id] };

          return (
            <div
              key={config.id}
              className="glass-card rounded-3xl p-6 sm:p-7 border-cream-300 dark:border-surface-750 shadow-lg space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-cream-300 dark:border-surface-750">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold border ${laneProps.bgClass} ${laneProps.textClass} ${laneProps.borderClass}`}
                  >
                    {laneProps.label}
                  </span>
                  <span className="text-[11px] font-mono text-cream-600 dark:text-slate-400">
                    Rule ID: {config.id.slice(0, 8)}
                  </span>
                </div>

                {/* Field 1: Max Attempts */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-cream-800 dark:text-slate-200">
                    <span>Max Retry Attempts</span>
                    <span className="font-mono text-brand-500 font-bold">
                      {currentForm.maxAttempts} Attempts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    disabled={!isAdmin}
                    value={currentForm.maxAttempts || 3}
                    onChange={(e) => handleChange(config.id, 'maxAttempts', parseInt(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[10px] text-cream-600 dark:text-slate-400 block">
                    Hard ceiling per case before auto-closing.
                  </span>
                </div>

                {/* Field 2: Cooldown Minutes */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-cream-800 dark:text-slate-200">
                    <span>Cool-down Window</span>
                    <span className="font-mono text-brand-500 font-bold">
                      {currentForm.cooldownMinutes} Minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="1440"
                    step="15"
                    disabled={!isAdmin}
                    value={currentForm.cooldownMinutes || 60}
                    onChange={(e) => handleChange(config.id, 'cooldownMinutes', parseInt(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[10px] text-cream-600 dark:text-slate-400 block">
                    Minimum delay between consecutive outreach touches.
                  </span>
                </div>

                {/* Field 3: Max Incentive Ceiling */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-cream-800 dark:text-slate-200">
                    <span>Max Incentive Ceiling</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatINR(currentForm.maxIncentiveAmount || 0)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    step="50"
                    disabled={!isAdmin}
                    value={currentForm.maxIncentiveAmount || 0}
                    onChange={(e) => handleChange(config.id, 'maxIncentiveAmount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                  />
                  <span className="text-[10px] text-cream-600 dark:text-slate-400 block">
                    Maximum recovery discount allowable per customer.
                  </span>
                </div>

                {/* Field 4: Global Daily Cap */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-cream-800 dark:text-slate-200">
                    <span>Daily Outreach Cap</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {currentForm.dailyCapGlobal || 500} Actions/Day
                    </span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    step="50"
                    disabled={!isAdmin}
                    value={currentForm.dailyCapGlobal || 500}
                    onChange={(e) => handleChange(config.id, 'dailyCapGlobal', parseInt(e.target.value) || 500)}
                    className="w-full px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
                  />
                  <span className="text-[10px] text-cream-600 dark:text-slate-400 block">
                    Rate limiter across the entire merchant account.
                  </span>
                </div>
              </div>

              {/* Save Button */}
              {isAdmin && (
                <div className="pt-4 border-t border-cream-300 dark:border-surface-750">
                  <button
                    onClick={() => handleSave(config)}
                    disabled={updateMutation.isPending}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-orange transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save {config.lane} Guardrails</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
