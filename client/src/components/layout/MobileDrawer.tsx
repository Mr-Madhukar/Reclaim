import React from 'react';
import {
  X,
  Sparkles,
  LayoutDashboard,
  FileText,
  Sliders,
  History,
  FlaskConical,
  Award,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { MainTab } from './Navbar';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  const { user, switchRole } = useAuth();

  if (!isOpen) return null;

  const roles: { role: UserRole; label: string }[] = [
    { role: 'ADMIN', label: 'Admin' },
    { role: 'REVIEWER', label: 'Reviewer' },
    { role: 'OPS_VIEWER', label: 'Ops Viewer' },
  ];

  const navItems: { tab: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'landing', label: 'Project Showcase', icon: Sparkles },
    { tab: 'overview', label: 'Dashboard KPIs', icon: LayoutDashboard },
    { tab: 'cases', label: 'Case Workbench', icon: FileText },
    { tab: 'sandbox', label: 'Simulation Sandbox', icon: FlaskConical },
    { tab: 'policies', label: 'Policy Engine', icon: Sliders },
    { tab: 'audit', label: 'Audit Trail', icon: History },
    { tab: 'scorecard', label: 'Scorecard', icon: Award },
  ];

  return (
    <div className="fixed inset-0 z-50 flex xl:hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-xs h-full bg-cream-100 dark:bg-surface-900 shadow-2xl p-6 flex flex-col justify-between border-l border-cream-300 dark:border-surface-750 animate-slide-up overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-cream-300 dark:border-surface-750">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center text-white">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                RECLAIM
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-cream-200 dark:bg-surface-800 text-cream-700 dark:text-slate-300"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="py-6 space-y-1.5">
            {navItems.map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => {
                  onSelectTab(tab);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-cream-800 dark:text-slate-300 hover:bg-cream-200 dark:hover:bg-surface-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Persona Switcher */}
        <div className="pt-4 border-t border-cream-300 dark:border-surface-750">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-cream-600 dark:text-slate-400 mb-2">
            Active RBAC Persona
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {roles.map(({ role, label }) => (
              <button
                key={role}
                onClick={() => {
                  switchRole(role);
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  user?.role === role
                    ? 'bg-brand-500 text-white'
                    : 'bg-cream-200 dark:bg-surface-800 text-cream-800 dark:text-slate-300 border border-cream-300 dark:border-surface-750'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Policy Engine Guardrails On</span>
          </div>
        </div>
      </div>
    </div>
  );
};
