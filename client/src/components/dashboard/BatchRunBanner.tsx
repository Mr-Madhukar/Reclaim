import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useRunBatch } from '../../hooks/useCases';
import { useAuth } from '../../hooks/useAuth';
import { BatchRunResult } from '../../types';

export const BatchRunBanner: React.FC = () => {
  const { hasRole } = useAuth();
  const runBatchMutation = useRunBatch();
  const [lastResult, setLastResult] = useState<BatchRunResult | null>(null);

  const isAdmin = hasRole(['ADMIN']);

  if (!isAdmin) {
    return null;
  }

  const handleRunBatch = async () => {
    try {
      const result = await runBatchMutation.mutateAsync({ limit: 10 });
      setLastResult(result);
    } catch (err) {
      console.error('Batch run error', err);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border-brand-500/30 mb-8 shadow-glow-orange animate-slide-up relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5" />
            <span>Interactive Demo Trigger</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Trigger Autonomous Agent Batch Processing
          </h3>
          <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
            Execute the full 6-stage recovery loop across all open cases in PostgreSQL: root-cause diagnosis via Gemini 2.0 Flash, deterministic policy gate checks, bounded action dispatch, and audit logging.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={handleRunBatch}
            disabled={runBatchMutation.isPending}
            className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm shadow-glow-orange hover:shadow-glow-orange-lg transition-all"
          >
            {runBatchMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Run Recovery Batch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Execution Outcome Result Display */}
      {lastResult && (
        <div className="mt-6 pt-4 border-t border-cream-300 dark:border-surface-750 flex flex-wrap items-center gap-4 text-xs font-mono animate-fade-in">
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Batch Complete:</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-cream-900 dark:text-slate-200">
            Processed: <strong>{lastResult.processedCount}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            Recovered: <strong>{lastResult.recoveredCount}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
            Guardrail Stops: <strong>{lastResult.stoppedCount}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
            Escalated: <strong>{lastResult.escalatedCount}</strong>
          </div>
          <div className="text-cream-600 dark:text-slate-400 text-[11px]">
            Duration: {lastResult.durationMs}ms
          </div>
        </div>
      )}

      {runBatchMutation.isError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Error running batch: {runBatchMutation.error.message}</span>
        </div>
      )}
    </div>
  );
};
