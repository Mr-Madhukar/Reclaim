import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  FlaskConical,
  Sliders,
  History,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowUp,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { MainTab } from './Navbar';

interface FooterProps {
  onSelectTab?: (tab: MainTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (tab: MainTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
      scrollToTop();
    }
  };

  return (
    <footer className="w-full border-t border-cream-300/80 dark:border-white/[0.08] bg-cream-200/40 dark:bg-black/70 backdrop-blur-xl transition-colors relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-brand-500/[0.06] to-transparent pointer-events-none blur-2xl"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
          {/* Column 1: Brand & Operational Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-white shadow-sm border border-cream-300/80 dark:border-white/20 p-1 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Reclaim Logo"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                RECLAIM
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30 font-semibold">
                AI Recovery Agent
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Autonomous revenue recovery agent for <strong className="text-slate-900 dark:text-zinc-200">Razorpay AI Buildathon 2026</strong>.
              Transforms payment degradations, cart drop-offs, and overdue invoices into verified recovered revenue.
            </p>

            <div className="pt-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Deterministic Engine: Live &amp; Bounded</span>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-zinc-200 font-bold flex items-center space-x-1.5">
              <Zap className="h-3.5 w-3.5 text-brand-500" />
              <span>Platform Views</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('landing')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Agent Showcase</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('overview')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Command Center</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('cases')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Recovery Workbench</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('sandbox')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Simulator Sandbox</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('policies')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <Sliders className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Policy Guardrails</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('audit')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Immutable Audit Trail</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('scorecard')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer"
                >
                  <Award className="h-3.5 w-3.5 text-cream-500 dark:text-zinc-500 group-hover:text-brand-500 transition-colors" />
                  <span>Evaluator Scorecard</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Autonomous Recovery Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-zinc-200 font-bold flex items-center space-x-1.5">
              <BrainCircuit className="h-3.5 w-3.5 text-brand-500" />
              <span>Recovery Architecture</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
              <li className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-medium text-slate-800 dark:text-zinc-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0"></span>
                  <span>Lane A: Payment Degradation</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 pl-3">
                  Dynamic gateway failover, UPI intent fallback &amp; retry engine.
                </p>
              </li>
              <li className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-medium text-slate-800 dark:text-zinc-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                  <span>Lane B: Checkout Drop-off</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 pl-3">
                  Cart context preservation, personalized nudges &amp; incentive tiers.
                </p>
              </li>
              <li className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-medium text-slate-800 dark:text-zinc-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>Lane C: B2B Receivables</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 pl-3">
                  Autonomous dunning cadences, payment links &amp; promise-to-pay logging.
                </p>
              </li>
            </ul>
          </div>

          {/* Column 4: Governance & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-zinc-200 font-bold flex items-center space-x-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
              <span>Trust &amp; Governance</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block">Zero Hallucinations</strong>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-500">
                    AI diagnoses root causes; strictly deterministic code dispatches transactions.
                  </span>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <Lock className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block">TRAI DND Compliant</strong>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-500">
                    9 AM – 7 PM IST calling window enforcement with 4h cooldown.
                  </span>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200 block">RBI DPDP &amp; Opt-Out</strong>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-500">
                    Instant opt-out propagation across all channels with audit logging.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Middle Tech Architecture Badges Strip */}
        <div className="py-4 border-t border-cream-300/70 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-600 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-cream-300/40 dark:bg-white/[0.04] border border-cream-300 dark:border-white/[0.06]">
              Gemini 2.0 Flash
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cream-300/40 dark:bg-white/[0.04] border border-cream-300 dark:border-white/[0.06]">
              Razorpay API 2026
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cream-300/40 dark:bg-white/[0.04] border border-cream-300 dark:border-white/[0.06]">
              PostgreSQL Audit Ledger
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cream-300/40 dark:bg-white/[0.04] border border-cream-300 dark:border-white/[0.06]">
              HMAC SHA-256 Verified
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cream-300/40 dark:bg-white/[0.04] border border-cream-300 dark:border-white/[0.06]">
              WCAG 2.2 AA
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-cream-300/60 dark:bg-white/[0.06] hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white transition-all text-xs font-medium cursor-pointer"
            aria-label="Scroll back to top of page"
          >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-5 border-t border-cream-300/60 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-2">
          <div>
            <span>&copy; {new Date().getFullYear()} Reclaim. Built for Razorpay AI Buildathon 2026.</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600 dark:text-zinc-400">
            <span>100% Deterministic · Zero Hallucinated Financial Actions</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
