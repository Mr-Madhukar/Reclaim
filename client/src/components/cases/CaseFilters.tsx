import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { CaseFilterParams, CaseStatus, Lane } from '../../types';

interface CaseFiltersProps {
  filters: CaseFilterParams;
  onChange: (newFilters: CaseFilterParams) => void;
  onReset: () => void;
}

export const CaseFilters: React.FC<CaseFiltersProps> = ({ filters, onChange, onReset }) => {
  return (
    <div className="glass-card rounded-2xl p-4 border-cream-300 dark:border-surface-750 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-600 dark:text-slate-400" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          placeholder="Search by customer name, email, or source ID..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-cream-900 dark:text-slate-200 placeholder:text-cream-600 dark:placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Lane Filter */}
        <div className="flex items-center space-x-1">
          <Filter className="h-3.5 w-3.5 text-brand-500" />
          <select
            value={filters.lane || 'ALL'}
            onChange={(e) => onChange({ ...filters, lane: e.target.value as Lane | 'ALL', page: 1 })}
            className="px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-cream-900 dark:text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Loss Lanes</option>
            <option value="PAYMENT">Payment Degradation</option>
            <option value="CHECKOUT">Checkout Drop-off</option>
            <option value="RECEIVABLE">B2B Receivables</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onChange({ ...filters, status: e.target.value as CaseStatus | 'ALL', page: 1 })}
          className="px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-cream-900 dark:text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Active at Risk</option>
          <option value="RECOVERED">Recovered (Receipted)</option>
          <option value="STOPPED_MAX_ATTEMPTS">Stopped (Max Attempts)</option>
          <option value="STOPPED_OPTED_OUT">Stopped (Opt-Out)</option>
          <option value="ESCALATED_TO_HUMAN">Escalated to Human</option>
          <option value="EXPIRED">Expired</option>
        </select>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset Filters"
          className="p-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-cream-700 dark:text-slate-300 hover:text-brand-500 hover:border-brand-500/50 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
