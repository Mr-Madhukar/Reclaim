import React, { useState } from 'react';
import {
  ShieldCheck,
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
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

export type MainTab = 'landing' | 'overview' | 'cases' | 'sandbox' | 'policies' | 'audit' | 'scorecard';

interface NavbarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenMobileMenu: () => void;
  onOpenLoginModal: () => void;
}

interface NavTabItem {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
}

const NAV_TABS: NavTabItem[] = [
  { id: 'landing', label: 'Showcase', icon: Sparkles },
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Workbench', icon: FileText },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical, allowedRoles: ['ADMIN', 'REVIEWER'] },
  { id: 'policies', label: 'Policies', icon: Sliders, allowedRoles: ['ADMIN'] },
  { id: 'audit', label: 'Audit', icon: History, allowedRoles: ['ADMIN', 'OPS_VIEWER'] },
  { id: 'scorecard', label: 'Scorecard', icon: Award, allowedRoles: ['ADMIN', 'OPS_VIEWER'] },
];

const TAB_ACTIVE_CLASS = 'bg-brand-500 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]';
const TAB_INACTIVE_CLASS = 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-cream-300/50 dark:hover:bg-white/[0.05]';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenLoginModal,
}) => {
  const { user, switchRole } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const currentRole: UserRole = user?.role || 'ADMIN';

  const visibleNavTabs = NAV_TABS.filter((tab) => {
    if (!tab.allowedRoles) return true;
    return tab.allowedRoles.includes(currentRole);
  });

  const handleSwitchRole = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleDropdownOpen(false);

    // Auto-switch to dashboard if the current activeTab is not allowed in the new role
    const permittedTabs = NAV_TABS.filter(
      (tab) => !tab.allowedRoles || tab.allowedRoles.includes(newRole)
    ).map((t) => t.id);

    if (!permittedTabs.includes(activeTab)) {
      onSelectTab('overview');
    }
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin', desc: 'Full write & batch trigger access' },
    { role: 'REVIEWER', label: 'Reviewer', desc: 'Case resolution & interventions' },
    { role: 'OPS_VIEWER', label: 'Ops Viewer', desc: 'Read-only financial audit mode' },
  ];

  return (
    <header role="banner" className="sticky top-0 z-40 w-full bg-cream-100/80 dark:bg-[#020202]/80 backdrop-blur-xl border-b border-cream-300/80 dark:border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectTab('landing')}
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-xl"
            aria-label="Reclaim — Go to Showcase page"
          >
            <div className="h-9 w-9 rounded-xl bg-white shadow-md shadow-orange-500/15 border border-cream-300/80 dark:border-white/20 p-1 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all">
              <img
                src="/android-chrome-192x192.png"
                alt="Reclaim Logo"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              RECLAIM
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav role="navigation" aria-label="Main navigation" className="hidden xl:flex items-center space-x-1 bg-cream-200/80 dark:bg-white/[0.03] p-1 rounded-full border border-cream-300/80 dark:border-white/[0.08] backdrop-blur-md">
          {visibleNavTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === id ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Policy Live Pulse + 1-Click Role Switcher + Mobile Trigger */}
        <div className="flex items-center space-x-2.5">
          {/* Policy Guardrail Live Pulse */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px]">Guardrails Active</span>
          </div>

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
                      onClick={() => handleSwitchRole(role)}
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
