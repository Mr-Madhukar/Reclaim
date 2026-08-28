import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Receipt,
  Lock,
  Activity,
  CheckCircle2,
  CornerDownRight,
} from 'lucide-react';
import { MainTab } from '../layout/Navbar';

interface HeroSectionProps {
  onLaunchDashboard: (tab: MainTab) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunchDashboard }) => {
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<'stream' | 'metrics' | 'guardrails'>('stream');

  const telemetryEvents = [
    {
      id: 'EVT-9042',
      time: 'Just now',
      lane: 'PAYMENT',
      customer: 'Priya Sharma (TechFlow Corp)',
      amount: '₹4,899.00',
      action: 'SMS Retry Link + UPI QR',
      policy: 'PASSED (0/3 retries, within 9am-7pm)',
      status: 'RECOVERED',
      statusColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'EVT-9043',
      time: '2m ago',
      lane: 'CHECKOUT',
      customer: 'Aarav Patel (DesignStack)',
      amount: '₹12,450.00',
      action: 'Drafted Gemini 2.0 copy + 5% capped code',
      policy: 'PASSED (Budget cap verified)',
      status: 'PROCESSING',
      statusColor: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'EVT-9044',
      time: '6m ago',
      lane: 'RECEIVABLE',
      customer: 'FinScale Solutions',
      amount: '₹45,000.00',
      action: 'Log promise-to-pay committed for 28th Feb',
      policy: 'HALTED_ACTIVE_PROMISE (Guardrail enforced)',
      status: 'PAUSED',
      statusColor: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <section className="relative pt-8 pb-24 overflow-hidden">
      {/* Background Radial Glow & Ambient Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-orange-500/15 via-orange-600/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-blue-500/10 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Brand Logo Display */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-white shadow-xl shadow-orange-500/15 border border-white/20 p-2 overflow-hidden hover:scale-105 transition-transform flex items-center justify-center">
            <img
              src="/android-chrome-192x192.png"
              alt="Reclaim Brand Logo"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] dark:bg-white/[0.03] border border-cream-300/80 dark:border-white/[0.08] backdrop-blur-md text-xs font-mono text-slate-800 dark:text-zinc-300 mb-8 shadow-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="font-medium">Autonomous Revenue Recovery</span>
          <span className="text-slate-400 dark:text-zinc-600">·</span>
          <span className="text-brand-600 dark:text-brand-400 font-semibold">Razorpay AI Buildathon</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Find revenue slipping away. <br />
          <span className="text-gradient-orange">
            Win it back with a receipt for every rupee.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          An autonomous AI recovery agent across <strong className="text-slate-900 dark:text-zinc-200 font-medium">Payment Degradation</strong>,{' '}
          <strong className="text-slate-900 dark:text-zinc-200 font-medium">Checkout Abandonment</strong>, and{' '}
          <strong className="text-slate-900 dark:text-zinc-200 font-medium">Overdue Invoices</strong>.
          Enforces hard stopping rules, deterministic policy gates, and provable audit trails.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            type="button"
            onClick={() => onLaunchDashboard('overview')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-brand-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-[0_0_25px_-4px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_-2px_rgba(249,115,22,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Zap className="h-4 w-4 fill-white" />
            <span>Launch Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onLaunchDashboard('cases')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-cream-300 dark:border-white/[0.08] text-slate-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm hover:border-brand-500/40 hover:bg-cream-100 dark:hover:bg-white/[0.08] transition-all backdrop-blur-md"
          >
            <span>Explore 55 Seeded Cases</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              3 Lanes
            </span>
          </button>
        </div>

        {/* Interactive Live Agent Telemetry Console Preview */}
        <div className="max-w-5xl mx-auto mb-20 rounded-2xl bg-cream-100/90 dark:bg-[#09090b] border border-cream-300 dark:border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden text-left backdrop-blur-xl">
          {/* Terminal Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-cream-200/80 dark:bg-[#121215] border-b border-cream-300/80 dark:border-white/[0.08]">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-700 dark:text-zinc-200">
                agent.reclaim.internal — live-telemetry-feed
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTelemetryTab('stream')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                  activeTelemetryTab === 'stream'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Live Stream
              </button>
              <button
                type="button"
                onClick={() => setActiveTelemetryTab('guardrails')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                  activeTelemetryTab === 'guardrails'
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Policy Gates
              </button>
            </div>
          </div>

          {/* Telemetry Content Body */}
          <div className="p-5 sm:p-6 space-y-3 font-mono text-xs">
            {activeTelemetryTab === 'stream' ? (
              <div className="space-y-3">
                {telemetryEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-white/60 dark:bg-white/[0.02] border border-cream-300/80 dark:border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start md:items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-brand-500 border border-orange-500/20 shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-zinc-100">{evt.customer}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-medium">
                            {evt.lane}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-zinc-300">{evt.time}</span>
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-zinc-300 mt-1 flex items-center space-x-1.5">
                          <CornerDownRight className="h-3 w-3 text-slate-500 dark:text-zinc-400" />
                          <span>{evt.action}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end md:self-center">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">{evt.amount}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${evt.statusColor}`}>
                        {evt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 p-2">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-bold">5 Deterministic Policy Gates Enforced Pre-Dispatch:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-white/40 dark:bg-white/[0.02] border border-cream-300 dark:border-white/[0.06]">
                    <span className="text-brand-500 font-bold">01. Max Attempts Limit:</span>
                    <p className="text-slate-600 dark:text-zinc-400 text-[11px] mt-0.5">Strict 3 retry touches per payment case. Instant auto-close on limit.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/40 dark:bg-white/[0.02] border border-cream-300 dark:border-white/[0.06]">
                    <span className="text-brand-500 font-bold">02. Cool-down Window:</span>
                    <p className="text-slate-600 dark:text-zinc-400 text-[11px] mt-0.5">Mandatory 60-minute interval before subsequent customer nudges.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/40 dark:bg-white/[0.02] border border-cream-300 dark:border-white/[0.06]">
                    <span className="text-brand-500 font-bold">03. Business Hours Constraint:</span>
                    <p className="text-slate-600 dark:text-zinc-400 text-[11px] mt-0.5">Zero customer communications dispatched outside 9:00 AM - 7:00 PM IST.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/40 dark:bg-white/[0.02] border border-cream-300 dark:border-white/[0.06]">
                    <span className="text-brand-500 font-bold">04. Immutable HMAC Verification:</span>
                    <p className="text-slate-600 dark:text-zinc-400 text-[11px] mt-0.5">Every webhook signature validated via SHA-256 before state transition.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 Core Value Pillars Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto text-left">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#09090b] border border-cream-300/80 dark:border-white/[0.08] hover:border-orange-500/40 dark:hover:border-white/[0.18] transition-all backdrop-blur-md shadow-lg shadow-black/10">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-brand-500 flex items-center justify-center mb-4 border border-orange-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
              Measured Money Recovered
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Calculates verifiable rupee yields (₹ recovered / ₹ at risk) across batches — never asserted or hallucinated metrics.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#09090b] border border-cream-300/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-white/[0.18] transition-all backdrop-blur-md shadow-lg shadow-black/10">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
              Deterministic Stopping Rules
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Enforces cool-downs, max attempts, contact business hours, and customer opt-outs before every single touchpoint.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#09090b] border border-cream-300/80 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-white/[0.18] transition-all backdrop-blur-md shadow-lg shadow-black/10">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-2">
              Verifiable Receipt Audit Trail
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Every decision, AI prompt, policy check, and webhook outcome is logged to an immutable audit record with JSON diffs.
            </p>
          </div>
        </div>

        {/* Guardrail Guarantee Banner */}
        <div className="mt-8 max-w-xl mx-auto py-2.5 px-4 rounded-full bg-white/60 dark:bg-white/[0.03] border border-cream-300/80 dark:border-white/[0.08] flex items-center justify-center space-x-2 text-xs text-slate-700 dark:text-zinc-300 backdrop-blur-md">
          <Lock className="h-3.5 w-3.5 text-brand-500" />
          <span>Zero Freeform Actions · 100% Bounded Execution Catalog</span>
        </div>
      </div>
    </section>
  );
};
