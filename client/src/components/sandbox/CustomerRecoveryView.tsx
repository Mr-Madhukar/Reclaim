import React, { useState, useEffect } from 'react';
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
  Clock,
  RefreshCw,
  Languages,
  Wifi,
  Battery,
  Signal,
  Check,
  PhoneCall,
  PhoneOff,
  Volume2,
  Mic,
  MicOff,
} from 'lucide-react';
import { useCases } from '../../hooks/useCases';
import { api } from '../../lib/api';
import { formatINR, formatRootCause } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { CustomerRecoveryModal } from './CustomerRecoveryModal';

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
  const [copyLanguage, setCopyLanguage] = useState<'en' | 'hinglish'>('en');
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [optOutModalOpen, setOptOutModalOpen] = useState<boolean>(false);
  const [optOutReason, setOptOutReason] = useState<string>('Already paid through another channel');
  const [newUpiId, setNewUpiId] = useState<string>('user@okhdfcbank');

  // AI Voice Agent Calling Simulation State
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const activeCase = openCases.find((c) => c.id === selectedCaseId) || openCases[0];

  useEffect(() => {
    if (!isCalling) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCalling]);

  const getCustomerDisplayName = (name?: string) => {
    if (!name || name.startsWith('+') || name === 'Customer' || name.toLowerCase().includes('example') || name.toLowerCase().includes('techscale')) {
      return 'Priya Patel';
    }
    return name;
  };

  const handleStartCall = () => {
    setCallDuration(0);
    setIsCalling(true);
    setIsSpeaking(true);

    const displayName = getCustomerDisplayName(activeCase?.customer?.name);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak =
        copyLanguage === 'hinglish'
          ? `Namaste ${displayName} ji. Reclaim AI se call kar rahe hain aapki ${Number(activeCase?.amount || 0)} rupaye ki pending payment ke regarding. Bank server timeout ki wajah se transaction ruk gaya tha. Aap direct link se das second me payment complete kar sakte hain.`
          : `Hello ${displayName}. This is Reclaim AI calling regarding your pending transaction of ${Number(activeCase?.amount || 0)} rupees. We detected a temporary bank timeout. You can securely complete your payment in ten seconds.`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.lang = copyLanguage === 'hinglish' ? 'hi-IN' : 'en-US';
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEndCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsCalling(false);
    setIsSpeaking(false);
    setCallDuration(0);
  };

  const formatCallDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCustomerAction = async (
    action: 'PAY_SUCCESS' | 'OPT_OUT' | 'PROMISE_TO_PAY' | 'ALT_PAYMENT' | 'GRACE_PERIOD' | 'UPDATE_PAYMENT_METHOD',
    options?: { paymentMethod?: string; optOutReason?: string; paymentDetails?: { method: string; identifier: string } }
  ) => {
    if (!activeCase) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.cases.customerAction(activeCase.id, {
        action: action === 'ALT_PAYMENT' ? 'PAY_SUCCESS' : action,
        paymentMethod: options?.paymentMethod || 'Razorpay Direct',
        promisedDate,
        promisedAmount: activeCase.amount,
        optOutReason: options?.optOutReason,
        paymentDetails: options?.paymentDetails,
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

  const handleModalPaymentSuccess = async (paymentMethod: string) => {
    await handleCustomerAction('PAY_SUCCESS', { paymentMethod });
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750 shadow-xl space-y-6">
      {/* Header & Case Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-300 dark:border-surface-750">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Smartphone className="h-3.5 w-3.5" />
            <span>End-Customer Recovery Portal</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Customer Self-Service Payment &amp; Response Portal
          </h3>
          <p className="text-xs text-cream-700 dark:text-slate-400 mt-1">
            Experience how customers receive AI recovery nudges, listen to AI voice calls, pay via Razorpay rails, or opt out.
          </p>
        </div>

        {/* Case selector */}
        {openCases.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-cream-700 dark:text-slate-400 whitespace-nowrap">
              Active Case:
            </span>
            <select
              value={selectedCaseId || (activeCase ? activeCase.id : '')}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                setFeedback(null);
                handleEndCall();
              }}
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
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-cream-200 dark:bg-surface-800 mx-auto flex items-center justify-center text-cream-600 dark:text-slate-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Open Recovery Cases</h4>
          <p className="text-xs text-cream-700 dark:text-slate-400 max-w-md mx-auto">
            All customer cases are currently recovered or closed. Trigger a simulated webhook event in the Webhook Simulator tab to generate an active case.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Simulated Mobile Phone Mockup */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Bilingual Language Selector */}
            <div className="mb-3 flex items-center space-x-2 bg-cream-200 dark:bg-surface-850 p-1 rounded-xl border border-cream-300 dark:border-surface-750">
              <Languages className="h-3.5 w-3.5 text-brand-500 ml-1.5" />
              <button
                onClick={() => setCopyLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  copyLanguage === 'en'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-cream-700 dark:text-slate-400 hover:text-brand-500'
                }`}
              >
                English (Default)
              </button>
              <button
                onClick={() => setCopyLanguage('hinglish')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  copyLanguage === 'hinglish'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-cream-700 dark:text-slate-400 hover:text-brand-500'
                }`}
              >
                Hinglish 🇮🇳
              </button>
            </div>

            {/* Mobile Device Frame */}
            <div className="w-full max-w-sm rounded-[2.75rem] bg-slate-900 dark:bg-surface-950 p-4 shadow-2xl border-4 border-slate-700 dark:border-surface-700 ring-1 ring-slate-900/50">
              {/* Phone Speaker & Top Sensor Notch */}
              <div className="flex items-center justify-between px-6 pt-1 pb-3 text-slate-400 text-[10px] font-mono">
                <span>09:41</span>
                <div className="h-4 w-24 bg-slate-800 rounded-full"></div>
                <div className="flex items-center space-x-1">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3 w-3 text-emerald-400" />
                </div>
              </div>

              {/* Phone Screen Canvas */}
              <div className="bg-cream-100 dark:bg-surface-900 rounded-[2rem] p-5 space-y-4 text-xs shadow-inner min-h-[470px] flex flex-col justify-between relative overflow-hidden">
                {/* ACTIVE VOICE CALL OVERLAY */}
                {isCalling ? (
                  <div className="flex-1 flex flex-col items-center justify-between py-6 space-y-6 text-center animate-fade-in">
                    <div className="space-y-2">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold animate-pulse">
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>AI OUTBOUND CALL CONNECTED</span>
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Reclaim Voice Agent
                      </h4>
                      <p className="text-xs text-cream-600 dark:text-slate-400">
                        Speaking with {getCustomerDisplayName(activeCase.customer?.name)}
                      </p>
                      <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatCallDuration(callDuration)}
                      </div>
                    </div>

                    {/* Animated Audio Waveform */}
                    <div className="flex items-center justify-center space-x-1.5 h-16">
                      {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95].map((height, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 rounded-full bg-brand-500 transition-all duration-300"
                          style={{
                            height: isSpeaking ? `${height}%` : '20%',
                            animation: isSpeaking ? `pulse 0.8s ease-in-out ${idx * 0.1}s infinite alternate` : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <div className="p-3 rounded-2xl bg-surface-950/80 text-slate-200 text-[11px] text-left leading-relaxed border border-surface-750">
                      <span className="font-bold text-brand-400 block mb-1">
                        AI Agent Speech ({copyLanguage === 'hinglish' ? 'Hinglish' : 'English'}):
                      </span>
                      {copyLanguage === 'hinglish' ? (
                        <p>
                          &ldquo;Namaste {getCustomerDisplayName(activeCase.customer?.name)} ji! Reclaim AI se call kar rahe hain aapki {formatINR(activeCase.amount)} ki pending payment ke regarding. Bank server timeout ki wajah se transaction ruk gaya tha. Aap niche diye gaye link se sirf 10 seconds me payment complete kar sakte hain.&rdquo;
                        </p>
                      ) : (
                        <p>
                          &ldquo;Hello {getCustomerDisplayName(activeCase.customer?.name)}. This is Reclaim AI calling regarding your interrupted payment of {formatINR(activeCase.amount)}. We detected a temporary bank timeout. You can complete your transaction securely in 10 seconds.&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Call Controls */}
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-full ${
                          isMuted ? 'bg-amber-500 text-white' : 'bg-surface-800 text-slate-300'
                        }`}
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </button>

                      <button
                        onClick={handleEndCall}
                        className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
                      >
                        <PhoneOff className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {/* Brand Header inside phone */}
                      <div className="flex items-center justify-between pb-3 border-b border-cream-300 dark:border-surface-750">
                        <div className="flex items-center space-x-1.5">
                          <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[11px]">
                            R
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            Razorpay Secure Pay
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          100% VERIFIED
                        </span>
                      </div>

                      {/* Gemini Personalized Recovery Copy Box */}
                      <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 uppercase">
                          <div className="flex items-center space-x-1">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Adaptive Recovery Copy</span>
                          </div>
                          <span className="text-[9px] lowercase bg-brand-500/15 px-1.5 py-0.5 rounded">
                            {copyLanguage === 'en' ? 'en-IN' : 'hi-Latn'}
                          </span>
                        </div>

                        {copyLanguage === 'en' ? (
                          <p className="text-cream-900 dark:text-slate-200 leading-relaxed text-xs">
                            &ldquo;Hi {getCustomerDisplayName(activeCase.customer?.name)}, your payment of{' '}
                            <strong>{formatINR(activeCase.amount)}</strong> could not be completed due to a temporary{' '}
                            <strong className="text-brand-600 dark:text-brand-400">
                              {formatRootCause(activeCase.rootCause)}
                            </strong>
                            . We have safely saved your cart so you can finish seamlessly in one click.&rdquo;
                          </p>
                        ) : (
                          <p className="text-cream-900 dark:text-slate-200 leading-relaxed text-xs">
                            &ldquo;Namaste {getCustomerDisplayName(activeCase.customer?.name)} ji, aapka{' '}
                            <strong>{formatINR(activeCase.amount)}</strong> ka payment temporary technical issue (
                            <strong className="text-brand-600 dark:text-brand-400">
                              {formatRootCause(activeCase.rootCause)}
                            </strong>
                            ) ki wajah se ruka hai. Humne aapka transaction save kar liya hai taaki aap UPI ya Card se turant complete kar sakein.&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Amount Due Card */}
                      <div className="p-4 rounded-2xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-center space-y-1">
                        <span className="text-[10px] text-cream-600 dark:text-slate-400 uppercase font-mono tracking-wider">
                          Pending Amount
                        </span>
                        <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                          {formatINR(activeCase.amount)}
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-[10px] text-cream-600 dark:text-slate-400 font-mono">
                          <span>Ref: {activeCase.sourceRefId.slice(0, 14)}...</span>
                          <span>•</span>
                          <span className="capitalize">{activeCase.lane.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Payment & Voice Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-102 transition-all cursor-pointer"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Pay {formatINR(activeCase.amount)} via Razorpay</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentModalOpen(true)}
                          disabled={isProcessing}
                          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Instant UPI</span>
                        </button>

                        <button
                          onClick={handleStartCall}
                          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:scale-102 transition-all cursor-pointer"
                        >
                          <PhoneCall className="h-3.5 w-3.5 animate-bounce" />
                          <span>AI Voice Call 🎙️</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Customer Alternate Self-Service Options */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-1">
                Simulate Customer Self-Service Actions
              </h4>
              <p className="text-xs text-cream-700 dark:text-slate-400">
                Test how the autonomous agent &amp; policy engine adapt when customers choose flexible resolution options.
              </p>
            </div>

            {/* Option 1: Promise to Pay Commitment */}
            <div className="glass-card rounded-2xl p-5 border-cream-300 dark:border-surface-750 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase font-mono">
                <Calendar className="h-4 w-4" />
                <span>1. Commit Promise-to-Pay Date</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Customer promises to clear the dues by a future date. The Policy Engine freezes automated recovery nudges until the commitment date.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleCustomerAction('PROMISE_TO_PAY')}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <span>Submit Promise</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Option 2: Request 24h Grace Period (Snooze) */}
            <div className="glass-card rounded-2xl p-5 border-cream-300 dark:border-surface-750 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                <Clock className="h-4 w-4" />
                <span>2. Request 24-Hour Grace Period (Snooze)</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Customer requests a 24-hour extension. Reclaim pauses retry attempts for 24 hours and updates next attempt schedule.
              </p>
              <button
                onClick={() => handleCustomerAction('GRACE_PERIOD')}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Activate 24h Grace Period</span>
              </button>
            </div>

            {/* Option 3: Update Payment Rail / Handle on File */}
            <div className="glass-card rounded-2xl p-5 border-cream-300 dark:border-surface-750 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase font-mono">
                <RefreshCw className="h-4 w-4" />
                <span>3. Update Payment Rail on File</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Customer updates their default UPI handle or card on file for recurring subscriptions.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  placeholder="newhandle@upi"
                  className="px-3 py-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-xs font-mono text-slate-900 dark:text-white"
                />
                <button
                  onClick={() =>
                    handleCustomerAction('UPDATE_PAYMENT_METHOD', {
                      paymentDetails: { method: 'UPI Auto-Debit', identifier: newUpiId },
                    })
                  }
                  disabled={isProcessing || !newUpiId}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Update Rail</span>
                </button>
              </div>
            </div>

            {/* Option 4: Opt-Out / Unsubscribe Dialog */}
            <div className="glass-card rounded-2xl p-5 border-rose-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase font-mono">
                <Ban className="h-4 w-4" />
                <span>4. Customer Opt-Out / Stop Outreach</span>
              </div>
              <p className="text-xs text-cream-700 dark:text-slate-300 leading-relaxed">
                Customer clicks &ldquo;Unsubscribe / Stop Reminders&rdquo;. Immediately closes the case under deterministic stopping rules and prevents further contact.
              </p>
              <button
                onClick={() => setOptOutModalOpen(true)}
                disabled={isProcessing}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs transition-colors"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Simulate Opt-Out Request...</span>
              </button>
            </div>

            {/* Live Feedback Alert Banner */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl border text-xs font-mono flex items-start space-x-2.5 animate-slide-down shadow-md ${
                  feedback.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                )}
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider">
                    {feedback.success ? 'Action Recorded in Policy Engine' : 'Execution Notice'}
                  </strong>
                  <span className="mt-0.5 block leading-relaxed">{feedback.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RAZORPAY PAYMENT SIMULATION MODAL */}
      {activeCase && (
        <CustomerRecoveryModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          kase={activeCase}
          onPaymentSuccess={handleModalPaymentSuccess}
        />
      )}

      {/* OPT-OUT REASON MODAL */}
      {optOutModalOpen && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-cream-100 dark:bg-surface-900 border border-cream-300 dark:border-surface-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Confirm Opt-Out Request
                </h4>
                <p className="text-xs text-cream-600 dark:text-slate-400">
                  Deterministic Stopping Rule Enforcement
                </p>
              </div>
            </div>

            <p className="text-xs text-cream-700 dark:text-slate-300">
              Select the reason why customer <strong>{activeCase.customer.name}</strong> is opting out:
            </p>

            <div className="space-y-2">
              {[
                'Already paid through another channel',
                'Subscription cancelled or service no longer needed',
                'Temporary financial difficulty (will pay later)',
                'Do not contact / Requesting data privacy halt',
              ].map((reason) => (
                <label
                  key={reason}
                  onClick={() => setOptOutReason(reason)}
                  className={`flex items-start space-x-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    optOutReason === reason
                      ? 'bg-rose-500/10 border-rose-500/40 text-slate-900 dark:text-white font-medium'
                      : 'bg-cream-200 dark:bg-surface-850 border-cream-300 dark:border-surface-750 text-cream-700 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="optOutReason"
                    checked={optOutReason === reason}
                    onChange={() => setOptOutReason(reason)}
                    className="mt-0.5 text-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setOptOutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-cream-200 dark:bg-surface-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setOptOutModalOpen(false);
                  await handleCustomerAction('OPT_OUT', { optOutReason });
                }}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors"
              >
                Confirm Opt-Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
