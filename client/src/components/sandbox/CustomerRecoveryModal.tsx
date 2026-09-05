import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Check,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { RecoveryCase } from '../../types';
import { formatINR } from '../../lib/utils';
import { downloadPaymentReceipt } from '../../lib/receipt';

interface CustomerRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  kase: RecoveryCase;
  onPaymentSuccess: (paymentMethod: string) => Promise<void>;
}

type PaymentTab = 'upi' | 'card' | 'netbanking';

const TAB_ACTIVE_CLASS = 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold';
const TAB_INACTIVE_CLASS = 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium';

export const CustomerRecoveryModal: React.FC<CustomerRecoveryModalProps> = ({
  isOpen,
  onClose,
  kase,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'SELECT' | 'UPI_WAITING' | 'OTP_VERIFY' | 'SUCCESS'>('SELECT');
  const [paymentId, setPaymentId] = useState<string>('');
  const [otp, setOtp] = useState<string>('849201');
  const [otpInput, setOtpInput] = useState<string>('');
  const [upiIdInput, setUpiIdInput] = useState<string>(
    `${kase.customer?.email?.split('@')[0] || 'customer'}@okhdfcbank`
  );
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('832');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [selectedMethodName, setSelectedMethodName] = useState<string>('UPI (Google Pay)');
  const [timerSeconds, setTimerSeconds] = useState<number>(899); // 14:59

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    setStep('SELECT');
    setIsProcessing(false);
    setPaymentId('');
    onClose();
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOfficialRazorpayPay = () => {
    setIsProcessing(true);

    const openRazorpay = () => {
      const razorpayKey =
        (import.meta as unknown as { env?: { VITE_RAZORPAY_KEY_ID?: string } }).env?.VITE_RAZORPAY_KEY_ID ||
        'rzp_test_TUnRfl7f02A0Eu';

      const options = {
        key: razorpayKey,
        amount: Math.round(Number(kase.amount) * 100),
        currency: 'INR',
        name: kase.merchant?.name || 'Reclaim SaaS Services',
        description: `Autonomous Recovery - Case #${kase.id.slice(0, 8)}`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        prefill: {
          name: kase.customer?.name || 'Customer',
          email: kase.customer?.email || 'customer@example.com',
          contact: kase.customer?.phone || '+919876543210',
        },
        notes: {
          caseId: kase.id,
          sourceRefId: kase.sourceRefId,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response: { razorpay_payment_id?: string }) => {
          const pid = response.razorpay_payment_id || `pay_rzp_${window.crypto.randomUUID().slice(0, 8)}`;
          setPaymentId(pid);
          setSelectedMethodName('Razorpay Official Gateway');
          try {
            await onPaymentSuccess(`Razorpay Official Gateway (${pid})`);
            setIsProcessing(false);
            setStep('SUCCESS');
          } catch {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const win = window as unknown as { Razorpay?: new (opts: typeof options) => { open: () => void } };
      if (win.Razorpay) {
        const rzpInstance = new win.Razorpay(options);
        rzpInstance.open();
      } else {
        alert('Razorpay Checkout SDK not ready. You can also complete payment using the instant UPI simulator below.');
        setIsProcessing(false);
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
        alert('Unable to load Razorpay SDK. Please check your network or use the instant UPI simulator below.');
      };
      document.body.appendChild(script);
    } else {
      openRazorpay();
    }
  };

  const handleSimulateUpiApp = async (appName: string) => {
    setSelectedMethodName(`UPI (${appName})`);
    setStep('UPI_WAITING');
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await onPaymentSuccess(`UPI - ${appName}`);
        setIsProcessing(false);
        setPaymentId(`pay_recov_${window.crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`);
        setStep('SUCCESS');
      } catch {
        setIsProcessing(false);
        setStep('SELECT');
      }
    }, 2200);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedMethodName('Credit Card (Visa)');
    setOtp('849201');
    setOtpInput('849201');
    setStep('OTP_VERIFY');
  };

  const handleOtpVerify = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await onPaymentSuccess(`Card (${cardNumber.slice(-4)}) 3DS`);
        setIsProcessing(false);
        setPaymentId(`pay_recov_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`);
        setStep('SUCCESS');
      } catch {
        setIsProcessing(false);
        setStep('SELECT');
      }
    }, 1500);
  };

  const handleNetBankingPay = async () => {
    setSelectedMethodName(`NetBanking (${selectedBank})`);
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await onPaymentSuccess(`NetBanking - ${selectedBank}`);
        setIsProcessing(false);
        setPaymentId(`pay_recov_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`);
        setStep('SUCCESS');
      } catch {
        setIsProcessing(false);
        setStep('SELECT');
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-cream-100 dark:bg-surface-900 border border-cream-300 dark:border-surface-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-[#071933] via-[#0b2447] to-[#061429] p-5 text-white flex items-center justify-between shadow-md border-b border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/15 backdrop-blur-sm flex items-center justify-center border border-blue-400/30 shadow-inner">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-wide">Razorpay Secured Checkout</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 font-mono font-medium">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Merchant: <strong>{kase.merchant?.name || 'Reclaim SaaS Services'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close Checkout"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Info Strip */}
        <div className="bg-cream-200 dark:bg-surface-850 px-6 py-3 border-b border-cream-300 dark:border-surface-750 flex items-center justify-between text-xs">
          <div>
            <span className="text-cream-600 dark:text-slate-400 uppercase font-mono text-[10px]">
              Customer:
            </span>
            <span className="ml-1 font-semibold text-slate-900 dark:text-white">
              {kase.customer?.name}
            </span>
          </div>
          <div className="text-right">
            <span className="text-cream-600 dark:text-slate-400 text-[10px] uppercase font-mono mr-1">
              Amount Due:
            </span>
            <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {formatINR(kase.amount)}
            </span>
          </div>
        </div>

        {/* Main Body depending on Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'SELECT' && (
            <>
              {/* Official Razorpay Gateway Card */}
              <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1f3d] via-[#08152b] to-[#050d1a] border border-blue-500/30 shadow-xl shadow-blue-950/40 group hover:border-blue-400/50 transition-all duration-300">
                {/* Ambient glow accent */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-4">
                  {/* Top Row: Brand, Title, Badge, Action Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-center space-x-3">
                      {/* Razorpay Authentic Brand Logo Mark */}
                      <div className="relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0C83FD] via-[#0256D0] to-[#01357a] text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20 shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                          <path d="M14.5 2.5L5.5 13H11.5L9.5 21.5L18.5 11H12.5L14.5 2.5Z" fill="white" />
                        </svg>
                        <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-[#071325]" />
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-white tracking-tight">
                            Razorpay Standard Checkout
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold tracking-wider uppercase whitespace-nowrap">
                            Test Mode
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Standard Checkout popup (UPI, GPay, PhonePe, Cards, NetBanking)
                        </p>
                      </div>
                    </div>

                    {/* Launch Button */}
                    <button
                      type="button"
                      onClick={handleOfficialRazorpayPay}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0C83FD] to-[#0256D0] hover:from-[#1E8FFF] hover:to-[#0969DA] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                    >
                      <span>{isProcessing ? 'Opening Gateway...' : 'Launch Gateway'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Bottom Row: Supported Methods & Trust Badges */}
                  <div className="pt-3 border-t border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-slate-400 font-mono">Accepted:</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/40 text-blue-200 font-medium">
                        UPI / GPay / PhonePe
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/40 text-blue-200 font-medium">
                        Cards (Visa/Mastercard/RuPay)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/40 text-blue-200 font-medium">
                        50+ NetBanking
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 font-mono">
                      <Lock className="h-3 w-3 text-emerald-400" />
                      <span>256-Bit SSL · PCI-DSS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-cream-300 dark:border-surface-750"></div>
                <span className="flex-shrink mx-3 px-2.5 py-0.5 rounded-full bg-cream-200 dark:bg-surface-800 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-cream-300 dark:border-surface-700">
                  Or use instant in-app simulator
                </span>
                <div className="flex-grow border-t border-cream-300 dark:border-surface-750"></div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-cream-200 dark:bg-surface-800 border border-cream-300 dark:border-surface-700">
                <button
                  onClick={() => setActiveTab('upi')}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'upi' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'card' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Cards</span>
                </button>

                <button
                  onClick={() => setActiveTab('netbanking')}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'netbanking' ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* UPI Tab */}
              {activeTab === 'upi' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-cream-200/60 dark:bg-surface-850 border border-cream-300 dark:border-surface-750">
                    {/* Simulated Dynamic QR Code with authentic finder patterns */}
                    <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center shrink-0">
                      <div className="h-32 w-32 bg-white rounded-xl flex items-center justify-center relative p-1.5">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                          {/* Top-left finder pattern */}
                          <rect x="2" y="2" width="28" height="28" rx="4" />
                          <rect x="6" y="6" width="20" height="20" rx="2" fill="white" />
                          <rect x="10" y="10" width="12" height="12" rx="2" />
                          {/* Top-right finder pattern */}
                          <rect x="70" y="2" width="28" height="28" rx="4" />
                          <rect x="74" y="6" width="20" height="20" rx="2" fill="white" />
                          <rect x="78" y="10" width="12" height="12" rx="2" />
                          {/* Bottom-left finder pattern */}
                          <rect x="2" y="70" width="28" height="28" rx="4" />
                          <rect x="6" y="74" width="20" height="20" rx="2" fill="white" />
                          <rect x="10" y="78" width="12" height="12" rx="2" />
                          {/* Data elements */}
                          <rect x="34" y="4" width="6" height="6" rx="1" />
                          <rect x="46" y="4" width="6" height="6" rx="1" />
                          <rect x="58" y="4" width="6" height="6" rx="1" />
                          <rect x="34" y="16" width="18" height="6" rx="1" />
                          <rect x="4" y="34" width="6" height="18" rx="1" />
                          <rect x="16" y="34" width="6" height="6" rx="1" />
                          <rect x="16" y="46" width="6" height="12" rx="1" />
                          <rect x="34" y="34" width="8" height="8" rx="1" />
                          <rect x="58" y="34" width="8" height="8" rx="1" />
                          <rect x="72" y="34" width="6" height="18" rx="1" />
                          <rect x="86" y="46" width="10" height="6" rx="1" />
                          <rect x="34" y="58" width="12" height="6" rx="1" />
                          <rect x="54" y="58" width="12" height="6" rx="1" />
                          <rect x="72" y="58" width="8" height="8" rx="1" />
                          <rect x="86" y="58" width="8" height="8" rx="1" />
                          <rect x="34" y="72" width="6" height="24" rx="1" />
                          <rect x="46" y="80" width="18" height="6" rx="1" />
                          <rect x="72" y="72" width="12" height="12" rx="1" />
                          <rect x="88" y="88" width="8" height="8" rx="1" />
                        </svg>
                        {/* Center UPI Badge */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-7 w-7 rounded-md bg-[#0C83FD] flex items-center justify-center shadow-md ring-2 ring-white">
                            <span className="text-[8px] font-black text-white font-mono tracking-tighter">UPI</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                        <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                        <span>Valid: {formatTimer(timerSeconds)}</span>
                      </div>
                    </div>

                    {/* Quick App Buttons */}
                    <div className="flex-1 w-full space-y-2">
                      <span className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 block">
                        Instant App Payment:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Google Pay', badge: 'GPay', dot: 'bg-blue-500', color: 'hover:border-blue-500' },
                          { name: 'PhonePe', badge: 'Pe', dot: 'bg-purple-600', color: 'hover:border-purple-500' },
                          { name: 'Paytm UPI', badge: 'Paytm', dot: 'bg-sky-500', color: 'hover:border-sky-500' },
                          { name: 'CRED UPI', badge: 'CRED', dot: 'bg-neutral-800', color: 'hover:border-neutral-900' },
                        ].map((app) => (
                          <button
                            key={app.name}
                            onClick={() => handleSimulateUpiApp(app.name)}
                            disabled={isProcessing}
                            className={`flex items-center space-x-2 p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-cream-300 dark:border-surface-700 text-xs font-semibold text-slate-800 dark:text-slate-200 ${app.color} shadow-xs hover:scale-102 transition-all cursor-pointer`}
                          >
                            <span className={`h-2 w-2 rounded-full ${app.dot} shrink-0`} />
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* VPA ID Input */}
                  <div className="space-y-2">
                    <label htmlFor="modal-upi-vpa" className="text-xs font-semibold text-cream-700 dark:text-slate-300">
                      Or pay with UPI ID / VPA
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="modal-upi-vpa"
                        type="text"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        placeholder="yourname@upi"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                      <button
                        onClick={() => handleSimulateUpiApp('VPA Request')}
                        disabled={!upiIdInput || isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1"
                      >
                        <span>Pay {formatINR(kase.amount)}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {activeTab === 'card' && (
                <form onSubmit={handleCardSubmit} className="space-y-4 animate-fade-in">
                  {/* Card mockup */}
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-surface-850 text-white border border-slate-700 shadow-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider">
                        Virtual Recovery Card
                      </span>
                      <span className="font-extrabold text-sm italic tracking-wide text-amber-300">
                        VISA
                      </span>
                    </div>
                    <div className="text-lg font-mono tracking-widest text-slate-200">
                      {cardNumber}
                    </div>
                    <div className="flex justify-between items-end text-xs font-mono text-slate-300">
                      <div>
                        <div className="text-[9px] text-slate-400">CARD HOLDER</div>
                        <div className="font-semibold uppercase">{kase.customer?.name}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400">EXPIRES</div>
                        <div>{cardExpiry}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="modal-card-number" className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 mb-1 block">
                        Card Number
                      </label>
                      <input
                        id="modal-card-number"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="modal-card-expiry" className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 mb-1 block">
                          Valid Thru (MM/YY)
                        </label>
                        <input
                          id="modal-card-expiry"
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="modal-card-cvv" className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 mb-1 block">
                          CVV / CVC
                        </label>
                        <input
                          id="modal-card-cvv"
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 mt-4"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Proceed to 3D Secure Verification ({formatINR(kase.amount)})</span>
                    </button>
                  </div>
                </form>
              )}

              {/* NetBanking Tab */}
              {activeTab === 'netbanking' && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-xs font-semibold text-cream-700 dark:text-slate-300 block">
                    Select Your Bank:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map((b) => (
                      <button
                        key={b}
                        onClick={() => setSelectedBank(b)}
                        className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                          selectedBank === b
                            ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                            : 'bg-cream-200/70 dark:bg-surface-850 border-cream-300 dark:border-surface-750 text-slate-800 dark:text-slate-300 hover:border-brand-500/50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNetBankingPay}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 mt-4"
                  >
                    <span>Authenticate with {selectedBank}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* UPI WAITING STATE */}
          {step === 'UPI_WAITING' && (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="h-16 w-16 mx-auto rounded-full bg-brand-500/10 border-2 border-brand-500 flex items-center justify-center animate-pulse">
                <QrCode className="h-8 w-8 text-brand-500 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Awaiting UPI Approval...
                </h4>
                <p className="text-xs text-cream-700 dark:text-slate-400 max-w-xs mx-auto">
                  Payment request sent to <strong>{selectedMethodName}</strong> for{' '}
                  <strong>{formatINR(kase.amount)}</strong>. Please approve on your phone.
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono">
                <Clock className="h-3.5 w-3.5" />
                <span>Auto-confirming test simulation...</span>
              </div>
            </div>
          )}

          {/* OTP VERIFICATION MODAL STATE */}
          {step === 'OTP_VERIFY' && (
            <div className="py-4 space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>3D Secure Authentication</strong>
                  <p className="mt-0.5">
                    Enter the test OTP sent to customer registered mobile{' '}
                    <strong>(+91 •••• ••8902)</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="modal-otp-input" className="text-xs font-semibold text-cream-700 dark:text-slate-300 block">
                  One-Time Password (OTP)
                </label>
                <input
                  id="modal-otp-input"
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full text-center tracking-widest text-2xl font-mono py-3 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
                <div className="text-[11px] font-mono text-center text-cream-600 dark:text-slate-400">
                  Demo Default OTP: <span className="font-bold text-brand-500">{otp}</span>
                </div>
              </div>

              <button
                onClick={handleOtpVerify}
                disabled={isProcessing || !otpInput}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <span>Authorizing Payment...</span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Submit &amp; Pay {formatINR(kase.amount)}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* SUCCESS RECEIPT STATE */}
          {step === 'SUCCESS' && (
            <div className="py-4 space-y-6 text-center animate-fade-in">
              <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Payment Captured Successfully!
                </h4>
                <p className="text-xs text-cream-700 dark:text-slate-400 mt-1">
                  Case status has been automatically updated to <strong>RECOVERED</strong>.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-4 rounded-2xl bg-cream-200/80 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-cream-300 dark:border-surface-750 pb-2">
                  <span className="text-cream-600 dark:text-slate-400">Payment ID:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {paymentId || 'pay_recov_sandbox'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-600 dark:text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINR(kase.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-600 dark:text-slate-400">Payment Rail:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedMethodName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-600 dark:text-slate-400">Timestamp:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all"
                >
                  Done &amp; Return
                </button>
                <button
                  type="button"
                  onClick={() => downloadPaymentReceipt(kase, paymentId, selectedMethodName)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Download Official Tax Invoice & Print Receipt"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="bg-cream-200/50 dark:bg-surface-950 px-6 py-3 border-t border-cream-300 dark:border-surface-750 flex items-center justify-center space-x-2 text-[10px] text-cream-600 dark:text-slate-500">
          <Lock className="h-3 w-3" />
          <span>Protected by Razorpay Webhook Engine &amp; Reclaim AI Guardrails</span>
        </div>
      </div>
    </div>
  );
};
