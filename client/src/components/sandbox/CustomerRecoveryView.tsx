import React, { useState } from 'react';
import {
  Smartphone,
  CreditCard,
  QrCode,
  Calendar,
  Ban,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useCases } from '../../hooks/useCases';
import { api } from '../../lib/api';
import { formatINR, formatRootCause } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export const CustomerRecoveryView: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: casesData } = useCases({ status: 'OPEN', limit: 10 });
  const openCases = casesData?.cases || [];

  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [promisedDate, setPromisedDate] = useState<string>(
    () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeCase = openCases.find((c) => c.id === selectedCaseId) || openCases[0];

  const handleCustomerAction = async (
    action: 'PAY_SUCCESS' | 'OPT_OUT' | 'PROMISE_TO_PAY' | 'ALT_PAYMENT',
    paymentMethod?: string
  ) => {
    if (!activeCase) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.cases.customerAction(activeCase.id, {
        action: action === 'ALT_PAYMENT' ? 'PAY_SUCCESS' : action,
        paymentMethod: paymentMethod || 'Card',
        promisedDate,
        promisedAmount: activeCase.amount,
      });

      setFeedback({ success: true, message: res.message });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ success: false, message: err.message });
      } else {
        setFeedback({ success: false, message: 'Action failed' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-300 dark:border-surface-750">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Smartphone className="h-3.5 w-3.5" />
            <span>End-Customer Recovery Portal</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Simulate Customer Payment &amp; Response Journey
          </h3>
          <p className="text-xs text-cream-700 dark:text-slate-400 mt-1">
            Experience how end-customers receive personalized Gemini copy, pay via alternate rails, or opt out.
          </p>
        </div>

        {/* Case selector */}
        {openCases.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-cream-700 dark:text-slate-400 whitespace-nowrap">
              Select Active Case:
            </span>
            <select
              value={selectedCaseId || (activeCase ? activeCase.id : '')}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 max-w-xs truncate"
            >
              {openCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer.name} ({formatINR(c.amount)} - {c.lane})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!activeCase ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-cream-700 dark:text-slate-400">
            No open recovery cases found. Trigger a webhook or batch run first to populate active cases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Simulated Mobile Phone Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm rounded-[2.5rem] bg-cream-900 dark:bg-surface-950 p-4 shadow-2xl border-4 border-cream-300 dark:border-surface-700">
              {/* Phone Speaker & Notch */}
              <div className="h-4 w-28 bg-cream-800 dark:bg-surface-800 rounded-full mx-auto mb-4"></div>

              {/* Screen Content */}
              <div className="bg-cream-100 dark:bg-surface-900 rounded-[2rem] p-5 space-y-4 text-xs shadow-inner">
                {/* Brand Header inside phone */}
                <div className="flex items-center justify-between pb-3 border-b border-cream-300 dark:border-surface-750">
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    Razorpay Secure Pay
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% SECURE
                  </span>
                </div>

                {/* Gemini Personalized Copy Box */}
                <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 uppercase">
                    <Sparkles className="h-3 w-3" />
                    <span>Personalized Recovery Nudge</span>
                  </div>
                  <p className="text-cream-900 dark:text-slate-200 leading-relaxed text-xs">
                    &ldquo;Hi {activeCase.customer.name}, your payment of{' '}
                    <strong>{formatINR(activeCase.amount)}</strong> could not be completed due to a temporary{' '}
                    <strong>{formatRootCause(activeCase.rootCause)}</strong>. We have saved your transaction so you can finish safely in one step.&rdquo;
                  </p>
                </div>

                {/* Amount Due Card */}
                <div className="p-4 rounded-2xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-center space-y-1">
                  <span className="text-[11px] text-cream-600 dark:text-slate-400 uppercase font-mono">
                    Total Amount Due
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {formatINR(activeCase.amount)}
                  </div>
                  <span className="text-[10px] text-cream-600 dark:text-slate-400 block font-mono">
                    Ref: {activeCase.sourceRefId.slice(0, 16)}...
                  </span>
                </div>

                {/* Simulated Payment Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleCustomerAction('PAY_SUCCESS', 'Razorpay Card')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Pay {formatINR(activeCase.amount)} with Card</span>
                  </button>

                  <button
                    onClick={() => handleCustomerAction('ALT_PAYMENT', 'UPI Instant')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Switch to Instant UPI (Alt Rail)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Alternate Interactions */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Simulate Alternate Customer Responses
              </h4>
              <p className="text-xs text-cream-700 dark:text-slate-400">
                Test how the agent responds to promise-to-pay commitments and customer opt-out requests.
              </p>
            </div>

            {/* Option 1: Promise to Pay Date Selector */}
            <div className="glass-card rounded-2xl p-5 border-cream-300 dark:border-surface-750 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase font-mono">
                <Calendar className="h-4 w-4" />
                <span>Option A: Commit &apos;Promise to Pay&apos; Date</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Customer promises to clear the dues by a specific future date. The Policy Engine pauses all reminders until the commitment date.
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleCustomerAction('PROMISE_TO_PAY')}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                >
                  <span>Submit Promise</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Option 2: Opt-Out Trigger */}
            <div className="glass-card rounded-2xl p-5 border-rose-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase font-mono">
                <Ban className="h-4 w-4" />
                <span>Option B: Customer Requests Opt-Out (Do Not Contact)</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Customer clicks &ldquo;Unsubscribe / Stop Reminders&rdquo;. Sets customer `optedOut = true` and permanently closes case under deterministic stopping rules.
              </p>
              <button
                onClick={() => handleCustomerAction('OPT_OUT')}
                disabled={isProcessing}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs transition-colors"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Simulate Opt-Out Request</span>
              </button>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl border text-xs font-mono flex items-start space-x-2 animate-slide-down ${
                  feedback.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong>Outcome: </strong>
                  <span>{feedback.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
