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

interface CustomerRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  kase: RecoveryCase;
  onPaymentSuccess: (paymentMethod: string) => Promise<void>;
}

type PaymentTab = 'upi' | 'card' | 'netbanking';

const TAB_ACTIVE_CLASS = 'bg-brand-500 text-white shadow-md';
const TAB_INACTIVE_CLASS = 'text-cream-700 dark:text-slate-400 hover:text-brand-500';

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

  const handleSimulateUpiApp = async (appName: string) => {
    setSelectedMethodName(`UPI (${appName})`);
    setStep('UPI_WAITING');
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await onPaymentSuccess(`UPI - ${appName}`);
        setIsProcessing(false);
        setPaymentId(`pay_recov_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`);
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
                Merchant: <strong>Reclaim SaaS Services</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
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
                    {/* Simulated Dynamic QR Code */}
                    <div className="relative p-3 bg-white rounded-2xl shadow-inner border border-slate-200 flex flex-col items-center">
                      <div className="h-32 w-32 bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                        {/* QR pattern mock */}
                        <div className="grid grid-cols-5 gap-1.5 p-2 w-full h-full opacity-90">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-xs ${
                                (i * 7) % 3 === 0 || i === 0 || i === 4 || i === 20 || i === 24
                                  ? 'bg-white'
                                  : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg border-2 border-white">
                            <QrCode className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 mt-2 text-[10px] font-mono text-slate-600">
                        <Clock className="h-3 w-3 text-amber-500" />
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
                          { name: 'Google Pay', color: 'hover:border-blue-500' },
                          { name: 'PhonePe', color: 'hover:border-purple-500' },
                          { name: 'Paytm UPI', color: 'hover:border-sky-500' },
                          { name: 'CRED UPI', color: 'hover:border-neutral-900' },
                        ].map((app) => (
                          <button
                            key={app.name}
                            onClick={() => handleSimulateUpiApp(app.name)}
                            disabled={isProcessing}
                            className={`flex items-center justify-center p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-cream-300 dark:border-surface-700 text-xs font-semibold text-slate-800 dark:text-slate-200 ${app.color} shadow-xs hover:scale-102 transition-all`}
                          >
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* VPA ID Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-cream-700 dark:text-slate-300">
                      Or pay with UPI ID / VPA
                    </label>
                    <div className="flex space-x-2">
                      <input
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
                      <label className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 mb-1 block">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 mb-1 block">
                          Valid Thru (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-cream-700 dark:text-slate-300 mb-1 block">
                          CVV / CVC
                        </label>
                        <input
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
                <label className="text-xs font-semibold text-cream-700 dark:text-slate-300 block">
                  One-Time Password (OTP)
                </label>
                <input
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
                  onClick={() => alert(`Receipt saved for Case ${kase.id}`)}
                  className="px-4 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-800 border border-cream-300 dark:border-surface-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Receipt</span>
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
