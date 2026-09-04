import React, { useEffect } from 'react';
import { X, FileCode, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDate } from '../../lib/utils';

interface JsonDiffModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

export const JsonDiffModal: React.FC<JsonDiffModalProps> = ({ log, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!log) return null;

  return (
    <dialog
      open
      aria-modal="true"
      aria-label="Audit Receipt Diff"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in w-full h-full max-w-none max-h-none m-0 bg-transparent border-0"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close audit diff backdrop"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm w-full h-full border-0 p-0 cursor-default"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-cream-300 dark:border-surface-750 z-10 max-h-[90vh] overflow-y-auto space-y-6 animate-slide-up">
        <div className="flex items-start justify-between pb-4 border-b border-cream-300 dark:border-surface-750">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase text-brand-600 dark:text-brand-400">
                Audit Receipt Diff
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                <span>IMMUTABLE RECEIPT</span>
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
              Event: {log.eventType} ({log.entityType})
            </h3>
            <div className="text-xs font-mono text-cream-600 dark:text-slate-400">
              Logged by <strong className="text-brand-500">{log.actor}</strong> at {formatDate(log.createdAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close diff modal"
            className="p-1.5 rounded-xl bg-cream-200 dark:bg-surface-800 text-cream-700 dark:text-slate-300 hover:text-brand-500 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reason */}
        <div className="p-4 rounded-2xl bg-cream-200/60 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs">
          <span className="font-bold text-slate-900 dark:text-white uppercase font-mono block mb-1">
            Decision Reason / Trigger Note
          </span>
          <p className="text-cream-800 dark:text-slate-200 leading-relaxed font-mono">
            {log.reason}
          </p>
        </div>

        {/* Before & After JSON Diffs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cream-700 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <FileCode className="h-3.5 w-3.5 text-rose-500" />
                <span>State Before Event</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-950 text-rose-300 font-mono text-xs overflow-x-auto border border-surface-750 max-h-64">
              <pre>
                {log.beforeJson ? JSON.stringify(log.beforeJson, null, 2) : '// null (Initial creation)'}
              </pre>
            </div>
          </div>

          {/* After JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cream-700 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <FileCode className="h-3.5 w-3.5 text-emerald-500" />
                <span>State After Event</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-surface-750 max-h-64">
              <pre>
                {log.afterJson ? JSON.stringify(log.afterJson, null, 2) : '// null'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
