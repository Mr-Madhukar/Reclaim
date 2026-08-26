import React from 'react';
import { Cpu, ShieldCheck, Database, Layers, CheckCircle } from 'lucide-react';

export const ArchitectureCard: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="h-3.5 w-3.5" />
            <span>Technical Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bounded Agentic Pipeline
          </h2>
          <p className="text-sm text-cream-700 dark:text-slate-400 mt-3">
            Pairing Google Gemini 2.0 Flash with deterministic TypeScript policy guardrails and PostgreSQL ACID transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1: Gemini 2.0 Integration */}
          <div className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-5 border border-purple-500/20">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Gemini 2.0 Flash LLM
            </h3>
            <p className="text-xs text-cream-700 dark:text-slate-400 leading-relaxed mb-4">
              Used strictly for root-cause diagnosis assistance, tone personalization, and customer copy drafting with JSON schema enforcement.
            </p>
            <ul className="space-y-2 text-xs text-cream-800 dark:text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-purple-500" />
                <span>JSON Schema Output (`responseSchema`)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-purple-500" />
                <span>Zero financial fact hallucinations</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-purple-500" />
                <span>Graceful template fallbacks</span>
              </li>
            </ul>
          </div>

          {/* Box 2: Deterministic Policy Engine */}
          <div className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Deterministic Policy Engine
            </h3>
            <p className="text-xs text-cream-700 dark:text-slate-400 leading-relaxed mb-4">
              A pure TypeScript rules engine that validates merchant limits, contact hours, cool-down windows, and opt-outs before executing any action.
            </p>
            <ul className="space-y-2 text-xs text-cream-800 dark:text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>100% deterministic &amp; unit-tested</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Configurable per merchant &amp; lane</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Non-bypassable transactional gates</span>
              </li>
            </ul>
          </div>

          {/* Box 3: PostgreSQL & BullMQ Queue */}
          <div className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 border-cream-300 dark:border-surface-750">
            <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-5 border border-brand-500/20">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              PostgreSQL &amp; BullMQ Rails
            </h3>
            <p className="text-xs text-cream-700 dark:text-slate-400 leading-relaxed mb-4">
              Robust relational state management with Prisma ORM, Decimal monetary precision, and Redis BullMQ for reliable recovery job sequencing.
            </p>
            <ul className="space-y-2 text-xs text-cream-800 dark:text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand-500" />
                <span>Prisma Decimal monetary safety</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand-500" />
                <span>Immutable audit logs with JSON diffs</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-brand-500" />
                <span>Idempotent retry sequencing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
