import React from 'react';
import { FileCode2, UserCheck, Bot, Cpu } from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDate } from '../../lib/utils';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  onInspectLog: (log: AuditLog) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, isLoading, onInspectLog }) => {
  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-6 border-cream-300 dark:border-surface-750 animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-cream-300/50 dark:bg-surface-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 border-cream-300 dark:border-surface-750 text-center space-y-3">
        <div className="text-3xl">📜</div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No audit log entries recorded yet
        </h3>
        <p className="text-xs text-cream-700 dark:text-slate-400 max-w-sm mx-auto">
          Audit entries are generated automatically as the agent evaluates cases and policy gates.
        </p>
      </div>
    );
  }

  const getActorIcon = (actor: string) => {
    if (actor.startsWith('agent')) return <Bot className="h-3.5 w-3.5 text-brand-500" />;
    if (actor.startsWith('system')) return <Cpu className="h-3.5 w-3.5 text-purple-500" />;
    return <UserCheck className="h-3.5 w-3.5 text-indigo-500" />;
  };

  return (
    <div className="glass-card rounded-3xl border-cream-300 dark:border-surface-750 overflow-hidden shadow-lg">
      <div tabIndex={0} role="region" aria-label="Audit Log Table" className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-brand-500">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-300/40 dark:bg-surface-850/80 text-cream-700 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-cream-300 dark:border-surface-750">
            <tr>
              <th scope="col" className="py-4 px-6">Timestamp</th>
              <th scope="col" className="py-4 px-4">Actor</th>
              <th scope="col" className="py-4 px-4">Event Type</th>
              <th scope="col" className="py-4 px-4">Entity</th>
              <th scope="col" className="py-4 px-4">Reason / Notes</th>
              <th scope="col" className="py-4 px-6 text-right">Receipt Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300/60 dark:divide-surface-750/60 font-mono">
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onInspectLog(log)}
                className="hover:bg-cream-200/80 dark:hover:bg-surface-800/80 transition-colors cursor-pointer group text-[11px]"
              >
                <td className="py-4 px-6 text-cream-700 dark:text-slate-400 whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </td>

                <td className="py-4 px-4">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cream-200 dark:bg-surface-800 text-slate-800 dark:text-slate-200 border border-cream-300 dark:border-surface-700">
                    {getActorIcon(log.actor)}
                    <span>{log.actor}</span>
                  </span>
                </td>

                <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                  {log.eventType}
                </td>

                <td className="py-4 px-4 text-cream-600 dark:text-slate-400 truncate max-w-[140px]">
                  {log.entityType}:{log.entityId.slice(0, 8)}
                </td>

                <td className="py-4 px-4 text-cream-800 dark:text-slate-300 font-sans max-w-xs truncate">
                  {log.reason}
                </td>

                <td className="py-4 px-6 text-right">
                  <button className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cream-200 dark:bg-surface-750 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all text-xs font-sans font-semibold">
                    <FileCode2 className="h-3.5 w-3.5" />
                    <span>View Diff</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
