import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileCode2,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/utils';

export const WebhookSimulator: React.FC = () => {
  const [event, setEvent] = useState<string>('payment.failed');
  const [amount, setAmount] = useState<number>(3499);
  const [failureCode, setFailureCode] = useState<string>('BAD_REQUEST_PAYMENT_TIMED_OUT');
  const [customerName, setCustomerName] = useState<string>('Vikram Malhotra');
  const [customerEmail, setCustomerEmail] = useState<string>('vikram.m@techscale.demo');
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<{
    signature: string;
    payload: unknown;
    event: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const failurePresets = [
    { code: 'BAD_REQUEST_PAYMENT_TIMED_OUT', label: 'Bank Gateway Timeout (Lane A)', reason: 'HDFC 3DS Gateway timed out' },
    { code: 'INSUFFICIENT_FUNDS', label: 'Insufficient Balance (Lane A)', reason: 'Account balance insufficient for charge' },
    { code: 'CARD_EXPIRED', label: 'Expired Card (Lane A)', reason: 'Card validity expired' },
    { code: 'INVALID_OTP', label: 'OTP Drop-off (Lane A)', reason: 'User entered incorrect OTP twice' },
    { code: 'MANDATE_INSUFFICIENT_BALANCE', label: 'Mandate Failure (Lane A)', reason: 'Auto-debit recurring mandate failed' },
  ];

  const handleFireWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsFiring(true);
    try {
      const selectedPreset = failurePresets.find((p) => p.code === failureCode);
      const res = await api.webhooks.simulate({
        event,
        amount,
        failureCode,
        failureReason: selectedPreset?.reason || 'Payment processing failed',
        customerEmail,
        customerName,
      });
      setLastResponse({
        signature: res.signature,
        payload: res.payload,
        event: res.event,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to dispatch webhook');
      }
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750 shadow-xl space-y-6">
      <div className="flex items-start justify-between pb-4 border-b border-cream-300 dark:border-surface-750">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Zap className="h-3.5 w-3.5" />
            <span>Razorpay Webhook Sandbox</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Simulate Incoming Payment Failure &amp; Loss Events
          </h3>
          <p className="text-xs text-cream-700 dark:text-slate-400 mt-1">
            Emit signed Razorpay webhook payloads to trigger agent detection, root-cause diagnosis, and policy evaluation.
          </p>
        </div>
      </div>

      <form onSubmit={handleFireWebhook} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Event Config */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="webhook-event-type" className="text-xs font-bold text-cream-800 dark:text-slate-200">
              Webhook Event Type
            </label>
            <select
              id="webhook-event-type"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
            >
              <option value="payment.failed">payment.failed (Degraded Payment)</option>
              <option value="payment.captured">payment.captured (Payment Success)</option>
              <option value="order.paid">order.paid (Checkout Conversion)</option>
              <option value="invoice.overdue">invoice.overdue (B2B Invoice Past Due)</option>
            </select>
          </div>

          {event === 'payment.failed' && (
            <div className="space-y-1.5">
              <label htmlFor="webhook-failure-code" className="text-xs font-bold text-cream-800 dark:text-slate-200">
                Failure Reason / Error Code
              </label>
              <select
                id="webhook-failure-code"
                value={failureCode}
                onChange={(e) => setFailureCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
              >
                {failurePresets.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="webhook-amount" className="text-xs font-bold text-cream-800 dark:text-slate-200">
                Transaction Amount (₹)
              </label>
              <input
                id="webhook-amount"
                type="number"
                min="100"
                max="500000"
                value={amount}
                onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="webhook-customer-name" className="text-xs font-bold text-cream-800 dark:text-slate-200">
                Customer Name
              </label>
              <input
                id="webhook-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="webhook-customer-email" className="text-xs font-bold text-cream-800 dark:text-slate-200">
              Customer Email
            </label>
            <input
              id="webhook-customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isFiring}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-orange transition-all"
          >
            <Send className="h-4 w-4" />
            <span>{isFiring ? 'Signing & Dispatching...' : `Dispatch Signed ${event} Webhook (${formatINR(amount)})`}</span>
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Webhook Receipt & HMAC Verification */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-cream-700 dark:text-slate-400">
            <span className="flex items-center space-x-1.5">
              <KeyRound className="h-3.5 w-3.5 text-brand-500" />
              <span>HMAC SHA-256 Webhook Receipt</span>
            </span>
            {lastResponse && (
              <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-3 w-3" />
                <span>SIGNATURE VERIFIED</span>
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-surface-950 text-slate-200 font-mono text-xs overflow-x-auto border border-surface-750 max-h-80 shadow-inner">
            {lastResponse ? (
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 text-[10px]">X-Razorpay-Signature:</span>
                  <div className="text-brand-400 text-[11px] truncate">{lastResponse.signature}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Received Payload:</span>
                  <pre className="text-emerald-400 text-[11px] mt-1">
                    {JSON.stringify(lastResponse.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic py-12 text-center">
                <FileCode2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span>Click &apos;Dispatch Signed Webhook&apos; to view live signature &amp; payload telemetry.</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
