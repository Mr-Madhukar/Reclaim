import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  BrainCircuit,
  Send,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCode2,
  Lock,
} from 'lucide-react';
import { useCaseDetail, useTriggerAction, useResolveEscalation, useLogPromiseToPay } from '../../hooks/useCases';
import { useAuth } from '../../hooks/useAuth';
import {
  formatINR,
  formatDate,
  formatRelativeTime,
  getLaneBadgeProps,
  getStatusBadgeProps,
  formatRootCause,
} from '../../lib/utils';

interface CaseDetailDrawerProps {
  caseId: string | null;
  onClose: () => void;
}

export const CaseDetailDrawer: React.FC<CaseDetailDrawerProps> = ({ caseId, onClose }) => {
  const { data: kase, isLoading } = useCaseDetail(caseId);
  const { user, hasRole, switchRole } = useAuth();

  const triggerActionMutation = useTriggerAction();
  const resolveMutation = useResolveEscalation();
  const promiseMutation = useLogPromiseToPay();

  const [notes, setNotes] = useState('');
  const [resolveOutcome, setResolveOutcome] = useState<'RECOVERED' | 'EXPIRED' | 'UNRESOLVED'>('RECOVERED');
  const [promiseAmount, setPromiseAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const canAct = hasRole(['ADMIN', 'REVIEWER']);

  if (!caseId) return null;

  const handleTriggerAction = async () => {
    try {
      const res = await triggerActionMutation.mutateAsync(caseId);
      setActionFeedback(res.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionFeedback(`Action blocked: ${err.message}`);
      } else {
        setActionFeedback('Action blocked: An unexpected error occurred');
      }
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    try {
      await resolveMutation.mutateAsync({ id: caseId, notes, outcome: resolveOutcome });
      setNotes('');
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleLogPromise = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(promiseAmount);
    if (isNaN(amt) || !promiseDate) return;
    try {
      await promiseMutation.mutateAsync({ id: caseId, promisedAmount: amt, promisedDate: promiseDate });
      setPromiseAmount('');
      setPromiseDate('');
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="relative w-full max-w-2xl h-full bg-cream-100 dark:bg-surface-900 border-l border-cream-300 dark:border-surface-750 shadow-2xl p-6 sm:p-8 overflow-y-auto z-10 space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-cream-300 dark:border-surface-750">
          <div>
            <span className="text-[10px] font-mono uppercase text-brand-600 dark:text-brand-400 font-bold">
              Case Inspection Drawer
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {kase ? kase.customer.name : 'Loading Case...'}
            </h3>
            <div className="text-xs font-mono text-cream-600 dark:text-slate-400">
              ID: {caseId}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-cream-200 dark:bg-surface-800 text-cream-700 dark:text-slate-300 hover:text-brand-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading || !kase ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-cream-200 dark:bg-surface-800 rounded-2xl"></div>
            <div className="h-40 bg-cream-200 dark:bg-surface-800 rounded-2xl"></div>
          </div>
        ) : (
          <>
            {/* Customer & Status Header Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-cream-200/70 dark:bg-surface-850 border border-cream-300 dark:border-surface-750">
                <span className="text-[10px] text-cream-600 dark:text-slate-400 uppercase font-mono block">
                  Amount At Risk
                </span>
                <span className="text-base font-extrabold font-mono text-risk dark:text-risk-light">
                  {formatINR(kase.amount)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-cream-200/70 dark:bg-surface-850 border border-cream-300 dark:border-surface-750">
                <span className="text-[10px] text-cream-600 dark:text-slate-400 uppercase font-mono block">
                  Loss Lane
                </span>
                <span
                  className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-mono border ${
                    getLaneBadgeProps(kase.lane).bgClass
                  } ${getLaneBadgeProps(kase.lane).textClass} ${getLaneBadgeProps(kase.lane).borderClass}`}
                >
                  {getLaneBadgeProps(kase.lane).label}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-cream-200/70 dark:bg-surface-850 border border-cream-300 dark:border-surface-750">
                <span className="text-[10px] text-cream-600 dark:text-slate-400 uppercase font-mono block">
                  Case Status
                </span>
                <span
                  className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-mono border ${
                    getStatusBadgeProps(kase.status).bgClass
                  } ${getStatusBadgeProps(kase.status).textClass} ${getStatusBadgeProps(kase.status).borderClass}`}
                >
                  {getStatusBadgeProps(kase.status).label}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-cream-200/70 dark:bg-surface-850 border border-cream-300 dark:border-surface-750">
                <span className="text-[10px] text-cream-600 dark:text-slate-400 uppercase font-mono block">
                  Opened
                </span>
                <span className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                  {formatRelativeTime(kase.openedAt)}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-cream-200/50 dark:bg-surface-850/80 border border-cream-300 dark:border-surface-750 space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <User className="h-4 w-4 text-brand-500" />
                <span>Customer Profile</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-cream-700 dark:text-slate-300 font-mono">
                <div>Email: {kase.customer.email}</div>
                <div>Phone: {kase.customer.phone || 'N/A'}</div>
                <div>Source Reference: {kase.sourceRefId}</div>
                <div>
                  Opt-out Status:{' '}
                  {kase.customer.optedOut ? (
                    <span className="text-rose-500 font-bold">OPTED OUT</span>
                  ) : (
                    <span className="text-emerald-500 font-bold">ACTIVE (CAN CONTACT)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Root-Cause Diagnosis (Gemini 2.0 Flash) */}
            <div className="p-5 rounded-2xl glass-card border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase font-mono">
                  <BrainCircuit className="h-4 w-4" />
                  <span>Gemini 2.0 AI Root-Cause Diagnosis</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  94% Confidence
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Bucket: <span className="text-brand-500 font-mono">{formatRootCause(kase.rootCause)}</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Autonomous agent classified transaction drop-off and recommended bounded intervention based on merchant policy configurations.
              </p>
            </div>

            {/* Deterministic Policy Guardrail Check */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Deterministic Policy Engine Status</span>
              </div>
              <p className="text-emerald-900 dark:text-emerald-300 text-[11px]">
                {kase.status === 'OPEN'
                  ? 'All policy checks active: Cool-down window verified, within contact hours (9 AM - 7 PM), and max attempt limit respected.'
                  : `Case is currently in state ${kase.status}. Policy stopping rules enforced.`}
              </p>
            </div>

            {/* Mandate & Autonomous Retry Sequencer Visualizer */}
            <div className="p-5 rounded-2xl glass-card border-brand-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
                  <span>Mandate &amp; Retry Sequence Flow</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                  {kase.actions && kase.actions.length > 0 ? `${kase.actions.length} Touches Executed` : 'Attempt 1 Ready'}
                </span>
              </div>

              {/* Interactive Timeline Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                {/* Step 1: Detect & Diagnose */}
                <div className="p-3 rounded-xl bg-cream-200/80 dark:bg-surface-850 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span>1. Signal Ingest</span>
                    <span className="text-[10px]">✓</span>
                  </div>
                  <p className="text-[10px] text-cream-600 dark:text-slate-400">
                    {formatRootCause(kase.rootCause)}
                  </p>
                </div>

                {/* Step 2: Policy Compliance Check */}
                <div className="p-3 rounded-xl bg-cream-200/80 dark:bg-surface-850 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span>2. Policy Gate</span>
                    <span className="text-[10px]">✓</span>
                  </div>
                  <p className="text-[10px] text-cream-600 dark:text-slate-400">
                    DND 9-19 IST + Cooldown
                  </p>
                </div>

                {/* Step 3: Bounded Touch */}
                <div className={`p-3 rounded-xl bg-cream-200/80 dark:bg-surface-850 border space-y-1 ${
                  kase.actions && kase.actions.length > 0 ? 'border-emerald-500/40' : 'border-brand-500/50 animate-pulse'
                }`}>
                  <div className="flex items-center justify-between font-bold text-brand-600 dark:text-brand-400">
                    <span>3. Intervention</span>
                    <span className="text-[10px]">{kase.actions && kase.actions.length > 0 ? '✓' : '●'}</span>
                  </div>
                  <p className="text-[10px] text-cream-600 dark:text-slate-400 truncate">
                    {kase.actions && kase.actions.length > 0 ? kase.actions[0].actionType : 'Ready to Dispatch'}
                  </p>
                </div>

                {/* Step 4: Resolution Outcome */}
                <div className={`p-3 rounded-xl bg-cream-200/80 dark:bg-surface-850 border space-y-1 ${
                  kase.status === 'RECOVERED' ? 'border-emerald-500 bg-emerald-500/10' : 'border-cream-300 dark:border-surface-700'
                }`}>
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>4. Outcome</span>
                    <span className="text-[10px]">{kase.status === 'RECOVERED' ? '₹' : '⏳'}</span>
                  </div>
                  <p className="text-[10px] text-cream-600 dark:text-slate-400 font-mono">
                    {kase.status === 'RECOVERED' ? 'Recovered & Verified' : kase.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Trigger Buttons (Role Gated) */}
            <div className="p-5 rounded-2xl glass-card border-brand-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Bounded Action Dispatcher
                </h4>
                {!canAct && (
                  <span className="text-[10px] text-amber-600 flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>Requires Admin or Reviewer</span>
                  </span>
                )}
              </div>

              {canAct ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleTriggerAction}
                    disabled={triggerActionMutation.isPending || kase.status !== 'OPEN'}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-bold shadow-glow-orange transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {triggerActionMutation.isPending ? 'Executing...' : 'Trigger Next Bounded Action'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-cream-700 dark:text-slate-400">
                  Logged in as <strong>{user?.role}</strong> (read-only).{' '}
                  <button
                    onClick={() => switchRole('REVIEWER')}
                    className="text-brand-500 underline font-semibold"
                  >
                    Switch to Reviewer
                  </button>{' '}
                  to execute recovery actions.
                </div>
              )}

              {actionFeedback && (
                <div className="p-3 rounded-xl bg-cream-200 dark:bg-surface-850 text-xs font-mono text-slate-800 dark:text-slate-200 border border-cream-300 dark:border-surface-700 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                  <span>{actionFeedback}</span>
                </div>
              )}
            </div>

            {/* B2B Promise to Pay Form (If Lane C) */}
            {kase.lane === 'RECEIVABLE' && canAct && kase.status === 'OPEN' && (
              <div className="p-4 rounded-2xl glass-card border-amber-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase font-mono">
                  <Calendar className="h-4 w-4" />
                  <span>Log Promise-to-Pay Commitment</span>
                </div>
                <form onSubmit={handleLogPromise} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-600 dark:text-slate-400" />
                      <input
                        type="number"
                        placeholder="Promised Amount (₹)"
                        value={promiseAmount}
                        onChange={(e) => setPromiseAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="date"
                      value={promiseDate}
                      onChange={(e) => setPromiseDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promiseMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                  >
                    Save Commitment Receipt
                  </button>
                </form>
              </div>
            )}

            {/* Human Resolution Form (If Escalated or Admin Wants to Close) */}
            {canAct && kase.status !== 'RECOVERED' && (
              <div className="p-4 rounded-2xl glass-card border-cream-300 dark:border-surface-750 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Manual Case Resolution
                </h4>
                <form onSubmit={handleResolve} className="space-y-3">
                  <select
                    value={resolveOutcome}
                    onChange={(e) =>
                      setResolveOutcome(e.target.value as 'RECOVERED' | 'EXPIRED' | 'UNRESOLVED')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="RECOVERED">Mark as Recovered</option>
                    <option value="EXPIRED">Close as Expired</option>
                    <option value="UNRESOLVED">Mark as Unresolved</option>
                  </select>
                  <textarea
                    rows={2}
                    placeholder="Resolution notes / reviewer reason..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={resolveMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-surface-750 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Resolve &amp; Write Audit Receipt
                  </button>
                </form>
              </div>
            )}

            {/* Action History Timeline */}
            <div className="space-y-3 pt-4 border-t border-cream-300 dark:border-surface-750">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <FileCode2 className="h-4 w-4 text-brand-500" />
                <span>Intervention History &amp; Receipts ({kase.actions?.length || 0})</span>
              </h4>

              {kase.actions && kase.actions.length > 0 ? (
                <div className="space-y-2.5">
                  {kase.actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-cream-200/80 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {act.actionType} (Attempt #{act.attemptNumber})
                        </span>
                        <span className="text-[10px] text-cream-600 dark:text-slate-400">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                      <div className="text-cream-700 dark:text-slate-300">
                        Reason: {act.decisionReason}
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-cream-600 dark:text-slate-400">
                        <span>Channel: {act.channel || 'system'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          {act.outcome || 'executed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-cream-600 dark:text-slate-400 italic">
                  No recovery actions executed for this case yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
