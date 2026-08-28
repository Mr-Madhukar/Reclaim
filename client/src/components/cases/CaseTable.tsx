import React from 'react';
import { ChevronRight, ArrowRight, User } from 'lucide-react';
import { RecoveryCase } from '../../types';
import {
  formatINR,
  formatRelativeTime,
  getLaneBadgeProps,
  getStatusBadgeProps,
  formatRootCause,
} from '../../lib/utils';

interface CaseTableProps {
  cases: RecoveryCase[];
  isLoading: boolean;
  onSelectCase: (kase: RecoveryCase) => void;
  page: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  isLoading,
  onSelectCase,
  page,
  total,
  limit,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-6 border-cream-300 dark:border-surface-750 animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-cream-300/50 dark:bg-surface-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 border-cream-300 dark:border-surface-750 text-center space-y-3">
        <div className="text-3xl">🔍</div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No recovery cases found
        </h3>
        <p className="text-xs text-cream-700 dark:text-slate-400 max-w-sm mx-auto">
          Try resetting the search filter or changing the selected loss lane.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block glass-card rounded-3xl border-cream-300 dark:border-surface-750 overflow-hidden shadow-lg">
        <div tabIndex={0} role="region" aria-label="Recovery Cases Table" className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-brand-500">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-300/40 dark:bg-surface-850/80 text-cream-700 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-cream-300 dark:border-surface-750">
              <tr>
                <th scope="col" className="py-4 px-6">Case / Customer</th>
                <th scope="col" className="py-4 px-4">Loss Lane</th>
                <th scope="col" className="py-4 px-4">Amount</th>
                <th scope="col" className="py-4 px-4">Root Cause Diagnosis</th>
                <th scope="col" className="py-4 px-4">Status</th>
                <th scope="col" className="py-4 px-4 text-center">Actions</th>
                <th scope="col" className="py-4 px-4">Opened</th>
                <th scope="col" className="py-4 px-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300/60 dark:divide-surface-750/60">
              {cases.map((kase) => {
                const laneBadge = getLaneBadgeProps(kase.lane);
                const statusBadge = getStatusBadgeProps(kase.status);

                return (
                  <tr
                    key={kase.id}
                    onClick={() => onSelectCase(kase)}
                    className="hover:bg-cream-200/80 dark:hover:bg-surface-800/80 transition-colors cursor-pointer group"
                  >
                    {/* Customer info */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                        <span>{kase.customer.name}</span>
                        {kase.customer.optedOut && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            OPTED-OUT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-cream-600 dark:text-slate-400 truncate max-w-[180px]">
                        {kase.customer.email}
                      </div>
                    </td>

                    {/* Lane */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${laneBadge.bgClass} ${laneBadge.textClass} ${laneBadge.borderClass}`}
                      >
                        {laneBadge.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(kase.amount)}
                    </td>

                    {/* Root Cause */}
                    <td className="py-4 px-4 font-mono text-cream-800 dark:text-slate-300 text-[11px]">
                      {formatRootCause(kase.rootCause)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} aria-hidden="true"></span>
                        <span>{statusBadge.label}</span>
                      </span>
                    </td>

                    {/* Actions Count */}
                    <td className="py-4 px-4 text-center font-mono text-[11px] text-cream-700 dark:text-slate-400">
                      {kase.actions?.length || 0} Touches
                    </td>

                    {/* Opened */}
                    <td className="py-4 px-4 text-cream-600 dark:text-slate-400 text-[11px]">
                      {formatRelativeTime(kase.openedAt)}
                    </td>

                    {/* Inspect button */}
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(kase);
                        }}
                        aria-label={`Inspect case for ${kase.customer.name}, amount ${formatINR(kase.amount)}`}
                        className="p-1.5 rounded-lg bg-cream-200 dark:bg-surface-750 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Stack View */}
      <div className="md:hidden space-y-3">
        {cases.map((kase) => {
          const laneBadge = getLaneBadgeProps(kase.lane);
          const statusBadge = getStatusBadgeProps(kase.status);

          return (
            <div
              key={kase.id}
              onClick={() => onSelectCase(kase)}
              className="glass-card rounded-2xl p-4 border-cream-300 dark:border-surface-750 active:scale-[0.99] transition-transform space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-brand-500" />
                    <span>{kase.customer.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-cream-600 dark:text-slate-400">
                    {kase.customer.email}
                  </div>
                </div>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {formatINR(kase.amount)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border ${laneBadge.bgClass} ${laneBadge.textClass} ${laneBadge.borderClass}`}
                >
                  {laneBadge.label}
                </span>

                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                >
                  <span className={`h-1 w-1 rounded-full ${statusBadge.dotClass}`}></span>
                  <span>{statusBadge.label}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-cream-300/80 dark:border-surface-750/80 text-cream-700 dark:text-slate-400">
                <span>Diagnosis: {formatRootCause(kase.rootCause)}</span>
                <span className="text-brand-500 font-semibold flex items-center space-x-1">
                  <span>Inspect</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Bar */}
      <nav aria-label="Cases pagination" className="flex items-center justify-between px-4 py-3 glass-card rounded-2xl border-cream-300 dark:border-surface-750 text-xs text-cream-700 dark:text-slate-400">
        <div>
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total cases)
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 disabled:opacity-40 hover:text-brand-500 transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 disabled:opacity-40 hover:text-brand-500 transition-colors"
          >
            Next
          </button>
        </div>
      </nav>
    </div>
  );
};
