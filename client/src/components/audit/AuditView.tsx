import React, { useState } from 'react';
import { AuditLogTable } from './AuditLogTable';
import { JsonDiffModal } from './JsonDiffModal';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { AuditLog } from '../../types';
import { ShieldCheck } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { data, isLoading } = useAuditLogs({ limit: 50 });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cryptographic State Proofs</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Immutable Audit Trail &amp; Receipts
          </h2>
          <p className="text-xs sm:text-sm text-cream-700 dark:text-slate-400 mt-1">
            Every AI diagnosis, policy check, dispatched intervention, and state mutation with full JSON before/after diffs.
          </p>
        </div>
      </div>

      <AuditLogTable
        logs={data?.auditLogs || []}
        isLoading={isLoading}
        onInspectLog={(log) => setSelectedLog(log)}
      />

      {selectedLog && (
        <JsonDiffModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};
