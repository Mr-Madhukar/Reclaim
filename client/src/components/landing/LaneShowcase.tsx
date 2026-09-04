import React, { useState } from 'react';
import {
  CreditCard,
  ShoppingCart,
  Building2,
  CheckCircle,
  Clock,
  Ban,
  Sparkles,
} from 'lucide-react';
import { Lane } from '../../types';

interface LaneInfo {
  lane: Lane;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderColor: string;
  badgeBg: string;
  lossScenario: string;
  diagnosisMechanism: string;
  boundedActions: string[];
  stoppingRules: string[];
  simulatedCase: {
    customer: string;
    amount: string;
    rootCause: string;
    actionTaken: string;
    outcome: string;
  };
}

export const LaneShowcase: React.FC = () => {
  const [selectedLane, setSelectedLane] = useState<Lane>('PAYMENT');

  const lanes: Record<Lane, LaneInfo> = {
    PAYMENT: {
      lane: 'PAYMENT',
      name: 'Lane A: Payment Degradation',
      tagline: 'Root Cause Classification & Intelligent Retry Sequencing',
      icon: CreditCard,
      color: 'text-brand-500',
      borderColor: 'border-brand-500/40',
      badgeBg: 'bg-brand-500/10 text-brand-500',
      lossScenario:
        'A card charge fails due to insufficient funds, or a subscription recurring mandate drops because of bank downtime.',
      diagnosisMechanism:
        'Buckets the exact failure error (insufficient_funds, bank_timeout, card_expired, otp_failure) to choose optimal retry timing or alternative rail.',
      boundedActions: [
        'send_retry_link (SMS/Email) with cool-down window',
        'suggest_alt_payment_method (UPI / Netbanking)',
        'send_mandate_reauth_link for expired e-mandates',
      ],
      stoppingRules: [
        'Maximum 3 retry attempts total',
        'Mandatory 60-minute cool-down between retries',
        'Immediate permanent halt on customer opt-out',
      ],
      simulatedCase: {
        customer: 'Priya Sharma (TechFlow Corp)',
        amount: '₹4,899.00',
        rootCause: 'bank_timeout (HDFC Gateway)',
        actionTaken: 'send_retry_link (SMS link via Razorpay test rails)',
        outcome: 'RECOVERED in 14 minutes (100% receipt verified)',
      },
    },
    CHECKOUT: {
      lane: 'CHECKOUT',
      name: 'Lane B: Checkout Drop-Off',
      tagline: 'High-Intent Cart Recovery with Budget-Capped Incentives',
      icon: ShoppingCart,
      color: 'text-indigo-500',
      borderColor: 'border-indigo-500/40',
      badgeBg: 'bg-indigo-500/10 text-indigo-500',
      lossScenario:
        'A customer adds items to cart, proceeds to checkout, but drops off at the payment step without completing.',
      diagnosisMechanism:
        'Analyzes session idle time (>30 min), cart value tier, and prior attempt count. Personalized recovery copy drafted with Gemini 2.0 Flash.',
      boundedActions: [
        'send_checkout_recovery_nudge (email with saved cart link)',
        'apply_recovery_incentive (strictly capped 5-10% discount code)',
      ],
      stoppingRules: [
        'Maximum 3 touches over 72 hours, then hard auto-close',
        'Incentive amount capped by merchant policy ceiling (max ₹500)',
        'No contact outside business hours (9 AM - 7 PM)',
      ],
      simulatedCase: {
        customer: 'Aarav Patel (DesignStack)',
        amount: '₹12,450.00',
        rootCause: 'checkout_abandonment (high cart value)',
        actionTaken: 'send_checkout_recovery_nudge + 5% capped incentive',
        outcome: 'RECOVERED (Net ₹11,827.50 recovered with audit receipt)',
      },
    },
    RECEIVABLE: {
      lane: 'RECEIVABLE',
      name: 'Lane C: B2B Receivables',
      tagline: 'Compliant Escalation Ladder & Promise-to-Pay Tracker',
      icon: Building2,
      color: 'text-amber-500',
      borderColor: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/10 text-amber-500',
      lossScenario:
        'A B2B invoice passes its net-30 due date without payment receipt, creating aging cash-flow risk.',
      diagnosisMechanism:
        'Tracks days overdue (1-7 days friendly, 8-15 days firm, 16+ days escalation) and monitors broken/kept promise-to-pay commitments.',
      boundedActions: [
        'send_reminder (tiered tone: gentle reminder → formal notice)',
        'offer_payment_plan (installment option for invoices > ₹25,000)',
        'log_promise_to_pay (record verbal/written payment date commitment)',
        'escalate_to_human (assign to finance reviewer)',
      ],
      stoppingRules: [
        'Maximum 4 reminders per month per invoice',
        'Zero harassment compliance ceiling (no contacts on weekends/holidays)',
        'Automatic pause upon active promise-to-pay commitment',
      ],
      simulatedCase: {
        customer: 'Kavita Reddy (FinScale Solutions)',
        amount: '₹45,000.00',
        rootCause: 'overdue_invoice (14 days past due)',
        actionTaken: 'log_promise_to_pay committed for 28th Feb',
        outcome: 'ACTIVE (Awaiting commitment maturity, guardrail paused)',
      },
    },
  };

  const current = lanes[selectedLane];
  const Icon = current.icon;

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Depth Over Breadth</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            The Three Revenue Recovery Lanes
          </h2>
          <p className="text-sm text-cream-700 dark:text-slate-400 mt-3">
            Covering failed payments, checkout drop-offs, and overdue B2B receivables in one unified, bounded architecture.
          </p>
        </div>

        {/* 3 Lane Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(['PAYMENT', 'CHECKOUT', 'RECEIVABLE'] as Lane[]).map((laneKey) => {
            const laneObj = lanes[laneKey];
            const LaneIcon = laneObj.icon;
            const isSelected = selectedLane === laneKey;

            return (
              <button
                key={laneKey}
                onClick={() => setSelectedLane(laneKey)}
                className={`p-6 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? `bg-white dark:bg-[#121215] ${laneObj.borderColor} shadow-[0_0_20px_-4px_rgba(249,115,22,0.3)] scale-[1.02]`
                    : 'bg-white/70 dark:bg-[#09090b] border-cream-300/80 dark:border-white/[0.08] hover:border-brand-500/40 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${laneObj.badgeBg}`}>
                    <LaneIcon className="h-6 w-6" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ACTIVE PREVIEW
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                  {laneObj.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 font-normal">
                  {laneObj.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Lane Showcase Card */}
        <div className="rounded-2xl p-6 sm:p-10 bg-white/80 dark:bg-[#09090b] border border-cream-300/80 dark:border-white/[0.08] shadow-2xl animate-fade-in backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-cream-300/80 dark:border-white/[0.08]">
            <div className="flex items-center space-x-4">
              <div className={`p-3.5 rounded-xl ${current.badgeBg}`}>
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Specification &amp; Bounded Catalog
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {current.name}
                </h3>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-400 max-w-md font-normal">
              <strong className="text-slate-900 dark:text-zinc-200">Loss Trigger: </strong>
              {current.lossScenario}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
            {/* Col 1: Bounded Action Catalog */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                <CheckCircle className="h-4 w-4" />
                <span>Bounded Action Catalog</span>
              </div>
              <ul className="space-y-2.5">
                {current.boundedActions.map((action, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-cream-300/80 dark:border-white/[0.06] text-xs font-mono text-slate-800 dark:text-zinc-300 flex items-start space-x-2"
                  >
                    <span className="text-brand-500 font-bold">›</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2: Stopping Rules & Compliance */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Ban className="h-4 w-4" />
                <span>Deterministic Stopping Rules</span>
              </div>
              <ul className="space-y-2.5">
                {current.stoppingRules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-xs text-slate-800 dark:text-zinc-300 flex items-start space-x-2"
                  >
                    <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Real Simulated Case Proof */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>Simulated Case Walkthrough</span>
                <span className="text-[10px] font-mono font-normal">SYNTHETIC SEED</span>
              </div>
              <div className="p-4 rounded-xl bg-black text-slate-100 font-mono text-xs border border-white/[0.08] space-y-2">
                <div>
                  <span className="text-zinc-200">Customer: </span>
                  <span className="text-white font-semibold">{current.simulatedCase.customer}</span>
                </div>
                <div>
                  <span className="text-zinc-200">Amount at Risk: </span>
                  <span className="text-red-200 font-semibold">{current.simulatedCase.amount}</span>
                </div>
                <div>
                  <span className="text-zinc-200">Diagnosis: </span>
                  <span className="text-orange-200">{current.simulatedCase.rootCause}</span>
                </div>
                <div>
                  <span className="text-zinc-200">Action: </span>
                  <span className="text-indigo-200">{current.simulatedCase.actionTaken}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-200">Outcome: </span>
                  <span className="text-emerald-200 font-bold">{current.simulatedCase.outcome}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
