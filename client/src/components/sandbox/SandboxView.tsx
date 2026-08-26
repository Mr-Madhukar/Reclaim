import React, { useState } from 'react';
import { WebhookSimulator } from './WebhookSimulator';
import { CustomerRecoveryView } from './CustomerRecoveryView';
import { Zap, Smartphone } from 'lucide-react';

export const SandboxView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'webhook' | 'customer'>('webhook');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simulation &amp; Evaluation Sandbox
          </h2>
          <p className="text-xs sm:text-sm text-cream-700 dark:text-slate-400 mt-1">
            Test live Razorpay webhooks and experience the end-customer payment recovery flow.
          </p>
        </div>

        {/* Subtab Toggle */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750">
          <button
            onClick={() => setActiveSubTab('webhook')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'webhook'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-500'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Webhook Simulator</span>
          </button>

          <button
            onClick={() => setActiveSubTab('customer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'customer'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-500'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Customer Portal Mock</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'webhook' && <WebhookSimulator />}
      {activeSubTab === 'customer' && <CustomerRecoveryView />}
    </div>
  );
};
