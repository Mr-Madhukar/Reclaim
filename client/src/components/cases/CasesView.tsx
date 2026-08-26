import React, { useState } from 'react';
import { CaseFilters } from './CaseFilters';
import { CaseTable } from './CaseTable';
import { CaseDetailDrawer } from './CaseDetailDrawer';
import { useCases } from '../../hooks/useCases';
import { CaseFilterParams, RecoveryCase } from '../../types';

export const CasesView: React.FC = () => {
  const [filters, setFilters] = useState<CaseFilterParams>({
    page: 1,
    limit: 10,
    lane: 'ALL',
    status: 'ALL',
    search: '',
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const { data, isLoading } = useCases(filters);

  const handleReset = () => {
    setFilters({
      page: 1,
      limit: 10,
      lane: 'ALL',
      status: 'ALL',
      search: '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Recovery Case Workbench
          </h2>
          <p className="text-xs sm:text-sm text-cream-700 dark:text-slate-400 mt-1">
            Filter, inspect, and execute bounded AI interventions with receipt-backed audit logs.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <CaseFilters filters={filters} onChange={setFilters} onReset={handleReset} />

      {/* Case Table */}
      <CaseTable
        cases={data?.cases || []}
        isLoading={isLoading}
        onSelectCase={(kase: RecoveryCase) => setSelectedCaseId(kase.id)}
        page={filters.page || 1}
        limit={filters.limit || 10}
        total={data?.total || 0}
        onPageChange={(newPage) => setFilters({ ...filters, page: newPage })}
      />

      {/* Case Detail Inspection Drawer */}
      {selectedCaseId && (
        <CaseDetailDrawer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </div>
  );
};
