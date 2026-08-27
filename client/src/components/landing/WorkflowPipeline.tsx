import React, { useState } from 'react';
import {
  Radar,
  BrainCircuit,
  ShieldCheck,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';

interface StepDetail {
  id: number;
  name: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  summary: string;
  whatItDoes: string;
  receiptLog: string;
  safetyRule: string;
}

export const WorkflowPipeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps: StepDetail[] = [
    {
      id: 0,
      name: '1. Detect',
      short: 'Event Ingestion',
      icon: Radar,
      colorClass: 'text-brand-500 bg-brand-500/10 border-brand-500/30',
      summary: 'Ingests webhook events or scheduled scans across payments, checkouts, and invoices.',
      whatItDoes:
        'Listens for Razorpay payment failures, abandoned checkout sessions (>30 min old), and overdue invoice dates. Automatically opens a typed RecoveryCase record with an amount at risk.',
      receiptLog: 'RecoveryCase.create({ lane: "PAYMENT", amount: 2499.00, status: "OPEN" })',
      safetyRule: 'Idempotency check against sourceRefId prevents duplicate case creation.',
    },
    {
      id: 1,
      name: '2. Diagnose',
      short: 'Root-Cause AI',
      icon: BrainCircuit,
      colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      summary: 'Rules-first bucketing with Gemini 2.0 Flash for copy crafting and ambiguous case handling.',
      whatItDoes:
        'Buckets failures into exact categories: insufficient_funds, bank_timeout, card_expired, otp_failure, mandate_expired, or risk_decline. Calls Gemini 2.0 Flash with JSON schema enforcement to personalize copy.',
      receiptLog: 'DiagnosisResult { rootCause: "insufficient_funds", confidence: 0.94, recommendedAction: "send_retry_link" }',
      safetyRule: 'Gemini LLM cannot invent financial facts; all outputs constrained by strict Zod schema.',
    },
    {
      id: 2,
      name: '3. Policy Gate',
      short: 'Deterministic Check',
      icon: ShieldCheck,
      colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      summary: 'Pure, deterministic compliance engine that validates 5 hard safety checks before any action.',
      whatItDoes:
        'Evaluates: (1) Is case OPEN? (2) Has customer opted out? (3) Has max retry attempts been hit? (4) Is cool-down window active? (5) Is it outside contact hours (9 AM - 7 PM)?',
      receiptLog: 'PolicyCheckResult { allowed: true, reason: "All policy checks passed", ruleTriggered: null }',
      safetyRule: 'If ANY check fails, the action is blocked and the case is closed or paused with a reason.',
    },
    {
      id: 3,
      name: '4. Bounded Act',
      short: 'Intervention Execution',
      icon: Send,
      colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      summary: 'Executes strictly from a pre-approved catalog of bounded recovery workflows.',
      whatItDoes:
        'Dispatches tailored interventions: send_retry_link (SMS/Email), suggest_alt_payment_method, mandate_reauth_link, checkout_recovery_nudge (with discount cap), or tiered invoice reminder.',
      receiptLog: 'RecoveryAction.create({ actionType: "send_retry_link", attemptNumber: 1, outcome: "sent" })',
      safetyRule: 'Zero freeform actions permitted. Max 1 discount per cart, max 4 reminders per invoice/month.',
    },
    {
      id: 4,
      name: '5. Observe',
      short: 'Outcome Tracking',
      icon: Eye,
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      summary: 'Listens for customer responses, payment captures, link clicks, or promise-to-pay commits.',
      whatItDoes:
        'Monitors incoming Razorpay webhook payment.captured events, checkout conversion, or customer promise-to-pay entries.',
      receiptLog: 'WebhookEvent { event: "payment.captured", amount: 2499.00, verified: true }',
      safetyRule: 'HMAC SHA-256 signature verification guarantees webhook authenticity.',
    },
    {
      id: 5,
      name: '6. Close / Stop',
      short: 'State Resolution',
      icon: CheckCircle2,
      colorClass: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30',
      summary: 'Closes case with measured money recovered or halts permanently under stopping rules.',
      whatItDoes:
        'If payment succeeds → marks RECOVERED and increments measured revenue total. If max attempts reached → marks STOPPED_MAX_ATTEMPTS. If customer requests stop → STOPPED_OPTED_OUT. If complex → ESCALATED_TO_HUMAN.',
      receiptLog: 'RecoveryCase.update({ status: "RECOVERED", closedReason: "Payment captured via retry link" })',
      safetyRule: 'Immutable audit log written at the exact millisecond of state transition.',
    },
  ];

  const current = steps[activeStep];
  const CurrentIcon = current.icon;

  return (
    <section className="py-16 bg-cream-200/20 dark:bg-black/30 border-y border-cream-300/80 dark:border-white/[0.08] transition-colors backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-cream-300 dark:border-white/[0.08] text-brand-600 dark:text-brand-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span>Core Architecture Loop</span>
          </div>
          <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Reclaim Operates: 6-Stage Autonomous Loop
          </p>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-3 font-normal">
            Every recovery cycle follows this exact, deterministic sequence across all three loss lanes.
          </p>
        </div>

        {/* Step Indicator Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-white dark:bg-[#121215] border-brand-500 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)] scale-[1.02]'
                    : 'bg-white/60 dark:bg-white/[0.02] border-cream-300/80 dark:border-white/[0.06] hover:border-brand-500/40 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-1.5 rounded-lg border ${step.colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-zinc-400">
                    Stage 0{idx + 1}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-zinc-200 truncate">
                  {step.short}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Inspector Card */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white/70 dark:bg-[#09090b] border border-cream-300/80 dark:border-white/[0.08] animate-fade-in shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-cream-300/80 dark:border-white/[0.08]">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl border ${current.colorClass}`}>
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {current.name}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {current.short}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="h-4 w-4" />
              <span>Guardrail: {current.safetyRule}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
            {/* Left: Functional Breakdown */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 font-semibold">
                  What Happens in this Stage
                </h4>
                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
                  {current.whatItDoes}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/[0.02] border border-cream-300 dark:border-white/[0.06] flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-zinc-100">Stopping Condition Check:</strong> {current.safetyRule}
                </div>
              </div>
            </div>

            {/* Right: Code / Receipt Log Preview */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 mb-2">
                <span className="flex items-center space-x-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-brand-500" />
                  <span>Immutable Audit Log Payload</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  VERIFIED RECEIPT
                </span>
              </div>
              <div
                tabIndex={0}
                role="region"
                aria-label="Immutable Audit Log Payload Preview"
                className="p-4 rounded-xl bg-black text-slate-200 font-mono text-xs overflow-x-auto border border-white/[0.08] shadow-inner focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <pre className="text-emerald-400 leading-relaxed">
                  {current.receiptLog}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
