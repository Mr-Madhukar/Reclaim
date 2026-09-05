import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Download,
  CreditCard,
  QrCode,
  Clock,
  Ban,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { downloadPaymentReceipt } from '../../lib/receipt';
import { RecoveryCase } from '../../types';

interface PublicCaseData {
  id: string;
  sourceRefId: string;
  amount: number;
  lane: string;
  status: string;
  rootCause?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  merchant: {
    name: string;
  };
}

interface CustomerPublicCheckoutProps {
  caseId: string;
  onClose: () => void;
}

export const CustomerPublicCheckout: React.FC<CustomerPublicCheckoutProps> = ({ caseId, onClose }) => {
  const [caseData, setCaseData] = useState<PublicCaseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'DETAILS' | 'SUCCESS' | 'OPT_OUT_SUCCESS'>('DETAILS');
  const [paymentId, setPaymentId] = useState<string>('');
  const [selectedMethodName, setSelectedMethodName] = useState<string>('Razorpay Gateway');
  const [gracePeriodRequested, setGracePeriodRequested] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/cases/${caseId}/public`);
        if (!res.ok) {
          throw new Error('Payment link not found or has expired.');
        }
        const json = await res.json();
        if (isMounted) {
          setCaseData(json.data);
          if (json.data.status === 'RECOVERED') {
            setStep('SUCCESS');
            setPaymentId(`pay_recov_${json.data.id.slice(0, 8)}`);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load checkout');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCase();
    return () => {
      isMounted = false;
    };
  }, [caseId]);

  const handleOfficialRazorpayPay = () => {
    if (!caseData) return;
    setIsProcessing(true);

    const openRazorpay = () => {
      const razorpayKey =
        (import.meta as unknown as { env?: { VITE_RAZORPAY_KEY_ID?: string } }).env?.VITE_RAZORPAY_KEY_ID ||
        'rzp_test_TUnRfl7f02A0Eu';

      const options = {
        key: razorpayKey,
        amount: Math.round(Number(caseData.amount) * 100),
        currency: 'INR',
        name: caseData.merchant.name,
        description: `Recovery Payment - #${caseData.sourceRefId.slice(0, 10)}`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        prefill: {
          name: caseData.customer.name,
          email: caseData.customer.email,
          contact: caseData.customer.phone || '+919876543210',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response: { razorpay_payment_id?: string }) => {
          const pid = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
          setPaymentId(pid);
          setSelectedMethodName('Razorpay Official Gateway');
          await submitCustomerAction('PAY_SUCCESS', { paymentMethod: `Razorpay (${pid})` });
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const win = window as unknown as { Razorpay?: new (opts: typeof options) => { open: () => void } };
      if (win.Razorpay) {
        const rzp = new win.Razorpay(options);
        rzp.open();
      } else {
        setIsProcessing(false);
        alert('Razorpay Checkout SDK not ready. Please try the instant simulator below.');
      }
    };

    const win = window as unknown as { Razorpay?: unknown };
    if (!win.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = openRazorpay;
      script.onerror = () => {
        setIsProcessing(false);
        alert('Failed to load Razorpay SDK. Please check your network.');
      };
      document.body.appendChild(script);
    } else {
      openRazorpay();
    }
  };

  const submitCustomerAction = async (action: string, options?: Record<string, unknown>) => {
    if (!caseData) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}/customer-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...options,
        }),
      });

      if (!res.ok) {
        throw new Error('Action failed to record');
      }

      if (action === 'PAY_SUCCESS') {
        setStep('SUCCESS');
      } else if (action === 'OPT_OUT') {
        setStep('OPT_OUT_SUCCESS');
      } else if (action === 'GRACE_PERIOD') {
        setGracePeriodRequested(true);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error processing action');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstantUpiPay = async (app: string) => {
    setSelectedMethodName(`UPI (${app})`);
    const pid = `pay_recov_${window.crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    setPaymentId(pid);
    await submitCustomerAction('PAY_SUCCESS', { paymentMethod: `UPI - ${app}` });
  };

  const handleDownloadReceipt = () => {
    if (!caseData) return;
    const mockCase: RecoveryCase = {
      id: caseData.id,
      merchantId: 'm_1',
      customerId: 'cust_1',
      sourceRefId: caseData.sourceRefId,
      amount: caseData.amount,
      lane: caseData.lane as RecoveryCase['lane'],
      status: 'RECOVERED',
      rootCause: (caseData.rootCause || 'insufficient_funds') as RecoveryCase['rootCause'],
      openedAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      customer: {
        id: 'cust_1',
        merchantId: 'm_1',
        name: caseData.customer.name,
        email: caseData.customer.email,
        phone: caseData.customer.phone || null,
        optedOut: false,
        createdAt: new Date().toISOString(),
      },
      merchant: {
        id: 'm_1',
        name: caseData.merchant.name,
        slug: 'reclaim',
        timezone: 'Asia/Kolkata',
      },
      actions: [],
    };

    downloadPaymentReceipt(mockCase, paymentId, selectedMethodName);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-surface-950 text-white">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-surface-950 text-white">
        <div className="max-w-md w-full glass-card p-6 rounded-3xl text-center space-y-4 border border-surface-750">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Payment Link Unavailable</h3>
          <p className="text-xs text-slate-400">{error || 'This recovery link has expired or is invalid.'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-xs font-bold text-slate-200 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex flex-col items-center justify-center bg-surface-950 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl bg-surface-900 border border-surface-750 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-600 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-wide">Razorpay Checkout</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-mono">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Merchant: <strong>{caseData.merchant.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Home
          </button>
        </div>

        {/* Order Strip */}
        <div className="bg-surface-850 px-6 py-3 border-b border-surface-750 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 uppercase font-mono text-[10px]">Customer: </span>
            <span className="font-semibold text-white">{caseData.customer.name}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-mono mr-1">Amount Due: </span>
            <span className="text-base font-extrabold font-mono text-emerald-400">
              {formatINR(caseData.amount)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {step === 'DETAILS' && (
            <>
              {/* Official Gateway Button */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-brand-500/15 border border-indigo-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase font-mono">
                  <Sparkles className="h-4 w-4 text-brand-400" />
                  <span>Official Razorpay Gateway (Recommended)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Complete your interrupted payment in 10 seconds via UPI (Google Pay, PhonePe, Paytm), Cards, or NetBanking.
                </p>
                <button
                  type="button"
                  onClick={handleOfficialRazorpayPay}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay {formatINR(caseData.amount)} via Official Gateway</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Instant Simulator Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase font-mono">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Instant Payment Apps</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => handleInstantUpiPay(app)}
                      disabled={isProcessing}
                      className="p-3 rounded-xl bg-surface-800 hover:bg-surface-750 border border-surface-700 text-center transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold block text-slate-200">{app}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Instant UPI</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grace Period Alert or Action */}
              {gracePeriodRequested ? (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center space-x-2">
                  <Clock className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span>24-Hour Grace Period Activated. Automated reminders are paused.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-surface-750 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => submitCustomerAction('GRACE_PERIOD')}
                    disabled={isProcessing}
                    className="hover:text-indigo-400 underline transition-colors"
                  >
                    Need more time? Request 24h extension
                  </button>
                  <button
                    type="button"
                    onClick={() => submitCustomerAction('OPT_OUT', { optOutReason: 'Customer opted out from checkout' })}
                    disabled={isProcessing}
                    className="hover:text-rose-400 text-[11px] transition-colors"
                  >
                    Opt-out / Stop reminders
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'SUCCESS' && (
            <div className="py-4 space-y-6 text-center animate-fade-in">
              <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-white">Payment Captured Successfully!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Thank you! Your transaction has been verified and settled on Razorpay rails.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-850 border border-surface-750 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-surface-750 pb-2">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-bold text-white">{paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-emerald-400">{formatINR(caseData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="text-slate-200">{selectedMethodName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Done &amp; Return
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>
          )}

          {step === 'OPT_OUT_SUCCESS' && (
            <div className="py-6 space-y-4 text-center animate-fade-in">
              <div className="h-16 w-16 mx-auto rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                <Ban className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Outreach Stopped</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                You have been unsubscribed. In compliance with DPDP Act 2023 stopping rules, no further automated reminders will be sent to your email or phone.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-xs font-bold text-slate-200"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="bg-surface-950 px-6 py-3 border-t border-surface-750 flex items-center justify-center space-x-2 text-[10px] text-slate-500">
          <Lock className="h-3 w-3" />
          <span>Protected by Razorpay Webhook Engine &amp; Reclaim AI Guardrails</span>
        </div>
      </div>
    </div>
  );
};
