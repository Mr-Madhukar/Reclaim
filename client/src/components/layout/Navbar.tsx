import React, { useState } from 'react';
import {
  ShieldCheck,
  Sun,
  Moon,
  UserCheck,
  Menu,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
  FileText,
  Sliders,
  History,
  FlaskConical,
  Award,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

export type MainTab = 'landing' | 'overview' | 'cases' | 'sandbox' | 'policies' | 'audit' | 'scorecard';

interface NavbarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenMobileMenu: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenLoginModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, switchRole } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin', desc: 'Full write & batch trigger access' },
    { role: 'REVIEWER', label: 'Reviewer', desc: 'Case resolution & interventions' },
    { role: 'OPS_VIEWER', label: 'Ops Viewer', desc: 'Read-only financial audit mode' },
  ];

  return (
    <header role="banner" className="sticky top-0 z-40 w-full glass-panel border-b border-cream-300/80 dark:border-surface-750/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectTab('landing')}
            className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-2xl"
            aria-label="Reclaim — Go to Showcase page"
          >
            <div className="h-10 w-10 rounded-xl bg-white shadow-md shadow-orange-500/15 border border-cream-300/80 dark:border-surface-700/80 p-1 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all">
              <img
                src="/android-chrome-192x192.png"
                alt="Reclaim Logo"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
              RECLAIM
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav role="navigation" aria-label="Main navigation" className="hidden xl:flex items-center space-x-1 bg-cream-200/80 dark:bg-surface-900/80 p-1 rounded-xl border border-cream-300/80 dark:border-surface-750/80">
          <button
            onClick={() => onSelectTab('landing')}
            aria-current={activeTab === 'landing' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'landing'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Showcase</span>
          </button>

          <button
            onClick={() => onSelectTab('overview')}
            aria-current={activeTab === 'overview' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab('cases')}
            aria-current={activeTab === 'cases' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cases'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Workbench</span>
          </button>

          <button
            onClick={() => onSelectTab('sandbox')}
            aria-current={activeTab === 'sandbox' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sandbox'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Sandbox</span>
          </button>

          <button
            onClick={() => onSelectTab('policies')}
            aria-current={activeTab === 'policies' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'policies'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Policies</span>
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            aria-current={activeTab === 'audit' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit</span>
          </button>

          <button
            onClick={() => onSelectTab('scorecard')}
            aria-current={activeTab === 'scorecard' ? 'page' : undefined}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scorecard'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-cream-700 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-cream-300/50 dark:hover:bg-surface-800'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Scorecard</span>
          </button>
        </nav>

        {/* Right: Theme Toggle + 1-Click Role Switcher + Mobile Trigger */}
        <div className="flex items-center space-x-2.5">
          {/* Policy Guardrail Live Pulse */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px]">Guardrails Active</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-cream-200 dark:bg-surface-850 text-cream-800 dark:text-slate-200 border border-cream-300 dark:border-surface-750 hover:border-brand-500/50 transition-colors focus:outline-none"
            title={theme === 'dark' ? 'Switch to Cream Light Mode' : 'Switch to Dark Obsidian Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* 1-Click RBAC Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              aria-expanded={roleDropdownOpen}
              aria-haspopup="true"
              aria-label={`Switch role, current role: ${user?.role || 'ADMIN'}`}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-xs font-medium text-cream-800 dark:text-slate-200 hover:border-brand-500 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5 text-brand-500" />
              <span className="hidden sm:inline font-mono font-semibold">
                {user?.role || 'ADMIN'}
              </span>
              <ChevronDown className="h-3 w-3 text-cream-600 dark:text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-xl p-2 z-50 animate-slide-down border border-cream-300 dark:border-surface-700"
                onMouseLeave={() => setRoleDropdownOpen(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream-600 dark:text-slate-400 border-b border-cream-200 dark:border-surface-750">
                  Switch Demo Persona (RBAC)
                </div>
                <div className="py-1 space-y-1">
                  {roles.map(({ role, label, desc }) => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex flex-col transition-colors ${
                        user?.role === role
                          ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/30'
                          : 'text-cream-800 dark:text-slate-200 hover:bg-cream-300/50 dark:hover:bg-surface-800'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{label}</span>
                        {user?.role === role && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                        )}
                      </span>
                      <span className="text-[10px] text-cream-600 dark:text-slate-400 font-normal">
                        {desc}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-1 border-t border-cream-200 dark:border-surface-750">
                  <button
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-center py-1.5 text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Custom Login...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={onOpenMobileMenu}
            className="xl:hidden p-2 rounded-xl bg-cream-200 dark:bg-surface-850 border border-cream-300 dark:border-surface-750 text-cream-800 dark:text-slate-200"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
