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
    <section className="py-16 bg-cream-200/50 dark:bg-surface-900/50 border-y border-cream-300/80 dark:border-surface-750/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
            The Core Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Reclaim Operates: 6-Stage Autonomous Loop
          </p>
          <p className="text-sm text-cream-700 dark:text-slate-400 mt-3">
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
                className={`p-3.5 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? 'bg-cream-100 dark:bg-surface-800 border-brand-500 shadow-glow-orange scale-[1.02]'
                    : 'glass-card border-cream-300 dark:border-surface-750 hover:border-brand-500/40 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-1.5 rounded-lg border ${step.colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-cream-600 dark:text-slate-400">
                    Stage 0{idx + 1}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {step.short}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Inspector Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750 animate-fade-in shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-cream-300 dark:border-surface-750">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl border ${current.colorClass}`}>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-cream-700 dark:text-slate-400 mb-1">
                  What Happens in this Stage
                </h4>
                <p className="text-sm text-cream-900 dark:text-slate-200 leading-relaxed">
                  {current.whatItDoes}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cream-300/40 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-cream-800 dark:text-slate-300 leading-relaxed">
                  <strong>Stopping Condition Check:</strong> {current.safetyRule}
                </div>
              </div>
            </div>

            {/* Right: Code / Receipt Log Preview */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-cream-700 dark:text-slate-400 mb-2">
                <span className="flex items-center space-x-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-brand-500" />
                  <span>Immutable Audit Log Payload</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  VERIFIED RECEIPT
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-surface-950 text-slate-200 font-mono text-xs overflow-x-auto border border-surface-750 shadow-inner">
                <pre className="text-brand-400 leading-relaxed">
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
