import React from 'react';
import { ShieldCheck, Cpu, Code2, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer role="contentinfo" className="w-full border-t border-cream-300/80 dark:border-white/[0.08] bg-cream-200/20 dark:bg-black/40 backdrop-blur-md py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-white shadow-sm border border-cream-300/80 dark:border-white/20 p-1 overflow-hidden flex items-center justify-center">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Reclaim Logo"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                RECLAIM
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                AI Revenue Recovery Agent
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md leading-relaxed font-normal">
              Find revenue that&apos;s slipping away, and win it back — with a receipt for every rupee.
              Built for <strong className="text-slate-900 dark:text-zinc-200">Razorpay AI Buildathon 2026</strong>.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/60 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-300 border border-cream-300 dark:border-white/[0.08]">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Deterministic Guardrails</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/60 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-300 border border-cream-300 dark:border-white/[0.08]">
                <Cpu className="h-3 w-3 text-brand-500" />
                <span>Gemini 2.0 Flash</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/60 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-300 border border-cream-300 dark:border-white/[0.08]">
                <Code2 className="h-3 w-3 text-indigo-500" />
                <span>Strict TypeScript</span>
              </span>
            </div>
          </div>

          {/* Col 2: The Three Loss Lanes */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 font-semibold">
              Recovery Lanes
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
              <li className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                <span>Lane A: Payment Degradation</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                <span>Lane B: Checkout Drop-off</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Lane C: B2B Receivables</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Evaluator Docs */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 font-semibold">
              Buildathon Artifacts
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
              <li>
                <span className="inline-flex items-center space-x-1 hover:text-brand-500 cursor-pointer">
                  <span>PRD &amp; System Specs</span>
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </li>
              <li>
                <span className="inline-flex items-center space-x-1 hover:text-brand-500 cursor-pointer">
                  <span>Policy Gate Rules</span>
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </li>
              <li>
                <span className="inline-flex items-center space-x-1 hover:text-brand-500 cursor-pointer">
                  <span>Immutable Audit Trail</span>
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-cream-300/60 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-500">
          <div>
            <span>&copy; {new Date().getFullYear()} Reclaim. Built for Razorpay AI Buildathon 2026.</span>
          </div>
          <div className="mt-2 sm:mt-0 font-mono text-[11px]">
            <span>100% Deterministic · Zero Hallucinated Financial Actions</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
