import React from 'react';
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Receipt,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MainTab } from '../layout/Navbar';

interface HeroSectionProps {
  onLaunchDashboard: (tab: MainTab) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunchDashboard }) => {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 dark:bg-brand-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Track Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
          <span>Razorpay AI Buildathon 2026 · Track 03</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
          Find revenue that&apos;s slipping away, and win it back{' '}
          <span className="text-gradient-orange block sm:inline">
            — with a receipt for every rupee.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-cream-700 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          An autonomous AI agent that detects revenue at risk across{' '}
          <strong className="text-brand-600 dark:text-brand-400 font-semibold">Payment Degradation</strong>,{' '}
          <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Checkout Abandonment</strong>, and{' '}
          <strong className="text-amber-700 dark:text-amber-400 font-semibold">Overdue Invoices</strong>.
          Enforces hard stopping rules, deterministic policy gates, and an immutable audit trail.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onLaunchDashboard('overview')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-glow-orange hover:shadow-glow-orange-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Launch Live Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onLaunchDashboard('cases')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-700 text-cream-900 dark:text-slate-200 font-semibold text-sm hover:border-brand-500/50 hover:bg-cream-300/50 dark:hover:bg-surface-800 transition-all"
          >
            <span>Explore 50+ Seeded Cases</span>
          </button>
        </div>

        {/* 3 Core Value Pillars Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Pillar 1 */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 border-cream-300 dark:border-surface-750">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4 border border-brand-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Measured Money Recovered
            </h3>
            <p className="text-xs text-cream-700 dark:text-slate-400 leading-relaxed">
              Calculates real rupee yields (₹ recovered / ₹ at risk) across batches — never asserted or hallucinated metrics.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 border-cream-300 dark:border-surface-750">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Deterministic Stopping Rules
            </h3>
            <p className="text-xs text-cream-700 dark:text-slate-400 leading-relaxed">
              Enforces cool-downs, max attempts, contact business hours, and customer opt-outs before every single touchpoint.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 border-cream-300 dark:border-surface-750">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Verifiable Receipt Audit Trail
            </h3>
            <p className="text-xs text-cream-700 dark:text-slate-400 leading-relaxed">
              Every decision, AI prompt, policy check, and webhook outcome is logged to an immutable audit record with JSON diffs.
            </p>
          </div>
        </div>

        {/* Guardrail Guarantee Banner */}
        <div className="mt-10 max-w-xl mx-auto py-2.5 px-4 rounded-xl bg-cream-200/70 dark:bg-surface-850/70 border border-cream-300 dark:border-surface-700 flex items-center justify-center space-x-2 text-xs text-cream-800 dark:text-slate-300">
          <Lock className="h-3.5 w-3.5 text-brand-500" />
          <span>Zero Freeform Actions · 100% Bounded Execution Catalog</span>
        </div>
      </div>
    </section>
  );
};
